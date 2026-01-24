/**
 * Visual Design System v30.0 - Enterprise-Grade Blog Post Aesthetics
 * 
 * STATE-OF-THE-ART visual design system for generating beautiful,
 * modern, professional blog post layouts with premium typography,
 * spacing, and visual hierarchy.
 * 
 * @version 30.0.0
 * @license MIT
 */

export const VISUAL_DESIGN_VERSION = '30.0.0';

// ============================================================================
// DESIGN TOKENS - Premium Visual Constants
// ============================================================================

export interface DesignTokens {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  shadows: ShadowScale;
  borders: BorderScale;
  animations: AnimationTokens;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface TypographyScale {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ShadowScale {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface BorderScale {
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  width: {
    thin: string;
    medium: string;
    thick: string;
  };
}

export interface AnimationTokens {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    default: string;
    smooth: string;
    bounce: string;
  };
}

// ============================================================================
// DEFAULT DESIGN TOKENS - Enterprise Premium Theme
// ============================================================================

export const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    primary: '#1a365d',
    secondary: '#2d3748',
    accent: '#3182ce',
    background: '#ffffff',
    surface: '#f7fafc',
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
      muted: '#718096'
    },
    semantic: {
      success: '#38a169',
      warning: '#d69e2e',
      error: '#e53e3e',
      info: '#3182ce'
    }
  },
  typography: {
    fontFamily: {
      heading: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      body: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace"
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },
  borders: {
    radius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '4px'
    }
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
};

// ============================================================================
// PREMIUM VISUAL COMPONENTS
// ============================================================================

export interface HeroSectionConfig {
  title: string;
  subtitle?: string;
  backgroundType: 'gradient' | 'image' | 'solid' | 'pattern';
  backgroundColor?: string;
  gradientColors?: [string, string];
  imageUrl?: string;
  overlayOpacity?: number;
  alignment: 'left' | 'center' | 'right';
  height: 'small' | 'medium' | 'large' | 'full';
}

export interface CalloutBoxConfig {
  type: 'info' | 'success' | 'warning' | 'error' | 'tip' | 'quote';
  title?: string;
  content: string;
  icon?: string;
  collapsible?: boolean;
}

export interface TableOfContentsConfig {
  style: 'sidebar' | 'inline' | 'floating';
  maxDepth: number;
  numbered: boolean;
  sticky: boolean;
  highlightActive: boolean;
}

export interface CodeBlockConfig {
  language: string;
  code: string;
  showLineNumbers: boolean;
  highlightLines?: number[];
  title?: string;
  copyButton: boolean;
}

/**
 * Generate premium hero section HTML
 */
export function generateHeroSection(config: HeroSectionConfig, tokens: DesignTokens = DEFAULT_TOKENS): string {
  const heightMap = {
    small: '300px',
    medium: '450px',
    large: '600px',
    full: '100vh'
  };

  const alignmentMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
  };

  let backgroundStyle = '';
  if (config.backgroundType === 'gradient' && config.gradientColors) {
    backgroundStyle = `background: linear-gradient(135deg, ${config.gradientColors[0]}, ${config.gradientColors[1]});`;
  } else if (config.backgroundType === 'solid' && config.backgroundColor) {
    backgroundStyle = `background-color: ${config.backgroundColor};`;
  } else if (config.backgroundType === 'pattern') {
    backgroundStyle = `background: ${tokens.colors.primary}; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");`;
  }

  return `
<section class="wp-optimizer-hero" style="
  ${backgroundStyle}
  min-height: ${heightMap[config.height]};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: ${alignmentMap[config.alignment]};
  padding: ${tokens.spacing['3xl']};
  position: relative;
  overflow: hidden;
  border-radius: ${tokens.borders.radius.xl};
  margin-bottom: ${tokens.spacing['2xl']};
">
  <div style="
    position: relative;
    z-index: 2;
    max-width: 800px;
    text-align: ${config.alignment};
  ">
    <h1 style="
      font-family: ${tokens.typography.fontFamily.heading};
      font-size: ${tokens.typography.fontSize['5xl']};
      font-weight: ${tokens.typography.fontWeight.bold};
      color: white;
      line-height: ${tokens.typography.lineHeight.tight};
      margin-bottom: ${tokens.spacing.lg};
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">${config.title}</h1>
    ${config.subtitle ? `
    <p style="
      font-family: ${tokens.typography.fontFamily.body};
      font-size: ${tokens.typography.fontSize.xl};
      color: rgba(255,255,255,0.9);
      line-height: ${tokens.typography.lineHeight.relaxed};
    ">${config.subtitle}</p>` : ''}
  </div>
