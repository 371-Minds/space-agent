/**
 * Brand tools – Phase 2: Multimedia Junkie brand system.
 *
 * Provides MCP tool definitions for exposing brand guidelines and
 * colour palettes to the agent for consistent UI/content generation.
 */

import { type Tool } from '@modelcontextprotocol/sdk/types.js';
import { BRAND } from '../config/brand.js';

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const getBrandGuidelinesTool: Tool = {
  name: 'get_brand_guidelines',
  description:
    'Return the complete Multimedia Junkie brand guidelines including name, ' +
    'tagline, colours, typography, services, and accessibility constraints. ' +
    'Use this whenever generating UI components, videos, or marketing copy.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export const getColorPaletteTool: Tool = {
  name: 'get_color_palette',
  description:
    'Return the Multimedia Junkie colour palette including semantic colors, ' +
    'named gradients, and WCAG accessibility contrast ratios (AA/AAA). ' +
    'All HTML/CSS generation must reference these exact hex values.',
  inputSchema: {
    type: 'object',
    properties: {
      include_gradients: {
        type: 'boolean',
        description: 'Set to true to include named gradient definitions.',
      },
      include_accessibility: {
        type: 'boolean',
        description: 'Set to true to include WCAG contrast-ratio table.',
      },
    },
  },
};

// ─── Tool Handlers ────────────────────────────────────────────────────────────

type ToolResult = { content: Array<{ type: 'text'; text: string }> };

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

export function handleGetBrandGuidelines(): ToolResult {
  return ok(BRAND);
}

export function handleGetColorPalette(args: {
  include_gradients?: boolean;
  include_accessibility?: boolean;
}): ToolResult {
  const result: Record<string, unknown> = { colors: BRAND.colors };
  if (args.include_gradients) result.gradients = BRAND.gradients;
  if (args.include_accessibility) result.accessibility = BRAND.accessibility;
  return ok(result);
}

// ─── MCP Resource ────────────────────────────────────────────────────────────

/** URI for the brand guidelines MCP resource. */
export const BRAND_RESOURCE_URI = 'brand://multimedia-junkie/guidelines';

export function getBrandResource() {
  return {
    uri: BRAND_RESOURCE_URI,
    name: 'Multimedia Junkie Brand Guidelines',
    description:
      'Complete brand configuration: colours, typography, services, and accessibility rules.',
    mimeType: 'application/json',
    text: JSON.stringify(BRAND, null, 2),
  };
}
