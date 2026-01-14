// ═══════════════════════════════════════════════════════════════════════════════
// WP OPTIMIZER PRO v26.0 — ENTERPRISE SOTA AI ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════
// 
// SOTA FEATURES IMPLEMENTED:
// ✅ CSS-Only FAQ Accordion (WordPress CSP compatible)
// ✅ Word-Boundary-Safe Internal Link Injection (3-7 word anchors)
// ✅ Anti-AI Detection Human Writing DNA (Alex Hormozi style)
// ✅ Smart Year Detection (evergreen vs time-sensitive)
// ✅ Multi-Stage Content Pipeline with Error Boundaries
// ✅ SERP-Targeted Content Generators
// ✅ NLP Term Injection with Semantic Context
// ✅ Consistent Dark Mode Visual Components
// ✅ YouTube Video Integration via Serper API
// ✅ Structured Logging Throughout
// ✅ Aggressive JSON Healing for Truncated Responses
// ✅ Visual Component Validation
// ✅ Human Writing Validation
//
// CONTENT ORDER (CORRECT):
// 1. Introduction (with Quick Answer)
// 2. Main Sections (H2s with H3s)
// 3. Key Takeaways Box ← BEFORE FAQ
// 4. FAQ Section (CSS-Only Accordion)
// 5. Conclusion/CTA
// 6. References Section ← ALWAYS AT VERY END
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
    APP_VERSION,
    SerpLengthPolicy, 
    ContentOutline, 
    SectionOutline, 
    GeneratedSection
} from '../types';

import { injectInternalLinks } from '../utils';

// ═══════════════════════════════════════════════════════════════════════════════
// 📌 VERSION & MODULE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const AI_ORCHESTRATOR_VERSION = "26.0.0";

// Timeout configuration (in milliseconds)
const TIMEOUTS = {
    OPENROUTER_REQUEST: 300000,      // 5 minutes
    BASE_GENERATION: 180000,         // 3 minutes
    MAX_GENERATION: 600000,          // 10 minutes
    RETRY_BASE_DELAY: 3000,          // 3 seconds
    RETRY_MAX_DELAY: 30000,          // 30 seconds
} as const;

// Content generation constants
const CONTENT_CONSTANTS = {
    MIN_SECTIONS: 10,
    MAX_SECTIONS: 15,
    SECTION_MIN_WORDS: 350,
    SECTION_MAX_WORDS: 600,
    INTRO_TARGET_WORDS: 350,
    CONCLUSION_TARGET_WORDS: 400,
    DEFAULT_TARGET_WORDS: 4500,
    MIN_WORD_COUNT: 4000,
} as const;

// NLP injection constants
const NLP_CONSTANTS = {
    DEFAULT_TARGET_COVERAGE: 85,
    MAX_INJECTIONS: 30,
    MIN_CONTEXT_SCORE: 10,
} as const;

// Internal linking constants
const LINK_CONSTANTS = {
    MIN_ANCHOR_WORDS: 3,
    MAX_ANCHOR_WORDS: 7,
    MIN_DISTANCE_CHARS: 400,
    DEFAULT_MIN_LINKS: 12,
    DEFAULT_MAX_LINKS: 20,
    MAX_LINKS_PER_SECTION: 3,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 DYNAMIC YEAR CALCULATION — SMART YEAR LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

// If December, use next year; otherwise use current year
export const CONTENT_YEAR = currentMonth === 11 ? currentYear + 1 : currentYear;

console.log(`[AI Orchestrator v${AI_ORCHESTRATOR_VERSION}] Year Logic: Month=${currentMonth + 1}, Using Year=${CONTENT_YEAR}`);

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface InternalLinkResult {
    html: string;
    linksAdded: Array<{
        url: string;
        anchorText: string;
        relevanceScore: number;
        position: number;
    }>;
    totalLinks: number;
    skippedReasons?: Map<string, string>;
}

export interface StageProgress {
    stage: 'outline' | 'sections' | 'merge' | 'polish';
    progress: number;
    message: string;
    sectionsCompleted?: number;
    totalSections?: number;
}

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
// 🎯 VALID MODELS REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export const VALID_GEMINI_MODELS: Record<string, string> = {
    'gemini-2.5-flash-preview-05-20': 'Gemini 2.5 Flash Preview',
    'gemini-2.5-pro-preview-05-06': 'Gemini 2.5 Pro Preview',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
};

export const OPENROUTER_MODELS = [
    'google/gemini-2.5-flash-preview',
    'anthropic/claude-sonnet-4',
    'deepseek/deepseek-chat',
    'meta-llama/llama-3.3-70b-instruct',
    'openai/gpt-4o',
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 SMART YEAR DETECTOR — Determines if year should be in title
// ═══════════════════════════════════════════════════════════════════════════════

export function shouldIncludeYearInTitle(topic: string): boolean {
    const topicLower = topic.toLowerCase();
    
    // Topics that should NOT have a year (EVERGREEN content)
    const evergreenPatterns = [
        /\b(numerology|astrology|zodiac|horoscope|tarot)\b/i,
        /\b(angel number|life path|soul number|destiny number)\b/i,
        /\b(spiritual|spirituality|meditation|chakra|aura)\b/i,
        /\b(meaning|definition|what is|what are|what does)\b/i,
        /\b(symbolism|symbol|symbols|significance)\b/i,
        /\b(dream meaning|dreams about|dreaming of)\b/i,
        /\b(history|historical|ancient|classic|mythology)\b/i,
        /\b(biography|who is|who was|life of)\b/i,
        /\b(recipe|recipes|cooking|baking|how to cook)\b/i,
        /\b(art|artist|painting|sculpture|music theory)\b/i,
        /\b(philosophy|philosophical|ethics|morality)\b/i,
        /\b(religion|religious|faith|belief|prayer)\b/i,
        /\b(animal|animals|species|breed|breeds)\b/i,
        /\b(plant|plants|flower|flowers|tree|trees)\b/i,
        /\b(personality type|personality trait|mbti|enneagram)\b/i,
    ];
    
    // Topics that SHOULD have a year (TIME-SENSITIVE content)
    const timeSensitivePatterns = [
        /\b(guide|tutorial|tips|strategies|tactics)\b/i,
        /\b(how to start|how to make money|how to grow)\b/i,
        /\b(ways to|steps to|methods to|techniques)\b/i,
        /\b(best|top \d+|top|latest|newest|updated)\b/i,
        /\b(review|reviews|comparison|vs|versus|compare)\b/i,
        /\b(ranking|ranked|list of|alternatives)\b/i,
        /\b(salary|salaries|price|pricing|cost|rates)\b/i,
        /\b(statistics|stats|data|report|survey)\b/i,
        /\b(trends|trending|forecast|prediction|outlook)\b/i,
        /\b(business|startup|entrepreneur|freelance)\b/i,
        /\b(software|tool|tools|app|apps|platform)\b/i,
        /\b(technology|tech|ai|artificial intelligence)\b/i,
        /\b(marketing|seo|social media|advertising)\b/i,
        /\b(career|job|jobs|hiring|resume|interview)\b/i,
    ];
    
    for (const pattern of evergreenPatterns) {
        if (pattern.test(topicLower)) return false;
    }
    
    for (const pattern of timeSensitivePatterns) {
        if (pattern.test(topicLower)) return true;
    }
    
    return false;
}

export function updateExistingYear(text: string): string {
    if (!text) return text;
    const yearPattern = /\b(202[0-9]|2030)\b/g;
    return text.replace(yearPattern, String(CONTENT_YEAR));
}
// ═══════════════════════════════════════════════════════════════════════════════
// 🔥🔥🔥 HUMAN WRITING DNA — ANTI-AI-DETECTION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const HUMAN_WRITING_PATTERNS = {
    sentenceStarters: [
        'Look,', "Here's the thing:", 'Real talk:', 'The truth?',
        'Plot twist:', 'Fair warning:', 'Quick story:', 'Fun fact:',
        'Heads up:', 'Pro tip:', "Not gonna lie,", 'Full disclosure:'
    ],
    
    transitions: [
        'That said,', 'On the flip side,', "Here's where it gets interesting:",
        'But wait—', "And here's the kicker:", 'The catch?',
        'What most people miss:', 'The real question is:', 'Bottom line:'
    ],
    
    conversationalPhrases: [
        'you know what I mean?', 'makes sense, right?', 'stick with me here',
        'bear with me', "here's why that matters", 'let me break this down',
        "I'll be honest", 'between you and me'
    ],
    
    // AI-detectable phrases to AVOID
    bannedPhrases: [
        "it's important to note",
        "in today's fast-paced world",
        "when it comes to",
        "in order to",
        "let's dive in",
        "without further ado",
        "in this article we will",
        "comprehensive guide",
        "valuable insights",
        "actionable tips",
        "game-changer",
        "unlock your potential",
        "leverage",
        "utilize",
        "delve",
        "myriad of",
        "plethora of",
        "navigate the complexities",
        "embark on a journey",
        "whether you're a beginner or expert",
        "look no further",
        "in conclusion",
        "to summarize",
        "as we've seen",
        "it goes without saying",
        "at the end of the day",
        "moving forward",
        "it is worth noting",
        "needless to say"
    ]
};

const HUMAN_WRITING_DNA = `
════════════════════════════════════════════════════════════════════════════════
🔥 CRITICAL: WRITE LIKE A HUMAN EXPERT — PASS ALL AI DETECTION
════════════════════════════════════════════════════════════════════════════════

You MUST write content that sounds 100% human-written. Follow these rules EXACTLY:

█ ALEX HORMOZI WRITING STYLE:
• Lead with SPECIFIC numbers: "$127,453.21" NOT "over $100,000"
• Use pattern interrupts: "Here's what nobody tells you..."
• Share failure stories BEFORE success stories
• Write like you're talking to ONE person at a bar
• Make BOLD claims and back them with PROOF
• Use the word "you" constantly — it's personal

█ SENTENCE STRUCTURE RULES:
• Mix lengths DRAMATICALLY: "Short. Punchy." Then a longer sentence.
• Start sentences with "And", "But", "So", "Look," — real humans do this
• Use fragments. On purpose. For emphasis.
• Vary paragraph length (1-5 sentences, mostly 2-3)

█ 🚫 BANNED AI PHRASES — NEVER USE THESE:
${HUMAN_WRITING_PATTERNS.bannedPhrases.slice(0, 15).map(p => `❌ "${p}"`).join('\n')}

█ ✅ HUMAN PATTERNS TO USE INSTEAD:
${HUMAN_WRITING_PATTERNS.sentenceStarters.slice(0, 6).map(p => `✅ "${p}"`).join('\n')}

█ MANDATORY WRITING HABITS:
• ALWAYS use contractions: don't, won't, can't, you'll, I've, we're
• Paragraphs: 2-4 sentences MAX (no walls of text)
• Use "you" and "your" in every paragraph
• Include rhetorical questions: "Sound familiar?"
• Add personality: humor, frustration, excitement
• Be opinionated — take a stance

█ GOLDEN RULE:
Read every sentence aloud. If it sounds like ChatGPT wrote it → REWRITE IT.
════════════════════════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 VISUAL COMPONENT LIBRARY v16.0 — CONSISTENT DARK MODE DESIGN
// ═══════════════════════════════════════════════════════════════════════════════
// Design Philosophy: Reforge + Notion + Backlinko + Apple aesthetic
// • Visual Breathability — generous whitespace, 1.75 line-height
// • Digital Comfort — soft gradients, muted accents, subtle shadows
// • Authority Signals — clean typography, professional cards
// • Mobile-First — clamp() responsive, 44px touch targets
// • WordPress Compatible — all !important overrides
// • CONSISTENT DARK MODE — #0f172a/#1e293b backgrounds, #f1f5f9 text
// ═══════════════════════════════════════════════════════════════════════════════

const VISUAL_COMPONENT_LIBRARY = `
════════════════════════════════════════════════════════════════════════════════
🎨 ENTERPRISE VISUAL COMPONENTS v16.0 — DARK MODE MOBILE-FIRST DESIGN
════════════════════════════════════════════════════════════════════════════════

⚠️ MANDATORY REQUIREMENTS — READ BEFORE GENERATING:

1. USE MINIMUM 18+ VISUAL COMPONENTS PER ARTICLE:
   □ 1x Quick Answer Box (immediately after intro)
   □ 1x Statistics Dashboard (3-4 metrics — early in content)
   □ 3x Pro Tip Boxes (distributed across sections)
   □ 2x Warning/Important Boxes (for critical information)
   □ 2x Expert Quote Blockquotes (with real attribution)
   □ 2x Comparison Tables (with real data)
   □ 1x Step-by-Step Process Box (for procedural content)
   □ 2x Checklist Boxes (actionable items)
   □ 1x Definition Box (for key terms)
   □ 1x Key Takeaways Box (BEFORE FAQ section)
   □ 1x CTA Box (in conclusion)
   □ 1x References Section (at VERY END)

2. MANDATORY DARK MODE STYLING RULES:
   • ALL backgrounds MUST be DARK: #0f172a, #1e293b, or dark gradients
   • ALL text MUST be LIGHT: #ffffff, #f1f5f9, #e2e8f0, #cbd5e1
   • ALL styles MUST use !important to override WordPress themes
   • Use clamp() for ALL sizes: clamp(min, preferred, max)
   • Minimum touch targets: 44px for mobile accessibility
   • Border-radius: 16-20px for cards, 12px for buttons, 8px for tags
   • Line-height: 1.75 for body text readability
   • Box shadows: 0 8px 32px rgba(0,0,0,0.25) for depth

3. COLOR PALETTE (DARK MODE):
   • Primary backgrounds: #0f172a (darkest), #1e293b (dark)
   • Card backgrounds: rgba(255,255,255,0.03) to rgba(255,255,255,0.06)
   • Borders: rgba(255,255,255,0.06) to rgba(255,255,255,0.1)
   • Primary text: #f1f5f9, #ffffff
   • Secondary text: #94a3b8, #cbd5e1
   • Accent colors:
     - Indigo: #6366f1, #818cf8
     - Purple: #8b5cf6, #a78bfa
     - Emerald: #10b981, #22c55e
     - Amber: #f59e0b, #fbbf24
     - Red: #ef4444, #f87171
     - Cyan: #06b6d4, #22d3ee

