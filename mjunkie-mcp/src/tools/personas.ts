/**
 * Persona tools – Phase 4: Autonomous persona workflows.
 *
 * Specialized MCP tools for CEO Mimi, CTO Zara, and CFO Maya
 * to manage and query the Sovereign Engine pipeline.
 */

import { type Tool } from '@modelcontextprotocol/sdk/types.js';
import { fetchSovereign, SOVEREIGN_ENGINE_BASE_URL } from './content.js';

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const mimiStrategicQueryTool: Tool = {
  name: 'mimi_strategic_query',
  description:
    'CEO Mimi strategic query: returns published cases sorted by runtime descending, ' +
    'plus a list of all failed beats. Provides an executive summary for strategic decisions.',
  inputSchema: {
    type: 'object',
    properties: {
      max_cases: {
        type: 'number',
        description: 'Maximum number of top cases to return (default: 5).',
      },
    },
  },
};

export const zaraTechQueryTool: Tool = {
  name: 'zara_tech_query',
  description:
    'CTO Zara technical query: returns character capability roster and all beats ' +
    'currently in "needs_update" state (paginated). Used for pipeline management decisions.',
  inputSchema: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        description: 'Page number for needs_update beats pagination (1-indexed, default: 1).',
      },
      page_size: {
        type: 'number',
        description: 'Beats per page (default: 10).',
      },
    },
  },
};

export const mayaFinanceQueryTool: Tool = {
  name: 'maya_finance_query',
  description:
    'CFO Maya finance query: aggregates all asset credits consumed and revenue attributed, ' +
    'then returns a per-case ROI breakdown and an overall summary.',
  inputSchema: {
    type: 'object',
    properties: {
      include_per_case: {
        type: 'boolean',
        description: 'If true, include per-case financial breakdowns (default: true).',
      },
    },
  },
};

// ─── Tool Handlers ────────────────────────────────────────────────────────────

type ToolResult = { content: Array<{ type: 'text'; text: string }> };
function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
function err(message: string): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }] };
}

interface Case { id: string; name: string; status: string; runtime: number; [k: string]: unknown }
interface Beat { id: string; status: string; [k: string]: unknown }
interface Asset { case_id?: string; credits_consumed?: number; revenue_attributed?: number; [k: string]: unknown }

export async function handleMimiStrategicQuery(
  args: { max_cases?: number },
  baseUrl = SOVEREIGN_ENGINE_BASE_URL,
): Promise<ToolResult> {
  try {
    const [cases, beats] = await Promise.all([
      fetchSovereign('/cases', undefined, baseUrl) as Promise<Case[]>,
      fetchSovereign('/beats', undefined, baseUrl) as Promise<Beat[]>,
    ]);

    const maxCases = args.max_cases ?? 5;
    const publishedCases = (cases as Case[])
      .filter((c) => c.status === 'published')
      .sort((a, b) => b.runtime - a.runtime)
      .slice(0, maxCases);

    const failedBeats = (beats as Beat[]).filter((b) => b.status === 'failed');

    return ok({
      persona: 'CEO Mimi',
      summary: {
        top_published_cases: publishedCases,
        failed_beats: failedBeats,
        action_required: failedBeats.length > 0,
        recommendation:
          failedBeats.length > 0
            ? `${failedBeats.length} beat(s) failed. Escalate to CTO Zara for pipeline review.`
            : 'All active beats healthy. Focus on publishing in-progress cases.',
      },
    });
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function handleZaraTechQuery(
  args: { page?: number; page_size?: number },
  baseUrl = SOVEREIGN_ENGINE_BASE_URL,
): Promise<ToolResult> {
  try {
    const page = Math.max(1, Math.trunc(args.page ?? 1));
    const pageSize = Math.max(1, Math.trunc(args.page_size ?? 10));

    if (!Number.isFinite(page) || !Number.isFinite(pageSize)) {
      return err('Invalid pagination parameters: page and page_size must be finite numbers >= 1.');
    }

    const [characters, allBeats] = await Promise.all([
      fetchSovereign('/characters', undefined, baseUrl) as Promise<unknown[]>,
      fetchSovereign('/beats', undefined, baseUrl) as Promise<Beat[]>,
    ]);

    const needsUpdate = (allBeats as Beat[]).filter((b) => b.status === 'needs_update');
    const start = (page - 1) * pageSize;
    const pageBeats = needsUpdate.slice(start, start + pageSize);

    return ok({
      persona: 'CTO Zara',
      characters: characters,
      needs_update_beats: {
        page,
        page_size: pageSize,
        total: needsUpdate.length,
        total_pages: Math.ceil(needsUpdate.length / pageSize),
        items: pageBeats,
      },
      pipeline_health:
        needsUpdate.length === 0 ? 'GREEN' : needsUpdate.length < 3 ? 'AMBER' : 'RED',
    });
  } catch (e) {
    return err((e as Error).message);
  }
}

export async function handleMayaFinanceQuery(
  args: { include_per_case?: boolean },
  baseUrl = SOVEREIGN_ENGINE_BASE_URL,
): Promise<ToolResult> {
  try {
    const [assets, cases] = await Promise.all([
      fetchSovereign('/assets', undefined, baseUrl) as Promise<Asset[]>,
      fetchSovereign('/cases', undefined, baseUrl) as Promise<Case[]>,
    ]);

    const includePer = args.include_per_case !== false;

    const totalCredits = (assets as Asset[]).reduce((s, a) => s + (a.credits_consumed ?? 0), 0);
    const totalRevenue = (assets as Asset[]).reduce((s, a) => s + (a.revenue_attributed ?? 0), 0);
    const overallRoi =
      totalCredits > 0
        ? (((totalRevenue - totalCredits) / totalCredits) * 100).toFixed(2)
        : 'N/A';

    let perCase: unknown[] = [];
    if (includePer) {
      perCase = (cases as Case[]).map((c) => {
        const caseAssets = (assets as Asset[]).filter((a) => a.case_id === c.id);
        const cCredits = caseAssets.reduce((s, a) => s + (a.credits_consumed ?? 0), 0);
        const cRevenue = caseAssets.reduce((s, a) => s + (a.revenue_attributed ?? 0), 0);
        return {
          case_id: c.id,
          case_name: c.name,
          assets: caseAssets.length,
          credits_consumed: cCredits,
          revenue_attributed: cRevenue,
          roi_percent: cCredits > 0
            ? (((cRevenue - cCredits) / cCredits) * 100).toFixed(2)
            : 'N/A',
        };
      });
    }

    return ok({
      persona: 'CFO Maya',
      overall: {
        total_assets: (assets as Asset[]).length,
        total_credits_consumed: totalCredits,
        total_revenue_attributed: totalRevenue,
        roi_percent: overallRoi,
      },
      ...(includePer ? { per_case: perCase } : {}),
    });
  } catch (e) {
    return err((e as Error).message);
  }
}
