/**
 * Phase 4 Tests – Persona Workflow tools (Mimi, Zara, Maya)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// ─── Mock Sovereign Engine ────────────────────────────────────────────────────

const MOCK_DB = {
  characters: [
    { id: 'char_001', name: 'CEO Mimi', role: 'Chief Executive Officer', capabilities: ['strategic_decisions'] },
    { id: 'char_002', name: 'CTO Zara', role: 'Chief Technology Officer', capabilities: ['technical_architecture'] },
    { id: 'char_003', name: 'CFO Maya', role: 'Chief Financial Officer', capabilities: ['credit_tracking'] },
  ],
  cases: [
    { id: 'case_001', name: 'ch01_geometric_outlier', status: 'published', runtime: 127 },
    { id: 'case_002', name: 'ch02_neon_pulse', status: 'in_progress', runtime: 84 },
    { id: 'case_003', name: 'ch03_brand_evolution', status: 'published', runtime: 203 },
  ],
  beats: [
    { id: 'beat_001', case_id: 'case_001', status: 'completed' },
    { id: 'beat_002', case_id: 'case_001', status: 'needs_update' },
    { id: 'beat_003', case_id: 'case_002', status: 'needs_update' },
    { id: 'beat_004', case_id: 'case_002', status: 'failed' },
    { id: 'beat_005', case_id: 'case_003', status: 'completed' },
    { id: 'beat_006', case_id: 'case_003', status: 'failed' },
  ],
  assets: [
    { id: 'asset_001', case_id: 'case_001', credits_consumed: 120, revenue_attributed: 800 },
    { id: 'asset_002', case_id: 'case_003', credits_consumed: 45, revenue_attributed: 300 },
    { id: 'asset_003', case_id: 'case_001', credits_consumed: 20, revenue_attributed: 150 },
    { id: 'asset_004', case_id: 'case_003', credits_consumed: 30, revenue_attributed: 200 },
  ],
};

let mockServer;
let mockBaseUrl;

before(async () => {
  await new Promise((resolve) => {
    mockServer = createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname.slice(1);
      const collection = MOCK_DB[path];
      if (!collection) { res.writeHead(404); res.end('{}'); return; }
      let result = collection;
      for (const [k, v] of url.searchParams.entries()) {
        result = result.filter((item) => String(item[k]) === v);
      }
      res.writeHead(200);
      res.end(JSON.stringify(result));
    });
    mockServer.listen(0, '127.0.0.1', () => {
      const { port } = mockServer.address();
      mockBaseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => mockServer?.close());

const {
  handleMimiStrategicQuery,
  handleZaraTechQuery,
  handleMayaFinanceQuery,
} = await import('../dist/tools/personas.js');

// ─── CEO Mimi ─────────────────────────────────────────────────────────────────

describe('Phase 4 – mimi_strategic_query', () => {
  it('returns published cases sorted by runtime descending', async () => {
    const result = await handleMimiStrategicQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.persona, 'CEO Mimi');
    const cases = data.summary.top_published_cases;
    assert.ok(cases.length >= 1);
    // Sorted by runtime descending: case_003 (203) before case_001 (127)
    assert.ok(cases[0].runtime >= cases[cases.length - 1].runtime);
  });

  it('includes failed beats list', async () => {
    const result = await handleMimiStrategicQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(data.summary.failed_beats));
    assert.equal(data.summary.failed_beats.length, 2);
  });

  it('sets action_required when there are failed beats', async () => {
    const result = await handleMimiStrategicQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.summary.action_required, true);
  });

  it('respects max_cases limit', async () => {
    const result = await handleMimiStrategicQuery({ max_cases: 1 }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.summary.top_published_cases.length, 1);
  });
});

// ─── CTO Zara ─────────────────────────────────────────────────────────────────

describe('Phase 4 – zara_tech_query', () => {
  it('returns character roster', async () => {
    const result = await handleZaraTechQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.persona, 'CTO Zara');
    assert.equal(data.characters.length, 3);
  });

  it('returns paginated needs_update beats', async () => {
    const result = await handleZaraTechQuery({ page: 1, page_size: 10 }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.needs_update_beats.total, 2);
    assert.equal(data.needs_update_beats.items.length, 2);
  });

  it('reports pipeline health as AMBER when few beats need update', async () => {
    const result = await handleZaraTechQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    // 2 needs_update beats → AMBER
    assert.equal(data.pipeline_health, 'AMBER');
  });

  it('paginates correctly', async () => {
    const result = await handleZaraTechQuery({ page: 1, page_size: 1 }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.needs_update_beats.items.length, 1);
    assert.equal(data.needs_update_beats.total_pages, 2);
  });

  it('clamps page_size: 0 to 1 (no invalid pagination)', async () => {
    const result = await handleZaraTechQuery({ page: 1, page_size: 0 }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    // page_size 0 is clamped to 1; total_pages should be a finite integer
    assert.ok(Number.isFinite(data.needs_update_beats.total_pages));
    assert.ok(data.needs_update_beats.page_size >= 1);
  });

  it('clamps negative page to 1', async () => {
    const result = await handleZaraTechQuery({ page: -5, page_size: 10 }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.needs_update_beats.page, 1);
  });
});

// ─── CFO Maya ─────────────────────────────────────────────────────────────────

describe('Phase 4 – maya_finance_query', () => {
  it('returns correct overall totals', async () => {
    const result = await handleMayaFinanceQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.persona, 'CFO Maya');
    assert.equal(data.overall.total_credits_consumed, 215);   // 120+45+20+30
    assert.equal(data.overall.total_revenue_attributed, 1450); // 800+300+150+200
    assert.equal(data.overall.total_assets, 4);
  });

  it('calculates a positive ROI', async () => {
    const result = await handleMayaFinanceQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    const roi = parseFloat(data.overall.roi_percent);
    assert.ok(roi > 0, 'ROI should be positive');
  });

  it('includes per-case breakdown by default', async () => {
    const result = await handleMayaFinanceQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(data.per_case));
    assert.equal(data.per_case.length, 3);
  });

  it('omits per_case when include_per_case is false', async () => {
    const result = await handleMayaFinanceQuery({ include_per_case: false }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.per_case, undefined);
  });

  it('per-case ROI is N/A for case with no assets', async () => {
    const result = await handleMayaFinanceQuery({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    const case2 = data.per_case.find((c) => c.case_id === 'case_002');
    assert.equal(case2.roi_percent, 'N/A');
    assert.equal(case2.credits_consumed, 0);
  });
});