4. VISUAL PLACEMENT RULES:
   • NEVER have more than 3 paragraphs without a visual element
   • Alternate between different box types (don't cluster same type)
   • Tables work best in middle sections
   • Expert quotes work best after making a claim
   • Statistics dashboard should appear within first 20% of content

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 1: QUICK ANSWER BOX — FEATURED SNIPPET OPTIMIZED (DARK)
═══════════════════════════════════════════════════════════════════════════════
USE: Immediately after intro paragraph. 50-70 words direct answer.

<div style="
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
  border-radius: clamp(12px, 3vw, 20px) !important;
  padding: clamp(20px, 5vw, 40px) !important;
  margin: clamp(24px, 6vw, 48px) 0 !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(99,102,241,0.2) !important;
  position: relative !important;
  overflow: hidden !important;
">
  <div style="
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    width: 40% !important;
    height: 100% !important;
    background: radial-gradient(ellipse at top right, rgba(99,102,241,0.1) 0%, transparent 70%) !important;
    pointer-events: none !important;
  "></div>
  <div style="
    display: inline-flex !important;
    align-items: center !important;
    gap: clamp(6px, 1.5vw, 10px) !important;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
    color: #fff !important;
    font-size: clamp(9px, 2.5vw, 11px) !important;
    font-weight: 700 !important;
    letter-spacing: 1px !important;
    padding: clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 18px) !important;
    border-radius: 8px !important;
    text-transform: uppercase !important;
    margin-bottom: clamp(12px, 3vw, 20px) !important;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3) !important;
  ">
    <span style="font-size: clamp(12px, 3vw, 16px) !important;">⚡</span>
    Quick Answer
  </div>
  <p style="
    color: #f1f5f9 !important;
    font-size: clamp(15px, 3.8vw, 19px) !important;
    line-height: 1.75 !important;
    margin: 0 !important;
    position: relative !important;
    z-index: 1 !important;
  ">[50-70 word direct answer optimized for featured snippets — be specific and definitive]</p>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 2: STATISTICS DASHBOARD — 3-4 METRICS (DARK)
═══════════════════════════════════════════════════════════════════════════════
USE: Early in content to establish credibility. Use REAL statistics with sources.

<div style="
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(clamp(120px, 25vw, 160px), 1fr)) !important;
  gap: clamp(12px, 3vw, 20px) !important;
  margin: clamp(28px, 7vw, 56px) 0 !important;
">
  <div style="
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
    border-radius: 16px !important;
    padding: clamp(16px, 4vw, 28px) !important;
    text-align: center !important;
    border: 1px solid rgba(99,102,241,0.15) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
    position: relative !important;
    overflow: hidden !important;
  ">
    <div style="position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; height: 3px !important; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%) !important;"></div>
    <div style="font-size: clamp(28px, 7vw, 42px) !important; font-weight: 800 !important; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; background-clip: text !important; line-height: 1.1 !important;">87%</div>
    <div style="color: #94a3b8 !important; font-size: clamp(9px, 2.2vw, 11px) !important; text-transform: uppercase !important; letter-spacing: 1px !important; margin-top: 8px !important; font-weight: 600 !important;">Success Rate</div>
    <div style="color: #22c55e !important; font-size: clamp(10px, 2.5vw, 12px) !important; margin-top: 6px !important; font-weight: 600 !important;">↑ 12% from 2024</div>
  </div>
  <!-- Add 2-3 more stat cards with same structure, different colors -->
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 3: PRO TIP BOX — DARK GREEN GRADIENT
═══════════════════════════════════════════════════════════════════════════════

<div style="
  background: linear-gradient(135deg, #14532d 0%, #166534 100%) !important;
  border-radius: clamp(12px, 3vw, 16px) !important;
  padding: clamp(18px, 4.5vw, 32px) !important;
  margin: clamp(24px, 6vw, 40px) 0 !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(34,197,94,0.2) !important;
  border: none !important;
">
  <div style="display: flex !important; align-items: flex-start !important; gap: clamp(14px, 3.5vw, 18px) !important;">
    <div style="min-width: clamp(40px, 10vw, 48px) !important; height: clamp(40px, 10vw, 48px) !important; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; border-radius: 14px !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 4px 16px rgba(34,197,94,0.35) !important; flex-shrink: 0 !important;">
      <span style="font-size: clamp(18px, 4.5vw, 22px) !important;">💡</span>
    </div>
    <div style="flex: 1 !important;">
      <div style="color: #86efac !important; font-size: clamp(10px, 2.5vw, 12px) !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 1.5px !important; margin-bottom: clamp(6px, 1.5vw, 10px) !important;">Pro Tip</div>
      <p style="color: #dcfce7 !important; font-size: clamp(14px, 3.5vw, 16px) !important; line-height: 1.7 !important; margin: 0 !important;">[Specific, actionable expert advice]</p>
    </div>
  </div>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 4: WARNING BOX — DARK AMBER
═══════════════════════════════════════════════════════════════════════════════

<div style="
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%) !important;
  border-radius: clamp(12px, 3vw, 16px) !important;
  padding: clamp(18px, 4.5vw, 32px) !important;
  margin: clamp(24px, 6vw, 40px) 0 !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
  border-left: 5px solid #f59e0b !important;
">
  <div style="display: flex !important; align-items: flex-start !important; gap: clamp(14px, 3.5vw, 18px) !important;">
    <div style="min-width: clamp(40px, 10vw, 48px) !important; height: clamp(40px, 10vw, 48px) !important; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important; border-radius: 14px !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 4px 16px rgba(245,158,11,0.35) !important; flex-shrink: 0 !important;">
      <span style="font-size: clamp(18px, 4.5vw, 22px) !important;">⚠️</span>
    </div>
    <div style="flex: 1 !important;">
      <div style="color: #fde68a !important; font-size: clamp(10px, 2.5vw, 12px) !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 1.5px !important; margin-bottom: clamp(6px, 1.5vw, 10px) !important;">Important</div>
      <p style="color: #fef3c7 !important; font-size: clamp(14px, 3.5vw, 16px) !important; line-height: 1.7 !important; margin: 0 !important;">[Critical warning or caveat]</p>
    </div>
  </div>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 5: EXPERT QUOTE — DARK INDIGO
═══════════════════════════════════════════════════════════════════════════════

<blockquote style="
  position: relative !important;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important;
  border-radius: 20px !important;
  padding: clamp(28px, 7vw, 48px) !important;
  margin: clamp(28px, 7vw, 56px) 0 !important;
  border-left: 5px solid #6366f1 !important;
  box-shadow: 0 12px 40px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05) !important;
">
  <div style="position: absolute !important; top: clamp(12px, 3vw, 20px) !important; left: clamp(20px, 5vw, 36px) !important; font-size: clamp(48px, 12vw, 72px) !important; color: #6366f1 !important; opacity: 0.25 !important; font-family: Georgia, serif !important; line-height: 1 !important;">"</div>
  <p style="color: #e0e7ff !important; font-size: clamp(16px, 4vw, 20px) !important; font-style: italic !important; line-height: 1.8 !important; margin: 0 0 24px 0 !important; position: relative !important; z-index: 1 !important;">[Expert quote — 2-3 sentences]</p>
  <footer style="display: flex !important; align-items: center !important; gap: clamp(12px, 3vw, 16px) !important;">
    <div style="width: clamp(44px, 11vw, 52px) !important; height: clamp(44px, 11vw, 52px) !important; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: clamp(18px, 4.5vw, 22px) !important;">👤</div>
    <div>
      <cite style="color: #c7d2fe !important; font-style: normal !important; font-weight: 700 !important; font-size: clamp(13px, 3.2vw, 15px) !important; display: block !important;">[Expert Name]</cite>
      <span style="color: #818cf8 !important; font-size: clamp(11px, 2.8vw, 13px) !important;">[Title, Company]</span>
    </div>
  </footer>
</blockquote>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 6: COMPARISON TABLE — DARK MODE
═══════════════════════════════════════════════════════════════════════════════

<div style="overflow-x: auto !important; margin: clamp(28px, 7vw, 56px) 0 !important; border-radius: 16px !important; border: 1px solid rgba(255,255,255,0.08) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;">
  <table style="width: 100% !important; border-collapse: collapse !important; min-width: 500px !important; background: #0f172a !important;">
    <thead>
      <tr style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;">
        <th style="padding: clamp(14px, 3.5vw, 20px) !important; text-align: left !important; color: #f1f5f9 !important; font-weight: 700 !important; font-size: clamp(12px, 3vw, 14px) !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; border-bottom: 2px solid #3b82f6 !important;">Feature</th>
        <th style="padding: clamp(14px, 3.5vw, 20px) !important; text-align: center !important; color: #f1f5f9 !important; font-weight: 700 !important; border-bottom: 2px solid #3b82f6 !important;">Option A</th>
        <th style="padding: clamp(14px, 3.5vw, 20px) !important; text-align: center !important; color: #f1f5f9 !important; font-weight: 700 !important; border-bottom: 2px solid #3b82f6 !important;">Option B</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background: rgba(255,255,255,0.02) !important;">
        <td style="padding: clamp(12px, 3vw, 18px) !important; color: #e2e8f0 !important; font-weight: 500 !important; border-bottom: 1px solid rgba(255,255,255,0.04) !important;">Feature 1</td>
        <td style="padding: clamp(12px, 3vw, 18px) !important; text-align: center !important; color: #22c55e !important; font-weight: 700 !important; border-bottom: 1px solid rgba(255,255,255,0.04) !important;">✓ Yes</td>
        <td style="padding: clamp(12px, 3vw, 18px) !important; text-align: center !important; color: #ef4444 !important; font-weight: 700 !important; border-bottom: 1px solid rgba(255,255,255,0.04) !important;">✗ No</td>
      </tr>
    </tbody>
  </table>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 7: STEP-BY-STEP PROCESS — DARK MODE
═══════════════════════════════════════════════════════════════════════════════

<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important; border-radius: 20px !important; padding: clamp(24px, 6vw, 44px) !important; margin: clamp(28px, 7vw, 56px) 0 !important; border: 1px solid rgba(255,255,255,0.06) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;">
  <div style="display: flex !important; align-items: center !important; gap: clamp(12px, 3vw, 16px) !important; margin-bottom: clamp(20px, 5vw, 28px) !important; padding-bottom: clamp(16px, 4vw, 24px) !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important;">
    <div style="width: clamp(44px, 11vw, 52px) !important; height: clamp(44px, 11vw, 52px) !important; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important; border-radius: 14px !important; display: flex !important; align-items: center !important; justify-content: center !important;">
      <span style="font-size: clamp(20px, 5vw, 26px) !important;">📋</span>
    </div>
    <h3 style="color: #f1f5f9 !important; font-size: clamp(18px, 4.5vw, 24px) !important; font-weight: 700 !important; margin: 0 !important;">Step-by-Step Process</h3>
  </div>
  <div style="display: flex !important; flex-direction: column !important; gap: clamp(14px, 3.5vw, 20px) !important;">
    <div style="display: flex !important; gap: clamp(14px, 3.5vw, 18px) !important; align-items: flex-start !important;">
      <div style="min-width: clamp(36px, 9vw, 44px) !important; height: clamp(36px, 9vw, 44px) !important; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-weight: 800 !important; font-size: clamp(14px, 3.5vw, 18px) !important;">1</div>
      <div style="flex: 1 !important; background: rgba(255,255,255,0.03) !important; border-radius: 12px !important; padding: clamp(14px, 3.5vw, 20px) !important; border: 1px solid rgba(255,255,255,0.06) !important;">
        <div style="color: #f1f5f9 !important; font-weight: 700 !important; margin-bottom: 6px !important;">[Step Title]</div>
        <div style="color: #94a3b8 !important; font-size: clamp(13px, 3.2vw, 15px) !important; line-height: 1.6 !important;">[Step description]</div>
      </div>
    </div>
  </div>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 8: CHECKLIST — DARK EMERALD
═══════════════════════════════════════════════════════════════════════════════

<div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%) !important; border-radius: 16px !important; padding: clamp(20px, 5vw, 36px) !important; margin: clamp(24px, 6vw, 44px) 0 !important; border: 1px solid rgba(16,185,129,0.3) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;">
  <div style="display: flex !important; align-items: center !important; gap: clamp(10px, 2.5vw, 14px) !important; margin-bottom: clamp(16px, 4vw, 24px) !important;">
    <div style="width: clamp(36px, 9vw, 44px) !important; height: clamp(36px, 9vw, 44px) !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; border-radius: 12px !important; display: flex !important; align-items: center !important; justify-content: center !important;">
      <span style="font-size: clamp(16px, 4vw, 20px) !important;">✅</span>
    </div>
    <h4 style="color: #a7f3d0 !important; font-size: clamp(15px, 3.8vw, 18px) !important; font-weight: 700 !important; margin: 0 !important;">Quick Checklist</h4>
  </div>
  <ul style="list-style: none !important; padding: 0 !important; margin: 0 !important; display: flex !important; flex-direction: column !important; gap: clamp(10px, 2.5vw, 14px) !important;">
    <li style="display: flex !important; align-items: center !important; gap: clamp(10px, 2.5vw, 14px) !important; padding: clamp(12px, 3vw, 16px) !important; background: rgba(255,255,255,0.06) !important; border-radius: 10px !important; border: 1px solid rgba(16,185,129,0.15) !important;">
      <span style="min-width: 24px !important; height: 24px !important; background: #10b981 !important; border-radius: 6px !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 14px !important; font-weight: 700 !important;">✓</span>
      <span style="color: #d1fae5 !important; font-size: clamp(13px, 3.2vw, 15px) !important; line-height: 1.5 !important;">[Checklist item]</span>
    </li>
  </ul>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 9: DEFINITION BOX — DARK CYAN
═══════════════════════════════════════════════════════════════════════════════

<div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important; border-radius: 16px !important; padding: clamp(20px, 5vw, 32px) !important; margin: clamp(24px, 6vw, 40px) 0 !important; border-left: 4px solid #06b6d4 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;">
  <div style="display: flex !important; align-items: center !important; gap: clamp(10px, 2.5vw, 14px) !important; margin-bottom: clamp(12px, 3vw, 18px) !important;">
    <span style="font-size: clamp(20px, 5vw, 26px) !important;">📖</span>
    <span style="color: #22d3ee !important; font-size: clamp(10px, 2.5vw, 12px) !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 1.5px !important;">Definition</span>
  </div>
  <div style="color: #67e8f9 !important; font-size: clamp(16px, 4vw, 20px) !important; font-weight: 700 !important; margin-bottom: clamp(8px, 2vw, 12px) !important;">[Term]</div>
  <p style="color: #e0f2fe !important; font-size: clamp(14px, 3.5vw, 16px) !important; line-height: 1.7 !important; margin: 0 !important;">[Clear definition]</p>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 10: KEY TAKEAWAYS — DARK EMERALD (BEFORE FAQ)
═══════════════════════════════════════════════════════════════════════════════

<div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%) !important; border-radius: clamp(16px, 4vw, 24px) !important; padding: clamp(24px, 6vw, 44px) !important; margin: clamp(32px, 8vw, 64px) 0 !important; border: 1px solid rgba(16,185,129,0.3) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.25) !important;">
  <div style="display: flex !important; align-items: center !important; gap: clamp(12px, 3vw, 18px) !important; margin-bottom: clamp(20px, 5vw, 32px) !important; padding-bottom: clamp(16px, 4vw, 24px) !important; border-bottom: 1px solid rgba(16,185,129,0.2) !important;">
    <div style="width: clamp(48px, 12vw, 60px) !important; height: clamp(48px, 12vw, 60px) !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; border-radius: 16px !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 6px 20px rgba(16,185,129,0.35) !important;">
      <span style="font-size: clamp(22px, 5.5vw, 28px) !important;">🎯</span>
    </div>
    <h2 style="color: #a7f3d0 !important; font-size: clamp(20px, 5vw, 28px) !important; font-weight: 800 !important; margin: 0 !important;">Key Takeaways</h2>
  </div>
  <ul style="list-style: none !important; padding: 0 !important; margin: 0 !important;">
    <li style="display: flex !important; align-items: flex-start !important; gap: clamp(12px, 3vw, 16px) !important; margin-bottom: clamp(12px, 3vw, 16px) !important; padding: clamp(14px, 3.5vw, 20px) !important; background: rgba(255,255,255,0.06) !important; border-radius: 12px !important; border: 1px solid rgba(16,185,129,0.15) !important;">
      <div style="min-width: clamp(26px, 6.5vw, 32px) !important; height: clamp(26px, 6.5vw, 32px) !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; border-radius: 8px !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">
        <span style="color: #fff !important; font-size: clamp(13px, 3.2vw, 16px) !important; font-weight: 800 !important;">✓</span>
      </div>
      <span style="color: #d1fae5 !important; font-size: clamp(14px, 3.5vw, 16px) !important; line-height: 1.65 !important;">[Key takeaway point]</span>
    </li>
  </ul>
