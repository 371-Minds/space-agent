# Multimedia Junkie MCP (mjunkie-mcp) - Copilot & Agent Prompts

This document contains a curated set of prompts designed for GitHub Copilot, Space Agent, or any other LLM assistant to autonomously build the `mjunkie-mcp` server. 

Copy and paste these prompts sequentially into your AI assistant to execute the development plan outlined in `PLAN.md`.

---

## 🛠️ Prompt 1: Foundation & MCP Server Setup
**Goal:** Scaffold the base TypeScript MCP server.

```text
@workspace You are an expert TypeScript developer. Please scaffold a new Model Context Protocol (MCP) server named `mjunkie-mcp`. 

Requirements:
1. Initialize a Node.js TypeScript project with `@modelcontextprotocol/sdk`.
2. Create an entry point `index.ts` that sets up a standard MCP Server instance using the StdioServerTransport.
3. Configure `package.json` with the necessary build and start scripts.
4. Add basic error handling and graceful shutdown logic.
5. Create a `src/tools` and `src/resources` directory to keep our MCP capabilities modular.

Do not write the actual tools yet, just the boilerplate and standard MCP server lifecycle management.
```

---

## 💾 Prompt 2: Sovereign Engine (`json-server`) Integration
**Goal:** Implement the content factory backend.

```text
@workspace We are building the "Sovereign Engine" for Multimedia Junkie using `json-server`. 

1. Create a `db.json` file in the root of the project with the following root arrays:
   - `characters`: containing at least CEO Mimi, CTO Zara, and CFO Maya with their roles.
   - `cases`: representing content campaigns (e.g., "ch01_geometric_outlier").
   - `beats`: representing individual pieces of content to be generated, referencing a case_id, with a `status` field (e.g., "needs_update", "failed", "completed").
   - `assets`: representing generated multimedia files and their token/credit costs.
2. In `src/tools/content.ts`, implement MCP tool handlers using `fetch` or `axios` to interact with a local json-server running on port 3000:
   - `query_content`: A tool that accepts an endpoint (string) and optional query params, returning the JSON response.
   - `update_beat_status`: A tool that accepts a beat ID and a new status, performing a PATCH request to update it.
3. Register these tools in `index.ts`.
```

---

## 🎨 Prompt 3: Brand System Configuration Tools
**Goal:** Expose the Multimedia Junkie brand constraints to the agent.

```text
@workspace We need to ensure that any UI or content generated adheres strictly to the Multimedia Junkie brand.

1. Create a file `src/config/brand.ts`. Hardcode or import the Multimedia Junkie brand configuration:
   - Primary: "#E91E63", Secondary: "#9C27B0", Accent: "#FF5722", Background: "#FAFAFA", Text: "#212121".
   - Include the company details: Tagline ("Addicted to Creating Amazing Content"), and services (Video Production, Audio Engineering, Motion Graphics, Interactive Media).
2. Create an MCP tool in `src/tools/brand.ts` called `get_brand_guidelines`. It should return the full JSON representation of the brand's colors, typography, and accessibility guidelines (AA/AAA contrast ratios).
3. Create an MCP resource `brand://multimedia-junkie/guidelines` that exposes this data passively to the LLM context.
4. Register the tool and resource in `index.ts`.
```

---

## 🖥️ Prompt 4: Space Agent UI Templates (Two-Mode System)
**Goal:** Build the widget schemas and layout injection tools for the Space Agent frontend.

```text
@workspace This MCP server will be used by Space Agent, which can render UI directly in the workspace. We need to define our two-mode UI architecture.

1. Create `src/schemas/widgets.ts`. Define JSON schemas for our core widgets:
   - `time_date_card`
   - `hero_branding` (must use Multimedia Junkie identity)
   - `metric_card` (CPU/Memory/Pipeline status)
   - `service_monitor` (Online/Offline/Warning states)
2. Create a tool `generate_dashboard_layout` in `src/tools/ui.ts`. It should accept a `mode` parameter:
   - If `mode` is "command_center", return a 12x8 grid layout JSON structure (Template 1: Static Dashboard).
   - If `mode` is "spatial_floating", return a 3D depth-layered layout JSON structure (Template 2: Vision Pro style AR).
3. The returned layouts MUST inject the brand colors fetched from `src/config/brand.ts`.
4. Register the tool in `index.ts`.
```

---

## 🤖 Prompt 5: Persona Automations & Workflows
**Goal:** Add specific tools for Mimi, Zara, and Maya to manage the Sovereign Engine.

```text
@workspace We need to implement specialized MCP tools for our autonomous personas to manage the Sovereign Engine pipeline.

In `src/tools/personas.ts`, create and export the following tool definitions and their execution handlers:
1. `mimi_strategic_query`: 
   - Functionality: Queries the `cases` endpoint for items with status "published", sorted by runtime, and queries the `beats` endpoint for status "failed". Returns a combined executive summary.
2. `zara_tech_query`: 
   - Functionality: Queries the `characters` endpoint by capability/role, and retrieves all `beats` with status "needs_update" with pagination constraints.
3. `maya_finance_query`: 
   - Functionality: Queries the `assets` endpoint, calculates the sum of `credits_consumed` for all generated assets, and returns an ROI summary object.
4. Integrate these into the main MCP tool registration block in `index.ts`.
```

---

## 🚀 Prompt 6: Deployment & Space Agent SKILL.md
**Goal:** Finalize the project and generate instructions for the Space Agent.

```text
@workspace The MCP server codebase is complete. Let's package it and document it for Space Agent.

1. Create a `Dockerfile` that:
   - Installs Node.js dependencies.
   - Installs `json-server` globally.
   - Runs `json-server` on port 3000 and the built MCP server concurrently.
2. Create a `SKILL.md` file in the root directory. This file should be written for Space Agent. It must explain:
   - What the `mjunkie-mcp` server does.
   - How Space Agent can use `generate_dashboard_layout` to build out the UI.
   - How Space Agent should loop over `needs_update` beats using the Sovereign Engine API.
   - How it must enforce the #E91E63 primary brand color in any HTML/CSS it generates.
```
