/**
 * Semantic Content Optimizer v30.0 - Advanced HTML Structure Optimization
 * 
 * STATE-OF-THE-ART semantic HTML optimization for maximum SEO impact,
 * accessibility compliance, and search engine understanding.
 * 
 * @version 30.0.0
 * @license MIT
 */

export const SEMANTIC_OPTIMIZER_VERSION = '30.0.0';

// ============================================================================
// SEMANTIC STRUCTURE INTERFACES
// ============================================================================

export interface SemanticConfig {
  enableSchemaMarkup: boolean;
  enableOpenGraph: boolean;
  enableTwitterCards: boolean;
  enableAccessibility: boolean;
  enableMicrodata: boolean;
  contentType: 'article' | 'blog-post' | 'tutorial' | 'review' | 'how-to' | 'faq';
  language: string;
}

export interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  author: AuthorSchema;
  publisher: PublisherSchema;
  datePublished: string;
  dateModified: string;
  image?: string[];
  mainEntityOfPage?: string;
  wordCount?: number;
  articleSection?: string;
  keywords?: string[];
}

export interface AuthorSchema {
  '@type': 'Person' | 'Organization';
  name: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  jobTitle?: string;
  description?: string;
}

export interface PublisherSchema {
  '@type': 'Organization';
  name: string;
  logo: {
    '@type': 'ImageObject';
    url: string;
    width?: number;
    height?: number;
  };
  url?: string;
}

export interface FAQSchema {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: FAQItem[];
}

export interface FAQItem {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

export interface HowToSchema {
  '@context': string;
  '@type': 'HowTo';
  name: string;
  description: string;
  step: HowToStep[];
  totalTime?: string;
  estimatedCost?: {
    '@type': 'MonetaryAmount';
    currency: string;
    value: string;
  };
  tool?: string[];
  supply?: string[];
}

export interface HowToStep {
  '@type': 'HowToStep';
  name: string;
  text: string;
  url?: string;
  image?: string;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_SEMANTIC_CONFIG: SemanticConfig = {
  enableSchemaMarkup: true,
  enableOpenGraph: true,
  enableTwitterCards: true,
  enableAccessibility: true,
  enableMicrodata: true,
  contentType: 'article',
  language: 'en'
};

// ============================================================================
// SCHEMA MARKUP GENERATORS
// ============================================================================

/**
 * Generate Article Schema JSON-LD markup
 */
export function generateArticleSchema(data: {
  title: string;
  description: string;
  authorName: string;
  authorUrl?: string;
  authorJobTitle?: string;
  publisherName: string;
  publisherLogoUrl: string;
  datePublished: string;
  dateModified?: string;
  imageUrls?: string[];
  url?: string;
  wordCount?: number;
  section?: string;
  keywords?: string[];
}): string {
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    author: {
      '@type': 'Person',
      name: data.authorName,
      url: data.authorUrl,
      jobTitle: data.authorJobTitle
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisherName,
      logo: {
        '@type': 'ImageObject',
        url: data.publisherLogoUrl
      }
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    image: data.imageUrls,
    mainEntityOfPage: data.url,
    wordCount: data.wordCount,
    articleSection: data.section,
    keywords: data.keywords
  };

  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

/**
 * Generate FAQ Schema JSON-LD markup
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  const schema: FAQSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

/**
 * Generate HowTo Schema JSON-LD markup
 */
export function generateHowToSchema(data: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; imageUrl?: string }>;
  totalTime?: string;
  tools?: string[];
  supplies?: string[];
}): string {
  const schema: HowToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.name,
    description: data.description,
    totalTime: data.totalTime,
    tool: data.tools,
    supply: data.supplies,
    step: data.steps.map((step, index) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
      image: step.imageUrl,
      url: `#step-${index + 1}`
    }))
  };

  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

// ============================================================================
// OPEN GRAPH & TWITTER CARD GENERATORS
// ============================================================================

/**
 * Generate Open Graph meta tags
 */
