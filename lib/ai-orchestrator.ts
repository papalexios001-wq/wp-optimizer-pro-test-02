// ═══════════════════════════════════════════════════════════════════════════════
// WP OPTIMIZER PRO v27.0 — ENTERPRISE SOTA AI ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════
// 
// COMPLETE FEATURE SET:
// ✅ STAGED CONTENT PIPELINE — Generates outline → sections → merge (no truncation)
// ✅ THEME-ADAPTIVE VISUALS — Beautiful components that work on ANY theme
// ✅ REFERENCE DISCOVERY — Serper.dev powered authoritative source citations
// ✅ YOUTUBE INTEGRATION — Automatic relevant video discovery and embedding
// ✅ CIRCUIT BREAKER — Fails fast on repeated API errors
// ✅ ROBUST JSON HEALING — Multi-strategy recovery for malformed responses
// ✅ MULTI-PROVIDER — Google, OpenRouter, OpenAI, Anthropic, Groq
// ═══════════════════════════════════════════════════════════════════════════════

import { GoogleGenAI } from '@google/genai';
import { 
    ContentContract, 
    GenerateConfig, 
    SiteContext, 
    EntityGapAnalysis,
    NeuronAnalysisResult, 
    ExistingContentAnalysis, 
    InternalLinkTarget,
    ValidatedReference, 
    GeoTargetConfig, 
    NeuronTerm, 
    APP_VERSION
} from '../types';

import { injectInternalLinks } from '../utils';

// ═══════════════════════════════════════════════════════════════════════════════
// 📌 VERSION & CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const AI_ORCHESTRATOR_VERSION = "27.0.0";

const TIMEOUTS = {
    OUTLINE_GENERATION: 60000,
    SECTION_GENERATION: 90000,
    MERGE_GENERATION: 120000,
    POLISH_GENERATION: 90000,
    SINGLE_SHOT_GENERATION: 180000,
    OPENROUTER_REQUEST: 180000,
    CONTINUATION_REQUEST: 120000,
    TOTAL_JOB_TIMEOUT: 600000,
    REFERENCE_DISCOVERY: 30000,
    YOUTUBE_SEARCH: 20000,
} as const;

const CONTENT_TARGETS = {
    INITIAL_WORD_TARGET: 3000,
    EXPANDED_WORD_TARGET: 4000,
    FINAL_WORD_TARGET: 4500,
    MIN_ACCEPTABLE_WORDS: 2500,
    SECTION_TARGET_WORDS: 300,
    INTRO_TARGET_WORDS: 250,
    FAQ_TARGET_WORDS: 400,
} as const;

const GENERATION_CONFIG = {
    MAX_ATTEMPTS: 3,
    MAX_CONTINUATION_ATTEMPTS: 2,
    BASE_TEMPERATURE: 0.7,
    TEMPERATURE_INCREMENT: 0.05,
    MAX_TEMPERATURE: 0.9,
} as const;

