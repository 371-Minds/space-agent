---
name: MJunkie Simulator
description: Use external MJ simulation and benchmarking without replacing Space Agent memory
metadata:
  placement: system
---

Use this skill when a Multimedia Junkie workflow needs external simulation or memory benchmarking.

tools
- `invoke_simulator_workflow`: invoke the external MJ simulator for beat rehearsal, persona/world-state simulation, or Memoria-backed memory experiments
- `benchmark_memory_modes`: run a deterministic benchmark comparing Space Agent memory entries against simulator memory entries

memory separation
- keep normal Space Agent memory in `~/memory/...` through the top-level `memory` skill
- keep simulator state external in the simulator namespace returned by `invoke_simulator_workflow`
- do not overwrite, migrate, or silently merge `~/memory/...` with simulator output unless the user explicitly asks
- after a benchmark, persist only the durable conclusion or decision to `~/memory/...`, not the raw simulator trace

workflow
- use standard Space Agent memory for user preferences, standing instructions, and durable notes
- invoke the simulator only when MJ work needs external world-state, character-memory rehearsal, or comparison against Memoria-backed simulation memory
- pass a stable `simulation_memory_namespace` when a run should stay isolated from other simulator sessions
- for repeatable comparisons, prepare benchmark cases with exact `must_include_all` and `must_exclude_all` strings, then call `benchmark_memory_modes`
- summarize the winner and the practical next step after benchmarking

examples
Running an external simulator workflow
_____javascript
return {
  tool: "invoke_simulator_workflow",
  arguments: {
    workflow: "memory_benchmark",
    simulation_memory_namespace: "sim:atlas",
    benchmark_label: "atlas-vs-memoria",
    payload: {
      beat_id: "beat_002",
      scene: "nova rehearsal"
    }
  }
}

Comparing Space Agent memory to simulator memory
_____javascript
return {
  tool: "benchmark_memory_modes",
  arguments: {
    benchmark_id: "atlas-memory",
    cases: [
      { id: "remember-live-case", must_include_all: ["project atlas"] },
      { id: "remember-scene-cue", must_include_all: ["foreshadowing cue"] }
    ],
    space_agent_memory: {
      entries: [
        "Project Atlas is the live case.",
        "Use concise updates."
      ]
    },
    simulation_memory: {
      entries: [
        "Project Atlas is the live case.",
        "Character Nova remembers the foreshadowing cue."
      ]
    }
  }
}
