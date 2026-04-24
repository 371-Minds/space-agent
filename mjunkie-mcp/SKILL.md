# mjunkie-mcp SKILL.md – Space Agent Integration Guide

> **Skill type:** MCP Server  
> **Server name:** `mjunkie-mcp`  
> **Transport:** stdio (local)

---

## What mjunkie-mcp Does

`mjunkie-mcp` is the **Sovereign Engine API bridge** for the Multimedia Junkie creative production ecosystem. It exposes ten MCP tools and two MCP resources that allow Space Agent to:

1. **Query and update** the content pipeline (characters, cases, beats, assets)
2. **Enforce brand guidelines** in every piece of generated UI or content
3. **Render Spatial Dashboards** in two modes (Command Center grid / Spatial Floating AR)
4. **Run autonomous persona workflows** for CEO Mimi, CTO Zara, and CFO Maya

---

## Available Tools

| Tool | Phase | Purpose |
|------|-------|---------|
| `query_content` | 1 | Query any Sovereign Engine endpoint |
| `update_beat_status` | 1 | Patch a beat's production status |
| `track_finances` | 1 | Aggregate credits consumed and ROI |
| `get_brand_guidelines` | 2 | Full brand config (colors, typography, services) |
| `get_color_palette` | 2 | Color palette with optional gradients + accessibility |
| `generate_dashboard_layout` | 3 | Build a dashboard layout JSON for Space Agent |
| `update_widget_state` | 3 | Patch a rendered widget's live props |
| `mimi_strategic_query` | 4 | CEO executive summary (published cases + failed beats) |
| `zara_tech_query` | 4 | CTO pipeline health (characters + needs_update beats) |
| `maya_finance_query` | 4 | CFO ROI summary (credits, revenue, per-case breakdown) |

## Available Resources

| URI | Description |
|-----|-------------|
| `sovereign://db` | Live Sovereign Engine db.json snapshot |
| `brand://multimedia-junkie/guidelines` | Full brand configuration JSON |

---

## How Space Agent Uses generate_dashboard_layout

Call this tool to build and render the Multimedia Junkie dashboard directly in the Space Agent workspace. The examples below show the conceptual tool-call pattern; adapt the syntax to your MCP client library:

```javascript
// Command Center mode (standard desktop)
// Conceptual pseudocode – adapt to your MCP client API
const result = await mcpClient.callTool('generate_dashboard_layout', {
  mode: 'command_center',
  title: 'MJ Production Hub'
});
const layout = JSON.parse(result.content[0].text);
// layout.cells contains widget definitions for the 12×8 grid

// Spatial Floating mode (AR / Vision Pro)
const arResult = await mcpClient.callTool('generate_dashboard_layout', {
  mode: 'spatial_floating',
  title: 'MJ Spatial Hub'
});
const arLayout = JSON.parse(arResult.content[0].text);
// arLayout.layers contains 3D depth-layered widgets
```

**Rule:** All generated HTML/CSS must use `#E91E63` as the primary brand color. Never override the brand primary without an explicit user request.

---

## How to Loop Over needs_update Beats

Use the Sovereign Engine poll pattern to automate content generation triggers. The examples below are conceptual pseudocode – adapt them to your MCP client library:

```javascript
// Step 1: Find all beats that need update
const queryResult = await mcpClient.callTool('query_content', {
  endpoint: '/beats',
  params: { status: 'needs_update' }
});
const beats = JSON.parse(queryResult.content[0].text);

// Step 2: For each beat, trigger generation and update status
for (const beat of beats) {
  // Mark as in_progress
  await mcpClient.callTool('update_beat_status', {
    beat_id: beat.id,
    status: 'in_progress'
  });

  // TODO: trigger your generation pipeline here (e.g. video render, audio mix)
  // ...

  // Mark as completed (or failed on error)
  await mcpClient.callTool('update_beat_status', {
    beat_id: beat.id,
    status: 'completed'
  });
}
```

---

## Brand Color Enforcement Rule

When Space Agent generates any HTML, CSS, or UI component using this MCP server, it **must** apply the Multimedia Junkie brand:

```css
/* Required primary brand color */
--color-primary: #E91E63;
--color-secondary: #9C27B0;
--color-accent: #FF5722;
--color-background: #FAFAFA;
--color-text: #212121;
```

Always call `get_brand_guidelines` or read the `brand://multimedia-junkie/guidelines` resource before generating styled output to ensure the latest brand values are used.

---

## Connecting the MCP Server

Add to your Space Agent MCP configuration:

```json
{
  "mcpServers": {
    "mjunkie-mcp": {
      "command": "node",
      "args": ["/path/to/mjunkie-mcp/dist/index.js"],
      "env": {
        "SOVEREIGN_ENGINE_URL": "http://localhost:3000"
      }
    }
  }
}
```

Start the Sovereign Engine separately:
```bash
cd mjunkie-mcp
npm run db       # starts json-server on port 3000
npm start        # starts MCP server
```

Or use Docker for a one-command setup:
```bash
cd mjunkie-mcp
docker compose up
```
