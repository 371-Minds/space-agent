/**
 * Phase 3 Tests – Space Agent UI & Template System
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const {
  handleGenerateDashboardLayout,
  handleUpdateWidgetState,
} = await import('../dist/tools/ui.js');

const { ALL_WIDGET_SCHEMAS } = await import('../dist/schemas/widgets.js');
const { BRAND } = await import('../dist/config/brand.js');

describe('Phase 3 – Widget schemas', () => {
  it('defines all four required widget types', () => {
    assert.ok('time_date_card' in ALL_WIDGET_SCHEMAS);
    assert.ok('hero_branding' in ALL_WIDGET_SCHEMAS);
    assert.ok('metric_card' in ALL_WIDGET_SCHEMAS);
    assert.ok('service_monitor' in ALL_WIDGET_SCHEMAS);
  });

  it('hero_branding uses the primary brand color', () => {
    const schema = ALL_WIDGET_SCHEMAS.hero_branding;
    const gradient = schema.defaultProps.gradient;
    assert.ok(
      typeof gradient === 'string' && gradient.includes('#E91E63'),
      'Hero branding gradient must include primary brand color',
    );
  });

  it('service_monitor has correct state enum values', () => {
    const schema = ALL_WIDGET_SCHEMAS.service_monitor;
    const stateColors = schema.defaultProps.stateColors;
    assert.ok(stateColors.online === BRAND.colors.success);
    assert.ok(stateColors.warning === BRAND.colors.warning);
    assert.ok(stateColors.offline === BRAND.colors.error);
  });

  it('each widget schema has a type, title, description, and defaultProps', () => {
    for (const [key, schema] of Object.entries(ALL_WIDGET_SCHEMAS)) {
      assert.equal(schema.type, key, `${key} type should match its key`);
      assert.ok(schema.title?.length > 0, `${key} needs a title`);
      assert.ok(schema.description?.length > 0, `${key} needs a description`);
      assert.ok(typeof schema.defaultProps === 'object', `${key} needs defaultProps`);
    }
  });
});

describe('Phase 3 – generate_dashboard_layout (command_center)', () => {
  let layout;
  it('returns a valid command_center layout', () => {
    const result = handleGenerateDashboardLayout({ mode: 'command_center' });
    layout = JSON.parse(result.content[0].text);
    assert.equal(layout.mode, 'command_center');
  });

  it('uses a 12x8 grid', () => {
    assert.equal(layout.grid.columns, 12);
    assert.equal(layout.grid.rows, 8);
  });

  it('contains brand colors matching the brand config', () => {
    assert.equal(layout.brand.primary, BRAND.colors.primary);
    assert.equal(layout.brand.secondary, BRAND.colors.secondary);
  });

  it('contains at least 4 cells', () => {
    assert.ok(Array.isArray(layout.cells));
    assert.ok(layout.cells.length >= 4);
  });

  it('hero cell spans all 12 columns', () => {
    const hero = layout.cells.find((c) => c.widget_type === 'hero_branding');
    assert.ok(hero, 'Layout should contain a hero_branding cell');
    assert.equal(hero.col_span, 12);
  });

  it('service monitors are present', () => {
    const monitors = layout.cells.filter((c) => c.widget_type === 'service_monitor');
    assert.ok(monitors.length >= 1);
  });

  it('accepts a custom title', () => {
    const result = handleGenerateDashboardLayout({
      mode: 'command_center',
      title: 'Custom Dashboard',
    });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.title, 'Custom Dashboard');
  });
});

describe('Phase 3 – generate_dashboard_layout (spatial_floating)', () => {
  let layout;
  it('returns a valid spatial_floating layout', () => {
    const result = handleGenerateDashboardLayout({ mode: 'spatial_floating' });
    layout = JSON.parse(result.content[0].text);
    assert.equal(layout.mode, 'spatial_floating');
  });

  it('contains layers with depth values', () => {
    assert.ok(Array.isArray(layout.layers));
    assert.ok(layout.layers.length >= 2);
    for (const layer of layout.layers) {
      assert.ok(typeof layer.depth === 'number');
      assert.ok(typeof layer.position.z === 'number');
    }
  });

  it('includes 3D environment config', () => {
    assert.ok(layout.environment);
    assert.ok('worldScale' in layout.environment);
    assert.ok('depthUnit' in layout.environment);
  });

  it('gradient includes primary brand color', () => {
    assert.ok(layout.brand.gradient.includes('#E91E63'));
  });

  it('layers are sorted ascending by depth', () => {
    const depths = layout.layers.map((l) => l.depth);
    for (let i = 1; i < depths.length; i++) {
      assert.ok(depths[i] >= depths[i - 1], 'Layers should be in ascending depth order');
    }
  });
});

describe('Phase 3 – update_widget_state', () => {
  it('returns updated flag and echo of patched props', () => {
    const result = handleUpdateWidgetState({
      widget_type: 'metric_card',
      widget_id: 'metric_renders',
      props: { value: 99, trend: 'up' },
    });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.updated, true);
    assert.equal(data.widget_id, 'metric_renders');
    assert.deepEqual(data.patched_props, { value: 99, trend: 'up' });
  });

  it('includes a message string', () => {
    const result = handleUpdateWidgetState({
      widget_type: 'service_monitor',
      widget_id: 'svc_video',
      props: { state: 'warning' },
    });
    const data = JSON.parse(result.content[0].text);
    assert.ok(typeof data.message === 'string');
  });
});
