// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT ENRICHMENT MODULE — References, YouTube, CTA Integration
// ═══════════════════════════════════════════════════════════════════════════════

import { ContentContract, InternalLinkTarget } from './types';
import {
  createCTABox, createReferencesSection, integrateYouTubeVideoIntoContent
} from './cta-links-accordion-video';

export interface ValidatedReference {
  title: string;
  url: string;
  source?: string;
  author?: string;
}

/**
 * SOTA Content Enrichment: Integrates references, YouTube video, and CTA into final HTML
 * @param contract - The content contract to enrich
 * @param validatedReferences - List of validated references from entity gap analysis
 * @param internalLinks - List of internal links from sitemap/WP discovery
 * @param articleTitle - The article title (for YouTube search)
 * @param serperApiKey - Serper API key for YouTube search (optional)
 * @param log - Logging callback
 */
export async function enrichContentWithReferencesYouTubeAndCTA(
  contract: ContentContract,
  validatedReferences: ValidatedReference[] | undefined,
  internalLinks: InternalLinkTarget[] | undefined,
  articleTitle: string,
  serperApiKey: string | undefined,
  log?: (msg: string) => void
): Promise<ContentContract> {
  const enriched = { ...contract };
  let html = enriched.htmlContent || '';

  log?.('🎨 ENRICHING CONTENT: References, YouTube, CTA Integration');

  try {
    // 1. Embed YouTube video if available
    if (serperApiKey) {
      log?.(' → Integrating YouTube video...');
      const youtubeResult = await integrateYouTubeVideoIntoContent(
        html,
        articleTitle
      );
      html = youtubeResult;
    } else {
      log?.(' ⚠️ Skipping YouTube: No Serper API key');
    }

    // 2. Add references section
    if (validatedReferences && validatedReferences.length > 0) {
      log?.(` → Adding ${validatedReferences.length} references...`);
      const referencesHtml = createReferencesSection(validatedReferences);
      // Insert before closing body or before last section
      const insertPos = Math.max(
        html.lastIndexOf('</section>'),
        html.lastIndexOf('</article>'),
        html.length - 100
      );
      html = html.slice(0, insertPos) + '\n' + referencesHtml + '\n' + html.slice(insertPos);
    }

    // 3. Add CTA with internal link
    if (internalLinks && internalLinks.length > 0) {
      log?.(' → Adding CTA with internal link...');
      // Pick the most relevant internal link
      const ctaLink = internalLinks[0];
      const ctaHtml = createCTABox({
        heading: 'Continue Learning',
        description: `Explore more insights and resources to deepen your knowledge on this topic.`,
        buttonText: 'Discover More',
        targetLink: ctaLink.url,
        emoji: '🎓'
      });
      // Append CTA at the end
      html = html + '\n' + ctaHtml;
    } else {
      log?.(' ⚠️ No internal links available for CTA');
    }

    enriched.htmlContent = html;
    log?.('✅ Content enrichment complete');
  } catch (error: any) {
    log?.(`❌ Enrichment error: ${error.message}`);
  }

  return enriched;
}

export default enrichContentWithReferencesYouTubeAndCTA;