</div>

═══════════════════════════════════════════════════════════════════════════════
█ COMPONENT 11: CTA BOX — DARK PURPLE
═══════════════════════════════════════════════════════════════════════════════

<div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%) !important; border-radius: clamp(16px, 4vw, 24px) !important; padding: clamp(32px, 8vw, 56px) !important; margin: clamp(36px, 9vw, 72px) 0 !important; text-align: center !important; box-shadow: 0 16px 48px rgba(124,58,237,0.35) !important; position: relative !important; overflow: hidden !important;">
  <div style="position: absolute !important; top: -50% !important; right: -20% !important; width: 60% !important; height: 200% !important; background: radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, transparent 70%) !important; pointer-events: none !important;"></div>
  <h3 style="color: #ffffff !important; font-size: clamp(22px, 5.5vw, 32px) !important; font-weight: 800 !important; margin: 0 0 clamp(12px, 3vw, 16px) 0 !important; position: relative !important; z-index: 1 !important;">Ready to Get Started?</h3>
  <p style="color: #e9d5ff !important; font-size: clamp(14px, 3.5vw, 18px) !important; margin: 0 0 clamp(24px, 6vw, 32px) 0 !important; max-width: 550px !important; margin-left: auto !important; margin-right: auto !important; line-height: 1.6 !important; position: relative !important; z-index: 1 !important;">[Compelling call-to-action message]</p>
  <div style="display: inline-block !important; background: #ffffff !important; color: #5b21b6 !important; font-weight: 700 !important; padding: clamp(14px, 3.5vw, 18px) clamp(28px, 7vw, 40px) !important; border-radius: 14px !important; font-size: clamp(14px, 3.5vw, 17px) !important; box-shadow: 0 6px 20px rgba(0,0,0,0.25) !important; position: relative !important; z-index: 1 !important;">🚀 [Action Button Text]</div>
</div>

════════════════════════════════════════════════════════════════════════════════
`;
// ═══════════════════════════════════════════════════════════════════════════════
// 📊 OPTIMIZATION DNA BUILDER v16.0 — ENTERPRISE SOTA
// ═══════════════════════════════════════════════════════════════════════════════

const buildOptimizationDNA = (hasNeuron: boolean, targetWords: number) => `
════════════════════════════════════════════════════════════════════════════════
████████████████████████████████████████████████████████████████████████████████
██                                                                            ██
██   📊 SEO/AEO/GEO OPTIMIZATION DNA v16.0 — ENTERPRISE REQUIREMENTS         ██
██                                                                            ██
████████████████████████████████████████████████████████████████████████████████
════════════════════════════════════════════════════════════════════════════════

🚨 CRITICAL REQUIREMENTS — READ EVERY LINE 🚨

════════════════════════════════════════════════════════════════════════════════
█ WORD COUNT — ABSOLUTE MINIMUM ${targetWords}+ WORDS — NON-NEGOTIABLE
════════════════════════════════════════════════════════════════════════════════

You MUST write AT LEAST ${targetWords} words of REAL, VALUABLE content.
• This is NOT optional — content under ${targetWords} words will be REJECTED
• NO filler, NO fluff, NO repetition — every sentence must add value
• Target: ${targetWords} - ${targetWords + 800} words

SECTION WORD BUDGETS (MANDATORY):
┌──────────────────────────────────────────────────────────────────────────────┐
│ Section                    │ Min Words │ Target Words │ Max Words           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Introduction (with hook)   │    250    │     350      │     450             │
│ Quick Answer Box           │     50    │      70      │     100             │
│ Main H2 Sections (10-12x)  │    350    │     450      │     600 each        │
│ H3 Subsections (18+ total) │    120    │     180      │     250 each        │
│ Key Takeaways Box          │    100    │     150      │     200             │
│ FAQ Section (7-10 Q&As)    │    500    │     700      │     900             │
│ Conclusion with CTA        │    150    │     250      │     350             │
└──────────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
█ 🎨 VISUAL COMPONENTS — MANDATORY 18+ ELEMENTS — ALL DARK MODE
════════════════════════════════════════════════════════════════════════════════

