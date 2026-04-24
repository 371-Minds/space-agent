/**
 * Widget JSON schemas – Phase 3.
 *
 * These schemas describe the four core dashboard widgets used across
 * both the Command Center and Spatial Floating UI modes.
 */

import { BRAND } from '../config/brand.js';

export interface WidgetSchema {
  type: string;
  title: string;
  description: string;
  properties: Record<string, unknown>;
  defaultProps: Record<string, unknown>;
}

export const TIME_DATE_CARD: WidgetSchema = {
  type: 'time_date_card',
  title: 'Time & Date Card',
  description: 'Displays the current time and date with brand-consistent styling.',
  properties: {
    format: { type: 'string', enum: ['12h', '24h'], default: '24h' },
    showSeconds: { type: 'boolean', default: true },
    locale: { type: 'string', default: 'en-US' },
    backgroundColor: { type: 'string', default: BRAND.colors.surface },
    textColor: { type: 'string', default: BRAND.colors.text },
    accentColor: { type: 'string', default: BRAND.colors.primary },
  },
  defaultProps: {
    format: '24h',
    showSeconds: true,
    locale: 'en-US',
    backgroundColor: BRAND.colors.surface,
    textColor: BRAND.colors.text,
    accentColor: BRAND.colors.primary,
  },
};

export const HERO_BRANDING: WidgetSchema = {
  type: 'hero_branding',
  title: 'Hero Branding',
  description:
    'Multimedia Junkie identity block: logo, tagline, and gradient banner. ' +
    'Must always render with primary brand color #E91E63.',
  properties: {
    showLogo: { type: 'boolean', default: true },
    tagline: { type: 'string', default: BRAND.tagline },
    gradient: {
      type: 'string',
      default: BRAND.gradients[0].value,
      description: 'CSS gradient string applied to the hero background.',
    },
    height: { type: 'number', default: 200, description: 'Height in pixels.' },
  },
  defaultProps: {
    showLogo: true,
    tagline: BRAND.tagline,
    gradient: BRAND.gradients[0].value,
    height: 200,
  },
};

export const METRIC_CARD: WidgetSchema = {
  type: 'metric_card',
  title: 'Metric Card',
  description:
    'Displays a single KPI metric: label, value, unit, and optional trend arrow.',
  properties: {
    label: { type: 'string', description: 'Metric name, e.g. "Renders / Hour".' },
    value: { type: ['number', 'string'] },
    unit: { type: 'string', description: 'Unit suffix, e.g. "fps", "%" or "credits".' },
    trend: {
      type: 'string',
      enum: ['up', 'down', 'flat', 'none'],
      default: 'none',
    },
    accentColor: { type: 'string', default: BRAND.colors.secondary },
  },
  defaultProps: {
    label: 'Metric',
    value: 0,
    unit: '',
    trend: 'none',
    accentColor: BRAND.colors.secondary,
  },
};

export const SERVICE_MONITOR: WidgetSchema = {
  type: 'service_monitor',
  title: 'Service Monitor',
  description:
    'Pipeline service health card. States: Online (green), Warning (amber), Offline (red).',
  properties: {
    serviceName: { type: 'string', description: 'Name of the service, e.g. "Video Pipeline".' },
    state: {
      type: 'string',
      enum: ['online', 'warning', 'offline'],
      default: 'online',
    },
    details: { type: 'string', description: 'Optional status message.' },
    stateColors: {
      type: 'object',
      default: {
        online: BRAND.colors.success,
        warning: BRAND.colors.warning,
        offline: BRAND.colors.error,
      },
    },
  },
  defaultProps: {
    serviceName: 'Service',
    state: 'online',
    details: '',
    stateColors: {
      online: BRAND.colors.success,
      warning: BRAND.colors.warning,
      offline: BRAND.colors.error,
    },
  },
};

export const ALL_WIDGET_SCHEMAS: Record<string, WidgetSchema> = {
  time_date_card: TIME_DATE_CARD,
  hero_branding: HERO_BRANDING,
  metric_card: METRIC_CARD,
  service_monitor: SERVICE_MONITOR,
};
