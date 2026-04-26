/**
 * Phase 5 Tests – external simulator orchestration and memory benchmarking
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

let mockServer;
let mockBaseUrl;

before(async () => {
  await new Promise((resolve) => {
    mockServer = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      if (req.method !== 'POST' || url.pathname !== '/workflows/invoke') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const payload = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            accepted: true,
            workflow: payload.workflow,
            simulation_memory_namespace: payload.simulation_memory_namespace,
            benchmark_label: payload.benchmark_label ?? null,
            caller: payload.caller,
            echoed_payload: payload.payload,
          }),
        );
      });
    });
    mockServer.listen(0, '127.0.0.1', () => {
      const { port } = mockServer.address();
      mockBaseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => mockServer?.close());

const {
  handleInvokeSimulatorWorkflow,
  handleBenchmarkMemoryModes,
} = await import('../dist/tools/simulator.js');

describe('Phase 5 – invoke_simulator_workflow', () => {
  it('forwards workflow payloads to the simulator and reports separation', async () => {
    const result = await handleInvokeSimulatorWorkflow(
      {
        workflow: 'memory_benchmark',
        simulation_memory_namespace: 'sim:atlas',
        benchmark_label: 'atlas-vs-memoria',
        payload: {
          beat_id: 'beat_002',
          scene: 'nova rehearsal',
        },
      },
      mockBaseUrl,
    );
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.workflow, 'memory_benchmark');
    assert.equal(data.simulation_memory_namespace, 'sim:atlas');
    assert.equal(data.memory_separation.space_agent_memory, 'untouched');
    assert.equal(data.memory_separation.simulation_memory, 'external_only');
    assert.equal(data.simulator_response.accepted, true);
    assert.equal(data.simulator_response.caller, 'space-agent');
    assert.equal(data.simulator_response.echoed_payload.scene, 'nova rehearsal');
  });

  it('rejects absolute simulator paths', async () => {
    const result = await handleInvokeSimulatorWorkflow(
      {
        workflow: 'persona_scene',
        simulator_path: 'https://evil.example.com/invoke',
        payload: {},
      },
      mockBaseUrl,
    );
    const data = JSON.parse(result.content[0].text);
    assert.ok('error' in data);
    assert.match(data.error, /must start with|absolute url/i);
  });
});

describe('Phase 5 – benchmark_memory_modes', () => {
  it('scores both memory modes deterministically and selects a winner', () => {
    const result = handleBenchmarkMemoryModes({
      benchmark_id: 'atlas-memory',
      cases: [
        {
          id: 'remember-live-case',
          must_include_all: ['project atlas'],
        },
        {
          id: 'remember-scene-cue',
          must_include_all: ['foreshadowing cue'],
        },
        {
          id: 'avoid-retired-work',
          must_exclude_all: ['retired concept'],
        },
      ],
      space_agent_memory: {
        entries: ['Project Atlas is the live case.', 'Use concise updates.'],
      },
      simulation_memory: {
        entries: [
          'Project Atlas is the live case.',
          'Character Nova remembers the foreshadowing cue from the last run.',
        ],
      },
    });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.benchmark_id, 'atlas-memory');
    assert.equal(data.total_cases, 3);
    assert.equal(data.overall.winner, 'simulation_memory');
    assert.equal(
      data.memory_separation.space_agent_memory,
      'prompt-include-backed and unchanged',
    );
    assert.equal(
      data.cases.find((item) => item.id === 'remember-scene-cue').winner,
      'simulation_memory',
    );
  });

  it('returns tie when both memory packets satisfy the same criteria', () => {
    const result = handleBenchmarkMemoryModes({
      benchmark_id: 'tie-check',
      cases: [
        {
          id: 'same-memory',
          must_include_all: ['project atlas'],
          must_exclude_all: ['retired concept'],
        },
      ],
      space_agent_memory: {
        entries: ['Project Atlas is the live case.'],
      },
      simulation_memory: {
        entries: ['Project Atlas is the live case.'],
      },
    });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.overall.winner, 'tie');
    assert.equal(data.cases[0].winner, 'tie');
  });
});
