// ═══════════════════════════════════════════════════════════════════════════════
// WP OPTIMIZER PRO v26.0 — COMPLETE TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const APP_VERSION = "26.0.0";

// ═══════════════════════════════════════════════════════════════════════════════
// 📌 CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FAQ {
    question: string;
    answer: string;
}

export interface HeadingInfo {
    level: number;
    text: string;
    id?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 OPPORTUNITY SCORE — FULL INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface OpportunityScore {
    total: number;
    factors: Record<string, number>;
    // Additional properties expected by App.tsx
    commercialIntent: number;
    temporalDecay: number;
    strikingDistance: number;
    competitionLevel: number;
    contentGap: number;
    trafficPotential: number;
    conversionPotential: number;
}

// Helper to create default opportunity score
export function createDefaultOpportunityScore(total: number = 0, factors: Record<string, number> = {}): OpportunityScore {
    return {
        total,
        factors,
        commercialIntent: factors.commercialIntent || 0,
        temporalDecay: factors.temporalDecay || 0,
        strikingDistance: factors.strikingDistance || 0,
        competitionLevel: factors.competitionLevel || 0,
        contentGap: factors.contentGap || 0,
        trafficPotential: factors.trafficPotential || 0,
        conversionPotential: factors.conversionPotential || 0,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📄 SITEMAP PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export interface SitemapPage {
    id: string;
    title: string;
    slug: string;
    url?: string;
    lastMod: string | null;
    wordCount: number | null;
    crawledContent: string | null;
    healthScore: number | null;
    status: 'idle' | 'processing' | 'completed' | 'failed' | 'queued';
    opportunity: OpportunityScore;
    improvementHistory: ImprovementHistoryEntry[];
    // Optional additional fields
    priority?: number;
    changefreq?: string;
    excerpt?: string;
    categories?: string[];
    tags?: string[];
}

export interface ImprovementHistoryEntry {
    date: string;
    wordsBefore: number;
    wordsAfter: number;
    scoreBefore: number;
    scoreAfter: number;
    changes: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 INTERNAL LINK TYPES — FIXED TO MATCH USAGE
// ═══════════════════════════════════════════════════════════════════════════════

export interface InternalLinkTarget {
    url: string;
    title: string;
    slug?: string;
    keywords?: string[];
    relevance?: number;
    category?: string;
}

// This is what injectInternalLinks returns for EACH link added
export interface InternalLinkAddedItem {
    url: string;
    anchorText: string;
    relevanceScore: number;
    position: number;
}

// This is the full result from injectInternalLinks function
export interface InternalLinkInjectionResult {
    html: string;
    linksAdded: InternalLinkAddedItem[];
    totalLinks: number;
    skippedReasons?: Map<string, string>;
}

// This is what gets stored in ContentContract.internalLinks
// Using the same structure as InternalLinkAddedItem for compatibility
export type InternalLinkResult = InternalLinkAddedItem;

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 SEO METRICS — COMPLETE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface SeoMetrics {
    wordCount: number;
    readability: number;
    contentDepth: number;
    headingStructure: number;
    aeoScore: number;
    geoScore: number;
    eeatSignals: number;
    internalLinkScore: number;
    schemaDetected: boolean;
    schemaTypes: string[];
    // Additional properties expected
    titleOptimization: number;
    metaOptimization: number;
    readabilityGrade: string;
    linkDensity: number;
    keywordDensity: number;
    imageOptimization: number;
    mobileScore: number;
    pageSpeed: number;
    coreWebVitals: CoreWebVitals;
    structuredDataScore: number;
    socialSignals: number;
    freshness: number;
    authorityScore: number;
}

export interface CoreWebVitals {
    lcp: number;
    fid: number;
    cls: number;
}

// Helper to create default SEO metrics
export function createDefaultSeoMetrics(): SeoMetrics {
    return {
        wordCount: 0,
        readability: 0,
        contentDepth: 0,
        headingStructure: 0,
        aeoScore: 0,
        geoScore: 0,
        eeatSignals: 0,
        internalLinkScore: 0,
        schemaDetected: false,
        schemaTypes: [],
        titleOptimization: 0,
        metaOptimization: 0,
        readabilityGrade: 'N/A',
        linkDensity: 0,
        keywordDensity: 0,
        imageOptimization: 0,
        mobileScore: 0,
        pageSpeed: 0,
        coreWebVitals: { lcp: 0, fid: 0, cls: 0 },
        structuredDataScore: 0,
        socialSignals: 0,
        freshness: 0,
        authorityScore: 0,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ QA VALIDATION — FIXED WITH ruleId
// ═══════════════════════════════════════════════════════════════════════════════

export interface QAValidationResult {
    ruleId: string;
    agent: string;
    category: 'critical' | 'seo' | 'aeo' | 'geo' | 'enhancement';
    score: number;
    feedback: string;
    fixSuggestion?: string;
    status: 'passed' | 'warning' | 'failed';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 EXISTING CONTENT ANALYSIS — FIXED
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExistingContentAnalysis {
    wordCount: number;
    headings: HeadingInfo[];
    imageCount: number;
    linkCount: number;
    hasFAQ: boolean;
    hasSchema: boolean;
    quality: 'low' | 'medium' | 'high';
    // Additional optional fields
    readabilityScore?: number;
    keywordDensity?: number;
    lastModified?: string;
    contentAge?: number;
    internalLinks?: number;
    externalLinks?: number;
    images?: Array<{ src: string; alt: string }>;
    videos?: number;
    tables?: number;
    lists?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📄 CONTENT CONTRACT
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContentContract {
    title: string;
    slug: string;
    excerpt: string;
    metaDescription: string;
    htmlContent: string;
    wordCount?: number;
    faqs?: FAQ[];
    schema?: any;
    groundingSources?: GroundingSource[];
    internalLinks?: InternalLinkResult[];
    expertInsight?: string;
    internalLinkSuggestions?: string[];
    featuredImagePrompt?: string;
    categoryNames?: string[];
    structureVerified?: boolean;
    // Generation metadata
    generatedAt?: string;
    generationTime?: number;
    provider?: string;
    model?: string;
    // Quality metrics
    qualityScore?: number;
    nlpCoverage?: number;
    visualComponentCount?: number;
}

export interface GroundingSource {
    uri: string;
    title: string;
    snippet?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 GENERATE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export interface GenerateConfig {
    topic: string;
    mode: 'surgical' | 'writer';
    provider: 'google' | 'openrouter' | 'anthropic' | 'openai' | 'groq';
    model?: string;
    temperature?: number;
    siteContext: SiteContext;
    apiKeys: ApiKeys;
    // Optional enhancement data
    entityGapData?: EntityGapAnalysis;
    neuronData?: NeuronAnalysisResult;
    existingAnalysis?: ExistingContentAnalysis;
    allFeedback?: string[];
    targetKeyword?: string;
    validatedReferences?: ValidatedReference[];
    internalLinks?: InternalLinkTarget[];
    geoConfig?: GeoTargetConfig;
    previousAttempts?: number;
    // Pipeline options
    useStagedPipeline?: boolean;
    useSERPGenerators?: boolean;
    useNLPInjector?: boolean;
    targetNLPCoverage?: number;
}

export interface SiteContext {
    url: string;
    orgName: string;
    authorName: string;
    language?: string;
    country?: string;
    industry?: string;
    targetAudience?: string;
    brandVoice?: string;
}

export interface ApiKeys {
    google: string;
    openrouter: string;
    anthropic: string;
    openai: string;
    groq: string;
    serper: string;
    neuronwriter?: string;
    // Model selections
    openrouterModel?: string;
    groqModel?: string;
    geminiModel?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 ENTITY GAP ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EntityGapAnalysis {
    missingEntities: string[];
    paaQuestions: string[];
    topKeywords: string[];
    contentGaps: string[];
    competitorEntities?: string[];
    suggestedTopics?: string[];
    serpFeatures?: string[];
    validatedReferences?: ValidatedReference[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧬 NEURONWRITER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface NeuronTerm {
    term: string;
    type: 'title' | 'header' | 'basic' | 'extended';
    importance: number;
    recommended: number;
    current?: number;
}

export interface NeuronAnalysisResult {
    terms: NeuronTerm[];
    targetWordCount: number;
    recommendations?: string[];
    competitorAnalysis?: any;
    contentScore?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📚 VALIDATED REFERENCE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidatedReference {
    url: string;
    title: string;
    source: string;
    year: number | string;
    isValid: boolean;
    isAuthority: boolean;
    domain?: string;
    snippet?: string;
    citationCount?: number;
    trustScore?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌍 GEO TARGET CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeoTargetConfig {
    country: string;
    language: string;
    region?: string;
    city?: string;
    localKeywords?: string[];
    currencySymbol?: string;
    measurementSystem?: 'metric' | 'imperial';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 SERP LENGTH POLICY
// ═══════════════════════════════════════════════════════════════════════════════

export interface SerpLengthPolicy {
    minWords: number;
    maxWords: number;
    targetWords: number;
    competitorAverage?: number;
    topRankerAverage?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 CONTENT OUTLINE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContentOutline {
    title: string;
    sections: SectionOutline[];
    estimatedWordCount: number;
    targetKeywords: string[];
}

export interface SectionOutline {
    id: string;
    heading: string;
    level: 2 | 3 | 4;
    targetWords: number;
    keyPoints: string[];
    subsections?: SectionOutline[];
}

export interface GeneratedSection {
    id: string;
    heading: string;
    content: string;
    wordCount: number;
    visualComponents: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 GOD MODE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type GodModePhase = 
    | 'idle'
    | 'initializing'
    | 'fetching_sitemap'
    | 'analyzing_content'
    | 'entity_gap_analysis'
    | 'neuron_analysis'
    | 'reference_validation'
    | 'content_generation'
    | 'youtube_integration'
    | 'nlp_injection'
    | 'internal_linking'
    | 'faq_upgrade'
    | 'qa_validation'
    | 'publishing'
    | 'completed'
    | 'failed';

export interface GodModeJobState {
    id: string;
    targetId: string;
    phase: GodModePhase;
    progress: number;
    logs: string[];
    startTime: number;
    endTime?: number;
    error?: string;
    result?: ContentContract;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏪 STORE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AppState {
    // API Keys
    apiKeys: ApiKeys;
    setApiKey: (key: keyof ApiKeys, value: string) => void;
    
    // Site Context
    siteContext: SiteContext;
    setSiteContext: (ctx: Partial<SiteContext>) => void;
    
    // Pages
    pages: SitemapPage[];
    setPages: (pages: SitemapPage[]) => void;
    updatePage: (id: string, updates: Partial<SitemapPage>) => void;
    
    // Job States
    jobStates: Map<string, GodModeJobState>;
    updateJobState: (id: string, updates: Partial<GodModeJobState>) => void;
    
    // UI State
    selectedPageId: string | null;
    setSelectedPageId: (id: string | null) => void;
    
    // Settings
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    defaultProvider: string;
    defaultModel: string;
    autoSave: boolean;
    showAdvancedOptions: boolean;
    maxConcurrentJobs: number;
    enableLogging: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 WORDPRESS API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WordPressCredentials {
    siteUrl: string;
    username: string;
    applicationPassword: string;
}

export interface WordPressPost {
    id?: number;
    title: { rendered?: string; raw?: string };
    content: { rendered?: string; raw?: string };
    excerpt: { rendered?: string; raw?: string };
    slug: string;
    status: 'publish' | 'draft' | 'pending' | 'private';
    categories?: number[];
    tags?: number[];
    featured_media?: number;
    meta?: Record<string, any>;
    yoast_head_json?: YoastMeta;
}

export interface YoastMeta {
    title?: string;
    description?: string;
    robots?: {
        index?: string;
        follow?: string;
    };
    og_title?: string;
    og_description?: string;
    og_image?: Array<{ url: string }>;
    schema?: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 YOUTUBE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface YouTubeVideo {
    videoId: string;
    title: string;
    channel: string;
    views: number;
    duration: string;
    thumbnail: string;
    relevanceScore: number;
}

export interface YouTubeSearchResult {
    video: YouTubeVideo | null;
    searchQuery: string;
    alternates: YouTubeVideo[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 STAGE PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════

export interface StageProgress {
    stage: 'outline' | 'sections' | 'merge' | 'polish' | 'enhancement';
    progress: number;
    message: string;
    sectionsCompleted?: number;
    totalSections?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧬 NLP TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface NLPInjectionResult {
    html: string;
    termsAdded: string[];
    termsFailed: string[];
    initialCoverage: number;
    finalCoverage: number;
    insertionDetails: Array<{
        term: string;
        location: 'paragraph' | 'list' | 'heading' | 'callout';
        template: string;
        contextScore: number;
    }>;
}

export interface NLPCoverageAnalysis {
    score: number;
    weightedScore: number;
    usedTerms: Array<NeuronTerm & { count: number; positions: number[] }>;
    missingTerms: NeuronTerm[];
    criticalMissing: NeuronTerm[];
    headerMissing: NeuronTerm[];
    bodyMissing: NeuronTerm[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SERP CONTENT BLOCKS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SERPContentBlocks {
    quickAnswer?: string;
    featuredSnippetBait?: string;
    paaFAQs?: Array<{ question: string; answer: string }>;
    paaHTML?: string;
    comparisonTable?: string;
    statsDashboard?: string;
    prosConsTable?: string;
    definitionBox?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ VALIDATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface VisualValidationResult {
    passed: boolean;
    score: number;
    missing: string[];
    found: Record<string, number>;
}

export interface HumanWritingValidation {
    score: number;
    issues: string[];
    suggestions: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 DEFAULT EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    APP_VERSION,
    createDefaultOpportunityScore,
    createDefaultSeoMetrics,
};
