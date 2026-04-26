/**
 * Simulator tools – Phase 5: external simulation orchestration and benchmarking.
 *
 * Keeps Space Agent prompt-include memory separate from Memoria-backed simulator
 * memory by treating the simulator as an external capability that can be invoked
 * and benchmarked without mutating ~/memory.
 */

import { type Tool } from '@modelcontextprotocol/sdk/types.js';

export const MJ_SIMULATOR_BASE_URL =
  process.env.MJ_SIMULATOR_URL ?? 'http://localhost:3001';

type ToolResult = { content: Array<{ type: 'text'; text: string }> };

interface InvokeSimulatorWorkflowArgs {
  workflow: string;
  payload: Record<string, unknown>;
  simulator_path?: string;
  simulation_memory_namespace?: string;
  benchmark_label?: string;
}

interface BenchmarkCase {
  id: string;
  prompt?: string;
  must_include_all?: string[];
  must_exclude_all?: string[];
}

interface MemoryPacket {
  label?: string;
  entries: string[];
}

interface BenchmarkMemoryModesArgs {
  benchmark_id: string;
  cases: BenchmarkCase[];
  space_agent_memory: MemoryPacket;
  simulation_memory: MemoryPacket;
}

export const invokeSimulatorWorkflowTool: Tool = {
  name: 'invoke_simulator_workflow',
  description:
    'Invoke an external Multimedia Junkie simulator workflow without mutating ' +
    'Space Agent memory. Use for beat rehearsal, persona/world-state simulation, ' +
    'or Memoria-backed memory experiments.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow: {
        type: 'string',
        description:
          'Workflow identifier such as "beat_rehearsal", "persona_scene", or "memory_benchmark".',
      },
      payload: {
        type: 'object',
        description: 'Workflow payload forwarded to the simulator unchanged.',
        additionalProperties: true,
      },
      simulator_path: {
        type: 'string',
        description:
          'Optional simulator API path. Defaults to "/workflows/invoke" and must stay path-relative.',
      },
      simulation_memory_namespace: {
        type: 'string',
        description:
          'Optional external simulator memory namespace. Keeps simulator state separate from ~/memory.',
      },
      benchmark_label: {
        type: 'string',
        description: 'Optional benchmark or trace label for repeatable runs.',
      },
    },
    required: ['workflow', 'payload'],
  },
};

export const benchmarkMemoryModesTool: Tool = {
  name: 'benchmark_memory_modes',
  description:
    'Run a deterministic benchmark comparing Space Agent memory entries against ' +
    'Memoria-backed simulation memory entries without merging the two stores.',
  inputSchema: {
    type: 'object',
    properties: {
      benchmark_id: {
        type: 'string',
        description: 'Stable benchmark identifier for the comparison run.',
      },
      cases: {
        type: 'array',
        description:
          'Deterministic benchmark cases. Each case scores required recalls and required omissions.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            prompt: { type: 'string' },
            must_include_all: {
              type: 'array',
              items: { type: 'string' },
            },
            must_exclude_all: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['id'],
        },
      },
      space_agent_memory: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          entries: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['entries'],
      },
      simulation_memory: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          entries: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['entries'],
      },
    },
    required: ['benchmark_id', 'cases', 'space_agent_memory', 'simulation_memory'],
  },
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
  };
}

function normalizeSimulatorPath(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error('Simulator path must start with "/"');
  }
  if (path.startsWith('//')) {
    throw new Error('Simulator path must be a path, not a protocol-relative URL');
  }
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) {
    throw new Error('Simulator path must be a path, not an absolute URL');
  }
  return path;
}

