/**
 * Content tools – Phase 1: Sovereign Engine integration.
 *
 * Provides MCP tool definitions for querying and mutating the
 * json-server Sovereign Engine database.
 */

import { type Tool } from '@modelcontextprotocol/sdk/types.js';

export const SOVEREIGN_ENGINE_BASE_URL =
  process.env.SOVEREIGN_ENGINE_URL ?? 'http://localhost:3000';

// ─── Tool Definitions ────────────────────────────────────────────────────────

/** Tool: query_content */
export const queryContentTool: Tool = {
  name: 'query_content',
  description:
    'Query the Sovereign Engine (json-server) database. Supports any endpoint ' +
    'such as /characters, /beats, /cases, or /assets. Optional query params are ' +
    'passed as a key-value map.',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        description:
          'The Sovereign Engine API endpoint to query, e.g. "/beats" or "/assets".',
      },
      params: {
        type: 'object',
        description:
          'Optional query parameters as a key-value map, e.g. {"status": "needs_update"}.',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['endpoint'],
  },
};

/** Tool: update_beat_status */
export const updateBeatStatusTool: Tool = {
  name: 'update_beat_status',
  description:
    'Update the status of a production beat in the Sovereign Engine. ' +
    'Valid statuses: "needs_update" | "in_progress" | "completed" | "failed".',
  inputSchema: {
    type: 'object',
    properties: {
      beat_id: {
        type: 'string',
        description: 'The ID of the beat to update, e.g. "beat_002".',
      },
      status: {
        type: 'string',
        enum: ['needs_update', 'in_progress', 'completed', 'failed'],
        description: 'The new status value.',
      },
    },
    required: ['beat_id', 'status'],
  },
};

/** Tool: track_finances */
export const trackFinancesTool: Tool = {
  name: 'track_finances',
  description:
    'Aggregate financial data from the Sovereign Engine assets. ' +
    'Returns total credits consumed, total revenue attributed, and calculated ROI.',
  inputSchema: {
    type: 'object',
    properties: {
      case_id: {
        type: 'string',
        description:
          'Optional: filter financial data to a specific case ID. ' +
          'Omit to aggregate across all assets.',
      },
    },
  },
};

// ─── Tool Handlers ────────────────────────────────────────────────────────────

export type ToolResult = { content: Array<{ type: 'text'; text: string }> };

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
  };
}

/**
 * Fetch from the Sovereign Engine json-server.
 * Exported for testability with a mock base URL.
 */
export async function fetchSovereign(
  endpoint: string,
  params?: Record<string, string>,
  baseUrl = SOVEREIGN_ENGINE_BASE_URL,
): Promise<unknown> {
  const url = new URL(endpoint, baseUrl);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Sovereign Engine error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function handleQueryContent(
  args: { endpoint: string; params?: Record<string, string> },
  baseUrl = SOVEREIGN_ENGINE_BASE_URL,
): Promise<ToolResult> {
  try {
    const data = await fetchSovereign(args.endpoint, args.params, baseUrl);
    return ok(data);
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function handleUpdateBeatStatus(
  args: { beat_id: string; status: string },
  baseUrl = SOVEREIGN_ENGINE_BASE_URL,
): Promise<ToolResult> {
  try {
    const url = new URL(`/beats/${args.beat_id}`, baseUrl).toString();
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: args.status }),
    });
    if (!res.ok) {
      return err(`Sovereign Engine error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return ok({ updated: true, beat: data });
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function handleTrackFinances(
  args: { case_id?: string },
  baseUrl = SOVEREIGN_ENGINE_BASE_URL,
): Promise<ToolResult> {
  try {
    const params = args.case_id ? { case_id: args.case_id } : undefined;
    const assets = (await fetchSovereign('/assets', params, baseUrl)) as Array<{
      credits_consumed?: number;
      revenue_attributed?: number;
    }>;

    const totalCredits = assets.reduce((s, a) => s + (a.credits_consumed ?? 0), 0);
    const totalRevenue = assets.reduce((s, a) => s + (a.revenue_attributed ?? 0), 0);
    const roi =
      totalCredits > 0
        ? (((totalRevenue - totalCredits) / totalCredits) * 100).toFixed(2)
        : 'N/A';

    return ok({
      asset_count: assets.length,
      total_credits_consumed: totalCredits,
      total_revenue_attributed: totalRevenue,
      roi_percent: roi,
      filter: args.case_id ? { case_id: args.case_id } : 'all',
    });
  } catch (e) {
    return err((e as Error).message);
  }
}
