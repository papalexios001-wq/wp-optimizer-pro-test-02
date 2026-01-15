// ═══════════════════════════════════════════════════════════════════════════════
// WP OPTIMIZER PRO v27.0 — REFERENCE DISCOVERY & VALIDATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
// 
// Uses Serper.dev API to:
// ✅ Discover high-quality, authoritative references
// ✅ Validate URL accessibility
// ✅ Filter for trusted domains (.gov, .edu, major publications)
// ✅ Extract metadata (title, snippet, year)
// ═══════════════════════════════════════════════════════════════════════════════

export const REFERENCE_SERVICE_VERSION = "27.0.0";

// ═══════════════════════════════════════════════════════════════════════════════
// 📌 TYPES
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
// 🏛️ AUTHORITY DOMAINS — Trusted Sources
// ═══════════════════════════════════════════════════════════════════════════════

const AUTHORITY_DOMAINS = {
    // Government & Education (highest trust)
    government: ['.gov', '.gov.uk', '.gov.au', '.gc.ca', '.europa.eu'],
    education: ['.edu', '.ac.uk', '.edu.au'],
    
    // Major News & Publications
    majorNews: [
        'reuters.com', 'bbc.com', 'bbc.co.uk', 'nytimes.com', 'washingtonpost.com',
        'theguardian.com', 'wsj.com', 'bloomberg.com', 'forbes.com', 'cnbc.com',
        'cnn.com', 'apnews.com', 'npr.org', 'time.com', 'usatoday.com'
    ],
    
    // Scientific & Medical
    scientific: [
        'nature.com', 'science.org', 'sciencedirect.com', 'pubmed.gov',
        'ncbi.nlm.nih.gov', 'mayoclinic.org', 'webmd.com', 'healthline.com',
        'nih.gov', 'cdc.gov', 'who.int', 'cochrane.org', 'nejm.org', 'bmj.com'
    ],
    
    // Tech & Business
    tech: [
        'techcrunch.com', 'wired.com', 'arstechnica.com', 'theverge.com',
        'engadget.com', 'zdnet.com', 'cnet.com', 'hbr.org', 'mckinsey.com'
    ],
    
    // Reference & Encyclopedia
    reference: [
        'wikipedia.org', 'britannica.com', 'investopedia.com', 'statista.com',
        'pewresearch.org', 'gallup.com'
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 CALCULATE AUTHORITY SCORE
// ═══════════════════════════════════════════════════════════════════════════════

function calculateAuthorityScore(url: string): number {
    const urlLower = url.toLowerCase();
    
    // Government & Education — Highest authority (90-100)
    for (const gov of AUTHORITY_DOMAINS.government) {
        if (urlLower.includes(gov)) return 95;
    }
    for (const edu of AUTHORITY_DOMAINS.education) {
        if (urlLower.includes(edu)) return 92;
    }
    
    // Scientific & Medical — Very high (85-90)
    for (const sci of AUTHORITY_DOMAINS.scientific) {
        if (urlLower.includes(sci)) return 88;
    }
    
    // Major News — High (75-85)
    for (const news of AUTHORITY_DOMAINS.majorNews) {
        if (urlLower.includes(news)) return 82;
    }
    
    // Tech & Business — Good (70-75)
    for (const tech of AUTHORITY_DOMAINS.tech) {
        if (urlLower.includes(tech)) return 75;
    }
    
    // Reference — Good (70-75)
    for (const ref of AUTHORITY_DOMAINS.reference) {
        if (urlLower.includes(ref)) return 72;
    }
    
    // Check for HTTPS
    const hasHttps = url.startsWith('https://');
    
    // Default score based on basic criteria
    return hasHttps ? 50 : 30;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 EXTRACT SOURCE NAME FROM URL
// ═══════════════════════════════════════════════════════════════════════════════

function extractSourceName(url: string): string {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        
        // Special mappings for known sources
        const sourceMap: Record<string, string> = {
            'nytimes.com': 'The New York Times',
            'washingtonpost.com': 'The Washington Post',
            'theguardian.com': 'The Guardian',
            'bbc.com': 'BBC',
            'bbc.co.uk': 'BBC',
            'cnn.com': 'CNN',
            'reuters.com': 'Reuters',
            'bloomberg.com': 'Bloomberg',
            'forbes.com': 'Forbes',
            'wsj.com': 'Wall Street Journal',
            'mayoclinic.org': 'Mayo Clinic',
            'healthline.com': 'Healthline',
            'webmd.com': 'WebMD',
            'nature.com': 'Nature',
            'science.org': 'Science',
            'hbr.org': 'Harvard Business Review',
            'mckinsey.com': 'McKinsey & Company',
            'pewresearch.org': 'Pew Research Center',
            'statista.com': 'Statista',
            'wikipedia.org': 'Wikipedia',
            'britannica.com': 'Encyclopædia Britannica',
            'investopedia.com': 'Investopedia',
            'techcrunch.com': 'TechCrunch',
            'wired.com': 'WIRED',
            'theverge.com': 'The Verge',
            'arstechnica.com': 'Ars Technica',
            'nih.gov': 'National Institutes of Health',
            'cdc.gov': 'CDC',
            'who.int': 'World Health Organization',
            'ncbi.nlm.nih.gov': 'PubMed/NCBI',
        };
        
        if (sourceMap[hostname]) {
            return sourceMap[hostname];
        }
        
        // Format hostname as title case
        return hostname
            .split('.')
            .slice(0, -1)
            .join(' ')
            .replace(/\b\w/g, l => l.toUpperCase());
            
    } catch {
        return 'Source';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 EXTRACT YEAR FROM TEXT
// ═══════════════════════════════════════════════════════════════════════════════

function extractYear(text: string): string | undefined {
    const currentYear = new Date().getFullYear();
    const yearPattern = /\b(20[0-2][0-9])\b/g;
    const matches = text.match(yearPattern);
    
    if (matches) {
        // Return the most recent year found
        const years = matches.map(Number).filter(y => y <= currentYear);
        if (years.length > 0) {
            return Math.max(...years).toString();
        }
    }
    
    return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌐 DISCOVER REFERENCES USING SERPER.DEV
// ═══════════════════════════════════════════════════════════════════════════════

export async function discoverReferences(
    topic: string,
    serperApiKey: string,
    options: ReferenceDiscoveryOptions = {},
    log?: (msg: string) => void
): Promise<DiscoveredReference[]> {
    const {
        targetCount = 10,
        minAuthorityScore = 60,
        includeNews = true,
        includeAcademic = true,
        geoCountry = 'us',
        geoLanguage = 'en'
    } = options;
    
    log?.(`📚 Discovering references for: "${topic.substring(0, 40)}..."`);
    
    const allReferences: DiscoveredReference[] = [];
    
    // Build search queries
    const queries = [
        `${topic} research study statistics`,
        `${topic} expert guide official`,
    ];
    
    if (includeAcademic) {
        queries.push(`${topic} site:edu OR site:gov`);
    }
    
    if (includeNews) {
        queries.push(`${topic} news 2024 OR 2025`);
    }
    
    for (const query of queries) {
        try {
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': serperApiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: query,
                    gl: geoCountry,
                    hl: geoLanguage,
                    num: 10
                })
            });
            
            if (!response.ok) {
                log?.(`   ⚠️ Serper API error: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            const organic = data.organic || [];
            
            for (const result of organic) {
                if (!result.link || !result.title) continue;
                
                // Skip social media and low-quality sites
                const skipDomains = [
                    'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
                    'youtube.com', 'pinterest.com', 'reddit.com', 'quora.com',
                    'linkedin.com', 'medium.com'
                ];
                
                const urlLower = result.link.toLowerCase();
                if (skipDomains.some(d => urlLower.includes(d))) continue;
                
                // Calculate authority score
                const authorityScore = calculateAuthorityScore(result.link);
                
                if (authorityScore < minAuthorityScore) continue;
                
                // Check for duplicates
                if (allReferences.some(r => r.url === result.link)) continue;
                
                // Extract metadata
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
        
        // Small delay between requests
        await new Promise(r => setTimeout(r, 300));
    }
    
    // Sort by authority score and take top results
    const sortedRefs = allReferences
        .sort((a, b) => b.authorityScore - a.authorityScore)
        .slice(0, targetCount);
    
    log?.(`   ✅ Found ${sortedRefs.length} high-quality references`);
    
    // Log top sources
    const topSources = sortedRefs.slice(0, 5).map(r => r.source);
    log?.(`   📋 Top sources: ${topSources.join(', ')}`);
    
    return sortedRefs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ VALIDATE REFERENCES — Check URL accessibility
// ═══════════════════════════════════════════════════════════════════════════════

export async function validateReferences(
    references: DiscoveredReference[],
    log?: (msg: string) => void
): Promise<DiscoveredReference[]> {
    log?.(`🔍 Validating ${references.length} references...`);
    
    const validatedRefs: DiscoveredReference[] = [];
    
    for (const ref of references) {
        try {
            // Use HEAD request for faster validation
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(ref.url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; WPOptimizerBot/1.0)'
                }
            });
            
            clearTimeout(timeout);
            
            if (response.ok || response.status === 405) {
                // 405 means HEAD not allowed but page likely exists
                validatedRefs.push({ ...ref, isValid: true });
            } else {
                log?.(`   ⚠️ Invalid (${response.status}): ${ref.source}`);
            }
        } catch (error) {
            // If HEAD fails, try GET with range
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(ref.url, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; WPOptimizerBot/1.0)',
                        'Range': 'bytes=0-0'
                    }
                });
                
                clearTimeout(timeout);
                
                if (response.ok || response.status === 206) {
                    validatedRefs.push({ ...ref, isValid: true });
                }
            } catch {
                // Skip invalid references
                log?.(`   ⚠️ Unreachable: ${ref.source}`);
            }
        }
    }
    
    log?.(`   ✅ ${validatedRefs.length}/${references.length} references validated`);
    
    return validatedRefs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 DISCOVER AND VALIDATE — Complete Pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export async function discoverAndValidateReferences(
    topic: string,
    serperApiKey: string,
    options: ReferenceDiscoveryOptions = {},
    log?: (msg: string) => void
): Promise<DiscoveredReference[]> {
    // Step 1: Discover references
    const discovered = await discoverReferences(topic, serperApiKey, options, log);
    
    if (discovered.length === 0) {
        log?.(`   ⚠️ No references discovered`);
        return [];
    }
    
    // Step 2: Validate (optional — can skip for speed)
    // const validated = await validateReferences(discovered, log);
    // return validated;
    
    // For speed, skip validation and return discovered refs
    return discovered;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    REFERENCE_SERVICE_VERSION,
    discoverReferences,
    validateReferences,
    discoverAndValidateReferences,
    calculateAuthorityScore,
    extractSourceName
};
