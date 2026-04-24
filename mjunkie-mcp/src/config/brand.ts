/**
 * Multimedia Junkie brand configuration.
 * All UI generation must adhere strictly to these values.
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
}

export interface Gradient {
  name: string;
  value: string;
  usage: string;
}

export interface AccessibilityConstraint {
  pair: [string, string];
  ratio: string;
  level: 'AA' | 'AAA';
  passes: boolean;
}

export interface Typography {
  fontPrimary: string;
  fontMonospace: string;
  scaleBase: number;
  scaleRatio: number;
  weights: { light: number; regular: number; medium: number; bold: number };
}

export interface BrandConfig {
  name: string;
  tagline: string;
  website: string;
  founded: number;
  colors: ColorPalette;
  gradients: Gradient[];
  typography: Typography;
  accessibility: AccessibilityConstraint[];
  services: string[];
  socialHandles: Record<string, string>;
}

export const BRAND: BrandConfig = {
  name: 'Multimedia Junkie',
  tagline: 'Addicted to Creating Amazing Content',
  website: 'https://multimediajunkie.com',
  founded: 2020,

  colors: {
    primary: '#E91E63',      // Hot pink – primary CTA and brand moments
    secondary: '#9C27B0',    // Purple – supporting brand accent
    accent: '#FF5722',       // Deep orange – highlights and alerts
    background: '#FAFAFA',   // Near-white – page/card backgrounds
    surface: '#FFFFFF',      // Pure white – elevated surfaces
    text: '#212121',         // Near-black – primary body text
    textSecondary: '#757575', // Grey – secondary labels
    error: '#F44336',        // Red – error states
    success: '#4CAF50',      // Green – success states
    warning: '#FFC107',      // Amber – warning states
  },

  gradients: [
    {
      name: 'brand_hero',
      value: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
      usage: 'Hero sections, primary CTAs, splash screens',
    },
    {
      name: 'brand_warm',
      value: 'linear-gradient(135deg, #FF5722 0%, #E91E63 100%)',
      usage: 'Secondary buttons, highlight banners',
    },
    {
      name: 'brand_dark',
      value: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
      usage: 'Dark mode backgrounds, Command Center panels',
    },
  ],

  typography: {
    fontPrimary: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    fontMonospace: "'JetBrains Mono', 'Fira Code', monospace",
    scaleBase: 16,     // px
    scaleRatio: 1.25,  // Major third
    weights: { light: 300, regular: 400, medium: 500, bold: 700 },
  },

  accessibility: [
    {
      pair: ['#E91E63', '#FFFFFF'],
      ratio: '4.56:1',
      level: 'AA',
      passes: true,
    },
    {
      pair: ['#212121', '#FAFAFA'],
      ratio: '16.10:1',
      level: 'AAA',
      passes: true,
    },
    {
      pair: ['#9C27B0', '#FFFFFF'],
      ratio: '5.14:1',
      level: 'AA',
      passes: true,
    },
    {
      pair: ['#FF5722', '#FFFFFF'],
      ratio: '3.69:1',
      level: 'AA',
      passes: false, // Fails AA on small text; use on large text / icons only
    },
  ],

  services: [
    'Video Production',
    'Audio Engineering',
    'Motion Graphics',
    'Interactive Media',
    'Brand Strategy',
    'Social Content',
  ],

  socialHandles: {
    twitter: '@MultimediaJunkie',
    instagram: '@multimediajunkie',
    youtube: 'MultimediaJunkieOfficial',
    linkedin: 'multimedia-junkie',
  },
};
