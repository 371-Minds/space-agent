/**
 * mjunkie-mcp – Multimedia Junkie MCP Server
 *
 * The "Sovereign Engine" API bridge for autonomous content generation and
 * spatial dashboard rendering. Exposes tools for the Space Agent to manage
 * the Multimedia Junkie content pipeline, brand system, and UI.
 *
 * Architecture:
 *   Phase 1 – Sovereign Engine (json-server) content tools
 *   Phase 2 – Brand system tools + resource
 *   Phase 3 – Space Agent UI layout tools
 *   Phase 4 – Persona workflow tools (Mimi / Zara / Maya)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ── Tools ────────────────────────────────────────────────────────────────────
import {
  queryContentTool,
  updateBeatStatusTool,
  trackFinancesTool,
  handleQueryContent,
  handleUpdateBeatStatus,
  handleTrackFinances,
} from './tools/content.js';

import {
  getBrandGuidelinesTool,
  getColorPaletteTool,
  handleGetBrandGuidelines,
  handleGetColorPalette,
  BRAND_RESOURCE_URI,
  getBrandResource,
} from './tools/brand.js';

import {
  generateDashboardLayoutTool,
  updateWidgetStateTool,
  handleGenerateDashboardLayout,
  handleUpdateWidgetState,
} from './tools/ui.js';

import {
  mimiStrategicQueryTool,
  zaraTechQueryTool,
  mayaFinanceQueryTool,
  handleMimiStrategicQuery,
  handleZaraTechQuery,
  handleMayaFinanceQuery,
} from './tools/personas.js';

import {
  invokeSimulatorWorkflowTool,
  benchmarkMemoryModesTool,
  handleInvokeSimulatorWorkflow,
  handleBenchmarkMemoryModes,
} from './tools/simulator.js';

// ── Resources ────────────────────────────────────────────────────────────────
import {
  SOVEREIGN_RESOURCE_URI,
  getSovereignResource,
} from './resources/sovereign.js';

// ─── Server Bootstrap ─────────────────────────────────────────────────────────

const server = new Server(
  { name: 'mjunkie-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } },
);

// ── List Tools ───────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Phase 1 – Sovereign Engine
    queryContentTool,
    updateBeatStatusTool,
    trackFinancesTool,
    // Phase 2 – Brand System
    getBrandGuidelinesTool,
    getColorPaletteTool,
    // Phase 3 – UI Templates
    generateDashboardLayoutTool,
    updateWidgetStateTool,
    // Phase 4 – Persona Workflows
    mimiStrategicQueryTool,
    zaraTechQueryTool,
    mayaFinanceQueryTool,
    // Phase 5 – Simulator orchestration
    invokeSimulatorWorkflowTool,
    benchmarkMemoryModesTool,
  ],
}));

// ── Call Tool ────────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  switch (name) {
    // Phase 1
    case 'query_content':
      return handleQueryContent(args as Parameters<typeof handleQueryContent>[0]);
    case 'update_beat_status':
      return handleUpdateBeatStatus(args as Parameters<typeof handleUpdateBeatStatus>[0]);
    case 'track_finances':
      return handleTrackFinances(args as Parameters<typeof handleTrackFinances>[0]);

    // Phase 2
    case 'get_brand_guidelines':
      return handleGetBrandGuidelines();
    case 'get_color_palette':
      return handleGetColorPalette(args as Parameters<typeof handleGetColorPalette>[0]);

    // Phase 3
    case 'generate_dashboard_layout':
      return handleGenerateDashboardLayout(
        args as Parameters<typeof handleGenerateDashboardLayout>[0],
      );
    case 'update_widget_state':
      return handleUpdateWidgetState(args as Parameters<typeof handleUpdateWidgetState>[0]);

    // Phase 4
    case 'mimi_strategic_query':
      return handleMimiStrategicQuery(args as Parameters<typeof handleMimiStrategicQuery>[0]);
    case 'zara_tech_query':
      return handleZaraTechQuery(args as Parameters<typeof handleZaraTechQuery>[0]);
    case 'maya_finance_query':
      return handleMayaFinanceQuery(args as Parameters<typeof handleMayaFinanceQuery>[0]);

    // Phase 5
    case 'invoke_simulator_workflow':
      return handleInvokeSimulatorWorkflow(
        args as Parameters<typeof handleInvokeSimulatorWorkflow>[0],
      );
    case 'benchmark_memory_modes':
      return handleBenchmarkMemoryModes(
        args as Parameters<typeof handleBenchmarkMemoryModes>[0],
      );

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ── List Resources ────────────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: SOVEREIGN_RESOURCE_URI,
      name: 'Sovereign Engine Database',
      description: 'Live db.json snapshot: characters, cases, beats, assets.',
      mimeType: 'application/json',
    },
    {
      uri: BRAND_RESOURCE_URI,
      name: 'Multimedia Junkie Brand Guidelines',
      description: 'Brand colours, typography, services, and accessibility rules.',
      mimeType: 'application/json',
    },
  ],
}));

// ── Read Resource ─────────────────────────────────────────────────────────────

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  if (uri === SOVEREIGN_RESOURCE_URI) {
    const r = getSovereignResource();
    return { contents: [{ uri: r.uri, mimeType: r.mimeType, text: r.text }] };
  }
  if (uri === BRAND_RESOURCE_URI) {
    const r = getBrandResource();
    return { contents: [{ uri: r.uri, mimeType: r.mimeType, text: r.text }] };
  }
  throw new Error(`Unknown resource URI: ${uri}`);
});

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running and listening on stdio
}

main().catch((err) => {
  console.error('[mjunkie-mcp] Fatal error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close().then(() => process.exit(0)).catch(() => process.exit(1));
});
process.on('SIGINT', () => {
  server.close().then(() => process.exit(0)).catch(() => process.exit(1));
});