async function postSimulatorWorkflow(
  args: InvokeSimulatorWorkflowArgs,
  baseUrl = MJ_SIMULATOR_BASE_URL,
): Promise<unknown> {
  const url = new URL(baseUrl);
  url.pathname = normalizeSimulatorPath(args.simulator_path ?? '/workflows/invoke');
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow: args.workflow,
      payload: args.payload,
      simulation_memory_namespace: args.simulation_memory_namespace,
      benchmark_label: args.benchmark_label,
      caller: 'space-agent',
    }),
  });
  if (!res.ok) {
    throw new Error(`Simulator error: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function handleInvokeSimulatorWorkflow(
  args: InvokeSimulatorWorkflowArgs,
  baseUrl = MJ_SIMULATOR_BASE_URL,
): Promise<ToolResult> {
  try {
    const data = await postSimulatorWorkflow(args, baseUrl);
    return ok({
      workflow: args.workflow,
      benchmark_label: args.benchmark_label ?? null,
      simulation_memory_namespace:
        args.simulation_memory_namespace ?? `simulation:${args.workflow}`,
      memory_separation: {
        space_agent_memory: 'untouched',
        simulation_memory: 'external_only',
      },
      simulator_response: data,
    });
  } catch (e) {
    return err((e as Error).message);
  }
}

function normalizeEntries(entries: string[]): string[] {
  return entries.map((entry) => entry.trim()).filter(Boolean);
}

function containsPhrase(entries: string[], phrase: string): boolean {
  const normalizedPhrase = phrase.trim().toLowerCase();
  if (!normalizedPhrase) return false;
  return entries.some((entry) => entry.toLowerCase().includes(normalizedPhrase));
}

function scoreCandidate(packet: MemoryPacket, benchmarkCase: BenchmarkCase) {
  const entries = normalizeEntries(packet.entries);
  const mustIncludeAll = benchmarkCase.must_include_all ?? [];
  const mustExcludeAll = benchmarkCase.must_exclude_all ?? [];

  const matched = mustIncludeAll.filter((phrase) => containsPhrase(entries, phrase));
  const missing = mustIncludeAll.filter((phrase) => !containsPhrase(entries, phrase));
  const unexpected = mustExcludeAll.filter((phrase) => containsPhrase(entries, phrase));
  const respectedExclusions = mustExcludeAll.filter(
    (phrase) => !containsPhrase(entries, phrase),
  );

  const criteriaMet = matched.length + respectedExclusions.length;
  const criteriaTotal = mustIncludeAll.length + mustExcludeAll.length;
  const score = criteriaTotal === 0 ? 1 : criteriaMet / criteriaTotal;

  return {
    label: packet.label?.trim() || null,
    score,
    criteria_met: criteriaMet,
    criteria_total: criteriaTotal,
    matched,
    missing,
    unexpected,
  };
}

export function handleBenchmarkMemoryModes(args: BenchmarkMemoryModesArgs): ToolResult {
  try {
    const spaceAgentLabel = args.space_agent_memory.label?.trim() || 'Space Agent memory';
    const simulationLabel =
      args.simulation_memory.label?.trim() || 'Memoria-backed simulation memory';

    const cases = args.cases.map((benchmarkCase) => {
      const spaceAgent = scoreCandidate(
        { ...args.space_agent_memory, label: spaceAgentLabel },
        benchmarkCase,
      );
      const simulation = scoreCandidate(
        { ...args.simulation_memory, label: simulationLabel },
        benchmarkCase,
      );
      const winner =
        spaceAgent.score === simulation.score
          ? 'tie'
          : spaceAgent.score > simulation.score
            ? 'space_agent_memory'
            : 'simulation_memory';
      return {
        id: benchmarkCase.id,
        prompt: benchmarkCase.prompt ?? null,
        criteria: {
          must_include_all: benchmarkCase.must_include_all ?? [],
          must_exclude_all: benchmarkCase.must_exclude_all ?? [],
        },
        candidates: {
          space_agent_memory: spaceAgent,
          simulation_memory: simulation,
        },
        winner,
      };
    });

    const totals = cases.reduce(
      (acc, benchmarkCase) => {
        acc.space_agent_memory.total_score +=
          benchmarkCase.candidates.space_agent_memory.score;
        acc.space_agent_memory.criteria_met +=
          benchmarkCase.candidates.space_agent_memory.criteria_met;
        acc.space_agent_memory.criteria_total +=
          benchmarkCase.candidates.space_agent_memory.criteria_total;
        acc.simulation_memory.total_score +=
          benchmarkCase.candidates.simulation_memory.score;
        acc.simulation_memory.criteria_met +=
          benchmarkCase.candidates.simulation_memory.criteria_met;
        acc.simulation_memory.criteria_total +=
          benchmarkCase.candidates.simulation_memory.criteria_total;
        return acc;
      },
      {
        space_agent_memory: {
          label: spaceAgentLabel,
          total_score: 0,
          criteria_met: 0,
          criteria_total: 0,
        },
        simulation_memory: {
          label: simulationLabel,
          total_score: 0,
          criteria_met: 0,
          criteria_total: 0,
        },
      },
    );

    const overallWinner =
      totals.space_agent_memory.total_score === totals.simulation_memory.total_score
        ? 'tie'
        : totals.space_agent_memory.total_score > totals.simulation_memory.total_score
          ? 'space_agent_memory'
          : 'simulation_memory';

    return ok({
      benchmark_id: args.benchmark_id,
      total_cases: cases.length,
      memory_separation: {
        space_agent_memory: 'prompt-include-backed and unchanged',
        simulation_memory: 'evaluated separately with no automatic merge',
      },
      overall: {
        winner: overallWinner,
        candidates: totals,
      },
      cases,
    });
  } catch (e) {
    return err((e as Error).message);
  }
}
