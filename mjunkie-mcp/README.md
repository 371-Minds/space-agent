# mjunkie-mcp

**Multimedia Junkie MCP Server** – the Sovereign Engine API bridge for autonomous content generation and spatial dashboard rendering.

Built on the [Model Context Protocol](https://modelcontextprotocol.io) SDK, `mjunkie-mcp` connects the Multimedia Junkie creative production ecosystem to Space Agent and any other MCP-compatible AI framework.

---

## Architecture

```
mjunkie-mcp/
├── src/
│   ├── index.ts            # MCP server entry – registers all tools + resources
│   ├── config/
│   │   └── brand.ts        # Multimedia Junkie brand config (colors, typography)
│   ├── schemas/
│   │   └── widgets.ts      # JSON schemas for the four dashboard widget types
│   ├── tools/
│   │   ├── content.ts      # Phase 1: Sovereign Engine query/update/finance tools
│   │   ├── brand.ts        # Phase 2: Brand guidelines + color palette tools
│   │   ├── ui.ts           # Phase 3: Dashboard layout generation tools
│   │   └── personas.ts     # Phase 4: CEO Mimi / CTO Zara / CFO Maya workflows
│   └── resources/
│       └── sovereign.ts    # MCP Resource: live db.json snapshot
├── tests/
│   ├── phase1.test.mjs     # Sovereign Engine content tools tests
│   ├── phase2.test.mjs     # Brand system tests
│   ├── phase3.test.mjs     # UI template system tests
│   └── phase4.test.mjs     # Persona workflow tests
├── db.json                 # Sovereign Engine database (json-server)
├── Dockerfile              # Multi-stage build (builder + runtime)
├── docker-compose.yml      # One-command local dev: json-server + MCP server
├── docker-entrypoint.sh    # Container entrypoint script
├── SKILL.md                # Space Agent integration guide
└── AGENTS.md               # Agent implementation contract
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Install & build
```bash
cd mjunkie-mcp
bun install
bun run build
```

### Run locally (two terminals)

**Terminal 1 – Sovereign Engine:**
```bash
bun run db        # starts json-server on http://localhost:3000
```

**Terminal 2 – MCP Server:**
```bash
bun start         # starts MCP server on stdio
```

### Run with Docker
```bash
docker compose up   # starts both services
```

### Development mode (hot reload)
```bash
bun run dev   # bun --watch (no build step needed)
```

---

## Running Tests
```bash
bun test
```

Tests use the Node.js built-in test runner with mock HTTP servers. No external services required.

---

## Tools Reference

| Tool | Phase | Description |
|------|-------|-------------|
| `query_content` | 1 | GET any Sovereign Engine endpoint |
| `update_beat_status` | 1 | PATCH a beat status |
| `track_finances` | 1 | Aggregate credits + ROI |
| `get_brand_guidelines` | 2 | Full brand config |
| `get_color_palette` | 2 | Colors + optional gradients & a11y |
| `generate_dashboard_layout` | 3 | Command Center or Spatial Floating layout |
| `update_widget_state` | 3 | Patch live widget props |
| `mimi_strategic_query` | 4 | CEO executive summary |
| `zara_tech_query` | 4 | CTO pipeline health |
| `maya_finance_query` | 4 | CFO ROI breakdown |

---

## Resources

| URI | Description |
|-----|-------------|
| `sovereign://db` | Live Sovereign Engine db.json snapshot |
| `brand://multimedia-junkie/guidelines` | Brand configuration JSON |

---

## Brand Colors

All generated UI must use these values:

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#E91E63` | CTAs, brand moments |
| Secondary | `#9C27B0` | Supporting accents |
| Accent | `#FF5722` | Highlights, alerts |
| Background | `#FAFAFA` | Page / card backgrounds |
| Text | `#212121` | Body text |

See [SKILL.md](./SKILL.md) for the complete Space Agent integration guide.