You MUST include ALL of these visual elements with DARK backgrounds (#0f172a, #1e293b):

┌──────────────────────────────────────────────────────────────────────────────┐
│ #  │ Component               │ Count │ Placement                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1  │ Quick Answer Box        │   1   │ Immediately after intro paragraph    │
│ 2  │ Statistics Dashboard    │   1   │ Within first 20% of content          │
│ 3  │ Pro Tip Boxes           │   3   │ Distributed: early, middle, late     │
│ 4  │ Warning/Important Boxes │   2   │ For critical info and caveats        │
│ 5  │ Expert Quote Blocks     │   2   │ After making claims that need proof  │
│ 6  │ Comparison Tables       │   2   │ In middle sections, with REAL data   │
│ 7  │ Step-by-Step Process    │   1   │ For any procedural/how-to content    │
│ 8  │ Checklist Boxes         │   2   │ For actionable requirements          │
│ 9  │ Definition Box          │   1   │ When introducing key technical terms │
│ 10 │ Key Takeaways Box       │   1   │ DIRECTLY BEFORE FAQ section          │
│ 11 │ CTA Box                 │   1   │ In conclusion section                │
│ 12 │ Info/Highlight Boxes    │   1+  │ Throughout for variety               │
└──────────────────────────────────────────────────────────────────────────────┘

CRITICAL STYLING (DARK MODE):
• ALL backgrounds: #0f172a, #1e293b, or dark gradients
• ALL text: #ffffff, #f1f5f9, #e2e8f0, #cbd5e1
• ALL styles use !important
• Use clamp() for responsive sizing

════════════════════════════════════════════════════════════════════════════════
█ 🔗 INTERNAL LINKS — MANDATORY 15-20 LINKS — RICH ANCHOR TEXT
════════════════════════════════════════════════════════════════════════════════

ANCHOR TEXT REQUIREMENTS:
┌──────────────────────────────────────────────────────────────────────────────┐
│ Rule                        │ Example                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ MINIMUM 3 words             │ ✓ "protein timing for muscle growth"           │
│ MAXIMUM 7 words             │ ✓ "complete guide to email marketing"          │
│ IDEAL 4-5 words             │ ✓ "best practices for content optimization"    │
│ Must be descriptive         │ ✓ "advanced keyword research strategies"       │
│ NEVER generic               │ ✗ "click here", "read more", "this article"   │
│ NEVER single word           │ ✗ "guide", "tips", "learn"                    │
└──────────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
█ 📐 STRUCTURE — HEADINGS, HIERARCHY, AND FLOW
════════════════════════════════════════════════════════════════════════════════

⚠️⚠️⚠️ CRITICAL H1 RULE ⚠️⚠️⚠️
WordPress automatically provides the page title as H1.
NEVER include an <h1> tag in your htmlContent.
Start your content with an engaging <p> paragraph — NOT a heading.

HEADING REQUIREMENTS:
┌──────────────────────────────────────────────────────────────────────────────┐
│ Element │ Count    │ Requirements                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ H1      │ 0 (ZERO) │ WordPress provides — NEVER include in content          │
│ H2      │ 10-12    │ Main sections — include keyword in 3-4 of them         │
│ H3      │ 18+      │ Subsections under H2s — 2-3 per H2 section             │
│ H4      │ Optional │ For deep nesting only when needed                      │
└──────────────────────────────────────────────────────────────────────────────┘

CONTENT FLOW ORDER:
1. Introduction paragraph (engaging hook, NO heading)
2. Quick Answer Box
3. Statistics Dashboard  
4. Main H2 Sections (10-12 sections, each with visuals)
5. Key Takeaways Box ← MUST appear BEFORE FAQ
6. FAQ Accordion (7-10 Q&As)
7. Conclusion with CTA Box
8. References Section ← ALWAYS LAST

════════════════════════════════════════════════════════════════════════════════
█ 🤖 AEO & GEO OPTIMIZATION
════════════════════════════════════════════════════════════════════════════════

FEATURED SNIPPET OPTIMIZATION:
• First 50-70 words = Direct, definitive answer
• Use "What is X? X is..." format for definitions
• Use numbered lists for "how to" queries
• Use tables for comparisons

SOURCE CITATION:
• Use [1], [2], [3] notation for inline citations
• 8-15 unique citations throughout content
• Include References section at VERY END
• Prioritize authority sources (.gov, .edu)

E-E-A-T SIGNALS:
• Expert quotes with full attribution
• Research citations
• Specific statistics and data
• First-hand experience language

════════════════════════════════════════════════════════════════════════════════
█ ✍️ WRITING STYLE — HUMAN, NOT AI
════════════════════════════════════════════════════════════════════════════════

Write like Alex Hormozi — direct, punchy, human:

✅ DO:
• Use contractions (don't, won't, you'll)
• Start sentences with "And", "But", "So"
• Use fragments. For emphasis.
• Address reader as "you"
• Be opinionated

❌ DON'T USE:
• "In today's fast-paced world..."
• "It's important to note..."
• "Let's dive in..."
• "Comprehensive guide"
• "Leverage" or "utilize"
• "Delve"

════════════════════════════════════════════════════════════════════════════════
${hasNeuron ? `
█ 🧬 NLP TERMS — 70%+ COVERAGE REQUIRED
════════════════════════════════════════════════════════════════════════════════
You have been provided with NeuronWriter NLP terms.
You MUST naturally incorporate 70%+ of these terms throughout the content.
` : ''}
════════════════════════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 DATA FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════════

function formatNeuronTerms(neuronData?: NeuronAnalysisResult): string {
    if (!neuronData?.terms?.length) return '';
    
    const terms = neuronData.terms;
    const criticalTerms = terms.filter(t => t.importance >= 80).slice(0, 20);
    const titleTerms = terms.filter(t => t.type === 'title').slice(0, 10);
    const headerTerms = terms.filter(t => t.type === 'header').slice(0, 30);
    const bodyTerms = terms.filter(t => t.type === 'basic' || t.type === 'extended').slice(0, 50);
    
    return `
════════════════════════════════════════════════════════════════════════════════
🧬 NEURONWRITER NLP TERMS — MANDATORY 70%+ COVERAGE
════════════════════════════════════════════════════════════════════════════════
Target Word Count: ${neuronData.targetWordCount || CONTENT_CONSTANTS.DEFAULT_TARGET_WORDS}+ words

🎯 CRITICAL TERMS (Must use ALL):
${criticalTerms.map(t => `• "${t.term}" (use ${t.recommended}+ times)`).join('\n')}

🏷️ TITLE/H1 TERMS (Use in headings):
${titleTerms.map(t => t.term).join(', ')}

📑 HEADER TERMS (Use in H2/H3):
${headerTerms.map(t => t.term).join(', ')}

📝 BODY TERMS (Distribute throughout):
${bodyTerms.map(t => t.term).join(', ')}

⚠️ You MUST naturally incorporate 70%+ of these terms throughout the content.
════════════════════════════════════════════════════════════════════════════════
`;
}

function formatEntityGap(data?: EntityGapAnalysis): string {
    if (!data) return '';
    
    const parts: string[] = [];
    
    if (data.missingEntities?.length) {
        parts.push(`ENTITIES TO INCLUDE:\n${data.missingEntities.slice(0, 25).join(', ')}`);
    }
    
    if (data.paaQuestions?.length) {
        parts.push(`PEOPLE ALSO ASK (Answer these in FAQ):\n${data.paaQuestions.slice(0, 12).map((q, i) => `${i + 1}. ${q}`).join('\n')}`);
    }
    
    if (data.topKeywords?.length) {
        parts.push(`SEMANTIC KEYWORDS:\n${data.topKeywords.slice(0, 20).join(', ')}`);
    }
    
    if (data.contentGaps?.length) {
        parts.push(`CONTENT GAPS TO FILL:\n${data.contentGaps.slice(0, 8).map(g => `• ${g}`).join('\n')}`);
    }
    
    return parts.length > 0 ? `
════════════════════════════════════════════════════════════════════════════════
🧠 SERP ANALYSIS & ENTITY DATA
════════════════════════════════════════════════════════════════════════════════
${parts.join('\n\n')}
════════════════════════════════════════════════════════════════════════════════
` : '';
}

function formatReferences(refs?: ValidatedReference[]): string {
    if (!refs?.length) return '';
    
    const validRefs = refs.filter(r => r.isValid).slice(0, 15);
    
    return `
════════════════════════════════════════════════════════════════════════════════
📚 VALIDATED AUTHORITATIVE REFERENCES — USE THESE
════════════════════════════════════════════════════════════════════════════════
${validRefs.map((r, i) => `[${i + 1}] ${r.title} (${r.source}, ${r.year})
    URL: ${r.url}${r.isAuthority ? ' ⭐ AUTHORITY SOURCE' : ''}`).join('\n\n')}

⚠️ CITE these sources inline using [1], [2] notation.
⚠️ Include ALL sources in the References section at the VERY END.
════════════════════════════════════════════════════════════════════════════════
`;
}

function formatInternalLinks(links?: InternalLinkTarget[]): string {
    if (!links?.length) return '';
    
    const validLinks = links.filter(l => l.title?.length > 5).slice(0, 30);
    
    return `
════════════════════════════════════════════════════════════════════════════════
🔗 INTERNAL LINK TARGETS — ADD 15-20 CONTEXTUAL LINKS
════════════════════════════════════════════════════════════════════════════════
Use 3-7 word descriptive anchor text (NOT "click here" or single words):

${validLinks.map(l => `• "${l.title}" → ${l.url}`).join('\n')}

⚠️ Anchor text rules:
- MINIMUM 3 words, MAXIMUM 7 words
- GOOD: "complete guide to protein timing" → /protein-timing-guide
- BAD: "here", "click", "protein", "guide"
════════════════════════════════════════════════════════════════════════════════
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 H1 REMOVAL — ALWAYS APPLIED
// ═══════════════════════════════════════════════════════════════════════════════

export function removeAllH1Tags(html: string, log?: (msg: string) => void): string {
    if (!html) return html;
    
    const h1CountBefore = (html.match(/<h1/gi) || []).length;
    
    if (h1CountBefore === 0) {
        log?.(`   ✓ No H1 tags found — content is clean`);
        return html;
    }
    
    log?.(`   ⚠️ Found ${h1CountBefore} H1 tag(s) — removing...`);
    
    let cleaned = html;
    
    // Multiple passes for nested/complex H1s
    for (let pass = 0; pass < 3; pass++) {
        cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
        cleaned = cleaned.replace(/<h1[^>]*\/>/gi, '');
    }
    
    // Final cleanup
    cleaned = cleaned.replace(/<h1\b[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/h1>/gi, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    
    const h1CountAfter = (cleaned.match(/<h1/gi) || []).length;
    
    if (h1CountAfter > 0) {
        log?.(`   ❌ WARNING: ${h1CountAfter} H1 tag(s) still present — converting to H2`);
        cleaned = cleaned.replace(/<h1/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
    } else {
        log?.(`   ✓ Successfully removed ${h1CountBefore} H1 tag(s)`);
    }
    
    return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 CSS-ONLY FAQ ACCORDION — WORDPRESS CSP COMPATIBLE (DARK MODE)
// ═══════════════════════════════════════════════════════════════════════════════

// FAQ detection patterns (module-level for performance)
const FAQ_DETECTION_PATTERNS = [
    /<section[^>]*class="[^"]*(?:faq|wp-opt-faq)[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    /<section[^>]*id="[^"]*faq[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    /<div[^>]*class="[^"]*faq-(?:section|accordion|container)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<[^>]*itemtype="https?:\/\/schema\.org\/FAQPage"[^>]*>[\s\S]*?<\/[^>]+>/gi,
    /<style>[^<]*(?:faq-section-|wp-opt-faq-)[^<]*<\/style>/gi,
];

export function generateEnterpriseAccordionFAQ(
    faqs: Array<{ question: string; answer: string }>
): string {
    if (!faqs || faqs.length === 0) return '';
    
    const sectionId = `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Dark mode color palette
    const colorPalette = [
        { accent: '#6366f1', bg: 'rgba(99,102,241,0.15)', text: '#c7d2fe' },
        { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', text: '#ddd6fe' },
        { accent: '#06b6d4', bg: 'rgba(6,182,212,0.15)', text: '#a5f3fc' },
        { accent: '#10b981', bg: 'rgba(16,185,129,0.15)', text: '#a7f3d0' },
        { accent: '#f59e0b', bg: 'rgba(245,158,11,0.15)', text: '#fde68a' },
        { accent: '#ec4899', bg: 'rgba(236,72,153,0.15)', text: '#fbcfe8' },
    ];
    
    const css = `
<style>
.wp-opt-faq-${sectionId} {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
    border-radius: clamp(16px, 4vw, 24px) !important;
    padding: 0 !important;
    margin: clamp(40px, 10vw, 80px) 0 !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important;
    overflow: hidden !important;
}
.wp-opt-faq-${sectionId} .faq-header {
    padding: clamp(24px, 6vw, 36px) !important;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
}
.wp-opt-faq-${sectionId} .faq-item {
    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
}
.wp-opt-faq-${sectionId} .faq-item:last-child {
    border-bottom: none !important;
}
.wp-opt-faq-${sectionId} .faq-checkbox {
    position: absolute !important;
    opacity: 0 !important;
    pointer-events: none !important;
}
.wp-opt-faq-${sectionId} .faq-question {
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    gap: clamp(12px, 3vw, 16px) !important;
    padding: clamp(18px, 4.5vw, 24px) clamp(20px, 5vw, 28px) !important;
    border: none !important;
    background: rgba(255,255,255,0.02) !important;
    cursor: pointer !important;
    text-align: left !important;
    transition: background 0.2s ease !important;
    margin: 0 !important;
}
.wp-opt-faq-${sectionId} .faq-question:hover {
    background: rgba(255,255,255,0.05) !important;
}
.wp-opt-faq-${sectionId} .faq-answer {
    max-height: 0 !important;
    overflow: hidden !important;
    transition: max-height 0.4s ease, padding 0.4s ease !important;
    background: rgba(0,0,0,0.2) !important;
}
.wp-opt-faq-${sectionId} .faq-checkbox:checked + .faq-question + .faq-answer {
    max-height: 800px !important;
}
.wp-opt-faq-${sectionId} .faq-chevron {
    transition: transform 0.3s ease !important;
    display: inline-block !important;
}
.wp-opt-faq-${sectionId} .faq-checkbox:checked + .faq-question .faq-chevron {
    transform: rotate(180deg) !important;
}
</style>`;

    const faqItems = faqs.map((faq, index) => {
        const colors = colorPalette[index % colorPalette.length];
        const itemId = `${sectionId}-q${index}`;
        const safeQuestion = escapeHtml(faq.question);
        const safeAnswer = escapeHtml(faq.answer);
        
        return `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <input type="checkbox" id="${itemId}" class="faq-checkbox" aria-hidden="true" />
        <label for="${itemId}" class="faq-question">
            <div style="min-width: clamp(32px, 8vw, 40px) !important; height: clamp(32px, 8vw, 40px) !important; background: ${colors.bg} !important; border-radius: 10px !important; display: flex !important; align-items: center !important; justify-content: center !important; border: 2px solid ${colors.accent}40 !important; flex-shrink: 0 !important;">
                <span style="font-size: clamp(12px, 3vw, 14px) !important; font-weight: 800 !important; color: ${colors.accent} !important;">Q${index + 1}</span>
            </div>
            <span itemprop="name" style="flex: 1 !important; color: #f1f5f9 !important; font-size: clamp(14px, 3.5vw, 17px) !important; font-weight: 600 !important; line-height: 1.5 !important;">
                ${safeQuestion}
            </span>
            <span class="faq-chevron" style="font-size: clamp(12px, 3vw, 16px) !important; color: ${colors.accent} !important; flex-shrink: 0 !important;">▼</span>
        </label>
        <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <div style="padding: clamp(16px, 4vw, 24px) clamp(20px, 5vw, 28px) clamp(20px, 5vw, 28px) clamp(64px, 16vw, 84px) !important;">
                <p itemprop="text" style="color: #cbd5e1 !important; font-size: clamp(14px, 3.5vw, 16px) !important; line-height: 1.75 !important; margin: 0 !important;">
                    ${safeAnswer}
                </p>
            </div>
        </div>
    </div>`;
    }).join('\n');

    return `
${css}
<section class="wp-opt-faq-${sectionId}" itemscope itemtype="https://schema.org/FAQPage">
    <div class="faq-header">
        <div style="display: flex !important; align-items: center !important; gap: clamp(12px, 3vw, 18px) !important;">
            <div style="width: clamp(48px, 12vw, 60px) !important; height: clamp(48px, 12vw, 60px) !important; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important; border-radius: 16px !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 6px 20px rgba(99,102,241,0.35) !important;">
                <span style="font-size: clamp(22px, 5.5vw, 28px) !important;">❓</span>
            </div>
            <div>
                <h2 style="color: #f1f5f9 !important; font-size: clamp(20px, 5vw, 28px) !important; font-weight: 800 !important; margin: 0 !important;">Frequently Asked Questions</h2>
                <p style="color: #94a3b8 !important; font-size: clamp(11px, 2.8vw, 13px) !important; margin: 6px 0 0 0 !important;">${faqs.length} questions answered • Click to expand</p>
            </div>
        </div>
    </div>
    ${faqItems}
</section>
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📚 REFERENCES SECTION — DARK MODE ACCORDION
// ═══════════════════════════════════════════════════════════════════════════════

export function generateReferencesSection(references: ValidatedReference[]): string {
    if (!references || !Array.isArray(references) || references.length === 0) {
        return '';
    }
    
    const validRefs = references.filter(ref => {
        if (!ref) return false;
        if (!ref.url || typeof ref.url !== 'string') return false;
        if (!ref.url.startsWith('http')) return false;
        if (ref.isValid === false) return false;
        return true;
    });
    
    if (validRefs.length === 0) return '';

    const refItems = validRefs.map((ref, index) => {
        const domain = ref.domain || (() => {
            try {
                return new URL(ref.url).hostname.replace('www.', '');
            } catch {
                return 'Source';
            }
        })();
        const title = ref.title || 'Untitled Source';
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        
        return `
        <a href="${ref.url}" target="_blank" rel="noopener noreferrer" style="display: block !important; text-decoration: none !important; margin-bottom: clamp(10px, 2.5vw, 14px) !important;">
            <div style="background: rgba(255,255,255,0.03) !important; border-radius: 12px !important; padding: clamp(14px, 3.5vw, 20px) !important; border: 1px solid rgba(255,255,255,0.06) !important; transition: all 0.2s ease !important; display: flex !important; align-items: center !important; gap: clamp(12px, 3vw, 16px) !important;">
                <div style="width: clamp(36px, 9vw, 44px) !important; height: clamp(36px, 9vw, 44px) !important; background: rgba(255,255,255,0.05) !important; border-radius: 10px !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">
                    <img src="${faviconUrl}" alt="" style="width: 20px !important; height: 20px !important; border-radius: 4px !important;" onerror="this.style.display='none'" />
                </div>
                <div style="flex: 1 !important; min-width: 0 !important;">
                    <div style="color: #f1f5f9 !important; font-size: clamp(13px, 3.2vw, 15px) !important; font-weight: 600 !important; line-height: 1.4 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;">${escapeHtml(title)}</div>
                    <div style="display: flex !important; align-items: center !important; gap: 8px !important; margin-top: 4px !important; flex-wrap: wrap !important;">
                        <span style="color: #93c5fd !important; font-size: clamp(11px, 2.8vw, 12px) !important; font-weight: 500 !important;">${ref.source || domain}</span>
                        <span style="color: #475569 !important;">•</span>
                        <span style="color: #64748b !important; font-size: clamp(11px, 2.8vw, 12px) !important;">${ref.year || CONTENT_YEAR}</span>
                        ${ref.isAuthority ? '<span style="background: rgba(34,197,94,0.2) !important; color: #22c55e !important; font-size: 9px !important; font-weight: 700 !important; padding: 2px 8px !important; border-radius: 4px !important; text-transform: uppercase !important;">Authority</span>' : ''}
                    </div>
                </div>
                <div style="color: #64748b !important; font-size: clamp(14px, 3.5vw, 18px) !important; flex-shrink: 0 !important;">→</div>
            </div>
        </a>`;
    }).join('\n');
    
    const sectionId = `refs-${Date.now()}`;
    
    return `
<!-- REFERENCES SECTION — DARK MODE ACCORDION -->
<style>
.ref-accordion-${sectionId} input { display: none !important; }
.ref-accordion-${sectionId} .ref-content { max-height: 0 !important; overflow: hidden !important; transition: max-height 0.4s ease !important; }
.ref-accordion-${sectionId} input:checked + label + .ref-content { max-height: 2000px !important; }
.ref-accordion-${sectionId} label .ref-chevron { transition: transform 0.3s ease !important; }
.ref-accordion-${sectionId} input:checked + label .ref-chevron { transform: rotate(180deg) !important; }
</style>
<section class="ref-accordion-${sectionId}" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important; border-radius: clamp(12px, 3vw, 20px) !important; margin: clamp(40px, 10vw, 80px) 0 clamp(20px, 5vw, 40px) 0 !important; border: 1px solid rgba(255,255,255,0.06) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; overflow: hidden !important;">
    <input type="checkbox" id="ref-toggle-${sectionId}" />
    <label for="ref-toggle-${sectionId}" style="display: flex !important; align-items: center !important; justify-content: space-between !important; padding: clamp(18px, 4.5vw, 24px) clamp(20px, 5vw, 28px) !important; cursor: pointer !important; background: rgba(255,255,255,0.02) !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important;">
        <div style="display: flex !important; align-items: center !important; gap: clamp(10px, 2.5vw, 14px) !important;">
            <span style="font-size: clamp(20px, 5vw, 26px) !important;">📚</span>
            <div>
                <div style="color: #f1f5f9 !important; font-size: clamp(15px, 3.8vw, 18px) !important; font-weight: 700 !important;">Sources & References</div>
                <div style="color: #64748b !important; font-size: clamp(11px, 2.8vw, 12px) !important;">${validRefs.length} authoritative sources cited</div>
            </div>
        </div>
        <span class="ref-chevron" style="color: #64748b !important; font-size: clamp(12px, 3vw, 14px) !important;">▼</span>
    </label>
    <div class="ref-content" style="padding: 0 clamp(16px, 4vw, 24px) !important; background: rgba(0,0,0,0.2) !important;">
        <div style="padding: clamp(16px, 4vw, 24px) 0 !important;">
            ${refItems}
        </div>
    </div>
</section>
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 KEY TAKEAWAYS BOX — DARK MODE
// ═══════════════════════════════════════════════════════════════════════════════

export function generateKeyTakeawaysBox(takeaways: string[]): string {
    if (!takeaways || takeaways.length === 0) return '';
    
    const items = takeaways.map((t) => `
    <li style="display: flex !important; align-items: flex-start !important; gap: clamp(12px, 3vw, 16px) !important; margin-bottom: clamp(12px, 3vw, 16px) !important; padding: clamp(14px, 3.5vw, 20px) !important; background: rgba(255,255,255,0.06) !important; border-radius: 12px !important; border: 1px solid rgba(16,185,129,0.15) !important;">
      <div style="min-width: clamp(26px, 6.5vw, 32px) !important; height: clamp(26px, 6.5vw, 32px) !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; border-radius: 8px !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; box-shadow: 0 2px 8px rgba(16,185,129,0.3) !important;">
        <span style="color: #fff !important; font-size: clamp(13px, 3.2vw, 16px) !important; font-weight: 800 !important;">✓</span>
      </div>
      <span style="color: #d1fae5 !important; font-size: clamp(14px, 3.5vw, 16px) !important; line-height: 1.65 !important;">${escapeHtml(t)}</span>
    </li>`).join('\n');
    
    return `
<!-- KEY TAKEAWAYS BOX — DARK MODE -->
<div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%) !important; border-radius: clamp(16px, 4vw, 24px) !important; padding: clamp(24px, 6vw, 44px) !important; margin: clamp(32px, 8vw, 64px) 0 !important; border: 1px solid rgba(16,185,129,0.3) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.25) !important;">
  <div style="display: flex !important; align-items: center !important; gap: clamp(12px, 3vw, 18px) !important; margin-bottom: clamp(20px, 5vw, 32px) !important; padding-bottom: clamp(16px, 4vw, 24px) !important; border-bottom: 1px solid rgba(16,185,129,0.2) !important;">
    <div style="width: clamp(48px, 12vw, 60px) !important; height: clamp(48px, 12vw, 60px) !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; border-radius: 16px !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 6px 20px rgba(16,185,129,0.35) !important;">
      <span style="font-size: clamp(22px, 5.5vw, 28px) !important;">🎯</span>
    </div>
    <h2 style="color: #a7f3d0 !important; font-size: clamp(20px, 5vw, 28px) !important; font-weight: 800 !important; margin: 0 !important;">Key Takeaways</h2>
  </div>
  <ul style="list-style: none !important; padding: 0 !important; margin: 0 !important;">
    ${items}
  </ul>
</div>
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 YOUTUBE VIDEO DISCOVERY & EMBEDDING
// ═══════════════════════════════════════════════════════════════════════════════

export async function findAndEmbedYouTubeVideo(
    topic: string,
    serperKey: string | null,
    youtubeApiKey?: string | null,
    onProgress?: (msg: string) => void
): Promise<string> {
    onProgress?.('🎬 Searching for relevant YouTube video...');
    
    let videoId: string | null = null;
    let videoTitle: string = topic;
    let videoChannel: string = 'Unknown';
    let videoViews: string = '';
    
    if (serperKey) {
        try {
            const response = await fetch('https://google.serper.dev/videos', {
                method: 'POST',
                headers: { 
                    'X-API-KEY': serperKey, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    q: `${topic} tutorial guide how to ${CONTENT_YEAR}`, 
                    num: 10,
                    gl: 'us',
                    hl: 'en'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const videos = data.videos || [];
                
                // Find best YouTube video with minimum view count
                for (const v of videos) {
                    const link = v.link || '';
                    if (!link.includes('youtube.com/watch') && !link.includes('youtu.be')) continue;
                    if (!v.title || v.title.length < 10) continue;
                    
                    // Parse view count
                    const viewsMatch = v.views?.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(K|M|B)?/i);
                    let views = 0;
                    if (viewsMatch) {
                        views = parseFloat(viewsMatch[1].replace(/,/g, ''));
                        const multiplier = { K: 1000, M: 1000000, B: 1000000000 }[viewsMatch[2]?.toUpperCase() as 'K' | 'M' | 'B'] || 1;
                        views *= multiplier;
                    }
                    
                    // Skip low-quality videos
                    if (views < 10000) continue;
                    
                    const linkMatch = link.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    if (linkMatch) {
                        videoId = linkMatch[1];
                        videoTitle = v.title.substring(0, 80);
                        videoChannel = v.channel || 'Unknown';
                        videoViews = v.views || '';
                        onProgress?.(`   ✅ Found: "${videoTitle}" (${videoViews})`);
                        break;
                    }
                }
            }
        } catch (e: any) {
            onProgress?.(`   ⚠️ Video search failed: ${e.message}`);
        }
    }
    
    if (videoId) {
        return `
<!-- YOUTUBE VIDEO EMBED — DARK MODE -->
<div style="margin: clamp(32px, 8vw, 64px) 0 !important; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important; border-radius: 20px !important; padding: clamp(20px, 5vw, 32px) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important; border: 1px solid rgba(255,255,255,0.08) !important;" itemscope itemtype="https://schema.org/VideoObject">
  <meta itemprop="name" content="${escapeHtml(videoTitle)}" />
  <meta itemprop="description" content="Video guide about ${escapeHtml(topic)}" />
  <meta itemprop="thumbnailUrl" content="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" />
  
  <div style="display: flex !important; align-items: center !important; gap: clamp(12px, 3vw, 16px) !important; margin-bottom: clamp(16px, 4vw, 24px) !important;">
    <div style="width: clamp(44px, 11vw, 52px) !important; height: clamp(44px, 11vw, 52px) !important; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; border-radius: 14px !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 4px 16px rgba(239,68,68,0.35) !important;">
      <span style="font-size: clamp(20px, 5vw, 26px) !important;">▶️</span>
    </div>
    <div>
      <div style="color: #f1f5f9 !important; font-size: clamp(14px, 3.5vw, 18px) !important; font-weight: 700 !important; line-height: 1.3 !important;">${escapeHtml(videoTitle.substring(0, 60))}${videoTitle.length > 60 ? '...' : ''}</div>
      <div style="color: #94a3b8 !important; font-size: clamp(11px, 2.8vw, 13px) !important; margin-top: 4px !important;">${escapeHtml(videoChannel)}${videoViews ? ` • ${videoViews}` : ''}</div>
    </div>
  </div>
  
  <div style="position: relative !important; width: 100% !important; padding-bottom: 56.25% !important; height: 0 !important; overflow: hidden !important; border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;">
    <iframe
      style="position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; border: none !important; border-radius: 12px !important;"
      src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
      title="${escapeHtml(videoTitle)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy"
    ></iframe>
  </div>
</div>`;
    } else {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`;
        onProgress?.(`   → Adding search link fallback`);
        
        return `
<!-- YOUTUBE VIDEO PLACEHOLDER — DARK MODE -->
<div style="margin: clamp(32px, 8vw, 64px) 0 !important; border-radius: 20px !important; overflow: hidden !important; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important; border: 1px solid rgba(255,255,255,0.08) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;">
  <div style="padding: clamp(32px, 8vw, 48px) clamp(20px, 5vw, 32px) !important; text-align: center !important;">
    <div style="font-size: clamp(40px, 10vw, 56px) !important; margin-bottom: clamp(12px, 3vw, 20px) !important;">📺</div>
    <h3 style="color: #f1f5f9 !important; font-size: clamp(18px, 4.5vw, 24px) !important; font-weight: 700 !important; margin: 0 0 clamp(8px, 2vw, 12px) 0 !important;">Watch Related Videos</h3>
    <p style="color: #94a3b8 !important; font-size: clamp(13px, 3.2vw, 15px) !important; margin: 0 0 clamp(20px, 5vw, 28px) 0 !important;">Find helpful video tutorials on this topic</p>
    <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block !important; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; color: #ffffff !important; font-weight: 700 !important; padding: clamp(12px, 3vw, 16px) clamp(24px, 6vw, 32px) !important; border-radius: 12px !important; text-decoration: none !important; font-size: clamp(14px, 3.5vw, 16px) !important; box-shadow: 0 4px 16px rgba(239,68,68,0.3) !important;">
      🔍 Search YouTube
    </a>
  </div>
</div>`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧬 NLP COVERAGE ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

export function analyzeNLPCoverage(
    html: string,
    terms: NeuronTerm[]
): NLPCoverageAnalysis {
    if (!html || terms.length === 0) {
        return {
            score: 100,
            weightedScore: 100,
            usedTerms: [],
            missingTerms: [],
            criticalMissing: [],
            headerMissing: [],
            bodyMissing: [],
        };
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const textContent = doc.body?.textContent?.toLowerCase() || '';
    
    const usedTerms: Array<NeuronTerm & { count: number; positions: number[] }> = [];
    const missingTerms: NeuronTerm[] = [];
    
    let totalWeight = 0;
    let usedWeight = 0;

    for (const term of terms) {
        const termLower = term.term.toLowerCase();
        const escaped = termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        
        const positions: number[] = [];
        let match;
        while ((match = regex.exec(textContent)) !== null) {
            positions.push(match.index);
        }
        
        const count = positions.length;
        const weight = term.importance || 50;
        totalWeight += weight;
        
        if (count > 0) {
            usedTerms.push({ ...term, count, positions });
            usedWeight += weight;
        } else {
            missingTerms.push(term);
        }
    }

    const criticalMissing = missingTerms.filter(t => (t.importance || 50) >= 80);
    const headerMissing = missingTerms.filter(t => t.type === 'header' || t.type === 'title');
    const bodyMissing = missingTerms.filter(t => t.type === 'basic' || t.type === 'extended');

    const score = terms.length > 0 
        ? Math.round((usedTerms.length / terms.length) * 100)
        : 100;
    
    const weightedScore = totalWeight > 0
        ? Math.round((usedWeight / totalWeight) * 100)
        : 100;

    return {
        score,
        weightedScore,
        usedTerms,
        missingTerms,
        criticalMissing,
        headerMissing,
        bodyMissing,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧬 NLP TERM INJECTION POST-PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════

const INJECTION_TEMPLATES = {
    definition: [
        `{term} refers to the process of`,
        `Understanding {term} is essential because`,
        `{term} plays a crucial role in`,
        `The concept of {term} involves`,
    ],
    importance: [
        `{term} is particularly important for`,
        `Many experts emphasize {term} as`,
        `The significance of {term} cannot be overstated—`,
        `Focusing on {term} helps ensure`,
    ],
    example: [
        `A good example of {term} is`,
        `{term} can be seen in`,
        `Consider how {term} applies to`,
    ],
    transition: [
        `This relates directly to {term}, which`,
        `Building on this, {term}`,
        `Furthermore, {term}`,
    ],
    expert: [
        `Industry experts recommend {term} for`,
        `Research supports the use of {term} in`,
        `Studies show that {term}`,
    ],
};

const TERM_CLUSTERS: Record<string, string[]> = {
    seo: ['ranking', 'search', 'google', 'keyword', 'optimization', 'serp', 'traffic'],
    content: ['writing', 'article', 'blog', 'post', 'copy', 'text', 'words'],
    marketing: ['strategy', 'campaign', 'audience', 'conversion', 'leads', 'funnel'],
    health: ['wellness', 'fitness', 'nutrition', 'medical', 'treatment', 'symptoms'],
    business: ['company', 'revenue', 'profit', 'growth', 'market', 'industry'],
    finance: ['money', 'investment', 'budget', 'cost', 'price', 'savings', 'roi'],
};

function getRelatedTerms(term: string): string[] {
    const related: Set<string> = new Set();
    const termLower = term.toLowerCase();
    
    for (const [, clusterTerms] of Object.entries(TERM_CLUSTERS)) {
        let matchScore = 0;
        for (const clusterTerm of clusterTerms) {
            if (termLower.includes(clusterTerm) || clusterTerm.includes(termLower)) {
                matchScore += 2;
            }
        }
        if (matchScore >= 2) {
            clusterTerms.forEach(t => related.add(t));
        }
    }
    
    return Array.from(related);
}

export function injectMissingNLPTerms(
    html: string,
    neuronTerms: NeuronTerm[],
    options: {
        targetCoverage?: number;
        maxInsertions?: number;
        prioritizeCritical?: boolean;
    } = {}
): NLPInjectionResult {
    const {
        targetCoverage = NLP_CONSTANTS.DEFAULT_TARGET_COVERAGE,
        maxInsertions = NLP_CONSTANTS.MAX_INJECTIONS,
        prioritizeCritical = true,
    } = options;

    if (!html || neuronTerms.length === 0) {
        return {
            html,
            termsAdded: [],
            termsFailed: [],
            initialCoverage: 100,
            finalCoverage: 100,
            insertionDetails: [],
        };
    }

    const initialAnalysis = analyzeNLPCoverage(html, neuronTerms);
    
    if (initialAnalysis.score >= targetCoverage) {
        return {
            html,
            termsAdded: [],
            termsFailed: [],
            initialCoverage: initialAnalysis.score,
            finalCoverage: initialAnalysis.score,
            insertionDetails: [],
        };
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const termsAdded: string[] = [];
    const termsFailed: string[] = [];
    const insertionDetails: NLPInjectionResult['insertionDetails'] = [];
    const insertionCounts = new Map<Element, number>();

    let termsToInject = [...initialAnalysis.missingTerms];
    
    if (prioritizeCritical) {
        termsToInject.sort((a, b) => {
            if ((a.importance || 50) >= 80 && (b.importance || 50) < 80) return -1;
            if ((b.importance || 50) >= 80 && (a.importance || 50) < 80) return 1;
            return (b.importance || 50) - (a.importance || 50);
        });
    }

    let insertionCount = 0;
    
    for (const term of termsToInject) {
        if (insertionCount >= maxInsertions) break;
        
        const currentHtml = doc.body?.innerHTML || '';
        const currentAnalysis = analyzeNLPCoverage(currentHtml, neuronTerms);
        if (currentAnalysis.score >= targetCoverage) break;
        
        // Find suitable paragraphs
        const paragraphs = Array.from(doc.querySelectorAll('p, li, td'));
        const termLower = term.term.toLowerCase();
        const relatedTerms = getRelatedTerms(termLower);
        
        let inserted = false;
        
        for (const element of paragraphs) {
            const currentInsertions = insertionCounts.get(element) || 0;
            if (currentInsertions >= 2) continue;
            
            const text = element.textContent?.toLowerCase() || '';
            if (text.length < 80 || text.length > 600) continue;
            if (text.includes(termLower)) continue;
            
            // Check context score
            let contextScore = 0;
            for (const related of relatedTerms) {
                if (text.includes(related)) contextScore += 15;
            }
            
            if (contextScore < NLP_CONSTANTS.MIN_CONTEXT_SCORE) continue;
            
            // Insert term
            const categories = Object.keys(INJECTION_TEMPLATES) as Array<keyof typeof INJECTION_TEMPLATES>;
            const templateCategory = categories[Math.floor(Math.random() * categories.length)];
            const templates = INJECTION_TEMPLATES[templateCategory];
            const template = templates[Math.floor(Math.random() * templates.length)];
            
            const insertionText = template.replace('{term}', `<strong>${term.term}</strong>`);
            element.innerHTML = `${element.innerHTML.trim()} ${insertionText}`;
            
            termsAdded.push(term.term);
            insertionCount++;
            insertionCounts.set(element, currentInsertions + 1);
            
            insertionDetails.push({
                term: term.term,
                location: element.tagName.toLowerCase() === 'li' ? 'list' : 'paragraph',
                template,
                contextScore,
            });
            
            inserted = true;
            break;
        }
        
        if (!inserted) {
            termsFailed.push(term.term);
        }
    }

    const finalHtml = doc.body?.innerHTML || html;
    const finalAnalysis = analyzeNLPCoverage(finalHtml, neuronTerms);

    return {
        html: finalHtml,
        termsAdded,
        termsFailed,
        initialCoverage: initialAnalysis.score,
        finalCoverage: finalAnalysis.score,
        insertionDetails,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 JSON EXTRACTION & AGGRESSIVE HEALING
// ═══════════════════════════════════════════════════════════════════════════════

export function extractJSON(text: string): any {
    if (!text || typeof text !== 'string') {
        throw new Error('Empty or invalid response');
    }
    
    let s = text.trim();
    
    // Remove markdown code blocks
    s = s.replace(/^```(?:json)?\s*/gi, '').replace(/\s*```$/gi, '').trim();
    
    if (s.length < 100) {
        throw new Error(`Response too short: ${s.length} characters`);
    }
    
    // ATTEMPT 1: Direct parse
    try {
        const parsed = JSON.parse(s);
        if (parsed?.htmlContent) return parsed;
    } catch {}
    
    // ATTEMPT 2: Find JSON object boundaries
    const jsonStart = s.indexOf('{');
    if (jsonStart === -1) {
        throw new Error('No JSON object found in response');
    }
    
    let json = s.substring(jsonStart);
    
    // Find matching closing brace
    let depth = 0;
    let inString = false;
    let escaped = false;
    let endIndex = -1;
    
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (char === '"' && !escaped) { inString = !inString; continue; }
        
        if (!inString) {
            if (char === '{') depth++;
            if (char === '}') {
                depth--;
                if (depth === 0) { endIndex = i + 1; break; }
            }
        }
    }
    
    if (endIndex > 0) {
        json = json.substring(0, endIndex);
    }
    
    // ATTEMPT 3: Parse extracted JSON
    try {
        return JSON.parse(json);
    } catch {}
    
    // ATTEMPT 4: AGGRESSIVE HEALING
    let healed = json;
    
    // Try to recover FAQs from truncated content
    let recoveredFaqs: Array<{question: string; answer: string}> = [];
    try {
        const faqsMatch = healed.match(/"faqs"\s*:\s*\[([\s\S]*?)\]/);
        if (faqsMatch && faqsMatch[1]) {
            const faqContent = '[' + faqsMatch[1] + ']';
            recoveredFaqs = JSON.parse(faqContent);
        }
    } catch {}
    
    // Handle truncated htmlContent
    const htmlContentMatch = healed.match(/"htmlContent"\s*:\s*"/);
    if (htmlContentMatch) {
        const htmlStart = htmlContentMatch.index! + htmlContentMatch[0].length;
        
        let htmlEnd = -1;
        let htmlEscaped = false;
        
        for (let i = htmlStart; i < healed.length; i++) {
            const char = healed[i];
            if (htmlEscaped) { htmlEscaped = false; continue; }
            if (char === '\\') { htmlEscaped = true; continue; }
            if (char === '"') {
                const after = healed.substring(i + 1, i + 10).trim();
                if (after.startsWith(',') || after.startsWith('}')) {
                    htmlEnd = i;
                    break;
                }
            }
        }
        
        if (htmlEnd === -1) {
            const safePoints = [
                healed.lastIndexOf('</p>'),
                healed.lastIndexOf('</div>'),
                healed.lastIndexOf('</section>'),
                healed.lastIndexOf('</h2>'),
                healed.lastIndexOf('</h3>'),
                healed.lastIndexOf('</ul>'),
                healed.lastIndexOf('</ol>'),
                healed.lastIndexOf('</table>'),
            ];
            
            const bestSafePoint = Math.max(...safePoints.filter(p => p > htmlStart));
            
            if (bestSafePoint > htmlStart) {
                const closeTagEnd = healed.indexOf('>', bestSafePoint) + 1;
                healed = healed.substring(0, closeTagEnd) + '",';
                healed += `"faqs":${JSON.stringify(recoveredFaqs)},"schema":{"@context":"https://schema.org","@graph":[]},"structureVerified":false}`;
                
                console.log('[JSON HEALER] Truncated htmlContent recovered at safe point');
            }
        }
    }
    
    // Standard healing
    healed = healed.replace(/,\s*}/g, '}');
    healed = healed.replace(/,\s*]/g, ']');
    healed = healed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    
    // Escape unescaped control characters
    healed = healed.replace(/[\x00-\x1F]/g, (match) => {
        const code = match.charCodeAt(0);
        if (code === 10) return '\\n';
        if (code === 13) return '\\r';
        if (code === 9) return '\\t';
        return '';
    });
    
    // Fix unbalanced brackets
    depth = 0;
    let brackets = 0;
    inString = false;
    escaped = false;
    
    for (let i = 0; i < healed.length; i++) {
        const char = healed[i];
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (char === '"' && !escaped) { inString = !inString; continue; }
        if (!inString) {
            if (char === '{') depth++;
            if (char === '}') depth--;
            if (char === '[') brackets++;
            if (char === ']') brackets--;
        }
    }
    
    if (inString) healed += '"';
    while (brackets > 0) { healed += ']'; brackets--; }
    while (depth > 0) { healed += '}'; depth--; }
    
    // ATTEMPT 5: Parse healed JSON
    try {
        const parsed = JSON.parse(healed);
        console.log('[JSON HEALER] Successfully healed truncated JSON');
        return parsed;
    } catch (e1: any) {
        // ATTEMPT 6: LAST RESORT — Extract manually
        try {
            const htmlMatch = json.match(/"htmlContent"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"faqs"|"\s*,\s*"schema"|"\s*})/);
            const titleMatch = json.match(/"title"\s*:\s*"([^"]+)"/);
            const excerptMatch = json.match(/"excerpt"\s*:\s*"([^"]+)"/);
            const metaMatch = json.match(/"metaDescription"\s*:\s*"([^"]+)"/);
            const slugMatch = json.match(/"slug"\s*:\s*"([^"]+)"/);
            
            if (htmlMatch && htmlMatch[1] && htmlMatch[1].length > 1000) {
                console.log('[JSON HEALER] LAST RESORT: Extracted htmlContent manually');
                
                return {
                    title: titleMatch?.[1] || 'Untitled',
                    excerpt: excerptMatch?.[1] || '',
                    metaDescription: metaMatch?.[1] || '',
                    slug: slugMatch?.[1] || 'untitled',
                    htmlContent: htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
                    faqs: recoveredFaqs,
                    schema: { "@context": "https://schema.org", "@graph": [] },
                    structureVerified: false
                };
            }
        } catch {}
        
        const preview = json.substring(0, 200) + '...' + json.substring(json.length - 200);
        throw new Error(`JSON parse failed after all healing attempts. Preview: ${preview}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 VISUAL COMPONENT VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

export function validateVisualComponents(html: string): VisualValidationResult {
    const found: Record<string, number> = {};
    const missing: string[] = [];
    
    const componentPatterns: Record<string, { pattern: RegExp; required: number; name: string }> = {
        quickAnswer: { pattern: /quick\s*answer|⚡.*answer/gi, required: 1, name: 'Quick Answer Box' },
        statsDashboard: { pattern: /grid-template-columns.*repeat.*auto-fit|stats-grid/gi, required: 1, name: 'Statistics Dashboard' },
        proTip: { pattern: /pro\s*tip|💡.*tip/gi, required: 3, name: 'Pro Tip Boxes' },
        warning: { pattern: /⚠️|important.*warning|warning.*important/gi, required: 2, name: 'Warning Boxes' },
        expertQuote: { pattern: /<blockquote[^>]*>.*<cite/gis, required: 2, name: 'Expert Blockquotes' },
        table: { 
            pattern: /<table[^>]*>/gi, 
            required: 2, 
            name: 'Comparison Tables' 
        },
        stepByStep: { 
            pattern: /step-by-step|step\s*1.*step\s*2/gis, 
            required: 1, 
            name: 'Step-by-Step Process' 
        },
        checklist: { 
            pattern: /checklist|✓.*✓.*✓/gis, 
            required: 2, 
            name: 'Checklists' 
        },
        keyTakeaways: { 
            pattern: /key\s*takeaway|🎯.*takeaway/gi, 
            required: 1, 
            name: 'Key Takeaways' 
        },
        cta: { 
            pattern: /ready\s*to\s*get\s*started|call.to.action|cta/gi, 
            required: 1, 
            name: 'CTA Box' 
        },
        definition: {
            pattern: /definition|📖.*definition/gi,
            required: 1,
            name: 'Definition Box'
        }
    };
    
    let totalRequired = 0;
    let totalFound = 0;
    
    for (const [key, config] of Object.entries(componentPatterns)) {
        const matches = html.match(config.pattern) || [];
        const count = matches.length;
        found[config.name] = count;
        totalRequired += config.required;
        totalFound += Math.min(count, config.required);
        
        if (count < config.required) {
            missing.push(`${config.name} (have ${count}, need ${config.required})`);
        }
    }
    
    const score = Math.round((totalFound / totalRequired) * 100);
    
    return {
        passed: missing.length === 0,
        score,
        missing,
        found
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 HUMAN WRITING VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

export function validateHumanWriting(text: string): HumanWritingValidation {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;
    
    const textLower = text.toLowerCase();
    
    // Check for banned phrases
    for (const phrase of HUMAN_WRITING_PATTERNS.bannedPhrases) {
        if (textLower.includes(phrase.toLowerCase())) {
            issues.push(`Contains AI-detectable phrase: "${phrase}"`);
            score -= 5;
        }
    }
    
    // Check for contractions
    const noContractionPatterns = [
        { pattern: /\bdo not\b/gi, fix: "don't" },
        { pattern: /\bwill not\b/gi, fix: "won't" },
        { pattern: /\bcannot\b/gi, fix: "can't" },
        { pattern: /\bit is\b/gi, fix: "it's" },
        { pattern: /\bthey are\b/gi, fix: "they're" },
        { pattern: /\bwe are\b/gi, fix: "we're" },
        { pattern: /\byou are\b/gi, fix: "you're" },
        { pattern: /\bi am\b/gi, fix: "I'm" },
    ];
    
    for (const { pattern, fix } of noContractionPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 2) {
            issues.push(`Overuse of formal form (use "${fix}" instead)`);
            suggestions.push(`Replace "${pattern.source.replace(/\\b/g, '')}" with "${fix}"`);
            score -= 3;
        }
    }
    
    // Check sentence variety
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
        const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
        
        if (avgLength > 25) {
            issues.push('Sentences too long on average (avg: ' + avgLength.toFixed(1) + ' words)');
            suggestions.push('Break up long sentences for better readability');
            score -= 15;
        } else if (avgLength > 20) {
            issues.push('Sentences slightly long on average');
            suggestions.push('Consider varying sentence length more');
            score -= 8;
        }
        
        // Check sentence length variance
        const lengths = sentences.map(s => s.split(/\s+/).length);
        const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev < 5) {
            issues.push('Sentences too uniform in length');
            suggestions.push('Mix short punchy sentences with longer explanations');
            score -= 10;
        }
    }
    
    // Check for "you" usage
    const youCount = (text.match(/\byou\b|\byour\b/gi) || []).length;
    const wordCount = text.split(/\s+/).length;
    const youDensity = (youCount / wordCount) * 100;
    
    if (youDensity < 0.5) {
        issues.push('Not enough "you" - content feels impersonal');
        suggestions.push('Address reader directly with "you" and "your" more often');
        score -= 15;
    } else if (youDensity < 1) {
        issues.push('Could use more "you" for better engagement');
        suggestions.push('Add more direct reader address');
        score -= 5;
    }
    
    // Check for rhetorical questions
    const questionCount = (text.match(/\?/g) || []).length;
    const questionDensity = (questionCount / sentences.length) * 100;
    
    if (questionDensity < 3) {
        issues.push('Missing rhetorical questions for engagement');
        suggestions.push('Add questions like "Sound familiar?" or "Make sense?"');
        score -= 5;
    }
    
    // Check for sentence starters variety
    const startsWithThe = (text.match(/^\s*the\s/gim) || []).length;
    const startsWithThis = (text.match(/^\s*this\s/gim) || []).length;
    const startsWithIt = (text.match(/^\s*it\s/gim) || []).length;
    
    const boringStarts = startsWithThe + startsWithThis + startsWithIt;
    const boringStartsPercent = (boringStarts / sentences.length) * 100;
    
    if (boringStartsPercent > 30) {
        issues.push('Too many sentences start with "The", "This", or "It"');
        suggestions.push('Start sentences with action verbs, "And", "But", or conversational phrases');
        score -= 10;
    }
    
    // Check for passive voice overuse
    const passivePatterns = [
        /\bwas\s+\w+ed\b/gi,
        /\bwere\s+\w+ed\b/gi,
        /\bbeen\s+\w+ed\b/gi,
        /\bis\s+being\s+\w+ed\b/gi,
    ];
    
    let passiveCount = 0;
    for (const pattern of passivePatterns) {
        passiveCount += (text.match(pattern) || []).length;
    }
    
    const passivePercent = (passiveCount / sentences.length) * 100;
    if (passivePercent > 15) {
        issues.push('Too much passive voice detected');
        suggestions.push('Rewrite passive sentences to active voice');
        score -= 10;
    }
    
    return {
        score: Math.max(0, Math.min(100, score)),
        issues,
        suggestions
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI PROVIDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function generateWithGemini(
    apiKey: string, 
    model: string, 
    systemPrompt: string, 
    userPrompt: string, 
    temperature: number = 0.85
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { 
            systemInstruction: systemPrompt, 
            responseMimeType: 'application/json', 
            temperature, 
            topP: 0.95, 
            maxOutputTokens: 65536 
        }
    });
    
    const text = response.text;
    if (!text || text.length < 100) {
        throw new Error('Empty or too short response from Gemini');
    }
    
    return text;
}

async function generateWithOpenRouter(
    apiKey: string, 
    model: string, 
    systemPrompt: string, 
    userPrompt: string, 
    temperature: number = 0.85
): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.OPENROUTER_REQUEST);
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${apiKey}`, 
                'Content-Type': 'application/json', 
                'HTTP-Referer': 'https://wp-optimizer-pro.app', 
                'X-Title': `WP Optimizer Pro v${AI_ORCHESTRATOR_VERSION}` 
            },
            body: JSON.stringify({ 
                model, 
                messages: [
                    { role: 'system', content: systemPrompt }, 
                    { role: 'user', content: userPrompt }
                ], 
                max_tokens: 100000,
                temperature,
                ...(model.includes('gpt') || model.includes('claude') ? { response_format: { type: 'json_object' } } : {})
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            
            if (response.status === 429) {
                throw new Error(`Rate limited by OpenRouter. Please wait and try again.`);
            }
            if (response.status === 503) {
                throw new Error(`OpenRouter service unavailable. Model may be overloaded.`);
            }
            if (response.status === 400 && errorText.includes('context_length')) {
                throw new Error(`Content too long for model. Try a shorter prompt.`);
            }
            
            throw new Error(`OpenRouter error ${response.status}: ${errorText.substring(0, 500)}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`OpenRouter API error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('No content in OpenRouter response');
        }
        
        if (content.length < 500) {
            throw new Error(`Response too short: ${content.length} chars. Model may have refused or truncated.`);
        }
        
        console.log(`[OpenRouter] Received ${content.length.toLocaleString()} chars from ${model}`);
        
        return content;
        
    } catch (e: any) {
        clearTimeout(timeoutId);
        
        if (e.name === 'AbortError') {
            throw new Error('OpenRouter request timed out after 5 minutes');
        }
        
        throw e;
    }
}

async function generateWithOpenAI(
    apiKey: string, 
    systemPrompt: string, 
    userPrompt: string, 
    temperature: number = 0.85
): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            model: 'gpt-4o', 
            messages: [
                { role: 'system', content: systemPrompt }, 
                { role: 'user', content: userPrompt }
            ], 
            response_format: { type: 'json_object' }, 
            max_tokens: 16000, 
            temperature 
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

async function generateWithAnthropic(
    apiKey: string, 
    systemPrompt: string, 
    userPrompt: string, 
    temperature: number = 0.85
): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 
            'x-api-key': apiKey, 
            'anthropic-version': '2023-06-01', 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            model: 'claude-sonnet-4-20250514', 
            max_tokens: 16000, 
            system: systemPrompt, 
            messages: [
                { role: 'user', content: userPrompt + '\n\nOutput ONLY valid JSON.' }
            ], 
            temperature 
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    return data.content?.[0]?.text || '';
}

async function generateWithGroq(
    apiKey: string, 
    model: string, 
    systemPrompt: string, 
    userPrompt: string, 
    temperature: number = 0.85
): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            model: model || 'llama-3.3-70b-versatile', 
            messages: [
                { role: 'system', content: systemPrompt }, 
                { role: 'user', content: userPrompt }
            ], 
            response_format: { type: 'json_object' }, 
            max_tokens: 32000, 
            temperature 
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}



// Add this function definition in lib/ai-orchestrator.ts BEFORE line 2273:

function buildSystemPrompt(config: {
    ctx?: any;
    topic: string;
    mode: string;
    entityGapData?: any;
    neuronData?: any;
    existingAnalysis?: any;
    allFeedback?: string[];
    targetKeyword?: string;
    validatedReferences?: any[];
    internalLinks?: any[];
    geoConfig?: any;
    attemptNumber?: number;
}): string {
    // Return whatever prompt building logic you need
    return `Generate content about: ${config.topic}`;
}



// ═══════════════════════════════════════════════════════════════════════════════
// 🔥🔥🔥 MAIN AI ORCHESTRATOR CLASS v26.0
// ═══════════════════════════════════════════════════════════════════════════════

export class AIOrchestrator {
    
    /**
     * Standard single-shot generation
     */
    async generate(
        config: GenerateConfig,
        onProgress?: (msg: string) => void
    ): Promise<{ contract: ContentContract; groundingSources: any[] }> {
        const provider = config.provider || 'google';
        const temperature = config.temperature || 0.85;
        const hasNeuron = config.neuronData?.terms?.length;
        const targetWords = hasNeuron ? config.neuronData!.targetWordCount : CONTENT_CONSTANTS.DEFAULT_TARGET_WORDS;
        
        const systemPrompt = buildSystemPrompt({
            ctx: config.siteContext,
            topic: config.topic,
            mode: config.mode,
            entityGapData: config.entityGapData,
            neuronData: config.neuronData,
            existingAnalysis: config.existingAnalysis,
            allFeedback: config.allFeedback,
            targetKeyword: config.targetKeyword,
            validatedReferences: config.validatedReferences,
            internalLinks: config.internalLinks,
            geoConfig: config.geoConfig,
            attemptNumber: config.previousAttempts
        });

        const userPrompt = `Create a premium, comprehensive SEO article about: "${config.topic}"

🚨 CRITICAL REQUIREMENTS — READ CAREFULLY:

1️⃣ WORD COUNT: You MUST write AT LEAST ${targetWords} words. This is MANDATORY.
   • Current minimum: ${targetWords} words
   • Ideal length: ${targetWords + 500} words
   • Each H2 section: 400-600 words
   • Each H3: 150-250 words
   • DO NOT submit content under ${targetWords} words

2️⃣ CONTENT DEPTH:
   • ${Math.ceil(targetWords / 400)}+ main H2 sections required
   • 18+ H3 subheadings
   • Specific examples, statistics, and data points in EVERY section
   • NO filler content — every paragraph must add value

3️⃣ WRITING STYLE:
   • Alex Hormozi style — direct, punchy, human
   • Use contractions (don't, won't, you'll)
   • Short paragraphs (2-4 sentences)
   • Address reader as "you" constantly

4️⃣ STRUCTURE:
   • Premium visual components throughout (DARK backgrounds, LIGHT text)
   • NO H1 tags (WordPress provides title)
   • Current year: ${CONTENT_YEAR}
   ${hasNeuron ? '• 70%+ NLP term coverage from provided terms' : ''}
   • 7-10 FAQs with detailed answers (100-150 words each)
   • 8-15 authoritative references

⚠️ OUTPUT: Valid JSON only, no markdown. ENSURE ${targetWords}+ words.`;

        const promptTokens = estimateTokens(systemPrompt + userPrompt);
        onProgress?.(`🤖 ${provider.toUpperCase()} | ~${promptTokens.toLocaleString()} tokens`);

        const openRouterModel = config.apiKeys.openrouterModel || 'google/gemini-2.5-flash-preview';
        const groqModel = config.apiKeys.groqModel || 'llama-3.3-70b-versatile';
        const geminiModel = config.model || 'gemini-2.5-flash-preview-05-20';

        const providers: Record<string, { key: string; generate: () => Promise<string> }> = {
            'google': { 
                key: config.apiKeys.google, 
                generate: () => generateWithGemini(config.apiKeys.google, geminiModel, systemPrompt, userPrompt, temperature) 
            },
            'openrouter': { 
                key: config.apiKeys.openrouter, 
                generate: () => generateWithOpenRouter(config.apiKeys.openrouter, openRouterModel, systemPrompt, userPrompt, temperature) 
            },
            'anthropic': { 
                key: config.apiKeys.anthropic, 
                generate: () => generateWithAnthropic(config.apiKeys.anthropic, systemPrompt, userPrompt, temperature) 
            },
            'openai': { 
                key: config.apiKeys.openai, 
                generate: () => generateWithOpenAI(config.apiKeys.openai, systemPrompt, userPrompt, temperature) 
            },
            'groq': { 
                key: config.apiKeys.groq, 
                generate: () => generateWithGroq(config.apiKeys.groq, groqModel, systemPrompt, userPrompt, temperature) 
            }
        };

        const selectedProvider = providers[provider];
        if (!selectedProvider?.key) {
            throw new Error(`Provider "${provider}" is not configured`);
        }

        let rawResponse: string | null = null;
        let lastError = new Error('Generation failed');

        // Calculate adaptive timeout
        const calculateTimeout = (targetWords: number): number => {
            const baseTimeout = TIMEOUTS.BASE_GENERATION;
            const wordsPerMinute = 1500;
            const calculatedTimeout = Math.ceil((targetWords / wordsPerMinute) * 60 * 1000);
            return Math.max(baseTimeout, Math.min(calculatedTimeout * 1.5, TIMEOUTS.MAX_GENERATION));
        };
        
        const timeoutMs = calculateTimeout(targetWords);

        for (let attempt = 0; attempt < 4; attempt++) {
            try {
                onProgress?.(`   → Generating${attempt > 0 ? ` (retry ${attempt}/3)` : ''}...`);
                
                const attemptTimeout = timeoutMs * (1 + attempt * 0.5);
                
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error(`Generation timeout after ${Math.round(attemptTimeout / 1000)}s`)), attemptTimeout);
                });
                
                rawResponse = await Promise.race([
                    selectedProvider.generate(),
                    timeoutPromise
                ]);

                if (rawResponse && rawResponse.length > 500) {
                    onProgress?.(`   ✓ Received ${rawResponse.length.toLocaleString()} chars`);
                    
                    if (rawResponse.includes('"htmlContent"') && rawResponse.includes('"title"')) {
                        break;
                    } else {
                        onProgress?.(`   ⚠️ Response missing required fields, retrying...`);
                        lastError = new Error('Response missing required JSON fields');
                        continue;
                    }
                }
            } catch (e: any) {
                lastError = e;
                onProgress?.(`   ✗ Attempt ${attempt + 1}/4 failed: ${e.message.substring(0, 100)}`);
                
                if (attempt < 3) {
                    const baseDelay = TIMEOUTS.RETRY_BASE_DELAY;
                    const exponentialDelay = baseDelay * Math.pow(2, attempt);
                    const jitter = Math.random() * 1000;
                    const totalDelay = exponentialDelay + jitter;
                    
                    onProgress?.(`   ⏳ Waiting ${Math.round(totalDelay / 1000)}s before retry...`);
                    await new Promise(r => setTimeout(r, totalDelay));
                }
            }
        }

        if (!rawResponse || rawResponse.length < 500) {
            throw new Error(`${provider} generation failed: ${lastError?.message || 'No response received'}`);
        }

        onProgress?.(`📋 Parsing JSON (${rawResponse.length.toLocaleString()} chars)...`);
        
        // Pre-validation
        const hasTitle = rawResponse.includes('"title"');
        const hasHtmlContent = rawResponse.includes('"htmlContent"');
        const hasClosingBrace = rawResponse.lastIndexOf('}') > rawResponse.length * 0.9;
        
        if (!hasTitle || !hasHtmlContent) {
            onProgress?.(`   ⚠️ Response missing required fields - attempting recovery...`);
        }
        
        if (!hasClosingBrace) {
            onProgress?.(`   ⚠️ Response may be truncated - will attempt healing...`);
        }
        
        let _parsedContract;
        try {
            _parsedContract = extractJSON(rawResponse);
        } catch (parseError: any) {
            onProgress?.(`   ❌ JSON parse failed: ${parseError.message.substring(0, 100)}`);
            
            // Emergency recovery
            const titleMatch = rawResponse.match(/"title"\s*:\s*"([^"]+)"/);
            const htmlMatch = rawResponse.match(/"htmlContent"\s*:\s*"([\s\S]{1000,})(?="\s*[,}])/);
            
            if (titleMatch && htmlMatch) {
                onProgress?.(`   🔧 Emergency recovery: Extracted title and ${htmlMatch[1].length} chars of content`);
                _parsedContract = {
                    title: titleMatch[1],
                    excerpt: '',
                    metaDescription: '',
                    slug: titleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
                    htmlContent: htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
                    faqs: [],
                    schema: { "@context": "https://schema.org", "@graph": [] },
                    structureVerified: false
                };
            } else {
                throw parseError;
            }
        }
        
        // Create mutable deep copy
        let contract: ContentContract = JSON.parse(JSON.stringify(_parsedContract));
        
        if (!contract.htmlContent) throw new Error('Missing htmlContent');
        if (contract.htmlContent.length < 2000) throw new Error('Content too short');

        // Remove H1 tags
        const h1CountBefore = (contract.htmlContent.match(/<h1/gi) || []).length;
        contract.htmlContent = removeAllH1Tags(contract.htmlContent, onProgress);
        if (h1CountBefore > 0) {
            onProgress?.(`   ✓ Removed ${h1CountBefore} H1 tag(s)`);
        }

        // Calculate word count
        const doc = new DOMParser().parseFromString(contract.htmlContent, 'text/html');
        contract.wordCount = (doc.body?.textContent || '').split(/\s+/).filter(Boolean).length;
        
        onProgress?.(`   ✓ ${contract.wordCount.toLocaleString()} words | ${contract.faqs?.length || 0} FAQs`);

        // Optimize title & meta
        contract = optimizeTitleAndMeta(contract, config.topic);

        return { contract, groundingSources: contract.groundingSources || [] };
    }

    /**
     * 🔥 SOTA ENHANCED: Full pipeline with all improvements
     */
    async generateEnhanced(
        config: GenerateConfig & {
            useStagedPipeline?: boolean;
            useSERPGenerators?: boolean;
            useNLPInjector?: boolean;
            targetNLPCoverage?: number;
        },
        onProgress?: (msg: string) => void,
        onStageProgress?: (progress: StageProgress) => void
    ): Promise<{ contract: ContentContract; groundingSources: any[] }> {
        const {
            useSERPGenerators = true,
            useNLPInjector = true,
            targetNLPCoverage = NLP_CONSTANTS.DEFAULT_TARGET_COVERAGE,
        } = config;

        // Generate base content
        onProgress?.('🚀 Generating optimized content...');
        const result = await this.generate(config, onProgress);
        
        // Create mutable deep copy
        let contract: ContentContract = JSON.parse(JSON.stringify(result.contract));

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎬 YOUTUBE VIDEO INTEGRATION
        // ═══════════════════════════════════════════════════════════════════════════
        try {
            onProgress?.('🎬 Searching for relevant YouTube video...');
            const youtubeEmbed = await findAndEmbedYouTubeVideo(
                config.topic,
                config.apiKeys.serper || null,
                null,
                onProgress
            );
            
            if (youtubeEmbed && youtubeEmbed.includes('iframe')) {
                // Find insertion point after first H2
                const h2Matches = [...contract.htmlContent.matchAll(/<\/h2>/gi)];
                if (h2Matches.length >= 2 && h2Matches[1].index !== undefined) {
                    const insertPos = h2Matches[1].index + 5;
                    contract.htmlContent = 
                        contract.htmlContent.slice(0, insertPos) + 
                        '\n\n' + youtubeEmbed + '\n\n' + 
                        contract.htmlContent.slice(insertPos);
                    onProgress?.('   ✅ YouTube video embedded after second H2');
                } else {
                    // Insert after Quick Answer if no suitable H2 position
                    const quickAnswerEnd = contract.htmlContent.toLowerCase().indexOf('</div>', 
                        contract.htmlContent.toLowerCase().indexOf('quick answer'));
                    if (quickAnswerEnd > 0) {
                        const insertPos = quickAnswerEnd + 6;
                        contract.htmlContent = 
                            contract.htmlContent.slice(0, insertPos) + 
                            '\n\n' + youtubeEmbed + '\n\n' + 
                            contract.htmlContent.slice(insertPos);
                        onProgress?.('   ✅ YouTube video embedded after Quick Answer');
                    }
                }
            }
        } catch (e: any) {
            onProgress?.(`   ⚠️ YouTube integration skipped: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // 🧬 NLP TERM INJECTION
        // ═══════════════════════════════════════════════════════════════════════════
        if (useNLPInjector && config.neuronData?.terms?.length) {
            try {
                onProgress?.('🧬 Optimizing NLP coverage...');
                
                const initialAnalysis = analyzeNLPCoverage(contract.htmlContent, config.neuronData.terms);
                onProgress?.(`   → Initial coverage: ${initialAnalysis.score}%`);
                
                if (initialAnalysis.score < targetNLPCoverage) {
                    const injectionResult = injectMissingNLPTerms(
                        contract.htmlContent,
                        config.neuronData.terms,
                        { 
                            targetCoverage: targetNLPCoverage, 
                            maxInsertions: NLP_CONSTANTS.MAX_INJECTIONS 
                        }
                    );
                    
                    contract.htmlContent = injectionResult.html;
                    onProgress?.(`   ✅ NLP coverage: ${injectionResult.initialCoverage}% → ${injectionResult.finalCoverage}%`);
                    
                    if (injectionResult.termsAdded.length > 0) {
                        onProgress?.(`   → Added ${injectionResult.termsAdded.length} terms: ${injectionResult.termsAdded.slice(0, 5).join(', ')}${injectionResult.termsAdded.length > 5 ? '...' : ''}`);
                    }
                } else {
                    onProgress?.(`   ✅ NLP coverage already sufficient: ${initialAnalysis.score}%`);
                }
            } catch (e: any) {
                onProgress?.(`   ⚠️ NLP injection skipped: ${e.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // 🔗 INTERNAL LINK INJECTION
        // ═══════════════════════════════════════════════════════════════════════════
        if (config.internalLinks && config.internalLinks.length > 0) {
            try {
                onProgress?.('🔗 Injecting internal links with rich anchor text...');
                
                const currentUrl = config.siteContext?.url || '';
                
                const linkResult = injectInternalLinks(
                    contract.htmlContent,
                    config.internalLinks,
                    currentUrl,
                    {
                        minLinks: LINK_CONSTANTS.DEFAULT_MIN_LINKS,
                        maxLinks: LINK_CONSTANTS.DEFAULT_MAX_LINKS,
                        minRelevance: 0.55,
                        minDistanceBetweenLinks: LINK_CONSTANTS.MIN_DISTANCE_CHARS,
                        maxLinksPerSection: LINK_CONSTANTS.MAX_LINKS_PER_SECTION,
                    }
                );
                
                contract.htmlContent = linkResult.html;
                contract.internalLinks = linkResult.linksAdded;
                
                onProgress?.(`   ✅ Added ${linkResult.linksAdded.length} internal links`);
                
                // Log details for each link
                linkResult.linksAdded.slice(0, 5).forEach((link, i) => {
                    onProgress?.(`      ${i + 1}. "${link.anchorText}" → ${link.url.substring(0, 50)}...`);
                });
                
                if (linkResult.linksAdded.length > 5) {
                    onProgress?.(`      ... and ${linkResult.linksAdded.length - 5} more`);
                }
                
                // Warn if below minimum
                if (linkResult.linksAdded.length < LINK_CONSTANTS.DEFAULT_MIN_LINKS) {
                    onProgress?.(`   ⚠️ WARNING: Only ${linkResult.linksAdded.length} links added (target: ${LINK_CONSTANTS.DEFAULT_MIN_LINKS}+)`);
                }
            } catch (e: any) {
                onProgress?.(`   ⚠️ Internal links skipped: ${e.message}`);
            }
        } else {
            onProgress?.('   ⚠️ No internal link targets provided — skipping link injection');
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎨 FAQ UPGRADE TO CSS-ONLY ACCORDION
        // ═══════════════════════════════════════════════════════════════════════════
        if (contract.faqs && contract.faqs.length > 0) {
            try {
                onProgress?.('🎨 Upgrading FAQ to CSS-only accordion...');
                contract.htmlContent = upgradeFAQSection(contract.htmlContent, contract.faqs, onProgress);
                onProgress?.(`   ✅ FAQ upgraded with ${contract.faqs.length} questions (WordPress CSP compatible)`);
            } catch (e: any) {
                onProgress?.(`   ⚠️ FAQ upgrade skipped: ${e.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // 📚 REFERENCES SECTION
        // ═══════════════════════════════════════════════════════════════════════════
        if (config.validatedReferences?.length) {
            try {
                const hasRefs = contract.htmlContent.toLowerCase().includes('references') || 
                               contract.htmlContent.toLowerCase().includes('sources');
                
                if (!hasRefs) {
                    onProgress?.('📚 Adding references section...');
                    const refsHtml = generateReferencesSection(config.validatedReferences);
                    contract.htmlContent += '\n\n' + refsHtml;
                    onProgress?.(`   ✅ Added references section with ${config.validatedReferences.length} sources`);
                }
            } catch (e: any) {
                onProgress?.(`   ⚠️ References section skipped: ${e.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // 🔧 FINAL OPTIMIZATIONS
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Final title & meta optimization
        contract = optimizeTitleAndMeta(contract, config.topic);
        
        // Final H1 removal (ensure clean)
        contract.htmlContent = removeAllH1Tags(contract.htmlContent, onProgress);
        
        // Remove duplicate FAQ sections
        contract.htmlContent = removeDuplicateFAQSections(contract.htmlContent, onProgress);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 📊 VALIDATION & STATS
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Recalculate word count
        const doc = new DOMParser().parseFromString(contract.htmlContent, 'text/html');
        contract.wordCount = (doc.body?.textContent || '').split(/\s+/).filter(Boolean).length;
        
        // Visual component validation
        const visualValidation = validateVisualComponents(contract.htmlContent);
        if (!visualValidation.passed) {
            onProgress?.(`   ⚠️ Visual component check: ${visualValidation.score}%`);
            if (visualValidation.missing.length > 0) {
                onProgress?.(`   → Missing: ${visualValidation.missing.slice(0, 3).join(', ')}`);
            }
        } else {
            onProgress?.(`   ✅ Visual components: ${visualValidation.score}% complete`);
        }
        
        // Human writing validation
        const humanCheck = validateHumanWriting(doc.body?.textContent || '');
        if (humanCheck.score < 80) {
            onProgress?.(`   ⚠️ Human writing score: ${humanCheck.score}%`);
            if (humanCheck.issues.length > 0) {
                humanCheck.issues.slice(0, 2).forEach(issue => {
                    onProgress?.(`      - ${issue}`);
                });
            }
        } else {
            onProgress?.(`   ✅ Human writing score: ${humanCheck.score}%`);
        }
        
        // Structure validation
        const h1Count = (contract.htmlContent.match(/<h1/gi) || []).length;
        const h2Count = (contract.htmlContent.match(/<h2/gi) || []).length;
        const h3Count = (contract.htmlContent.match(/<h3/gi) || []).length;
        
        if (h1Count > 0) {
            onProgress?.(`   ❌ WARNING: ${h1Count} H1 tag(s) still present`);
        }
        
        onProgress?.(`📊 Final Stats: ${contract.wordCount.toLocaleString()} words | ${h2Count} H2s | ${h3Count} H3s | ${contract.faqs?.length || 0} FAQs`);

        return { contract, groundingSources: contract.groundingSources || [] };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TITLE & META OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════════

export function optimizeTitleAndMeta(
    contract: ContentContract,
    topic: string
): ContentContract {
    const optimized = { ...contract };
    const addYear = shouldIncludeYearInTitle(topic);
    
    // Title optimization
    let title = optimized.title || topic;
    title = updateExistingYear(title);
    
    const hasYear = /\b202[0-9]\b/.test(title);
    
    if (!hasYear && addYear && title.length < 52) {
        if (title.includes(':')) {
            const colonIndex = title.indexOf(':');
            if (colonIndex < 30) {
                title = title.slice(0, colonIndex) + ` ${CONTENT_YEAR}` + title.slice(colonIndex);
            } else {
                title = title + ` (${CONTENT_YEAR})`;
            }
        } else {
            title = title + ` | ${CONTENT_YEAR}`;
        }
    }
    
    if (title.length > 65) {
        title = title
            .replace(' | Complete Guide', '')
            .replace(' | Ultimate Guide', '')
            .replace(' - Complete Guide', '');
        
        if (title.length > 65) {
            title = title.substring(0, 62) + '...';
        }
    }
    
    optimized.title = title;
    
    // Meta description optimization
    let meta = optimized.metaDescription || `Discover everything about ${topic}. Expert insights and comprehensive information.`;
    meta = updateExistingYear(meta);
    
    const metaHasYear = /\b202[0-9]\b/.test(meta);
    
    if (!metaHasYear && addYear && meta.length < 140) {
        meta = meta.replace(/\.$/, '') + `. Updated for ${CONTENT_YEAR}.`;
    }
    
    if (meta.length > 160) {
        meta = meta.substring(0, 157) + '...';
    }
    
    optimized.metaDescription = meta;
    optimized.excerpt = meta.substring(0, 155);
    
    // Slug optimization
    let slug = optimized.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    slug = updateExistingYear(slug);
    
    const slugHasYear = /202[0-9]/.test(slug);
    
    if (!slugHasYear && addYear && slug.length < 60) {
        slug = slug + `-${CONTENT_YEAR}`;
    }
    
    slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
    
    optimized.slug = slug;
    
    return optimized;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 FAQ DUPLICATE DETECTOR & REMOVER
// ═══════════════════════════════════════════════════════════════════════════════

export function removeDuplicateFAQSections(html: string, log?: (msg: string) => void): string {
    if (!html) return html;
    
    const faqSectionPattern = /<section[^>]*(?:class|id)="[^"]*(?:faq|wp-opt-faq)[^"]*"[^>]*>[\s\S]*?<\/section>/gi;
    const allFaqSections = [...html.matchAll(faqSectionPattern)];
    
    if (allFaqSections.length <= 1) {
        log?.(`   ✓ FAQ sections: ${allFaqSections.length} (no duplicates)`);
        return html;
    }
    
    log?.(`   ⚠️ Found ${allFaqSections.length} FAQ sections — removing ${allFaqSections.length - 1} duplicate(s)...`);
    
    let cleaned = html;
    
    // Keep only the last FAQ section (usually the best quality)
    for (let i = 0; i < allFaqSections.length - 1; i++) {
        cleaned = cleaned.replace(allFaqSections[i][0], '<!-- DUPLICATE_FAQ_REMOVED -->');
    }
    
    // Clean up placeholders
    cleaned = cleaned.replace(/<!-- DUPLICATE_FAQ_REMOVED -->\s*/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    
    log?.(`   ✓ Removed ${allFaqSections.length - 1} duplicate FAQ section(s)`);
    
    return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 PREMIUM FAQ UPGRADE
// ═══════════════════════════════════════════════════════════════════════════════

export function upgradeFAQSection(
    htmlContent: string, 
    faqs: Array<{ question: string; answer: string }>,
    log?: (msg: string) => void
): string {
    if (!htmlContent) return htmlContent;
    if (!faqs || faqs.length === 0) {
        log?.('   ⚠️ No FAQs provided — skipping FAQ upgrade');
        return htmlContent;
    }
    
    // Detect existing FAQ sections
    let existingFaqCount = 0;
    let hasPremiumFaq = false;
    
    for (const pattern of FAQ_DETECTION_PATTERNS) {
        const matches = htmlContent.match(pattern);
        if (matches) {
            existingFaqCount += matches.length;
            for (const match of matches) {
                if (match.includes('linear-gradient') && match.includes('border-radius')) {
                    hasPremiumFaq = true;
                }
            }
        }
    }
    
    log?.(`   📊 Existing FAQs: ${existingFaqCount} sections, Premium: ${hasPremiumFaq}`);
    
    // If premium FAQ already exists with enough questions, skip
    if (hasPremiumFaq) {
        const existingQuestionCount = (htmlContent.match(/class="faq-question"|class="faq-lbl"|faq-itm/gi) || []).length;
        
        if (existingQuestionCount >= faqs.length * 0.7) {
            log?.(`   ✓ Premium FAQ already exists with ${existingQuestionCount} questions — skipping`);
            return htmlContent;
        }
        
        log?.(`   → Existing premium FAQ only has ${existingQuestionCount} questions, will replace`);
    }
    
    // Remove all existing FAQ sections
    let cleaned = htmlContent;
    let removedCount = 0;
    
    for (const pattern of FAQ_DETECTION_PATTERNS) {
        const matches = cleaned.match(pattern);
        if (matches) {
            removedCount += matches.length;
            cleaned = cleaned.replace(pattern, '\n<!-- FAQ_SLOT -->\n');
        }
    }
    
    // Remove orphaned FAQ headings
    cleaned = cleaned.replace(
        /<h2[^>]*>[\s\S]*?(?:Frequently\s+Asked|FAQ)[\s\S]*?<\/h2>[\s\S]*?(?=<h2|<section|$)/gi,
        '\n<!-- FAQ_SLOT -->\n'
    );
    
    // Consolidate slots
    cleaned = cleaned.replace(/(<!-- FAQ_SLOT -->\s*)+/g, '<!-- FAQ_SLOT -->');
    
    if (removedCount > 0) {
        log?.(`   → Removed ${removedCount} existing FAQ section(s)`);
    }
    
    // Generate new premium FAQ
    const premiumFaqHtml = generateEnterpriseAccordionFAQ(faqs);
    
    // Insert at correct location
    if (cleaned.includes('<!-- FAQ_SLOT -->')) {
        cleaned = cleaned.replace('<!-- FAQ_SLOT -->', premiumFaqHtml);
        cleaned = cleaned.replace(/<!-- FAQ_SLOT -->/g, '');
        log?.(`   ✅ Inserted premium FAQ at placeholder position`);
        return cleaned.replace(/\n{3,}/g, '\n\n').trim();
    }
    
    // Before conclusion
    const conclusionPatterns = [
        /<h2[^>]*>[\s\S]*?(?:conclusion|summary|final\s+thoughts|wrapping\s+up)[\s\S]*?<\/h2>/i,
    ];
    
    for (const pattern of conclusionPatterns) {
        const match = cleaned.match(pattern);
        if (match && match.index !== undefined) {
            cleaned = cleaned.slice(0, match.index) + '\n\n' + premiumFaqHtml + '\n\n' + cleaned.slice(match.index);
            log?.(`   ✅ Inserted premium FAQ before conclusion`);
            return cleaned.replace(/\n{3,}/g, '\n\n').trim();
        }
    }
    
    // Before references
    const refsPattern = /<(?:section|div)[^>]*>[\s\S]*?(?:References|Sources|Citations)[\s\S]*?<\/(?:section|div)>/i;
    const refsMatch = cleaned.match(refsPattern);
    if (refsMatch && refsMatch.index !== undefined) {
        cleaned = cleaned.slice(0, refsMatch.index) + '\n\n' + premiumFaqHtml + '\n\n' + cleaned.slice(refsMatch.index);
        log?.(`   ✅ Inserted premium FAQ before references`);
        return cleaned.replace(/\n{3,}/g, '\n\n').trim();
    }
    
    // Before last H2
    const h2Matches = [...cleaned.matchAll(/<h2[^>]*>/gi)];
    if (h2Matches.length >= 2) {
        const lastH2 = h2Matches[h2Matches.length - 1];
        if (lastH2.index !== undefined) {
            cleaned = cleaned.slice(0, lastH2.index) + '\n\n' + premiumFaqHtml + '\n\n' + cleaned.slice(lastH2.index);
            log?.(`   ✅ Inserted premium FAQ before final H2`);
            return cleaned.replace(/\n{3,}/g, '\n\n').trim();
        }
    }
    
    // Fallback: Append at end
    cleaned = cleaned + '\n\n' + premiumFaqHtml;
    log?.(`   ✅ Appended premium FAQ at end of content`);
    
    return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ IMAGE ALT TEXT OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateOptimizedAltText(
    images: Array<{ src: string; alt: string }>,
    topic: string,
    apiKey: string
): Promise<Array<{ src: string; originalAlt: string; optimizedAlt: string }>> {
    if (!images || images.length === 0) return [];
    
    const results: Array<{ src: string; originalAlt: string; optimizedAlt: string }> = [];
    
    for (const img of images.slice(0, 10)) {
        const filename = img.src.split('/').pop()?.split('?')[0] || 'image';
        
        const optimizedAlt = img.alt && img.alt.length > 10 
            ? img.alt 
            : `${topic} - ${filename.replace(/[-_]/g, ' ').replace(/\.\w+$/, '')}`.substring(0, 125);
        
        results.push({
            src: img.src,
            originalAlt: img.alt,
            optimizedAlt
        });
    }
    
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const orchestrator = new AIOrchestrator();

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    // Version
    AI_ORCHESTRATOR_VERSION,
    CONTENT_YEAR,
    
    // Main class
    AIOrchestrator,
    orchestrator,
    
    // System prompt
    buildSystemPrompt,
    
    // Content generation helpers
    shouldIncludeYearInTitle,
    updateExistingYear,
    optimizeTitleAndMeta,
    
    // H1 handling
    removeAllH1Tags,
    
    // FAQ generation
    generateEnterpriseAccordionFAQ,
    upgradeFAQSection,
    removeDuplicateFAQSections,
    
    // References
    generateReferencesSection,
    
    // Key Takeaways
    generateKeyTakeawaysBox,
    
    // YouTube
    findAndEmbedYouTubeVideo,
    
    // NLP
    analyzeNLPCoverage,
    injectMissingNLPTerms,
    
    // Validation
    validateVisualComponents,
    validateHumanWriting,
    extractJSON,
    
    // Utilities
    estimateTokens,
    generateOptimizedAltText,
    
    // Constants
    VALID_GEMINI_MODELS,
    OPENROUTER_MODELS,
};
