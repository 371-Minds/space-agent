# Space Agent + Multimedia Junkie Simulation Expansion Plan

## Executive Summary

The next planning track is no longer the initial `mjunkie-mcp` bootstrap. That work is already complete. The new goal is to build a reusable simulation stack for Multimedia Junkie content production while preserving Space Agent's existing memory system and planning a deliberate root-level Bun migration for this repository.

The recommended direction is:

1. create a **separate Hermes-optimized simulation repo** based on `nativ3ai/hermes-geopolitical-market-sim`
2. import the useful MiroFish patterns there
3. replace the external memory dependency there with **native Memoria**
4. keep **Space Agent memory** in place inside this repo for stability and benchmarking
5. integrate the simulator into Space Agent and `mjunkie-mcp` through a **tool/skill-first** boundary
6. handle **root Bun migration** for this repository as a separate, explicit track instead of coupling it to simulator work

## Planning Assumptions

- the simulator will mainly serve Multimedia Junkie agents and content-production workflows
- the simulator should be reusable by Space Agent, `mjunkie-mcp`, and other internal agent systems
- Space Agent's current memory implementation should remain unchanged during this work
- Memoria should be embedded natively in the simulator so it can be benchmarked against Space Agent's memory behavior
- the root Space Agent repo should still migrate to Bun, but only after validating the existing npm-dependent packaging and supervisor paths

## Current Constraints In This Repo

The current root still treats npm as the canonical install path in several important places, so a full Bun migration is a real repo-wide migration rather than a trivial config change.

Key constraints:

- the root `package.json` uses `npm install` and `npm run install:packaging`
- `packaging/AGENTS.md` still defines `package-lock.json` as authoritative for packaging installs
- `commands/lib/supervisor/AGENTS.md` documents supervised staged releases running `npm install --omit=optional`
- the public README still instructs users to install and run the root with npm-first commands
- desktop packaging and release automation remain sensitive to dependency layout and lockfile policy

## Architecture Decision

### 1. Shared simulator lives outside this repo

The Hermes-based simulator should be developed in its own repo so it can evolve as a reusable runtime dependency for multiple agent systems instead of becoming tightly coupled to Space Agent internals.

That external repo should own:

- Hermes-first simulation runtime behavior
- Memoria embedding and persistence
- imported MiroFish patterns and generalization work
- scenario orchestration and output schemas
- a stable invocation surface for MCP tools, local CLI usage, or service calls

### 2. Space Agent remains the orchestration shell

This repo should consume the simulator through tools and skills first, not by absorbing the simulator implementation into the core browser or server runtime.

This repo should own:

- agent-facing invocation UX
- skill definitions and prompt guidance for using the simulator
- optional thin adapters in `mjunkie-mcp`
- benchmarking comparisons between Space Agent memory behavior and Memoria-backed simulator behavior

### 3. Root Bun migration stays separate

The Space Agent root Bun migration should be planned and validated independently so simulator work does not accidentally destabilize:

- desktop packaging
- supervised staged updates
- public install instructions
- release automation

## Workstream A: External Hermes-Based Simulation Repo

### Goal

Create a reusable simulation engine optimized for Hermes and suitable for Multimedia Junkie content-production workflows.

### Scope

- fork or otherwise start from `nativ3ai/hermes-geopolitical-market-sim`
- preserve the Hermes-optimized path
- generalize domain assumptions so the repo can serve more than geopolitical simulations
- import the useful MiroFish patterns
- replace the prior external memory layer with native Memoria
- define stable scenario and output contracts

### Desired outputs

- a reusable simulator repo
- native Memoria-backed long-horizon memory
- local development and evaluation flow for Hermes
- stable tool/service boundary for external callers

## Workstream B: Space Agent and `mjunkie-mcp` Integration

### Goal

Expose the simulator to agent workflows without replacing existing Space Agent memory.

### Scope

- add a tool/skill-first integration path for Space Agent
- add Multimedia Junkie-specific orchestration in `mjunkie-mcp`
- keep Space Agent memory untouched
- use the simulator as an external capability that can be invoked when needed

### Desired outputs

- one or more skills describing when and how agents should use the simulator
- thin invocation tools or adapters for MJ workflows
- clean separation between Space Agent memory and simulator memory
- repeatable benchmarking flows comparing Space Agent memory to Memoria-backed simulation memory

## Workstream C: Root Bun Migration For This Repo

### Goal

Migrate the root repo to Bun without breaking packaging, supervisor updates, or release workflows.

### Scope

- audit all npm-first assumptions in root scripts, packaging, supervisor behavior, CI, and docs
- define the desired lockfile policy
- validate root install, packaging install, desktop packaging, and supervised staged release flows
- only then flip canonical documentation and automation to Bun

### Desired outputs

- clear inventory of npm-coupled surfaces
- explicit Bun migration policy for root and packaging
- updated docs and automation once the migration is proven safe

## Recommended Implementation Order

### Phase 1 — simulator foundation

1. stand up the separate Hermes-based simulator repo
2. generalize the imported repo for reusable simulation scenarios
3. import the useful MiroFish pieces
4. embed Memoria natively
5. fix any imported runtime/build issues inside that repo

### Phase 2 — integration

1. define the external invocation contract
2. add Space Agent skill-first guidance for simulator use
3. add `mjunkie-mcp` orchestration around MJ-specific workflows
4. create benchmarking workflows against Space Agent memory

### Phase 3 — Bun migration

1. audit root npm assumptions
2. test Bun against root install and packaging flows
3. update CI, supervisor staging, and docs only after validation
4. declare Bun canonical at root only when those paths pass

## Success Criteria

- the simulator is reusable outside this repo
- Multimedia Junkie agents can invoke it through tools or skills
- Memoria is embedded natively in the simulator
- Space Agent memory remains intact and benchmarkable
- the root Bun migration does not regress packaging, supervisor updates, or release behavior
