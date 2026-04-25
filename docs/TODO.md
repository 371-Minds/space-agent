# Space Agent + Multimedia Junkie Simulation Expansion TODO

This file tracks the next planning and execution steps for the shared simulation stack, Memoria adoption, tool/skill-first integration, and the root Bun migration.

---

## Track 1: Separate Hermes-Based Simulator Repo

- [ ] Create the separate simulator repo from [`nativ3ai/hermes-geopolitical-market-sim`](https://github.com/nativ3ai/hermes-geopolitical-market-sim)
- [ ] Preserve the Hermes-optimized runtime path
- [ ] Identify and remove domain assumptions that are too specific to geopolitics
- [ ] Import the useful MiroFish patterns into the new simulator repo
- [ ] Replace the previous external memory dependency with native Memoria
- [ ] Define the simulator's stable scenario and output contracts
- [ ] Fix imported build/runtime issues in the simulator repo
- [ ] Add deterministic local tests for the simulator repo
- [ ] Document how Space Agent and `mjunkie-mcp` are expected to invoke it

---

## Track 2: Space Agent + `mjunkie-mcp` Integration

- [ ] Keep the existing Space Agent memory implementation unchanged
- [ ] Define the benchmarking approach for comparing Space Agent memory with Memoria
- [ ] Add a tool/skill-first integration plan for invoking the external simulator
- [ ] Add Space Agent-facing skill guidance for when to call the simulator
- [ ] Add Multimedia Junkie-specific orchestration in `mjunkie-mcp`
- [ ] Keep the integration thin so simulation logic stays outside this repo
- [ ] Document the boundary between Space Agent memory and simulator memory

---

## Track 3: Root Bun Migration Audit

- [ ] Audit root `package.json` npm-first scripts
- [ ] Audit packaging install and lockfile expectations
- [ ] Audit supervisor staged-release dependency install behavior
- [ ] Audit public README and docs for npm-canonical instructions
- [ ] Audit CI and release automation for npm assumptions
- [ ] Decide the desired lockfile and package-manager policy for the root repo

---

## Track 4: Root Bun Migration Execution

- [ ] Validate Bun-based root install behavior
- [ ] Validate packaging dependency install behavior under the chosen Bun policy
- [ ] Validate desktop packaging flows after the migration
- [ ] Validate supervised staged release installs after the migration
- [ ] Update docs and automation only after the migration path passes validation
- [ ] Declare Bun canonical at the root only when the above paths are stable