const CIRCUIT_BREAKER = {
    FAILURE_THRESHOLD: 3,
    RESET_TIMEOUT: 60000,
    HALF_OPEN_REQUESTS: 1,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 YEAR CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();
export const CONTENT_YEAR = currentMonth === 11 ? currentYear + 1 : currentYear;

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface StageProgress {
    stage: 'outline' | 'sections' | 'youtube' | 'references' | 'merge' | 'polish' | 'validation';
    progress: number;
    message: string;
    sectionsCompleted?: number;
    totalSections?: number;
}

export interface GenerationResult {
    contract: ContentContract;
    groundingSources?: string[];
    generationMethod: 'staged' | 'single-shot' | 'continuation';
    attempts: number;
    totalTime: number;
    youtubeVideo?: YouTubeVideoData;
    references?: DiscoveredReference[];
}

interface CircuitBreakerState {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
    provider: string;
}

interface ParsedResponse {
    success: boolean;
    data?: ContentContract;
    error?: string;
    isTruncated?: boolean;
    truncationPoint?: string;
}

interface SectionGenerationResult {
    success: boolean;
    html: string;
    wordCount: number;
    sectionIndex: number;
    error?: string;
}

interface ContentOutline {
    title: string;
    metaDescription: string;
    slug: string;
    sections: Array<{
        heading: string;
        type: 'h2';
        keyPoints: string[];
        subsections: Array<{
            heading: string;
            keyPoints: string[];
        }>;
        visualComponents: string[];
    }>;
    faqTopics: string[];
    keyTakeaways: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 YOUTUBE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface YouTubeVideoData {
    videoId: string;
    title: string;
    channel: string;
    channelUrl?: string;
    views: number;
    duration?: string;
    thumbnailUrl: string;
    embedUrl: string;
    publishedAt?: string;
    description?: string;
    relevanceScore: number;
}

export interface YouTubeSearchOptions {
    minViews?: number;
    maxAgeDays?: number;
    preferredChannels?: string[];
    excludeChannels?: string[];
    maxResults?: number;
    language?: string;
    country?: string;
}

export interface YouTubeSearchResult {
    video: YouTubeVideoData | null;
    alternativeVideos: YouTubeVideoData[];
    searchQuery: string;
    source: 'serper' | 'fallback';
    searchTime: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📚 REFERENCE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DiscoveredReference {
    url: string;
    title: string;
    source: string;
    snippet?: string;
    year?: string | number;
    author?: string;
    isValid: boolean;
    authorityScore: number;
    favicon?: string;
}

export interface ReferenceDiscoveryOptions {
    targetCount?: number;
    minAuthorityScore?: number;
    includeNews?: boolean;
    includeAcademic?: boolean;
    geoCountry?: string;
    geoLanguage?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔌 CIRCUIT BREAKER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

const circuitBreakers = new Map<string, CircuitBreakerState>();

function getCircuitBreaker(provider: string): CircuitBreakerState {
    if (!circuitBreakers.has(provider)) {
        circuitBreakers.set(provider, {
            failures: 0,
            lastFailure: 0,
            isOpen: false,
            provider
        });
    }
    return circuitBreakers.get(provider)!;
}

function recordFailure(provider: string, log: LogFunction): void {
    const breaker = getCircuitBreaker(provider);
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
        breaker.isOpen = true;
        log(`⚡ Circuit breaker OPEN for ${provider} after ${breaker.failures} failures`);
    }
}

function recordSuccess(provider: string): void {
    const breaker = getCircuitBreaker(provider);
    breaker.failures = 0;
    breaker.isOpen = false;
}

function isCircuitOpen(provider: string): boolean {
    const breaker = getCircuitBreaker(provider);
    if (!breaker.isOpen) return false;
    if (Date.now() - breaker.lastFailure > CIRCUIT_BREAKER.RESET_TIMEOUT) {
        return false;
    }
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 LOGGING & UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

type LogFunction = (msg: string, progress?: number) => void;

function escapeHtml(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function countWords(text: string): number {
    if (!text) return 0;
    const stripped = text.replace(/<[^>]*>/g, ' ');
    return stripped.split(/\s+/).filter(w => w.length > 0).length;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseMs: number = 2000): number {
    const exponential = baseMs * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(exponential + jitter, 30000);
}

function generateUniqueId(): string {
    return `wpo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractDomain(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url.split('/')[2]?.replace('www.', '') || 'source';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 THEME-ADAPTIVE CSS — Works on ANY WordPress Theme
// ═══════════════════════════════════════════════════════════════════════════════

export const THEME_ADAPTIVE_CSS = `
<style>
/* WP Optimizer Pro Visual System v27.0 — Theme Adaptive */
.wpo-content {
  --wpo-primary: #6366f1;
  --wpo-primary-light: #818cf8;
  --wpo-primary-dark: #4f46e5;
  --wpo-success: #10b981;
  --wpo-success-light: #34d399;
  --wpo-warning: #f59e0b;
  --wpo-warning-light: #fbbf24;
  --wpo-danger: #ef4444;
  --wpo-danger-light: #f87171;
  --wpo-info: #3b82f6;
  --wpo-info-light: #60a5fa;
  
  --wpo-text: inherit;
  --wpo-text-muted: currentColor;
  --wpo-bg-subtle: rgba(128, 128, 128, 0.06);
  --wpo-bg-elevated: rgba(128, 128, 128, 0.1);
  --wpo-border: rgba(128, 128, 128, 0.15);
  --wpo-border-light: rgba(128, 128, 128, 0.08);
  
  --wpo-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --wpo-font-mono: ui-monospace, "SF Mono", Monaco, "Cascadia Code", monospace;
  
  --wpo-space-xs: 0.5rem;
  --wpo-space-sm: 0.75rem;
  --wpo-space-md: 1rem;
  --wpo-space-lg: 1.5rem;
  --wpo-space-xl: 2rem;
  --wpo-space-2xl: 3rem;
  
  --wpo-radius-sm: 8px;
  --wpo-radius-md: 12px;
  --wpo-radius-lg: 16px;
  --wpo-radius-xl: 20px;
  
  font-family: var(--wpo-font);
  line-height: 1.8;
  font-size: clamp(16px, 2.5vw, 18px);
  color: var(--wpo-text);
}

@media (max-width: 768px) {
  .wpo-content {
    --wpo-space-xl: 1.5rem;
    --wpo-space-2xl: 2rem;
  }
}

.wpo-box {
  position: relative;
  border-radius: var(--wpo-radius-lg);
  padding: var(--wpo-space-lg);
  margin: var(--wpo-space-xl) 0;
  border: 1px solid var(--wpo-border);
  background: var(--wpo-bg-subtle);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.wpo-box:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.wpo-content h2 {
  font-size: clamp(1.5rem, 4vw, 1.875rem);
  font-weight: 700;
  line-height: 1.3;
  margin: var(--wpo-space-2xl) 0 var(--wpo-space-lg);
  letter-spacing: -0.02em;
}

.wpo-content h3 {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  font-weight: 600;
  line-height: 1.4;
  margin: var(--wpo-space-xl) 0 var(--wpo-space-md);
}

.wpo-content p {
  margin: 0 0 var(--wpo-space-md);
  line-height: 1.8;
}

.wpo-content ul, .wpo-content ol {
  margin: var(--wpo-space-md) 0;
  padding-left: var(--wpo-space-lg);
}

.wpo-content li {
  margin: var(--wpo-space-xs) 0;
  line-height: 1.7;
}

.wpo-content a:not(.wpo-btn) {
  color: var(--wpo-primary);
  text-decoration: underline;
  text-decoration-color: rgba(99, 102, 241, 0.3);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s;
}

.wpo-content a:not(.wpo-btn):hover {
  text-decoration-color: var(--wpo-primary);
}
</style>
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 VISUAL COMPONENT GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

export function createQuickAnswerBox(answer: string, title: string = 'Quick Answer'): string {
    return `
<div class="wpo-box" style="
    background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%);
    border: 1px solid rgba(99,102,241,0.2);
    border-left: 4px solid #6366f1;
    border-radius: 16px;
    padding: 24px;
    margin: 32px 0;
">
    <div style="display: flex; align-items: flex-start; gap: 16px;">
        <div style="
            min-width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        ">
            <span style="font-size: 24px; line-height: 1;">⚡</span>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #6366f1;
                margin-bottom: 8px;
            ">${escapeHtml(title)}</div>
            <p style="
                font-size: 17px;
                line-height: 1.7;
                margin: 0;
                font-weight: 500;
            ">${answer}</p>
        </div>
    </div>
</div>`;
}

export function createProTipBox(tip: string, title: string = 'Pro Tip'): string {
    return `
<div class="wpo-box" style="
    background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(34,197,94,0.04) 100%);
    border: 1px solid rgba(16,185,129,0.2);
    border-left: 4px solid #10b981;
    border-radius: 16px;
    padding: 24px;
    margin: 28px 0;
">
    <div style="display: flex; align-items: flex-start; gap: 14px;">
        <div style="
            min-width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        ">
            <span style="font-size: 20px; line-height: 1;">💡</span>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #10b981;
                margin-bottom: 8px;
            ">${escapeHtml(title)}</div>
            <p style="
                font-size: 15px;
                line-height: 1.7;
                margin: 0;
            ">${tip}</p>
        </div>
    </div>
</div>`;
}

export function createWarningBox(warning: string, title: string = 'Important'): string {
    return `
<div class="wpo-box" style="
    background: linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(234,179,8,0.04) 100%);
    border: 1px solid rgba(245,158,11,0.25);
    border-left: 4px solid #f59e0b;
    border-radius: 16px;
    padding: 24px;
    margin: 28px 0;
">
    <div style="display: flex; align-items: flex-start; gap: 14px;">
        <div style="
            min-width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        ">
            <span style="font-size: 20px; line-height: 1;">⚠️</span>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #d97706;
                margin-bottom: 8px;
            ">${escapeHtml(title)}</div>
            <p style="
                font-size: 15px;
                line-height: 1.7;
                margin: 0;
            ">${warning}</p>
        </div>
    </div>
</div>`;
}

export function createKeyTakeaways(takeaways: string[]): string {
    if (!takeaways || takeaways.length === 0) return '';
    
    const items = takeaways.map((t, i) => `
        <li style="
            display: flex;
            align-items: flex-start;
            gap: 14px;
            padding: 14px 0;
            ${i < takeaways.length - 1 ? 'border-bottom: 1px solid rgba(128,128,128,0.08);' : ''}
        ">
            <span style="
                min-width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 13px;
                font-weight: 800;
                flex-shrink: 0;
            ">${i + 1}</span>
            <span style="font-size: 15px; line-height: 1.6; padding-top: 3px;">${escapeHtml(t)}</span>
        </li>
    `).join('');

    return `
<div class="wpo-box" style="
    background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.03) 100%);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 20px;
    padding: 28px;
    margin: 48px 0;
">
    <div style="
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(99,102,241,0.15);
    ">
        <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <span style="font-size: 22px; line-height: 1;">🎯</span>
        </div>
        <h3 style="
            font-size: 20px;
            font-weight: 800;
            margin: 0;
        ">Key Takeaways</h3>
    </div>
    <ul style="list-style: none; padding: 0; margin: 0;">
        ${items}
    </ul>
</div>`;
}

export function createFAQAccordion(faqs: Array<{ question: string; answer: string }>): string {
    if (!faqs || faqs.length === 0) return '';
    
    const sectionId = generateUniqueId();
    
    const faqItems = faqs.map((faq, index) => {
        const itemId = `${sectionId}-${index}`;
        return `
        <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="border-bottom: 1px solid rgba(128,128,128,0.1);">
            <input type="checkbox" id="${itemId}" style="position: absolute; opacity: 0; pointer-events: none;" />
            <label for="${itemId}" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 20px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                transition: background 0.2s;
                gap: 12px;
            ">
                <span itemprop="name" style="flex: 1;">${escapeHtml(faq.question)}</span>
                <span style="font-size: 12px; color: #6366f1; transition: transform 0.3s ease; flex-shrink: 0;" class="${sectionId}-arrow">▼</span>
            </label>
            <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out;" class="${sectionId}-content">
                <div itemprop="text" style="padding: 0 20px 20px 20px; font-size: 15px; line-height: 1.8; opacity: 0.85;">${faq.answer}</div>
            </div>
        </div>`;
    }).join('');

    return `
<style>
#${sectionId} input:checked + label + div { max-height: 1000px !important; }
#${sectionId} input:checked + label .${sectionId}-arrow { transform: rotate(180deg); }
#${sectionId} label:hover { background: rgba(128,128,128,0.04); }
</style>
<section id="${sectionId}" itemscope itemtype="https://schema.org/FAQPage" style="
    border: 1px solid rgba(128,128,128,0.15);
    border-radius: 20px;
    margin: 48px 0;
    overflow: hidden;
">
    <div style="padding: 22px 24px; background: rgba(128,128,128,0.04); border-bottom: 1px solid rgba(128,128,128,0.1);">
        <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 22px; line-height: 1;">❓</span>
            </div>
            <div>
                <h2 style="font-size: 20px; font-weight: 800; margin: 0;">Frequently Asked Questions</h2>
                <p style="font-size: 13px; opacity: 0.6; margin: 4px 0 0 0;">${faqs.length} questions answered</p>
            </div>
        </div>
    </div>
    ${faqItems}
</section>`;
}

export function createReferencesSection(references: DiscoveredReference[]): string {
    if (!references || references.length === 0) return '';
    
    const validRefs = references.filter(r => r.url && r.title);
    if (validRefs.length === 0) return '';
    
    const refItems = validRefs.map((ref, index) => {
        const domain = extractDomain(ref.url);
        const favicon = ref.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        const yearDisplay = ref.year ? ` (${ref.year})` : '';
        const authorDisplay = ref.author ? `${escapeHtml(ref.author)}. ` : '';
        
        return `
        <li style="display: flex; gap: 16px; padding: 16px 0; ${index < validRefs.length - 1 ? 'border-bottom: 1px solid rgba(128,128,128,0.08);' : ''} align-items: flex-start;">
            <span style="min-width: 28px; height: 28px; background: rgba(99,102,241,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6366f1; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 2px;">${index + 1}</span>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <img src="${favicon}" alt="" width="16" height="16" style="border-radius: 3px; flex-shrink: 0;" onerror="this.style.display='none'" />
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6; font-weight: 600;">${escapeHtml(ref.source || domain)}${yearDisplay}</span>
                </div>
                <a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer nofollow" style="font-size: 15px; font-weight: 600; color: #6366f1; text-decoration: none; display: block; line-height: 1.4; word-break: break-word;">
                    ${authorDisplay}${escapeHtml(ref.title)}
                </a>
                ${ref.snippet ? `<p style="font-size: 13px; line-height: 1.6; opacity: 0.7; margin: 8px 0 0 0;">${escapeHtml(ref.snippet.substring(0, 150))}${ref.snippet.length > 150 ? '...' : ''}</p>` : ''}
            </div>
        </li>`;
    }).join('');

    return `
<section style="background: rgba(128,128,128,0.03); border: 1px solid rgba(128,128,128,0.12); border-radius: 20px; padding: 28px; margin: 56px 0 32px 0;">
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(128,128,128,0.1);">
        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 22px; line-height: 1;">📚</span>
        </div>
        <div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 0;">References & Sources</h2>
            <p style="font-size: 13px; opacity: 0.6; margin: 4px 0 0 0;">${validRefs.length} authoritative sources cited</p>
        </div>
    </div>
    <ol style="list-style: none; padding: 0; margin: 0;">${refItems}</ol>
</section>`;
}

export function createYouTubeEmbed(video: YouTubeVideoData): string {
    const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };
    
    return `
<div class="wpo-youtube-embed" style="margin: 40px 0;">
    <div style="border: 1px solid rgba(128, 128, 128, 0.15); border-radius: 16px; overflow: hidden; background: rgba(128, 128, 128, 0.03);">
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(128, 128, 128, 0.1); display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${escapeHtml(video.title)}</div>
                <div style="font-size: 12px; opacity: 0.6; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span>${escapeHtml(video.channel)}</span>
                    <span style="opacity: 0.4;">•</span>
                    <span>${formatViews(video.views)} views</span>
                    ${video.duration ? `<span style="opacity: 0.4;">•</span><span>${video.duration}</span>` : ''}
                </div>
            </div>
        </div>
        <div style="position: relative; padding-bottom: 56.25%; height: 0; background: #000;">
            <iframe 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                src="${video.embedUrl}?rel=0&modestbranding=1"
                title="${escapeHtml(video.title)}"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
            ></iframe>
        </div>
    </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 YOUTUBE VIDEO DISCOVERY — Serper.dev Integration
// ═══════════════════════════════════════════════════════════════════════════════

function extractYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}

function parseViewCount(viewString: string | number | undefined): number {
    if (!viewString) return 0;
    if (typeof viewString === 'number') return viewString;
    const str = viewString.toString().toLowerCase().replace(/,/g, '');
    const multipliers: Record<string, number> = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
    for (const [suffix, multiplier] of Object.entries(multipliers)) {
        if (str.includes(suffix)) {
            const num = parseFloat(str.replace(/[^0-9.]/g, ''));
            return Math.round(num * multiplier);
        }
    }
    return parseInt(str.replace(/[^0-9]/g, '')) || 0;
}

function calculateVideoRelevanceScore(video: any, searchQuery: string, options: YouTubeSearchOptions): number {
    let score = 50;
    const title = (video.title || '').toLowerCase();
    const channel = (video.channel || '').toLowerCase();
    const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const titleMatches = queryWords.filter(word => title.includes(word)).length;
    score += Math.min(30, (titleMatches / queryWords.length) * 30);
    
    const views = parseViewCount(video.views);
    if (views >= 1000000) score += 15;
    else if (views >= 500000) score += 12;
    else if (views >= 100000) score += 10;
    else if (views >= 50000) score += 7;
    else if (views >= 10000) score += 5;
    
    if (options.preferredChannels?.some(c => channel.includes(c.toLowerCase()))) score += 10;
    if (options.excludeChannels?.some(c => channel.includes(c.toLowerCase()))) score -= 50;
    
    const tutorialKeywords = ['tutorial', 'guide', 'how to', 'explained', 'complete', 'full'];
    if (tutorialKeywords.some(kw => title.includes(kw))) score += 5;
    
    if (video.date) {
        const videoDate = new Date(video.date);
        const daysSincePublished = (Date.now() - videoDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished < 365) score += 5;
        if (daysSincePublished < 180) score += 3;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

export async function searchYouTubeVideo(
    topic: string,
    serperApiKey: string,
    options: YouTubeSearchOptions = {},
    log?: LogFunction
): Promise<YouTubeSearchResult> {
    const startTime = Date.now();
    const { minViews = 10000, maxAgeDays = 730, maxResults = 10, language = 'en', country = 'us' } = options;
    
    log?.(`🎬 Searching YouTube for: "${topic.substring(0, 50)}..."`);
    
    const searchQueries = [
        `${topic} tutorial guide`,
        `${topic} explained`,
        `${topic} complete guide ${currentYear}`,
    ];
    
    const allVideos: YouTubeVideoData[] = [];
    
    for (const query of searchQueries) {
        try {
            log?.(`   → Searching: "${query.substring(0, 40)}..."`);
            
            const response = await fetch('https://google.serper.dev/videos', {
                method: 'POST',
                headers: { 'X-API-KEY': serperApiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: query, gl: country, hl: language, num: maxResults })
            });
            
            if (!response.ok) {
                log?.(`   ⚠️ Serper API error: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            const videos = data.videos || [];
            
            log?.(`   → Found ${videos.length} videos`);
            
            for (const video of videos) {
                if (!video.link?.includes('youtube.com') && !video.link?.includes('youtu.be')) continue;
                
                const videoId = extractYouTubeVideoId(video.link);
                if (!videoId) continue;
                if (allVideos.some(v => v.videoId === videoId)) continue;
                
                const views = parseViewCount(video.views);
                if (views < minViews) continue;
                
                if (video.date && maxAgeDays) {
                    const videoDate = new Date(video.date);
                    const daysSincePublished = (Date.now() - videoDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSincePublished > maxAgeDays) continue;
                }
                
                const relevanceScore = calculateVideoRelevanceScore(video, topic, options);
                
                allVideos.push({
                    videoId,
                    title: video.title || 'Video',
                    channel: video.channel || 'Unknown Channel',
                    channelUrl: video.channelUrl,
                    views,
                    duration: video.duration,
                    thumbnailUrl: video.imageUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    embedUrl: `https://www.youtube.com/embed/${videoId}`,
                    publishedAt: video.date,
                    description: video.snippet,
                    relevanceScore
                });
            }
            
            const goodVideos = allVideos.filter(v => v.relevanceScore >= 60);
            if (goodVideos.length >= 3) break;
            
        } catch (error: any) {
            log?.(`   ⚠️ Search error: ${error.message}`);
        }
        
        await sleep(200);
    }
    
    allVideos.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    const searchTime = Date.now() - startTime;
    
    if (allVideos.length === 0) {
        log?.(`   ⚠️ No suitable YouTube videos found`);
        return { video: null, alternativeVideos: [], searchQuery: topic, source: 'serper', searchTime };
    }
    
    const bestVideo = allVideos[0];
    const alternatives = allVideos.slice(1, 4);
    
    log?.(`   ✅ Best match: "${bestVideo.title.substring(0, 50)}..."`);
    log?.(`   📊 ${bestVideo.channel} • ${bestVideo.views.toLocaleString()} views • Score: ${bestVideo.relevanceScore}/100`);
    
    return { video: bestVideo, alternativeVideos: alternatives, searchQuery: topic, source: 'serper', searchTime };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📚 REFERENCE DISCOVERY — Serper.dev Integration
// ═══════════════════════════════════════════════════════════════════════════════

const AUTHORITY_DOMAINS = {
    government: ['.gov', '.gov.uk', '.gov.au', '.gc.ca', '.europa.eu'],
    education: ['.edu', '.ac.uk', '.edu.au'],
    majorNews: ['reuters.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com', 'wsj.com', 'bloomberg.com', 'forbes.com'],
    scientific: ['nature.com', 'science.org', 'pubmed.gov', 'ncbi.nlm.nih.gov', 'mayoclinic.org', 'nih.gov', 'cdc.gov', 'who.int'],
    tech: ['techcrunch.com', 'wired.com', 'arstechnica.com', 'theverge.com', 'hbr.org', 'mckinsey.com'],
    reference: ['wikipedia.org', 'britannica.com', 'investopedia.com', 'statista.com', 'pewresearch.org']
};

function calculateAuthorityScore(url: string): number {
    const urlLower = url.toLowerCase();
    
    for (const gov of AUTHORITY_DOMAINS.government) {
        if (urlLower.includes(gov)) return 95;
    }
    for (const edu of AUTHORITY_DOMAINS.education) {
        if (urlLower.includes(edu)) return 92;
    }
    for (const sci of AUTHORITY_DOMAINS.scientific) {
        if (urlLower.includes(sci)) return 88;
    }
    for (const news of AUTHORITY_DOMAINS.majorNews) {
        if (urlLower.includes(news)) return 82;
    }
    for (const tech of AUTHORITY_DOMAINS.tech) {
        if (urlLower.includes(tech)) return 75;
    }
    for (const ref of AUTHORITY_DOMAINS.reference) {
        if (urlLower.includes(ref)) return 72;
    }
    
    return url.startsWith('https://') ? 50 : 30;
}

function extractSourceName(url: string): string {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        const sourceMap: Record<string, string> = {
            'nytimes.com': 'The New York Times', 'washingtonpost.com': 'The Washington Post',
            'theguardian.com': 'The Guardian', 'bbc.com': 'BBC', 'reuters.com': 'Reuters',
            'bloomberg.com': 'Bloomberg', 'forbes.com': 'Forbes', 'wsj.com': 'Wall Street Journal',
            'mayoclinic.org': 'Mayo Clinic', 'nature.com': 'Nature', 'hbr.org': 'Harvard Business Review',
            'pewresearch.org': 'Pew Research Center', 'statista.com': 'Statista', 'wikipedia.org': 'Wikipedia',
            'britannica.com': 'Encyclopædia Britannica', 'investopedia.com': 'Investopedia',
            'techcrunch.com': 'TechCrunch', 'wired.com': 'WIRED', 'nih.gov': 'National Institutes of Health',
            'cdc.gov': 'CDC', 'who.int': 'World Health Organization', 'ncbi.nlm.nih.gov': 'PubMed/NCBI',
        };
        return sourceMap[hostname] || hostname.split('.').slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase());
    } catch {
        return 'Source';
    }
}

function extractYear(text: string): string | undefined {
    const yearPattern = /\b(20[0-2][0-9])\b/g;
    const matches = text.match(yearPattern);
    if (matches) {
        const years = matches.map(Number).filter(y => y <= currentYear);
        if (years.length > 0) return Math.max(...years).toString();
    }
    return undefined;
}

export async function discoverReferences(
    topic: string,
    serperApiKey: string,
    options: ReferenceDiscoveryOptions = {},
    log?: LogFunction
): Promise<DiscoveredReference[]> {
    const { targetCount = 10, minAuthorityScore = 60, includeNews = true, includeAcademic = true, geoCountry = 'us', geoLanguage = 'en' } = options;
    
    log?.(`📚 Discovering references for: "${topic.substring(0, 40)}..."`);
    
    const allReferences: DiscoveredReference[] = [];
    const queries = [`${topic} research study statistics`, `${topic} expert guide official`];
    
    if (includeAcademic) queries.push(`${topic} site:edu OR site:gov`);
    if (includeNews) queries.push(`${topic} news ${currentYear}`);
    
    for (const query of queries) {
        try {
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': serperApiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: query, gl: geoCountry, hl: geoLanguage, num: 10 })
            });
            
            if (!response.ok) {
                log?.(`   ⚠️ Serper API error: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            const organic = data.organic || [];
            
            for (const result of organic) {
                if (!result.link || !result.title) continue;
                
                const skipDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'youtube.com', 'pinterest.com', 'reddit.com', 'quora.com', 'linkedin.com', 'medium.com'];
                const urlLower = result.link.toLowerCase();
                if (skipDomains.some(d => urlLower.includes(d))) continue;
                
                const authorityScore = calculateAuthorityScore(result.link);
                if (authorityScore < minAuthorityScore) continue;
                if (allReferences.some(r => r.url === result.link)) continue;
                
                const source = extractSourceName(result.link);
                const year = extractYear(result.title + ' ' + (result.snippet || ''));
                
                allReferences.push({
                    url: result.link,
                    title: result.title,
                    source,
                    snippet: result.snippet,
                    year,
                    authorityScore,
                    isValid: true,
                    favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.link).hostname}&sz=32`
                });
            }
        } catch (error: any) {
            log?.(`   ⚠️ Query failed: ${error.message}`);
        }
        
        await sleep(300);
    }
    
    const sortedRefs = allReferences.sort((a, b) => b.authorityScore - a.authorityScore).slice(0, targetCount);
    
    log?.(`   ✅ Found ${sortedRefs.length} high-quality references`);
    if (sortedRefs.length > 0) {
        log?.(`   📋 Top sources: ${sortedRefs.slice(0, 5).map(r => r.source).join(', ')}`);
    }
    
    return sortedRefs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 RESPONSE VALIDATION & JSON HEALING
// ═══════════════════════════════════════════════════════════════════════════════

function validateResponseCompleteness(responseText: string): {
    isComplete: boolean;
    isTruncated: boolean;
    truncationType: 'json' | 'content' | 'none';
    details: string;
} {
    if (!responseText || responseText.trim().length === 0) {
        return { isComplete: false, isTruncated: false, truncationType: 'none', details: 'Empty response' };
    }
    
    const trimmed = responseText.trim();
    
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;
    
    if (openBraces - closeBraces > 0 || openBrackets - closeBrackets > 0) {
        return { isComplete: false, isTruncated: true, truncationType: 'json', details: `JSON imbalance: ${openBraces - closeBraces} unclosed braces` };
    }
    
    const requiredFields = ['htmlContent', 'title', 'metaDescription'];
    const hasAllFields = requiredFields.every(field => trimmed.includes(`"${field}"`));
    
    if (!hasAllFields) {
        return { isComplete: false, isTruncated: true, truncationType: 'content', details: `Missing required fields` };
    }
    
    const lastChar = trimmed.replace(/\s+$/, '').slice(-1);
    if (lastChar !== '}') {
        return { isComplete: false, isTruncated: true, truncationType: 'json', details: `Response doesn't end with }` };
    }
    
    return { isComplete: true, isTruncated: false, truncationType: 'none', details: 'Response appears complete' };
}

function healJSON(rawText: string, log: LogFunction): ParsedResponse {
    if (!rawText || rawText.trim().length === 0) {
        return { success: false, error: 'Empty response text' };
    }
    
    let text = rawText.trim();
    
    // Strategy 1: Direct parse
    try {
        const parsed = JSON.parse(text);
        if (parsed.htmlContent) {
            log('   ✓ JSON parsed directly');
            return { success: true, data: parsed };
        }
    } catch {}
    
    // Strategy 2: Extract from markdown
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        try {
            const parsed = JSON.parse(jsonBlockMatch[1].trim());
            if (parsed.htmlContent) {
                log('   ✓ JSON extracted from markdown block');
                return { success: true, data: parsed };
            }
        } catch {}
    }
    
    // Strategy 3: Find boundaries
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
            const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
            if (parsed.htmlContent) {
                log('   ✓ JSON extracted by boundary detection');
                return { success: true, data: parsed };
            }
        } catch {}
    }
    
    // Strategy 4: Fix common issues
    let fixed = text;
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    try {
        const parsed = JSON.parse(fixed);
        if (parsed.htmlContent) {
            log('   ✓ JSON healed with syntax fixes');
            return { success: true, data: parsed };
        }
    } catch {}
    
    // Strategy 5: Close truncated JSON
    const validation = validateResponseCompleteness(text);
    if (validation.isTruncated && validation.truncationType === 'json') {
        log(`   → Attempting to close truncated JSON`);
        
        let closedText = text;
        const ob = (closedText.match(/\{/g) || []).length;
        const cb = (closedText.match(/\}/g) || []).length;
        const oB = (closedText.match(/\[/g) || []).length;
        const cB = (closedText.match(/\]/g) || []).length;
        
        closedText += ']'.repeat(Math.max(0, oB - cB));
        closedText += '}'.repeat(Math.max(0, ob - cb));
        
        try {
            const parsed = JSON.parse(closedText);
            if (parsed.htmlContent) {
                log('   ✓ JSON healed by closing truncated structure');
                return { success: true, data: parsed, isTruncated: true };
            }
        } catch {}
    }
    
    // Strategy 6: Field extraction
    log('   → Attempting field-by-field extraction');
    
    const extractField = (fieldName: string): string | null => {
        const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
        const match = text.match(pattern);
        return match ? match[1] : null;
    };
    
    const htmlContent = extractField('htmlContent');
    const title = extractField('title');
    const metaDescription = extractField('metaDescription');
    
    if (htmlContent && title) {
        log('   ✓ JSON reconstructed from field extraction');
        return {
            success: true,
            data: {
                htmlContent,
                title,
                metaDescription: metaDescription || '',
                slug: '',
                excerpt: '',
                faqs: [],
                wordCount: countWords(htmlContent),
            } as ContentContract,
            isTruncated: true
        };
    }
    
    return { success: false, error: `JSON parse failed. Preview: ${text.slice(0, 150)}...`, isTruncated: validation.isTruncated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

function buildSlimSystemPrompt(config: { topic: string; targetWords: number; hasNeuronData: boolean; hasEntityData: boolean }): string {
    return `You are an expert SEO content writer. Generate comprehensive, human-written blog content.

═══════════════════════════════════════════════════════════════════════════════
MANDATORY REQUIREMENTS — FOLLOW EXACTLY
═══════════════════════════════════════════════════════════════════════════════

TARGET: ${config.targetWords}+ words of REAL, VALUABLE content.

STRUCTURE RULES:
• NEVER use H1 tags — WordPress provides the title
• Use 8-12 H2 sections with 2-3 H3 subsections each
• Include visual boxes: Pro Tips, Warnings, Statistics, Expert Quotes
• Add FAQ section with 7-10 Q&As before conclusion

WRITING STYLE (Human, NOT AI):
• Use contractions (don't, won't, you'll, we're)
• Short paragraphs (2-4 sentences max)
• Mix sentence lengths. Short punchy. Then longer explanatory ones.
• Address reader as "you" constantly
• Start sentences with And, But, So, Look, Here's the thing
• Be opinionated — take a stance

BANNED AI PHRASES (NEVER USE):
• "In today's fast-paced world"
• "It's important to note"
• "Let's dive in"
• "Comprehensive guide"
• "Leverage", "utilize", "delve"
• "Without further ado"
• "In conclusion"

OUTPUT FORMAT: Valid JSON with this EXACT structure:
{
  "title": "string (50-60 chars, compelling)",
  "metaDescription": "string (150-160 chars)",
  "slug": "string (url-friendly-slug)",
  "htmlContent": "string (all HTML content)",
  "excerpt": "string (2-3 sentences)",
  "faqs": [{"question": "string", "answer": "string"}],
  "wordCount": number
}

⚠️ CRITICAL: Your response MUST be ONLY valid JSON — no text before or after.
⚠️ CRITICAL: htmlContent MUST be complete — do not truncate.
═══════════════════════════════════════════════════════════════════════════════`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔌 UNIFIED LLM CALLER
// ═══════════════════════════════════════════════════════════════════════════════

async function callLLM(
    provider: string,
    apiKeys: any,
    model: string,
    userPrompt: string,
    systemPrompt: string,
    options: { temperature?: number; maxTokens?: number },
    timeoutMs: number,
    log: LogFunction
): Promise<string> {
    const { temperature = 0.7, maxTokens = 8000 } = options;
    
    if (isCircuitOpen(provider)) {
        throw new Error(`Circuit breaker OPEN for ${provider}`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        let response: string;
        
        switch (provider) {
            case 'google':
                response = await callGemini(apiKeys.google, model, userPrompt, systemPrompt, temperature, maxTokens, controller.signal);
                break;
            case 'openrouter':
                response = await callOpenRouter(apiKeys.openrouter, apiKeys.openrouterModel || model, userPrompt, systemPrompt, temperature, maxTokens, controller.signal);
                break;
            case 'openai':
                response = await callOpenAI(apiKeys.openai, 'gpt-4o', userPrompt, systemPrompt, temperature, maxTokens, controller.signal);
                break;
            case 'anthropic':
                response = await callAnthropic(apiKeys.anthropic, 'claude-sonnet-4-20250514', userPrompt, systemPrompt, temperature, maxTokens, controller.signal);
                break;
            case 'groq':
                response = await callGroq(apiKeys.groq, apiKeys.groqModel || 'llama-3.3-70b-versatile', userPrompt, systemPrompt, temperature, maxTokens, controller.signal);
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
        
        clearTimeout(timeoutId);
        recordSuccess(provider);
        return response;
        
    } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            recordFailure(provider, log);
            throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        
        if (error.message.includes('429') || error.message.includes('500') || error.message.includes('503')) {
            recordFailure(provider, log);
        }
        
        throw error;
    }
}

async function callGemini(apiKey: string, model: string, userPrompt: string, systemPrompt: string, temperature: number, maxTokens: number, signal: AbortSignal): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: model || 'gemini-2.5-flash-preview-05-20',
        contents: userPrompt,
        config: { systemInstruction: systemPrompt, temperature, maxOutputTokens: maxTokens }
    });
    return response.text || '';
}