export function generateOpenGraphMeta(data: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  siteName: string;
  type?: 'article' | 'website';
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}): string {
  const tags = [
    `<meta property="og:title" content="${escapeAttribute(data.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(data.description)}" />`,
    `<meta property="og:url" content="${data.url}" />`,
    `<meta property="og:site_name" content="${escapeAttribute(data.siteName)}" />`,
    `<meta property="og:type" content="${data.type || 'article'}" />`,
    `<meta property="og:locale" content="${data.locale || 'en_US'}" />`
  ];

  if (data.imageUrl) {
    tags.push(`<meta property="og:image" content="${data.imageUrl}" />`);
  }

  if (data.publishedTime) {
    tags.push(`<meta property="article:published_time" content="${data.publishedTime}" />`);
  }

  if (data.modifiedTime) {
    tags.push(`<meta property="article:modified_time" content="${data.modifiedTime}" />`);
  }

  if (data.author) {
    tags.push(`<meta property="article:author" content="${escapeAttribute(data.author)}" />`);
  }

  if (data.section) {
    tags.push(`<meta property="article:section" content="${escapeAttribute(data.section)}" />`);
  }

  if (data.tags) {
    data.tags.forEach(tag => {
      tags.push(`<meta property="article:tag" content="${escapeAttribute(tag)}" />`);
    });
  }

  return tags.join('\n');
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterCardMeta(data: {
  title: string;
  description: string;
  imageUrl?: string;
  cardType?: 'summary' | 'summary_large_image';
  site?: string;
  creator?: string;
}): string {
  const tags = [
    `<meta name="twitter:card" content="${data.cardType || 'summary_large_image'}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(data.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(data.description)}" />`
  ];

  if (data.imageUrl) {
    tags.push(`<meta name="twitter:image" content="${data.imageUrl}" />`);
  }

  if (data.site) {
    tags.push(`<meta name="twitter:site" content="${data.site}" />`);
  }

  if (data.creator) {
    tags.push(`<meta name="twitter:creator" content="${data.creator}" />`);
  }

  return tags.join('\n');
}

// ============================================================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================================================

/**
 * Add ARIA landmarks and roles to HTML content
 */
export function enhanceAccessibility(html: string): string {
  let enhanced = html;

  // Add role="main" to main content
  enhanced = enhanced.replace(
    /<article([^>]*)>/gi,
    '<article$1 role="article" itemscope itemtype="https://schema.org/Article">'
  );

  // Enhance navigation
  enhanced = enhanced.replace(
    /<nav([^>]*)>/gi,
    '<nav$1 role="navigation" aria-label="Main navigation">'
  );

  // Add skip link support
  const skipLink = '<a class="skip-link" href="#main-content" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;" onfocus="this.style.left=\'10px\';this.style.top=\'10px\';this.style.width=\'auto\';this.style.height=\'auto\';this.style.overflow=\'visible\';">Skip to main content</a>';

  if (!enhanced.includes('skip-link')) {
    enhanced = skipLink + enhanced;
  }

  // Ensure all images have alt text indication
  enhanced = enhanced.replace(
    /<img(?![^>]*alt=)([^>]*)>/gi,
    '<img alt="" $1>'
  );

  return enhanced;
}

/**
 * Generate semantic HTML wrapper for article content
 */
export function wrapInSemanticStructure(
  content: string,
  metadata: {
    title: string;
    author: string;
    publishDate: string;
    modifiedDate?: string;
    category?: string;
  }
): string {
  return `
<article class="semantic-article" itemscope itemtype="https://schema.org/Article">
  <header class="article-header">
    <h1 itemprop="headline">${metadata.title}</h1>
    <div class="article-meta">
      <address class="author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        By <span itemprop="name">${metadata.author}</span>
      </address>
      <time itemprop="datePublished" datetime="${metadata.publishDate}">
        Published: ${new Date(metadata.publishDate).toLocaleDateString()}
      </time>
      ${metadata.modifiedDate ? `
      <time itemprop="dateModified" datetime="${metadata.modifiedDate}">
        Updated: ${new Date(metadata.modifiedDate).toLocaleDateString()}
      </time>` : ''}
      ${metadata.category ? `
      <span itemprop="articleSection">${metadata.category}</span>` : ''}
    </div>
  </header>
  
  <div class="article-content" itemprop="articleBody">
    ${content}
  </div>
</article>
  `.trim();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Calculate content quality score based on semantic structure
 */
export function calculateSemanticScore(html: string): number {
  let score = 60; // Base score

  // Check for proper heading hierarchy
  if (/<h1[^>]*>/.test(html)) score += 5;
  if (/<h2[^>]*>/.test(html)) score += 5;
  if (/<h3[^>]*>/.test(html)) score += 3;

  // Check for semantic elements
  if (/<article[^>]*>/.test(html)) score += 5;
  if (/<section[^>]*>/.test(html)) score += 3;
  if (/<header[^>]*>/.test(html)) score += 3;
  if (/<footer[^>]*>/.test(html)) score += 2;
  if (/<nav[^>]*>/.test(html)) score += 2;
  if (/<aside[^>]*>/.test(html)) score += 2;

  // Check for schema.org microdata
  if (/itemscope/.test(html)) score += 5;
  if (/itemprop/.test(html)) score += 5;

  // Check for ARIA attributes
  if (/role=/.test(html)) score += 3;
  if (/aria-/.test(html)) score += 3;

  return Math.min(100, score);
}

export default {
  SEMANTIC_OPTIMIZER_VERSION,
  DEFAULT_SEMANTIC_CONFIG,
  generateArticleSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateOpenGraphMeta,
  generateTwitterCardMeta,
  enhanceAccessibility,
  wrapInSemanticStructure,
  calculateSemanticScore
};
