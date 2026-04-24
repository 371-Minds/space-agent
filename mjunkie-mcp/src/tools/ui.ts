/**
 * UI tools – Phase 3: Space Agent UI & Template System.
 *
 * Provides MCP tool definitions for dashboard layout generation
 * and real-time widget state updates.
 */

import { type Tool } from '@modelcontextprotocol/sdk/types.js';
import { BRAND } from '../config/brand.js';
import {
  HERO_BRANDING,
  TIME_DATE_CARD,
  METRIC_CARD,
  SERVICE_MONITOR,
} from '../schemas/widgets.js';

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const generateDashboardLayoutTool: Tool = {
  name: 'generate_dashboard_layout',
  description:
    'Generate a Multimedia Junkie dashboard layout for Space Agent rendering. ' +
    'Two modes: "command_center" (12×8 grid, standard laptop/desktop) or ' +
    '"spatial_floating" (3D depth-layered, AR/Vision Pro style). ' +
    'All layouts are pre-filled with brand colors.',
  inputSchema: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['command_center', 'spatial_floating'],
        description: 'The dashboard rendering mode.',
      },
      title: {
        type: 'string',
        description: 'Optional title for the dashboard panel.',
      },
    },
    required: ['mode'],
  },
};

export const updateWidgetStateTool: Tool = {
  name: 'update_widget_state',
  description:
    'Update the state of an individual widget within a rendered dashboard. ' +
    'Provide the widget type and the properties to patch.',
  inputSchema: {
    type: 'object',
    properties: {
      widget_type: {
        type: 'string',
        enum: ['time_date_card', 'hero_branding', 'metric_card', 'service_monitor'],
        description: 'The type of widget to update.',
      },
      widget_id: {
        type: 'string',
        description: 'Unique ID of the widget instance in the layout.',
      },
      props: {
        type: 'object',
        description: 'Key-value map of properties to patch on the widget.',
        additionalProperties: true,
      },
    },
    required: ['widget_type', 'widget_id', 'props'],
  },
};

// ─── Layout Builders ─────────────────────────────────────────────────────────

type ToolResult = { content: Array<{ type: 'text'; text: string }> };
function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

interface GridCell {
  widget_id: string;
  widget_type: string;
  col: number;
  row: number;
  col_span: number;
  row_span: number;
  props: Record<string, unknown>;
}

function buildCommandCenter(title: string): object {
  const cells: GridCell[] = [
    {
      widget_id: 'hero_01',
      widget_type: 'hero_branding',
      col: 1, row: 1, col_span: 12, row_span: 2,
      props: { ...HERO_BRANDING.defaultProps },
    },
    {
      widget_id: 'clock_01',
      widget_type: 'time_date_card',
      col: 1, row: 3, col_span: 3, row_span: 2,
      props: { ...TIME_DATE_CARD.defaultProps },
    },
    {
      widget_id: 'metric_renders',
      widget_type: 'metric_card',
      col: 4, row: 3, col_span: 3, row_span: 2,
      props: {
        ...METRIC_CARD.defaultProps,
        label: 'Renders / Hour',
        value: 42,
        unit: 'fps',
        trend: 'up',
      },
    },
    {
      widget_id: 'metric_credits',
      widget_type: 'metric_card',
      col: 7, row: 3, col_span: 3, row_span: 2,
      props: {
        ...METRIC_CARD.defaultProps,
        label: 'Credits Used',
        value: 215,
        unit: 'credits',
        trend: 'flat',
        accentColor: BRAND.colors.accent,
      },
    },
    {
      widget_id: 'metric_roi',
      widget_type: 'metric_card',
      col: 10, row: 3, col_span: 3, row_span: 2,
      props: {
        ...METRIC_CARD.defaultProps,
        label: 'ROI',
        value: '328',
        unit: '%',
        trend: 'up',
        accentColor: BRAND.colors.success,
      },
    },
    {
      widget_id: 'svc_video',
      widget_type: 'service_monitor',
      col: 1, row: 5, col_span: 4, row_span: 2,
      props: { ...SERVICE_MONITOR.defaultProps, serviceName: 'Video Pipeline', state: 'online' },
    },
    {
      widget_id: 'svc_audio',
      widget_type: 'service_monitor',
      col: 5, row: 5, col_span: 4, row_span: 2,
      props: { ...SERVICE_MONITOR.defaultProps, serviceName: 'Audio Engineering', state: 'warning', details: '2 beats need update' },
    },
    {
      widget_id: 'svc_motion',
      widget_type: 'service_monitor',
      col: 9, row: 5, col_span: 4, row_span: 2,
      props: { ...SERVICE_MONITOR.defaultProps, serviceName: 'Motion Graphics', state: 'online' },
    },
  ];

  return {
    mode: 'command_center',
    title,
    grid: { columns: 12, rows: 8 },
    brand: {
      primary: BRAND.colors.primary,
      secondary: BRAND.colors.secondary,
      background: BRAND.colors.background,
    },
    cells,
  };
}

