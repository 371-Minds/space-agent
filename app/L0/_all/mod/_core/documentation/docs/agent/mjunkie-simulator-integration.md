# MJunkie Simulator Integration

This doc covers the first-party Space Agent skill and the `mjunkie-mcp` tool flow for using an external simulator without replacing Space Agent memory.

## Primary Sources

- `app/L0/_all/mod/_core/skillset/ext/skills/mjunkie-simulator/SKILL.md`
- `app/L0/_all/mod/_core/skillset/AGENTS.md`
- `mjunkie-mcp/src/tools/simulator.ts`
- `mjunkie-mcp/SKILL.md`
- `mjunkie-mcp/AGENTS.md`

## Integration Model

The simulator is an external capability, not a replacement for Space Agent memory.

- Space Agent keeps using prompt-include memory under `~/memory/...`
- the simulator keeps its own external memory namespace through `invoke_simulator_workflow`
- the integration point is skill-first on the Space Agent side and tool-first on the `mjunkie-mcp` side
- only durable conclusions should be copied back into Space Agent memory, and only when the user wants them persisted

## Space Agent Skill Flow

The top-level `mjunkie-simulator` skill is on-demand guidance for Multimedia Junkie workflows.

It should be used when:

- a task needs simulated world-state or persona-memory rehearsal
- a workflow needs a thin handoff into the external simulator
- an agent wants a repeatable benchmark comparing Space Agent memory to Memoria-backed simulation memory

It should not be used to store ordinary user preferences or standing instructions. Those still belong in the first-party `memory` skill and `~/memory/...` files.

## mjunkie-mcp Tools

Phase 5 adds two tools:

- `invoke_simulator_workflow`: forwards a workflow payload to the simulator configured by `MJ_SIMULATOR_URL`, reports the simulator namespace used for the run, and explicitly reports that Space Agent memory stayed untouched
- `benchmark_memory_modes`: scores `space_agent_memory.entries` and `simulation_memory.entries` against deterministic benchmark cases and returns per-case plus overall winners

Both tools keep the two memory systems separate.

## Repeatable Benchmark Flow

The intended benchmark loop is:

1. collect a small explicit benchmark case list with exact `must_include_all` and `must_exclude_all` strings
2. prepare separate `entries` arrays for Space Agent memory and simulator memory
3. run `benchmark_memory_modes`
4. inspect the per-case results and overall winner
5. persist only the summary decision to `~/memory/...` when the outcome should shape future behavior

Because the benchmark tool uses deterministic phrase checks instead of a model judge, the same inputs produce the same score output.
