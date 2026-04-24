# Multimedia Junkie MCP (mjunkie-mcp) - Development Plan

## 🎯 Executive Summary
The `mjunkie-mcp` (Model Context Protocol) server bridges the **Multimedia Junkie** creative production ecosystem with autonomous agent frameworks (specifically inspired by **Space Agent**). It acts as the "Sovereign Engine" API layer, connecting brand configurations, a widget-based UI template system, and a `json-server` backend to empower autonomous content generation and spatial dashboard rendering.

## 🏗️ Architecture Overview
This MCP server will provide tools and resources across three core pillars:
1. **The Content Factory (Sovereign Engine):** Driven by `json-server`, managing assets, characters, and production beats.
2. **The Brand System:** Dynamic injection of Multimedia Junkie configurations (colors, typography, services).
3. **The Spatial Dashboard:** A two-mode interface system (Command Center grid vs. Spatial Floating) manageable via Space Agent plain-text skills.

---

## 🚀 Phase 1: Foundation & Sovereign Engine Setup
**Goal:** Establish the core MCP server and integrate the `json-server` content database.

- [ ] **Initialize MCP Server:** Set up a Node.js/TypeScript MCP server (`mjunkie-mcp`).
- [ ] **Scaffold `db.json`:** Create the Sovereign Engine database structure representing the Multimedia Junkie pipeline:
  - `/characters` (e.g., CEO Mimi, CTO Zara, CFO Maya)
  - `/beats` (content generation beats and statuses)
  - `/cases` (projects/campaigns)
  - `/assets` (generated multimedia files)
- [ ] **Implement Core MCP Tools:**
  - `query_content`: GET requests to the Sovereign Engine.
  - `update_beat`: PATCH/POST requests to update generation status.
  - `track_finances`: GET requests to aggregate asset generation costs and ROI.
- [ ] **Resource Exposure:** Expose `db.json` and schema definitions as MCP Resources for agent context.

---

## 🎨 Phase 2: Brand System Integration
**Goal:** Expose brand identity and styling rules to the agent for autonomous UI generation.

- [ ] **Ingest Brand Configs:** Load `multimedia-junkie.json` and `color-palettes.json`.
  - Primary: `#E91E63` | Secondary: `#9C27B0` | Accent: `#FF5722`
- [ ] **Develop Brand Tools:**
  - `get_brand_guidelines`: Returns logos, typography, and company data.
  - `get_color_palette`: Returns semantic colors, gradients, and accessibility constraints (AA/AAA).
- [ ] **Agent Instruction Generation:** Create dynamic prompt contexts ensuring the agent always formats outputs (videos, graphics, UI components) strictly within the Multimedia Junkie brand aesthetic.

---

## 🖥️ Phase 3: Space Agent UI & Template System
**Goal:** Build the widget-based component architecture (Two-Mode System).

- [ ] **Define Widget Schemas:** Create JSON schemas for the core widget types:
  - `time_date_card`
  - `hero_branding` (Multimedia Junkie Identity)
  - `metric_card` (Production rendering speeds, etc.)
  - `service_monitor` (Video/Audio/Motion Graphic pipeline status)
- [ ] **Template 1: Command Center:** Implement the grid-based static dashboard layout for standard laptop/desktop monitoring.
- [ ] **Template 2: Spatial Floating:** Implement the 3D depth-layered, AR-ready interface mode.
- [ ] **Implement UI Management Tools:**
  - `generate_dashboard_layout`: Allows Space Agent to request and inject a tailored dashboard layout directly into the frontend.
  - `update_widget_state`: Allows real-time updating of dashboard components via agentic actions.

---

## 🤖 Phase 4: Persona Workflows & Automation
**Goal:** Enable autonomous, multi-agent delegation pipelines.

- [ ] **CEO Mimi Workflow:** Implement tools for querying strategic decisions, case priorities, and underperforming content.
- [ ] **CTO Zara Workflow:** Implement tools for querying character capabilities, updating the motion library, and managing technical architecture.
- [ ] **CFO Maya Workflow:** Implement tools for tracking credits consumed, total assets generated, and calculating ROI.
- [ ] **Pipeline Automation Scripting:** Write GitHub Copilot/Space Agent automation prompts to watch for `needs_update` beats and trigger sovereign generation loops.

---

## 📦 Phase 5: Deployment & Handoff
**Goal:** Prepare `mjunkie-mcp` for production deployment.

- [ ] **Dockerization:** Containerize the MCP server alongside the `json-server` instance.
- [ ] **GitHub Actions Sync:** Implement the automated monitoring system to track upstream `db.json` changes.
- [ ] **Vercel/Akash/Render Network Configs:** Write deployment configurations for seamless hosting of the Sovereign Engine and MCP endpoint.
- [ ] **Documentation:** Finalize `README.md` and `SKILL.md` (for Space Agent) describing how to consume the `mjunkie-mcp` server.