interface FloatingLayer {
  layer_id: string;
  depth: number;
  widget_id: string;
  widget_type: string;
  position: { x: number; y: number; z: number };
  scale: number;
  opacity: number;
  props: Record<string, unknown>;
}

function buildSpatialFloating(title: string): object {
  const layers: FloatingLayer[] = [
    {
      layer_id: 'layer_bg',
      depth: 0,
      widget_id: 'hero_spatial',
      widget_type: 'hero_branding',
      position: { x: 0, y: 0, z: 0 },
      scale: 1.0,
      opacity: 0.85,
      props: { ...HERO_BRANDING.defaultProps, height: 240 },
    },
    {
      layer_id: 'layer_clock',
      depth: 1,
      widget_id: 'clock_spatial',
      widget_type: 'time_date_card',
      position: { x: -400, y: 200, z: 50 },
      scale: 0.8,
      opacity: 1.0,
      props: { ...TIME_DATE_CARD.defaultProps },
    },
    {
      layer_id: 'layer_renders',
      depth: 2,
      widget_id: 'metric_renders_spatial',
      widget_type: 'metric_card',
      position: { x: 0, y: 300, z: 100 },
      scale: 1.1,
      opacity: 1.0,
      props: {
        ...METRIC_CARD.defaultProps,
        label: 'Active Renders',
        value: 7,
        unit: 'jobs',
        trend: 'up',
      },
    },
    {
      layer_id: 'layer_services',
      depth: 3,
      widget_id: 'svc_pipeline_spatial',
      widget_type: 'service_monitor',
      position: { x: 400, y: 150, z: 150 },
      scale: 0.9,
      opacity: 0.95,
      props: {
        ...SERVICE_MONITOR.defaultProps,
        serviceName: 'Sovereign Engine',
        state: 'online',
      },
    },
  ];

  return {
    mode: 'spatial_floating',
    title,
    environment: {
      worldScale: 1.0,
      depthUnit: 'cm',
      background: 'transparent',
      ambientLight: 0.6,
    },
    brand: {
      primary: BRAND.colors.primary,
      secondary: BRAND.colors.secondary,
      gradient: BRAND.gradients[0].value,
    },
    layers,
  };
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────

export function handleGenerateDashboardLayout(args: {
  mode: 'command_center' | 'spatial_floating';
  title?: string;
}): ToolResult {
  const title = args.title ?? 'Multimedia Junkie – Sovereign Dashboard';
  if (args.mode === 'command_center') return ok(buildCommandCenter(title));
  return ok(buildSpatialFloating(title));
}

export function handleUpdateWidgetState(args: {
  widget_type: string;
  widget_id: string;
  props: Record<string, unknown>;
}): ToolResult {
  return ok({
    updated: true,
    widget_id: args.widget_id,
    widget_type: args.widget_type,
    patched_props: args.props,
    message: `Widget ${args.widget_id} state updated. Rerender the dashboard to reflect changes.`,
  });
}