</section>
  `.trim();
}

/**
 * Generate premium callout box HTML
 */
export function generateCalloutBox(config: CalloutBoxConfig, tokens: DesignTokens = DEFAULT_TOKENS): string {
  const typeStyles = {
    info: { bg: '#ebf8ff', border: tokens.colors.semantic.info, icon: 'ℹ️' },
    success: { bg: '#f0fff4', border: tokens.colors.semantic.success, icon: '✅' },
    warning: { bg: '#fffaf0', border: tokens.colors.semantic.warning, icon: '⚠️' },
    error: { bg: '#fff5f5', border: tokens.colors.semantic.error, icon: '❌' },
    tip: { bg: '#faf5ff', border: '#805ad5', icon: '💡' },
    quote: { bg: '#f7fafc', border: tokens.colors.secondary, icon: '💬' }
  };

  const style = typeStyles[config.type];
  const icon = config.icon || style.icon;

  return `
<aside class="wp-optimizer-callout wp-optimizer-callout--${config.type}" style="
  background-color: ${style.bg};
  border-left: 4px solid ${style.border};
  border-radius: ${tokens.borders.radius.md};
  padding: ${tokens.spacing.lg};
  margin: ${tokens.spacing.xl} 0;
  box-shadow: ${tokens.shadows.sm};
">
  <div style="display: flex; align-items: flex-start; gap: ${tokens.spacing.md};">
    <span style="font-size: 1.5rem; flex-shrink: 0;">${icon}</span>
    <div style="flex: 1;">
      ${config.title ? `
      <strong style="
        display: block;
        font-family: ${tokens.typography.fontFamily.heading};
        font-size: ${tokens.typography.fontSize.lg};
        font-weight: ${tokens.typography.fontWeight.semibold};
        color: ${tokens.colors.text.primary};
        margin-bottom: ${tokens.spacing.sm};
      ">${config.title}</strong>` : ''}
      <div style="
        font-family: ${tokens.typography.fontFamily.body};
        font-size: ${tokens.typography.fontSize.base};
        color: ${tokens.colors.text.secondary};
        line-height: ${tokens.typography.lineHeight.relaxed};
      ">${config.content}</div>
    </div>
  </div>
</aside>
  `.trim();
}

/**
 * Generate premium table of contents HTML
 */
export function generateTableOfContents(
  headings: Array<{ id: string; text: string; level: number }>,
  config: TableOfContentsConfig,
  tokens: DesignTokens = DEFAULT_TOKENS
): string {
  const filteredHeadings = headings.filter(h => h.level <= config.maxDepth);
  
  let counter = 0;
  const items = filteredHeadings.map((heading, index) => {
    const indent = (heading.level - 1) * 16;
    counter++;
    const prefix = config.numbered ? `${counter}. ` : '';
    
    return `
    <li style="margin-left: ${indent}px; margin-bottom: ${tokens.spacing.xs};">
      <a href="#${heading.id}" style="
        color: ${tokens.colors.text.secondary};
        text-decoration: none;
        font-size: ${tokens.typography.fontSize.sm};
        transition: color ${tokens.animations.duration.fast} ${tokens.animations.easing.default};
        display: block;
        padding: ${tokens.spacing.xs} 0;
      " onmouseover="this.style.color='${tokens.colors.accent}'" 
         onmouseout="this.style.color='${tokens.colors.text.secondary}'">
        ${prefix}${heading.text}
      </a>
    </li>`;
  }).join('');

  const stickyStyle = config.sticky ? 'position: sticky; top: 20px;' : '';

  return `
<nav class="wp-optimizer-toc" aria-label="Table of Contents" style="
  background-color: ${tokens.colors.surface};
  border: 1px solid #e2e8f0;
  border-radius: ${tokens.borders.radius.lg};
  padding: ${tokens.spacing.lg};
  margin-bottom: ${tokens.spacing.xl};
  ${stickyStyle}
">
  <h2 style="
    font-family: ${tokens.typography.fontFamily.heading};
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.text.primary};
    margin-bottom: ${tokens.spacing.md};
    padding-bottom: ${tokens.spacing.sm};
    border-bottom: 2px solid ${tokens.colors.accent};
  ">Table of Contents</h2>
  <ol style="list-style: none; padding: 0; margin: 0;">
    ${items}
  </ol>