async function callOpenRouter(apiKey: string, model: string, userPrompt: string, systemPrompt: string, temperature: number, maxTokens: number, signal: AbortSignal): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://wp-optimizer-pro.com', 'X-Title': 'WP Optimizer Pro' },
        body: JSON.stringify({ model: model || 'anthropic/claude-sonnet-4', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature, max_tokens: maxTokens }),
        signal
    });
    if (!response.ok) throw new Error(`OpenRouter error ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

async function callOpenAI(apiKey: string, model: string, userPrompt: string, systemPrompt: string, temperature: number, maxTokens: number, signal: AbortSignal): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature, max_tokens: maxTokens }),
        signal
    });
    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(apiKey: string, model: string, userPrompt: string, systemPrompt: string, temperature: number, maxTokens: number, signal: AbortSignal): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: model || 'claude-sonnet-4-20250514', system: systemPrompt, messages: [{ role: 'user', content: userPrompt }], temperature, max_tokens: maxTokens }),
        signal
    });
    if (!response.ok) throw new Error(`Anthropic error ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
}

async function callGroq(apiKey: string, model: string, userPrompt: string, systemPrompt: string, temperature: number, maxTokens: number, signal: AbortSignal): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature, max_tokens: Math.min(maxTokens, 8000) }),
        signal
    });
    if (!response.ok) throw new Error(`Groq error ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 CONTENT GENERATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function removeAllH1Tags(html: string, log: LogFunction): string {
    if (!html) return html;
    
    const h1CountBefore = (html.match(/<h1/gi) || []).length;
    if (h1CountBefore === 0) return html;
    
    log(`   ⚠️ Removing ${h1CountBefore} H1 tag(s)...`);
    
    let cleaned = html;
    for (let i = 0; i < 3; i++) {
        cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
    }
    cleaned = cleaned.replace(/<h1\b[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/h1>/gi, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    
    return cleaned;
}

async function generateContentOutline(config: GenerateConfig, log: LogFunction): Promise<ContentOutline | null> {
    log('📋 Stage 1: Generating content outline...');
    
    const outlinePrompt = `Create a detailed content outline for: "${config.topic}"

Output a JSON object with this EXACT structure:
{
  "title": "Compelling title (50-60 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "slug": "url-friendly-slug",
  "sections": [
    {
      "heading": "H2 Section Title",
      "type": "h2",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "subsections": [
        {"heading": "H3 Subsection", "keyPoints": ["Detail 1", "Detail 2"]}
      ],
      "visualComponents": ["proTip", "expertQuote"]
    }
  ],
  "faqTopics": ["Question 1?", "Question 2?"],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
}

REQUIREMENTS:
- 8-12 main sections (H2s)
- 2-3 subsections (H3s) per main section
- 7-10 FAQ topics
- 5-7 key takeaways

⚠️ Return ONLY valid JSON.`;

    try {
        const response = await callLLM(
            config.provider, config.apiKeys, config.model, outlinePrompt,
            buildSlimSystemPrompt({ topic: config.topic, targetWords: CONTENT_TARGETS.INITIAL_WORD_TARGET, hasNeuronData: !!config.neuronData, hasEntityData: !!config.entityGapData }),
            { temperature: 0.7, maxTokens: 4000 }, TIMEOUTS.OUTLINE_GENERATION, log
        );
        
        const parsed = healJSON(response, log);
        if (parsed.success && parsed.data) {
            const outline = parsed.data as unknown as ContentOutline;
            if (outline.sections && outline.sections.length >= 5) {
                log(`   ✅ Outline generated: ${outline.sections.length} sections, ${outline.faqTopics?.length || 0} FAQs`);
                return outline;
            }
        }
        
        log(`   ❌ Invalid outline structure`);
        return null;
    } catch (error: any) {
        log(`   ❌ Outline generation failed: ${error.message}`);
        return null;
    }
}

async function generateSection(sectionOutline: ContentOutline['sections'][0], sectionIndex: number, totalSections: number, config: GenerateConfig, log: LogFunction): Promise<SectionGenerationResult> {
    log(`   📝 Section ${sectionIndex + 1}/${totalSections}: "${sectionOutline.heading.substring(0, 40)}..."`);
    
    const sectionPrompt = `Write section ${sectionIndex + 1} of a blog post about "${config.topic}".

SECTION DETAILS:
Heading: ${sectionOutline.heading}
Key Points to Cover:
${sectionOutline.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Subsections:
${sectionOutline.subsections.map(s => `- ${s.heading}: ${s.keyPoints.join(', ')}`).join('\n')}

TARGET: 300-450 words for this section.

OUTPUT: Return ONLY the HTML content for this section. Start with <h2> and include all subsections with <h3>.

⚠️ Return ONLY HTML, no JSON wrapper, no markdown.`;

    try {
        const response = await callLLM(
            config.provider, config.apiKeys, config.model, sectionPrompt,
            'You are an expert content writer. Output only clean HTML with inline styles.',
            { temperature: 0.75, maxTokens: 3000 }, TIMEOUTS.SECTION_GENERATION, log
        );
        
        let html = response.trim().replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '');
        const wordCount = countWords(html);
        
        if (wordCount < 100) {
            return { success: false, html: '', wordCount: 0, sectionIndex, error: `Section too short: ${wordCount} words` };
        }
        
        log(`      ✅ ${wordCount} words`);
        return { success: true, html, wordCount, sectionIndex };
    } catch (error: any) {
        log(`      ❌ Failed: ${error.message}`);
        return { success: false, html: '', wordCount: 0, sectionIndex, error: error.message };
    }
}

async function generateFAQSection(faqTopics: string[], config: GenerateConfig, log: LogFunction): Promise<string> {
    log('   📝 Generating FAQ section...');
    
    const faqPrompt = `Write a comprehensive FAQ section for a blog post about "${config.topic}".

QUESTIONS TO ANSWER:
${faqTopics.map((q, i) => `${i + 1}. ${q}`).join('\n')}

OUTPUT: Return a complete FAQ section as HTML using a CSS-only accordion pattern.
Each Q&A should have 80-150 words in the answer.
Include Schema.org FAQPage markup.

⚠️ Return ONLY the HTML for the FAQ section, no JSON wrapper.`;

    try {
        const response = await callLLM(
            config.provider, config.apiKeys, config.model, faqPrompt,
            'You are an expert content writer. Output only clean HTML with inline styles.',
            { temperature: 0.7, maxTokens: 4000 }, TIMEOUTS.SECTION_GENERATION, log
        );
        
        let html = response.trim().replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '');
        const wordCount = countWords(html);
        log(`      ✅ FAQ: ${wordCount} words, ${faqTopics.length} questions`);
        return html;
    } catch (error: any) {
        log(`      ❌ FAQ generation failed: ${error.message}`);
        return createFAQAccordion(faqTopics.map(q => ({ question: q, answer: `[Answer for: ${q}]` })));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 MAIN ORCHESTRATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class AIOrchestrator {
    
    async generateEnhanced(
        config: GenerateConfig,
        log: LogFunction,
        onStageProgress?: (progress: StageProgress) => void
    ): Promise<GenerationResult> {
        const startTime = Date.now();
        log(`🚀 STAGED CONTENT PIPELINE v${AI_ORCHESTRATOR_VERSION}`);
        log(`   → Topic: "${config.topic.substring(0, 50)}..."`);
        log(`   → Provider: ${config.provider} | Model: ${config.model}`);
        
        let youtubeVideo: YouTubeVideoData | null = null;
        let references: DiscoveredReference[] = [];
        
        try {
            // Stage 1: Generate Outline
            onStageProgress?.({ stage: 'outline', progress: 10, message: 'Generating content outline...' });
            
            const outline = await generateContentOutline(config, log);
            
            if (!outline || !outline.sections || outline.sections.length < 5) {
                log('   ❌ Outline generation failed, falling back to single-shot');
                return this.generate(config, log);
            }
            
            onStageProgress?.({ stage: 'outline', progress: 15, message: `Outline ready: ${outline.sections.length} sections` });
            
            // Stage 1.5: YouTube Video Discovery (parallel with sections)
            const youtubePromise = config.apiKeys?.serper ? (async () => {
                onStageProgress?.({ stage: 'youtube', progress: 18, message: 'Searching for relevant video...' });
                try {
                    const result = await searchYouTubeVideo(config.topic, config.apiKeys.serper, { minViews: 10000, maxAgeDays: 730 }, log);
                    if (result.video) {
                        youtubeVideo = result.video;
                        log(`   ✅ YouTube video found: "${result.video.title.substring(0, 40)}..."`);
                    }
                } catch (e: any) {
                    log(`   ⚠️ YouTube search failed: ${e.message}`);
                }
            })() : Promise.resolve();
            
            // Stage 2: Generate Sections
            onStageProgress?.({ stage: 'sections', progress: 20, message: 'Generating sections...', sectionsCompleted: 0, totalSections: outline.sections.length });
            
            const sections: string[] = [];
            const BATCH_SIZE = 2;
            
            for (let i = 0; i < outline.sections.length; i += BATCH_SIZE) {
                const batch = outline.sections.slice(i, i + BATCH_SIZE);
                
                const batchResults = await Promise.all(
                    batch.map((section, batchIndex) => generateSection(section, i + batchIndex, outline.sections.length, config, log))
                );
                
                for (const result of batchResults) {
                    if (result.success && result.html) {
                        sections.push(result.html);
                    } else {
                        const failedSection = outline.sections[result.sectionIndex];
                        sections.push(`<h2>${escapeHtml(failedSection.heading)}</h2><p>[Content for this section could not be generated]</p>`);
                    }
                }
                
                const progress = 20 + Math.round((sections.length / outline.sections.length) * 35);
                onStageProgress?.({ stage: 'sections', progress, message: `Generated ${sections.length}/${outline.sections.length} sections`, sectionsCompleted: sections.length, totalSections: outline.sections.length });
                
                if (i + BATCH_SIZE < outline.sections.length) await sleep(1000);
            }
            
            log(`   ✅ Sections complete: ${sections.length}/${outline.sections.length}`);
            
            // Wait for YouTube search to complete
            await youtubePromise;
            
            // Stage 3: Generate FAQ
            onStageProgress?.({ stage: 'sections', progress: 60, message: 'Generating FAQ...' });
            
            const faqHtml = await generateFAQSection(outline.faqTopics || [], config, log);
            
            // Stage 3.5: Discover References
            if (config.apiKeys?.serper) {
                onStageProgress?.({ stage: 'references', progress: 65, message: 'Discovering authoritative references...' });
                try {
                    references = await discoverReferences(config.topic, config.apiKeys.serper, { targetCount: 10, minAuthorityScore: 60 }, log);
                } catch (e: any) {
                    log(`   ⚠️ Reference discovery failed: ${e.message}`);
                }
            }
            
            // Stage 4: Merge and Polish
            onStageProgress?.({ stage: 'merge', progress: 75, message: 'Merging content...' });
            
            // Build introduction
            const introPrompt = `Write an engaging introduction (250-350 words) for a blog post titled: "${outline.title}"

Topic: ${config.topic}

Include:
1. A compelling hook that grabs attention
2. What the reader will learn
3. Why this matters to them
4. A Quick Answer box (50-70 words)

OUTPUT: Return ONLY HTML, starting with <p> (no heading).`;

            let introHtml = '';
            try {
                const introResponse = await callLLM(config.provider, config.apiKeys, config.model, introPrompt, 'You are an expert content writer. Output only clean HTML.', { temperature: 0.7, maxTokens: 2000 }, TIMEOUTS.SECTION_GENERATION, log);
                introHtml = introResponse.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
                log(`      ✅ Introduction: ${countWords(introHtml)} words`);
            } catch (error: any) {
                log(`      ⚠️ Introduction failed, using placeholder`);
                introHtml = `<p>${escapeHtml(config.topic)} is a topic that deserves careful attention. In this guide, you'll learn everything you need to know.</p>`;
            }
            
            // Build conclusion
            const conclusionPrompt = `Write a strong conclusion (200-300 words) for a blog post about "${config.topic}".

Include:
1. Summary of main points
2. Call to action
3. Next steps for the reader

OUTPUT: Return ONLY HTML.`;

            let conclusionHtml = '';
            try {
                const conclusionResponse = await callLLM(config.provider, config.apiKeys, config.model, conclusionPrompt, 'You are an expert content writer. Output only clean HTML.', { temperature: 0.7, maxTokens: 2000 }, TIMEOUTS.SECTION_GENERATION, log);
                conclusionHtml = conclusionResponse.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
                log(`      ✅ Conclusion: ${countWords(conclusionHtml)} words`);
            } catch (error: any) {
                log(`      ⚠️ Conclusion failed, using placeholder`);
                conclusionHtml = `<h2>Conclusion</h2><p>Now you have all the tools you need to succeed with ${escapeHtml(config.topic)}. Take action today!</p>`;
            }
            
            // Assemble final content
            const contentParts = [
                THEME_ADAPTIVE_CSS,
                '<div class="wpo-content">',
                introHtml,
            ];
            
            // Insert YouTube video after intro if available
            if (youtubeVideo) {
                contentParts.push(createYouTubeEmbed(youtubeVideo));
            }
            
            contentParts.push(...sections);
            contentParts.push(createKeyTakeaways(outline.keyTakeaways || []));
            contentParts.push(faqHtml);
            
            // Add references section
            if (references.length > 0) {
                contentParts.push(createReferencesSection(references));
            }
            
            contentParts.push(conclusionHtml);
            contentParts.push('</div>');
            
            let assembledContent = contentParts.join('\n\n');
            
            // Remove any H1 tags
            assembledContent = removeAllH1Tags(assembledContent, log);
            
            const wordCount = countWords(assembledContent);
            log(`   ✅ Final assembly: ${wordCount} words`);
            
            // Extract FAQs for structured data
            const faqs = (outline.faqTopics || []).map(q => ({ question: q, answer: '' }));
            
            const contract: ContentContract = {
                title: outline.title,
                metaDescription: outline.metaDescription,
                slug: outline.slug,
                htmlContent: assembledContent,
                excerpt: outline.metaDescription,
                faqs,
                wordCount
            };
            
            // Stage 5: Validation
            onStageProgress?.({ stage: 'polish', progress: 90, message: 'Final validation...' });
            
            // Inject internal links if available
            if (config.internalLinks && config.internalLinks.length > 0) {
                log(`   🔗 Injecting internal links...`);
                const linkResult = injectInternalLinks(contract.htmlContent, config.internalLinks, config.topic, { minLinks: 10, maxLinks: 20, minRelevance: 0.5 });
                contract.htmlContent = linkResult.html;
                contract.internalLinks = linkResult.linksAdded;
                log(`      ✅ ${linkResult.linksAdded.length} internal links added`);
            }
            
            onStageProgress?.({ stage: 'validation', progress: 100, message: 'Complete!' });
            
            const totalTime = Date.now() - startTime;
            log(`🎉 STAGED GENERATION COMPLETE: ${contract.wordCount} words in ${Math.round(totalTime / 1000)}s`);
            
            return {
                contract,
                generationMethod: 'staged',
                attempts: 1,
                totalTime,
                youtubeVideo: youtubeVideo || undefined,
                references
            };
            
        } catch (error: any) {
            log(`❌ Staged generation failed: ${error.message}`);
            log(`   → Falling back to single-shot generation...`);
            return this.generate(config, log);
        }
    }
    
    async generate(config: GenerateConfig, log: LogFunction): Promise<GenerationResult> {
        const startTime = Date.now();
        const maxAttempts = GENERATION_CONFIG.MAX_ATTEMPTS;
        
        log(`🎨 SINGLE-SHOT GENERATION (fallback)`);
        log(`   → Target: ${CONTENT_TARGETS.INITIAL_WORD_TARGET}+ words`);
        
        let lastError: string = '';
        let bestResult: ContentContract | null = null;
        let bestWordCount = 0;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            log(`   📝 Attempt ${attempt}/${maxAttempts}...`);
            
            const temperature = Math.min(GENERATION_CONFIG.BASE_TEMPERATURE + ((attempt - 1) * GENERATION_CONFIG.TEMPERATURE_INCREMENT), GENERATION_CONFIG.MAX_TEMPERATURE);
            
            try {
                const userPrompt = this.buildFullPrompt(config);
                const systemPrompt = buildSlimSystemPrompt({ topic: config.topic, targetWords: CONTENT_TARGETS.INITIAL_WORD_TARGET, hasNeuronData: !!config.neuronData, hasEntityData: !!config.entityGapData });
                
                const response = await callLLM(config.provider, config.apiKeys, config.model, userPrompt, systemPrompt, { temperature, maxTokens: 16000 }, TIMEOUTS.SINGLE_SHOT_GENERATION, log);
                
                const parsed = healJSON(response, log);
                
                if (!parsed.success) {
                    lastError = parsed.error || 'Parse failed';
                    log(`      ❌ ${lastError}`);
                    if (attempt < maxAttempts) {
                        const backoff = calculateBackoff(attempt - 1);
                        log(`      ⏳ Waiting ${Math.round(backoff / 1000)}s before retry...`);
                        await sleep(backoff);
                    }
                    continue;
                }
                
                const contract = parsed.data!;
                const wordCount = contract.wordCount || countWords(contract.htmlContent);
                
                if (wordCount > bestWordCount) {
                    bestResult = contract;
                    bestWordCount = wordCount;
                }
                
                if (wordCount >= CONTENT_TARGETS.MIN_ACCEPTABLE_WORDS && contract.htmlContent?.length > 5000) {
                    log(`      ✅ Success: ${wordCount} words`);
                    
                    contract.htmlContent = removeAllH1Tags(contract.htmlContent, log);
                    contract.wordCount = countWords(contract.htmlContent);
                    
                    return { contract, generationMethod: 'single-shot', attempts: attempt, totalTime: Date.now() - startTime };
                }
                
                lastError = `Content too short: ${wordCount} words`;
                log(`      ⚠️ ${lastError}`);
                
            } catch (error: any) {
                lastError = error.message;
                log(`      ❌ Error: ${lastError}`);
                
                if (error.message.includes('Circuit breaker')) break;
                
                if (attempt < maxAttempts) {
                    const backoff = calculateBackoff(attempt - 1);
                    log(`      ⏳ Waiting ${Math.round(backoff / 1000)}s before retry...`);
                    await sleep(backoff);
                }
            }
        }
        
        if (bestResult && bestWordCount >= 2000) {
            log(`   ⚠️ Using best available result: ${bestWordCount} words`);
            bestResult.htmlContent = removeAllH1Tags(bestResult.htmlContent, log);
            bestResult.wordCount = countWords(bestResult.htmlContent);
            return { contract: bestResult, generationMethod: 'single-shot', attempts: maxAttempts, totalTime: Date.now() - startTime };
        }
        
        throw new Error(`Content generation failed after ${maxAttempts} attempts: ${lastError}`);
    }
    
    private buildFullPrompt(config: GenerateConfig): string {
        const parts: string[] = [];
        
        parts.push(`Write a comprehensive ${CONTENT_TARGETS.INITIAL_WORD_TARGET}+ word blog post about: "${config.topic}"`);
        
        if (config.entityGapData) {
            const entities = config.entityGapData.missingEntities?.slice(0, 15) || [];
            const paa = config.entityGapData.paaQuestions?.slice(0, 8) || [];
            if (entities.length > 0) parts.push(`\nENTITIES TO INCLUDE: ${entities.join(', ')}`);
            if (paa.length > 0) parts.push(`\nFAQ QUESTIONS TO ANSWER:\n${paa.map((q, i) => `${i + 1}. ${q}`).join('\n')}`);
        }
        
        if (config.neuronData?.terms) {
            const criticalTerms = config.neuronData.terms.filter(t => t.importance >= 80).slice(0, 15).map(t => t.term);
            if (criticalTerms.length > 0) parts.push(`\nCRITICAL NLP TERMS TO USE: ${criticalTerms.join(', ')}`);
        }
        
        if (config.internalLinks && config.internalLinks.length > 0) {
            const links = config.internalLinks.slice(0, 15);
            parts.push(`\nINTERNAL LINKS TO ADD (use 3-7 word anchors):\n${links.map(l => `• ${l.title} → ${l.url}`).join('\n')}`);
        }
        
        parts.push(`\n⚠️ OUTPUT: Return ONLY valid JSON matching the required structure.`);
        
        return parts.join('\n');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const orchestrator = new AIOrchestrator();

export {
    removeAllH1Tags,
    countWords,
    validateResponseCompleteness,
    healJSON,
    buildSlimSystemPrompt,
    createQuickAnswerBox,
    createProTipBox,
    createWarningBox,
    createKeyTakeaways,
    createFAQAccordion,
    createReferencesSection,
    createYouTubeEmbed,
    searchYouTubeVideo,
    discoverReferences,
    THEME_ADAPTIVE_CSS
};

export const VALID_GEMINI_MODELS: Record<string, string> = {
    'gemini-2.5-flash-preview-05-20': 'Gemini 2.5 Flash Preview',
    'gemini-2.5-pro-preview-05-06': 'Gemini 2.5 Pro Preview',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
};

export const OPENROUTER_MODELS = [
    'anthropic/claude-sonnet-4',
    'anthropic/claude-opus-4',
    'google/gemini-2.5-flash-preview',
    'google/gemini-2.5-pro-preview',
    'openai/gpt-4o',
    'deepseek/deepseek-chat',
    'meta-llama/llama-3.3-70b-instruct',
];

export default orchestrator;
