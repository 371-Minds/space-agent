/**
 * Phase 2 Tests – Brand System tools
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { handleGetBrandGuidelines, handleGetColorPalette, getBrandResource, BRAND_RESOURCE_URI } =
  await import('../dist/tools/brand.js');

const { BRAND } = await import('../dist/config/brand.js');

describe('Phase 2 – get_brand_guidelines', () => {
  it('returns the full brand config', () => {
    const result = handleGetBrandGuidelines();
    assert.equal(result.content[0].type, 'text');
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.name, 'Multimedia Junkie');
    assert.equal(data.colors.primary, '#E91E63');
    assert.equal(data.colors.secondary, '#9C27B0');
    assert.equal(data.colors.accent, '#FF5722');
  });

  it('includes tagline', () => {
    const result = handleGetBrandGuidelines();
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.tagline.length > 0);
  });

  it('includes all six services', () => {
    const result = handleGetBrandGuidelines();
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.services.length, 6);
    assert.ok(data.services.includes('Video Production'));
    assert.ok(data.services.includes('Motion Graphics'));
  });

  it('includes typography config', () => {
    const result = handleGetBrandGuidelines();
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.typography);
    assert.ok(data.typography.fontPrimary);
    assert.equal(typeof data.typography.scaleBase, 'number');
  });
});

describe('Phase 2 – get_color_palette', () => {
  it('returns colors without extra sections by default', () => {
    const result = handleGetColorPalette({});
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.colors);
    assert.equal(data.gradients, undefined);
    assert.equal(data.accessibility, undefined);
  });

  it('includes gradients when requested', () => {
    const result = handleGetColorPalette({ include_gradients: true });
    const data = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(data.gradients));
    assert.ok(data.gradients.length > 0);
    assert.ok(data.gradients[0].value.includes('#E91E63'));
  });

  it('includes accessibility table when requested', () => {
    const result = handleGetColorPalette({ include_accessibility: true });
    const data = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(data.accessibility));
    assert.ok(data.accessibility.length > 0);
    const aaEntry = data.accessibility.find((e) => e.level === 'AA' && e.passes);
    assert.ok(aaEntry, 'Should have at least one passing AA pair');
  });

  it('can include both gradients and accessibility', () => {
    const result = handleGetColorPalette({ include_gradients: true, include_accessibility: true });
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.gradients);
    assert.ok(data.accessibility);
  });
});

describe('Phase 2 – Brand MCP Resource', () => {
  it('uses the correct URI', () => {
    assert.equal(BRAND_RESOURCE_URI, 'brand://multimedia-junkie/guidelines');
  });

  it('resource text is valid JSON with brand data', () => {
    const r = getBrandResource();
    const data = JSON.parse(r.text);
    assert.equal(data.name, BRAND.name);
    assert.equal(data.colors.primary, BRAND.colors.primary);
  });

  it('resource has correct mimeType', () => {
    const r = getBrandResource();
    assert.equal(r.mimeType, 'application/json');
  });
});

describe('Phase 2 – Brand config integrity', () => {
  it('primary color is the hot-pink brand value', () => {
    assert.equal(BRAND.colors.primary, '#E91E63');
  });

  it('all colors start with #', () => {
    for (const [key, value] of Object.entries(BRAND.colors)) {
      assert.ok(value.startsWith('#'), `${key} should be a hex color`);
    }
  });

  it('accessibility array has at least one AAA-passing pair', () => {
    const aaaPass = BRAND.accessibility.find((a) => a.level === 'AAA' && a.passes);
    assert.ok(aaaPass, 'At least one AAA pair should pass');
  });
});