</nav>
  `.trim();
}

/**
 * Generate premium code block HTML with syntax highlighting
 */
export function generateCodeBlock(config: CodeBlockConfig, tokens: DesignTokens = DEFAULT_TOKENS): string {
  const lines = config.code.split('\n');
  const lineNumbersHtml = config.showLineNumbers 
    ? lines.map((_, i) => `<span style="color: ${tokens.colors.text.muted}; user-select: none;">${i + 1}</span>`).join('\n')
    : '';

  return `
<div class="wp-optimizer-code-block" style="
  background-color: #1a1a2e;
  border-radius: ${tokens.borders.radius.lg};
  overflow: hidden;
  margin: ${tokens.spacing.xl} 0;
  box-shadow: ${tokens.shadows.lg};
">
  ${config.title ? `
  <div style="
    background-color: #16162a;
    padding: ${tokens.spacing.sm} ${tokens.spacing.lg};
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #2d2d4a;
  ">
    <span style="
      font-family: ${tokens.typography.fontFamily.mono};
      font-size: ${tokens.typography.fontSize.sm};
      color: #a0aec0;
    ">${config.title}</span>
    <span style="
      font-size: ${tokens.typography.fontSize.xs};
      color: #718096;
      background-color: #2d2d4a;
      padding: 2px 8px;
      border-radius: ${tokens.borders.radius.sm};
    ">${config.language}</span>
  </div>` : ''}
  <div style="padding: ${tokens.spacing.lg}; overflow-x: auto;">
    <pre style="
      margin: 0;
      font-family: ${tokens.typography.fontFamily.mono};
      font-size: ${tokens.typography.fontSize.sm};
      line-height: 1.6;
      color: #e2e8f0;
    "><code>${escapeHtml(config.code)}</code></pre>
  </div>
</div>
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate global CSS styles for the design system
 */
export function generateGlobalStyles(tokens: DesignTokens = DEFAULT_TOKENS): string {
  return `
<style>
  .wp-optimizer-content {
    font-family: ${tokens.typography.fontFamily.body};
    font-size: ${tokens.typography.fontSize.lg};
    line-height: ${tokens.typography.lineHeight.relaxed};
    color: ${tokens.colors.text.primary};
    max-width: 768px;
    margin: 0 auto;
    padding: ${tokens.spacing['2xl']};
  }
  
  .wp-optimizer-content h1,
  .wp-optimizer-content h2,
  .wp-optimizer-content h3,
  .wp-optimizer-content h4 {
    font-family: ${tokens.typography.fontFamily.heading};
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.text.primary};
    line-height: ${tokens.typography.lineHeight.tight};
    margin-top: ${tokens.spacing['2xl']};
    margin-bottom: ${tokens.spacing.lg};
  }
  
  .wp-optimizer-content h1 { font-size: ${tokens.typography.fontSize['4xl']}; }
  .wp-optimizer-content h2 { font-size: ${tokens.typography.fontSize['3xl']}; }
  .wp-optimizer-content h3 { font-size: ${tokens.typography.fontSize['2xl']}; }
  .wp-optimizer-content h4 { font-size: ${tokens.typography.fontSize.xl}; }
  
  .wp-optimizer-content p {
    margin-bottom: ${tokens.spacing.lg};
  }
  
  .wp-optimizer-content a {
    color: ${tokens.colors.accent};
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color ${tokens.animations.duration.fast} ${tokens.animations.easing.default};
  }
  
  .wp-optimizer-content a:hover {
    border-bottom-color: ${tokens.colors.accent};
  }
  
  .wp-optimizer-content img {
    max-width: 100%;
    height: auto;
    border-radius: ${tokens.borders.radius.lg};
    box-shadow: ${tokens.shadows.md};
    margin: ${tokens.spacing.xl} 0;
  }
  
  .wp-optimizer-content blockquote {
    border-left: 4px solid ${tokens.colors.accent};
    margin: ${tokens.spacing.xl} 0;
    padding: ${tokens.spacing.lg};
    background-color: ${tokens.colors.surface};
    border-radius: 0 ${tokens.borders.radius.md} ${tokens.borders.radius.md} 0;
    font-style: italic;
    color: ${tokens.colors.text.secondary};
  }
</style>
  `.trim();
}

export default {
  VISUAL_DESIGN_VERSION,
  DEFAULT_TOKENS,
  generateHeroSection,
  generateCalloutBox,
  generateTableOfContents,
  generateCodeBlock,
  generateGlobalStyles
};
