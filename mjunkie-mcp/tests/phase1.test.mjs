/**
 * Phase 1 Tests – Sovereign Engine content tools
 *
 * Tests run with Node.js built-in test runner (node --test).
 * Content tools are tested against a mock Sovereign Engine server.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// ─── Mock Sovereign Engine ────────────────────────────────────────────────────

const MOCK_DB = {
  beats: [
    { id: 'beat_001', case_id: 'case_001', status: 'completed', duration_seconds: 15 },
    { id: 'beat_002', case_id: 'case_001', status: 'needs_update', duration_seconds: 30 },
    { id: 'beat_003', case_id: 'case_002', status: 'failed', duration_seconds: 60 },
  ],
  assets: [
    { id: 'asset_001', beat_id: 'beat_001', case_id: 'case_001', credits_consumed: 120, revenue_attributed: 800 },
    { id: 'asset_002', beat_id: 'beat_002', case_id: 'case_001', credits_consumed: 45, revenue_attributed: 300 },
  ],
  cases: [
    { id: 'case_001', name: 'ch01_geometric_outlier', status: 'published', runtime: 127 },
    { id: 'case_002', name: 'ch02_neon_pulse', status: 'in_progress', runtime: 84 },
  ],
};

let mockServer;
let mockBaseUrl;

function startMockServer() {
  return new Promise((resolve) => {
    mockServer = createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname.slice(1); // e.g. "beats"

      if (req.method === 'GET') {
        const collection = MOCK_DB[path];
        if (!collection) { res.writeHead(404); res.end(JSON.stringify({ error: 'not found' })); return; }

        // Simple filter by query params
        let result = collection;
        for (const [k, v] of url.searchParams.entries()) {
          result = result.filter((item) => String(item[k]) === v);
        }
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } else if (req.method === 'PATCH') {
        // e.g. /beats/beat_002
        const [col, id] = path.split('/');
        const item = (MOCK_DB[col] ?? []).find((x) => x.id === id);
        if (!item) { res.writeHead(404); res.end(JSON.stringify({ error: 'not found' })); return; }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          Object.assign(item, JSON.parse(body));
          res.writeHead(200);
          res.end(JSON.stringify(item));
        });
      } else {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'method not allowed' }));
      }
    });
    mockServer.listen(0, '127.0.0.1', () => {
      const { port } = mockServer.address();
      mockBaseUrl = `http://127.0.0.1:${port}`;
      resolve(mockBaseUrl);
    });
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// Dynamically import after setting up mock so we can override baseUrl
let handleQueryContent, handleUpdateBeatStatus, handleTrackFinances, fetchSovereign;

before(async () => {
  await startMockServer();
  const mod = await import('../dist/tools/content.js');
  handleQueryContent = mod.handleQueryContent;
  handleUpdateBeatStatus = mod.handleUpdateBeatStatus;
  handleTrackFinances = mod.handleTrackFinances;
  fetchSovereign = mod.fetchSovereign;
});

after(() => {
  mockServer?.close();
});

describe('Phase 1 – query_content', () => {
  it('returns all beats from /beats', async () => {
    const result = await handleQueryContent({ endpoint: '/beats' }, mockBaseUrl);
    assert.equal(result.content[0].type, 'text');
    const data = JSON.parse(result.content[0].text);
    assert.equal(Array.isArray(data), true);
    assert.equal(data.length, 3);
  });

  it('filters beats by status param', async () => {
    const result = await handleQueryContent(
      { endpoint: '/beats', params: { status: 'failed' } },
      mockBaseUrl,
    );
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.length, 1);
    assert.equal(data[0].status, 'failed');
  });

  it('returns error JSON for unknown endpoint', async () => {
    const result = await handleQueryContent({ endpoint: '/unknown' }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.ok('error' in data);
  });
});

describe('Phase 1 – update_beat_status', () => {
  it('patches a beat status to in_progress', async () => {
    const result = await handleUpdateBeatStatus(
      { beat_id: 'beat_002', status: 'in_progress' },
      mockBaseUrl,
    );
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.updated, true);
    assert.equal(data.beat.status, 'in_progress');
  });

  it('returns error for non-existent beat', async () => {
    const result = await handleUpdateBeatStatus(
      { beat_id: 'beat_999', status: 'completed' },
      mockBaseUrl,
    );
    const data = JSON.parse(result.content[0].text);
    assert.ok('error' in data);
  });
});

describe('Phase 1 – track_finances', () => {
  it('aggregates all asset finances', async () => {
    const result = await handleTrackFinances({}, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.asset_count, 2);
    assert.equal(data.total_credits_consumed, 165);
    assert.equal(data.total_revenue_attributed, 1100);
    // ROI = (1100 - 165) / 165 * 100 = 566.67
    assert.ok(parseFloat(data.roi_percent) > 500);
  });

  it('filters by case_id', async () => {
    const result = await handleTrackFinances({ case_id: 'case_001' }, mockBaseUrl);
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.filter.case_id, 'case_001');
  });
});

describe('Phase 1 – fetchSovereign', () => {
  it('throws on network error (bad URL)', async () => {
    await assert.rejects(
      () => fetchSovereign('/beats', undefined, 'http://127.0.0.1:1'),
      /ECONNREFUSED|fetch/i,
    );
  });
});
