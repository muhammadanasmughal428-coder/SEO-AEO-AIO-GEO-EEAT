import * as cheerio from 'cheerio';
import type { CrawlResult } from './crawler.js';
import type { PageAuditReport, AuditFinding, TechnicalData, CategoryScore } from '../src/types.js';

export function analyzeHtml(crawl: CrawlResult): PageAuditReport {
  const $ = cheerio.load(crawl.html || '');
  const findings: AuditFinding[] = [];

  // 1. EXTRACT TECHNICAL DATA
  const title = $('title').first().text().trim() || undefined;
  const metaDescription = $('meta[name="description" i]').attr('content')?.trim() ||
    $('meta[property="og:description" i]').attr('content')?.trim() || undefined;
  const canonical = $('link[rel="canonical" i]').attr('href')?.trim() || undefined;
  const robotsMeta = $('meta[name="robots" i]').attr('content')?.trim() || undefined;
  const language = $('html').attr('lang')?.trim() || $('meta[http-equiv="content-language" i]').attr('content')?.trim();
  const viewport = $('meta[name="viewport" i]').attr('content')?.trim();

  // Headings
  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const h1Text = h1Elements.first().text().trim() || undefined;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  // Images
  const imgElements = $('img');
  const imagesCount = imgElements.length;
  let imagesMissingAlt = 0;
  imgElements.each((_, el) => {
    const alt = $(el).attr('alt');
    if (!alt || alt.trim().length === 0) {
      imagesMissingAlt++;
    }
  });

  // Links
  const domain = new URL(crawl.finalUrl).hostname.toLowerCase();
  let internalLinksCount = 0;
  let externalLinksCount = 0;
  let hasAboutPageLink = false;
  let hasContactInfo = false;
  let hasPrivacyPolicyLink = false;
  let hasTermsLink = false;
  let hasEditorialPolicy = false;

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    try {
      const resolved = new URL(href, crawl.finalUrl);
      if (resolved.hostname.toLowerCase() === domain) {
        internalLinksCount++;
      } else {
        externalLinksCount++;
      }

      const pathAndText = (resolved.pathname + ' ' + $(el).text()).toLowerCase();
      if (/about|about-us|team|who-we-are/i.test(pathAndText)) hasAboutPageLink = true;
      if (/contact|support|reach-us/i.test(pathAndText)) hasContactInfo = true;
      if (/privacy|privacy-policy/i.test(pathAndText)) hasPrivacyPolicyLink = true;
      if (/terms|terms-of-service|terms-and-conditions/i.test(pathAndText)) hasTermsLink = true;
      if (/editorial|editorial-standards|ethics/i.test(pathAndText)) hasEditorialPolicy = true;
    } catch {
      // Ignored malformed links
    }
  });

  // Text & Body Content
  $('script, style, noscript, svg').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const words = bodyText.split(/\s+/).filter(w => w.length > 0);
  const contentWordCount = words.length;

  // Contact info signals in body text
  if (!hasContactInfo) {
    if (/@|mailto:|tel:|\+\d{1,3}[- ]?\d{3,}/.test(crawl.html) || /contact us|get in touch/i.test(bodyText)) {
      hasContactInfo = true;
    }
  }

  // Open Graph
  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property');
    const val = $(el).attr('content');
    if (prop && val) openGraph[prop.toLowerCase()] = val;
  });

  // Twitter
  const twitterCards: Record<string, string> = {};
  $('meta[name^="twitter:"], meta[property^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const val = $(el).attr('content');
    if (name && val) twitterCards[name.toLowerCase()] = val;
  });

  // Structured Data (JSON-LD & Microdata)
  const jsonLdSchemas: Array<{ type?: string; snippet?: string }> = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (raw) {
        const parsed = JSON.parse(raw);
        const type = parsed['@type'] || (Array.isArray(parsed['@graph']) ? parsed['@graph'].map((g: any) => g['@type']).join(', ') : 'Unknown');
        jsonLdSchemas.push({ type: String(type), snippet: raw.slice(0, 300) });
      }
    } catch {
      jsonLdSchemas.push({ type: 'Malformed JSON-LD', snippet: $(el).html()?.slice(0, 150) });
    }
  });
  const hasSchemaOrg = jsonLdSchemas.length > 0 || $('[itemscope]').length > 0;

  // Security Headers
  const hsts = Boolean(crawl.headers['strict-transport-security']);
  const xContentTypeOptions = Boolean(crawl.headers['x-content-type-options']);
  const xFrameOptions = Boolean(crawl.headers['x-frame-options']);
  const contentSecurityPolicy = Boolean(crawl.headers['content-security-policy']);

  // FAQ & Direct Answers
  const faqIndicators = /faq|frequently asked questions/i.test(crawl.html);
  const jsonLdFaq = jsonLdSchemas.some(s => s.type?.toLowerCase().includes('faqpage'));
  const hasFaqSection = faqIndicators || jsonLdFaq;

  // Detect questions in headers
  const sampleQuestions: string[] = [];
  $('h1, h2, h3, h4, dt, strong').each((_, el) => {
    const text = $(el).text().trim();
    if (text.endsWith('?') || /^(what|how|why|when|where|who|can|is|are|do|does)\b/i.test(text)) {
      if (text.length > 10 && text.length < 150 && !sampleQuestions.includes(text)) {
        sampleQuestions.push(text);
      }
    }
  });

  // Author & Credentials
  const authorMeta = $('meta[name="author" i]').attr('content')?.trim();
  const authorInSchema = jsonLdSchemas.some(s => s.type?.toLowerCase().includes('person') || (s.snippet && s.snippet.toLowerCase().includes('"author"')));
  const authorInText = /author|written by|reviewed by|by [A-Z][a-z]+/i.test(bodyText);
  const hasAuthorBio = Boolean(authorMeta || authorInSchema || authorInText);

  // Entities detection
  const foundEntities: string[] = [];
  if (openGraph['og:site_name']) foundEntities.push(`Site: ${openGraph['og:site_name']}`);
  jsonLdSchemas.forEach(s => {
    if (s.type && s.type !== 'Unknown') foundEntities.push(`Schema Entity: ${s.type}`);
  });
  if (domain) foundEntities.push(`Domain Brand: ${domain.replace(/^www\./, '').split('.')[0].toUpperCase()}`);

  const technicalData: TechnicalData = {
    title,
    metaDescription,
    canonical,
    robotsMeta,
    hasRobotsTxt: Boolean(crawl.robotsTxt?.found),
    robotsTxtSnippet: crawl.robotsTxt?.content,
    hasSitemap: Boolean(crawl.sitemap?.found),
    sitemapSnippet: crawl.sitemap?.content,
    h1Count,
    h1Text,
    h2Count,
    h3Count,
    imagesCount,
    imagesMissingAlt,
    internalLinksCount,
    externalLinksCount,
    openGraph,
    twitterCards,
    jsonLdSchemas,
    hasSchemaOrg,
    language,
    viewport,
    securityHeaders: {
      hsts,
      xContentTypeOptions,
      xFrameOptions,
      contentSecurityPolicy
    },
    isHttps: crawl.isHttps,
    contentWordCount,
    hasFaqSection,
    hasAuthorBio,
    hasAboutPageLink,
    hasContactInfo,
    hasPrivacyPolicyLink,
    hasTermsLink,
    hasEditorialPolicy,
    foundEntities,
    sampleQuestions: sampleQuestions.slice(0, 6)
  };

  // 2. AUDIT CHECKS

  // --- A. SEO CHECKS ---
  // Status code
  if (crawl.status === 200) {
    findings.push({
      id: 'seo_http_status',
      category: 'SEO',
      title: 'HTTP Status 200 OK',
      status: 'PASS',
      scoreImpact: 10,
      evidence: `Server returned HTTP ${crawl.status} ${crawl.statusText} in ${crawl.responseTimeMs}ms`,
      recommendation: 'Target URL is accessible to search engines.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'seo_http_status',
      category: 'SEO',
      title: `HTTP Status ${crawl.status}`,
      status: 'CRITICAL',
      scoreImpact: -25,
      evidence: `Website responded with HTTP status code ${crawl.status} (${crawl.statusText})`,
      recommendation: 'Ensure the page returns a 200 OK response code to be indexed properly.',
      priority: 'high'
    });
  }

  // HTTPS
  if (crawl.isHttps) {
    findings.push({
      id: 'seo_https',
      category: 'SEO',
      title: 'HTTPS Secure Encryption',
      status: 'PASS',
      scoreImpact: 8,
      evidence: `Website is served securely over HTTPS protocol (${crawl.finalUrl}).`,
      recommendation: 'Maintain active TLS certificates and HSTS.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'seo_https',
      category: 'SEO',
      title: 'Missing HTTPS Encryption',
      status: 'CRITICAL',
      scoreImpact: -15,
      evidence: `URL is served over plain unencrypted HTTP (${crawl.finalUrl}).`,
      recommendation: 'Install an SSL/TLS certificate immediately and enforce HTTPS redirects.',
      priority: 'high'
    });
  }

  // Title tag
  if (title) {
    const len = title.length;
    if (len >= 25 && len <= 65) {
      findings.push({
        id: 'seo_title',
        category: 'SEO',
        title: 'Title Tag Optimal Length',
        status: 'PASS',
        scoreImpact: 10,
        evidence: `Found: "${title}" (${len} characters, optimal range 25-65 chars).`,
        recommendation: 'Keep keywords near the front and brand name at the end.',
        priority: 'low'
      });
    } else {
      findings.push({
        id: 'seo_title',
        category: 'SEO',
        title: len < 25 ? 'Title Tag Too Short' : 'Title Tag Truncation Risk',
        status: 'WARNING',
        scoreImpact: 5,
        evidence: `Found: "${title}" (${len} characters). Search engines recommend 30-60 characters.`,
        recommendation: len < 25 ? 'Add descriptive keywords to improve CTR.' : 'Shorten title to prevent SERP snippet clipping.',
        priority: 'medium'
      });
    }
  } else {
    findings.push({
      id: 'seo_title',
      category: 'SEO',
      title: 'Missing <title> Tag',
      status: 'CRITICAL',
      scoreImpact: -15,
      evidence: 'No <title> tag found in HTML document head.',
      recommendation: 'Add a distinct, descriptive <title> tag between 30 and 60 characters.',
      priority: 'high'
    });
  }

  // Meta description
  if (metaDescription) {
    const mLen = metaDescription.length;
    if (mLen >= 70 && mLen <= 165) {
      findings.push({
        id: 'seo_description',
        category: 'SEO',
        title: 'Meta Description Optimal',
        status: 'PASS',
        scoreImpact: 10,
        evidence: `Found: "${metaDescription.slice(0, 100)}..." (${mLen} characters).`,
        recommendation: 'Ensure meta description contains user search intent phrases.',
        priority: 'low'
      });
    } else {
      findings.push({
        id: 'seo_description',
        category: 'SEO',
        title: 'Meta Description Suboptimal Length',
        status: 'WARNING',
        scoreImpact: 5,
        evidence: `Meta description length is ${mLen} characters (recommended 120-160 chars).`,
        recommendation: 'Optimize meta description length to 120-160 characters for complete search snippets.',
        priority: 'medium'
      });
    }
  } else {
    findings.push({
      id: 'seo_description',
      category: 'SEO',
      title: 'Missing Meta Description',
      status: 'CRITICAL',
      scoreImpact: -12,
      evidence: 'No <meta name="description"> found in page header.',
      recommendation: 'Add a meta description summarizing the page content in 140-160 characters.',
      priority: 'high'
    });
  }

  // Canonical tag
  if (canonical) {
    findings.push({
      id: 'seo_canonical',
      category: 'SEO',
      title: 'Canonical URL Specified',
      status: 'PASS',
      scoreImpact: 8,
      evidence: `rel="canonical" points to: ${canonical}`,
      recommendation: 'Confirm canonical target matches the preferred authoritative URL.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'seo_canonical',
      category: 'SEO',
      title: 'Missing Canonical Link Element',
      status: 'WARNING',
      scoreImpact: 2,
      evidence: 'No <link rel="canonical"> tag detected in document <head>.',
      recommendation: 'Specify canonical URL to protect against duplicate content indexing.',
      priority: 'medium'
    });
  }

  // Headings structure (H1, H2, H3)
  if (h1Count === 1) {
    findings.push({
      id: 'seo_h1',
      category: 'SEO',
      title: 'Single H1 Heading Configured',
      status: 'PASS',
      scoreImpact: 8,
      evidence: `Found 1 primary <h1>: "${h1Text?.slice(0, 80)}"`,
      recommendation: 'Maintain single primary topic hierarchy.',
      priority: 'low'
    });
  } else if (h1Count === 0) {
    findings.push({
      id: 'seo_h1',
      category: 'SEO',
      title: 'Missing <h1> Heading',
      status: 'CRITICAL',
      scoreImpact: -10,
      evidence: 'Page does not contain any <h1> heading element.',
      recommendation: 'Add one clear <h1> describing the primary subject of the page.',
      priority: 'high'
    });
  } else {
    findings.push({
      id: 'seo_h1',
      category: 'SEO',
      title: 'Multiple <h1> Headings Found',
      status: 'WARNING',
      scoreImpact: 4,
      evidence: `Found ${h1Count} separate <h1> elements.`,
      recommendation: 'Consolidate to a single <h1> heading per URL to preserve clear topic hierarchy.',
      priority: 'medium'
    });
  }

  // Images and alt attributes
  if (imagesCount === 0) {
    findings.push({
      id: 'seo_images',
      category: 'SEO',
      title: 'No Images Detected',
      status: 'PASS',
      scoreImpact: 5,
      evidence: 'Page contains 0 <img> tags.',
      recommendation: 'Consider adding contextual visual assets to increase user engagement.',
      priority: 'low'
    });
  } else if (imagesMissingAlt === 0) {
    findings.push({
      id: 'seo_images',
      category: 'SEO',
      title: 'Image Alt Attributes 100% Present',
      status: 'PASS',
      scoreImpact: 8,
      evidence: `All ${imagesCount} images have alt attributes defined.`,
      recommendation: 'Ensure alt descriptions are semantically accurate for accessibility.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'seo_images',
      category: 'SEO',
      title: 'Images Missing Alt Attributes',
      status: 'WARNING',
      scoreImpact: 2,
      evidence: `${imagesMissingAlt} out of ${imagesCount} images are missing the 'alt' attribute.`,
      recommendation: 'Provide meaningful descriptive alt text for every content image.',
      priority: 'high'
    });
  }

  // Open Graph & Social Cards
  const ogKeys = Object.keys(openGraph);
  if (ogKeys.length >= 3) {
    findings.push({
      id: 'seo_og',
      category: 'SEO',
      title: 'Open Graph Metadata Complete',
      status: 'PASS',
      scoreImpact: 7,
      evidence: `Defined: ${ogKeys.join(', ')}`,
      recommendation: 'Test preview cards across LinkedIn, Slack, and Facebook.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'seo_og',
      category: 'SEO',
      title: 'Incomplete Open Graph Tags',
      status: 'WARNING',
      scoreImpact: 2,
      evidence: `Found ${ogKeys.length} Open Graph tags (${ogKeys.join(', ') || 'none'}).`,
      recommendation: 'Implement og:title, og:description, og:image, og:url for rich social sharing.',
      priority: 'medium'
    });
  }

  // Robots.txt & Sitemap
  if (technicalData.hasRobotsTxt) {
    findings.push({
      id: 'seo_robots',
      category: 'SEO',
      title: 'robots.txt Present',
      status: 'PASS',
      scoreImpact: 6,
      evidence: 'robots.txt returned HTTP 200 OK from domain root.',
      recommendation: 'Audit crawl directives periodically.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'seo_robots',
      category: 'SEO',
      title: 'robots.txt Not Accessible',
      status: 'WARNING',
      scoreImpact: 0,
      evidence: 'No robots.txt detected at domain root /robots.txt.',
      recommendation: 'Deploy a robots.txt file to guide search engine crawlers.',
      priority: 'medium'
    });
  }

  if (technicalData.hasSitemap) {
    findings.push({
      id: 'seo_sitemap',
      category: 'SEO',
      title: 'XML Sitemap Found',
      status: 'PASS',
      scoreImpact: 6,
      evidence: 'sitemap.xml discovered at standard path.',
      recommendation: 'Keep sitemap submitted in Google Search Console.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'seo_sitemap',
      category: 'SEO',
      title: 'XML Sitemap Missing at Root',
      status: 'WARNING',
      scoreImpact: 2,
      evidence: 'Could not locate sitemap.xml at /sitemap.xml.',
      recommendation: 'Generate an XML sitemap and reference it inside robots.txt.',
      priority: 'medium'
    });
  }

  // --- B. AEO (Answer Engine Optimization) CHECKS ---
  // FAQ Schema / FAQ Content
  if (hasFaqSection) {
    findings.push({
      id: 'aeo_faq',
      category: 'AEO',
      title: 'FAQ Question-and-Answer Framework Found',
      status: 'PASS',
      scoreImpact: 15,
      evidence: `Identified FAQ patterns or Schema markup. Found ${sampleQuestions.length} explicit question patterns.`,
      recommendation: 'Ensure answers under each question are concise (40-60 words) for direct voice/snippet answers.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'aeo_faq',
      category: 'AEO',
      title: 'FAQ & Direct Answer Opportunity',
      status: 'WARNING',
      scoreImpact: 5,
      evidence: 'No formal FAQ block or FAQPage Schema detected on this page.',
      recommendation: 'Add an FAQ section with direct question-and-answer pairs matching user query intent.',
      priority: 'high'
    });
  }

  // Heading Question Patterns
  if (sampleQuestions.length >= 2) {
    findings.push({
      id: 'aeo_question_headings',
      category: 'AEO',
      title: 'Natural Query Formatted Headings',
      status: 'PASS',
      scoreImpact: 12,
      evidence: `Discovered conversational inquiry headings: "${sampleQuestions.slice(0, 2).join('", "')}"`,
      recommendation: 'Place the concise direct answer directly in the immediate subsequent paragraph.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'aeo_question_headings',
      category: 'AEO',
      title: 'Few Question-Based Headings',
      status: 'WARNING',
      scoreImpact: 4,
      evidence: `Only ${sampleQuestions.length} question pattern headings found.`,
      recommendation: 'Adopt conversational question headings (e.g., "What is...", "How to...") to trigger Answer Engine extractions.',
      priority: 'medium'
    });
  }

  // Featured Snippet Format (Short concise paragraphs & lists)
  const listCount = $('ul, ol').length;
  const tableCount = $('table').length;
  if (listCount > 0 || tableCount > 0) {
    findings.push({
      id: 'aeo_snippet_structure',
      category: 'AEO',
      title: 'Structured Elements (Lists / Tables) Detected',
      status: 'PASS',
      scoreImpact: 12,
      evidence: `Found ${listCount} list(s) and ${tableCount} data table(s) suitable for featured snippet extraction.`,
      recommendation: 'Use bulleted lists for multi-step processes or comparative summaries.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'aeo_snippet_structure',
      category: 'AEO',
      title: 'Unstructured Text Flow for Snippets',
      status: 'WARNING',
      scoreImpact: 3,
      evidence: 'No bulleted lists or tabular data structures found on page.',
      recommendation: 'Format core steps, features, or specifications into HTML <ul>/<ol> lists to increase snippet eligibility.',
      priority: 'medium'
    });
  }

  // --- C. AIO (AI Discoverability & Readability) CHECKS ---
  // Structured Data / Machine Readability
  if (hasSchemaOrg && jsonLdSchemas.length > 0) {
    findings.push({
      id: 'aio_structured_data',
      category: 'AIO',
      title: 'JSON-LD Machine-Readable Metadata',
      status: 'PASS',
      scoreImpact: 15,
      evidence: `Detected ${jsonLdSchemas.length} JSON-LD schema block(s): ${jsonLdSchemas.map(s => s.type).join(', ')}`,
      recommendation: 'Link entity @id attributes to authoritative knowledge bases (e.g. Wikidata).',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'aio_structured_data',
      category: 'AIO',
      title: 'Missing Machine-Readable JSON-LD',
      status: 'CRITICAL',
      scoreImpact: -10,
      evidence: 'No JSON-LD structured data detected. AI scrapers must rely solely on raw text parsing.',
      recommendation: 'Inject JSON-LD schemas (WebPage, Organization, Article, or FAQPage) to clarify entities for AI models.',
      priority: 'high'
    });
  }

  // Content Length & Depth for LLM Context
  if (contentWordCount >= 600) {
    findings.push({
      id: 'aio_context_depth',
      category: 'AIO',
      title: 'Substantial Text Depth for AI Context Windows',
      status: 'PASS',
      scoreImpact: 12,
      evidence: `Extracted approximately ${contentWordCount} clean words. Provides robust context for LLM embeddings.`,
      recommendation: 'Ensure semantic coherence across section headings.',
      priority: 'low'
    });
  } else if (contentWordCount >= 250) {
    findings.push({
      id: 'aio_context_depth',
      category: 'AIO',
      title: 'Moderate Content Depth',
      status: 'WARNING',
      scoreImpact: 6,
      evidence: `Extracted ${contentWordCount} words. May lack comprehensive topical coverage for AI summarization.`,
      recommendation: 'Expand topic coverage with definitions, examples, and contextual depth.',
      priority: 'medium'
    });
  } else {
    findings.push({
      id: 'aio_context_depth',
      category: 'AIO',
      title: 'Thin Content for AI Context Processing',
      status: 'CRITICAL',
      scoreImpact: -8,
      evidence: `Extracted only ${contentWordCount} words of readable body text.`,
      recommendation: 'Substantially expand page content with detailed explanations and verifiable context.',
      priority: 'high'
    });
  }

  // Semantic Clarity / Headings depth
  if (h2Count >= 2 && h3Count >= 1) {
    findings.push({
      id: 'aio_semantic_hierarchy',
      category: 'AIO',
      title: 'Clear Semantic Heading Hierarchy',
      status: 'PASS',
      scoreImpact: 10,
      evidence: `Found ${h2Count} <h2> and ${h3Count} <h3> sub-sections establishing logical topic trees.`,
      recommendation: 'Keep headings self-contained and descriptive.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'aio_semantic_hierarchy',
      category: 'AIO',
      title: 'Shallow Heading Hierarchy',
      status: 'WARNING',
      scoreImpact: 3,
      evidence: `Found ${h2Count} H2s and ${h3Count} H3s. Flat content structures complicate AI chunking.`,
      recommendation: 'Structure topics into granular subheadings (H2, H3) to aid AI RAG retrieval systems.',
      priority: 'medium'
    });
  }

  // --- D. GEO (Generative Engine Optimization) CHECKS ---
  // Named Entity Recognition & Organization Details
  if (foundEntities.length >= 2) {
    findings.push({
      id: 'geo_entities',
      category: 'GEO',
      title: 'Verifiable Entity Grounding',
      status: 'PASS',
      scoreImpact: 14,
      evidence: `Identified prominent entities: ${foundEntities.join('; ')}`,
      recommendation: 'Cross-reference corporate entities with Google Business Profiles and Crunchbase.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'geo_entities',
      category: 'GEO',
      title: 'Weak Entity Disambiguation',
      status: 'WARNING',
      scoreImpact: 4,
      evidence: 'Limited recognizable named entities found in structured headers.',
      recommendation: 'Clarify organization name, parent company, and primary product entities using schema.org/Organization.',
      priority: 'high'
    });
  }

  // Citations / External Authority Links
  if (externalLinksCount >= 2) {
    findings.push({
      id: 'geo_citations',
      category: 'GEO',
      title: 'Outbound Citations / Reference Signals',
      status: 'PASS',
      scoreImpact: 10,
      evidence: `Identified ${externalLinksCount} outbound references to third-party sources.`,
      recommendation: 'Ensure citations point to peer-reviewed, academic, or primary source domains.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'geo_citations',
      category: 'GEO',
      title: 'Missing External Citations or Sources',
      status: 'WARNING',
      scoreImpact: 3,
      evidence: `Only ${externalLinksCount} outbound link(s) detected. Generative engines favor cited assertions.`,
      recommendation: 'Include citations and links to authoritative source material to validate claims.',
      priority: 'medium'
    });
  }

  // About Page Verification
  if (hasAboutPageLink) {
    findings.push({
      id: 'geo_about',
      category: 'GEO',
      title: 'About Page / Institutional Profile Verified',
      status: 'FOUND',
      scoreImpact: 10,
      evidence: 'Direct navigation link to About / Company page discovered.',
      recommendation: 'Ensure About page details company founding date, team credentials, and mission.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'geo_about',
      category: 'GEO',
      title: 'About Page Link Not Found',
      status: 'NOT_FOUND',
      scoreImpact: 0,
      evidence: 'No link containing "about", "about-us", or "team" found in navigation.',
      recommendation: 'Provide an accessible About Us page link in the header or footer.',
      priority: 'medium'
    });
  }

  // --- E. E-E-A-T CHECKS (Experience, Expertise, Authoritativeness, Trustworthiness) ---
  // Author information & credentials
  if (hasAuthorBio) {
    findings.push({
      id: 'eeat_author',
      category: 'EEAT',
      title: 'Author Attribution & Byline Signals',
      status: 'FOUND',
      scoreImpact: 12,
      evidence: authorMeta ? `Author meta tag: "${authorMeta}"` : 'Author/editorial attribution identified in text or schema.',
      recommendation: 'Link author profiles to LinkedIn or professional publication portfolios.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'eeat_author',
      category: 'EEAT',
      title: 'Author Attribution Not Found',
      status: 'NOT_FOUND',
      scoreImpact: 0,
      evidence: 'No explicit author byline, biographical snippet, or Person schema detected.',
      recommendation: 'Add author bylines with professional credentials, degrees, or verified experience.',
      priority: 'high'
    });
  }

  // Contact Information
  if (hasContactInfo) {
    findings.push({
      id: 'eeat_contact',
      category: 'EEAT',
      title: 'Direct Contact / Support Verification',
      status: 'FOUND',
      scoreImpact: 10,
      evidence: 'Discovered direct contact channels (email/phone link or dedicated contact link).',
      recommendation: 'Display physical business address alongside electronic contact points.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'eeat_contact',
      category: 'EEAT',
      title: 'Contact Information Not Found',
      status: 'NOT_FOUND',
      scoreImpact: 0,
      evidence: 'No visible email address, phone number, or Contact Us link detected.',
      recommendation: 'Provide clear, verifiable contact channels (email, phone, physical location) to foster user trust.',
      priority: 'high'
    });
  }

  // Privacy Policy
  if (hasPrivacyPolicyLink) {
    findings.push({
      id: 'eeat_privacy',
      category: 'EEAT',
      title: 'Privacy Policy Documented',
      status: 'FOUND',
      scoreImpact: 10,
      evidence: 'Identified privacy policy hyperlink in page layout.',
      recommendation: 'Ensure privacy policy reflects current GDPR/CCPA standards.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'eeat_privacy',
      category: 'EEAT',
      title: 'Privacy Policy Link Not Found',
      status: 'NOT_FOUND',
      scoreImpact: 0,
      evidence: 'No hyperlink matching privacy policy keywords found.',
      recommendation: 'Publish and link a legally compliant Privacy Policy in the global footer.',
      priority: 'high'
    });
  }

  // Terms of Service
  if (hasTermsLink) {
    findings.push({
      id: 'eeat_terms',
      category: 'EEAT',
      title: 'Terms of Service Documented',
      status: 'FOUND',
      scoreImpact: 8,
      evidence: 'Identified terms and conditions hyperlink.',
      recommendation: 'Regularly update effective revision dates.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'eeat_terms',
      category: 'EEAT',
      title: 'Terms of Service Not Found',
      status: 'NOT_FOUND',
      scoreImpact: 0,
      evidence: 'No Terms of Service link found on the audited page.',
      recommendation: 'Add clear Terms of Service to clarify user agreements and operational disclosures.',
      priority: 'medium'
    });
  }

  // Security Headers (Trustworthiness)
  if (hsts && (xContentTypeOptions || xFrameOptions)) {
    findings.push({
      id: 'eeat_security_headers',
      category: 'EEAT',
      title: 'Robust Security Headers (Trust Signal)',
      status: 'FOUND',
      scoreImpact: 10,
      evidence: `Configured: HSTS: ${hsts}, X-Content-Type-Options: ${xContentTypeOptions}, X-Frame-Options: ${xFrameOptions}`,
      recommendation: 'Maintain strict Content Security Policy directives.',
      priority: 'low'
    });
  } else {
    findings.push({
      id: 'eeat_security_headers',
      category: 'EEAT',
      title: 'Missing Core Security Headers',
      status: 'NOT_FOUND',
      scoreImpact: 0,
      evidence: `Missing one or more trust headers (HSTS: ${hsts}, X-Content-Type-Options: ${xContentTypeOptions}, CSP: ${contentSecurityPolicy}).`,
      recommendation: 'Configure HSTS, X-Content-Type-Options, and CSP to demonstrate technical integrity.',
      priority: 'medium'
    });
  }

  // 3. CALCULATE SCORES MATHEMATICALLY
  function computeCategory(cat: 'SEO' | 'AEO' | 'AIO' | 'GEO' | 'EEAT'): CategoryScore {
    const catFindings = findings.filter(f => f.category === cat);
    let passed = 0;
    let warnings = 0;
    let critical = 0;
    let earned = 0;
    let maxPossible = 0;

    catFindings.forEach(f => {
      const isPassOrFound = f.status === 'PASS' || f.status === 'FOUND';
      const isWarning = f.status === 'WARNING';
      const isCriticalOrNotFound = f.status === 'CRITICAL' || f.status === 'NOT_FOUND';

      if (isPassOrFound) passed++;
      else if (isWarning) warnings++;
      else if (isCriticalOrNotFound) critical++;

      // Weight allocation
      const weight = Math.abs(f.scoreImpact) || 10;
      maxPossible += weight;
      if (isPassOrFound) {
        earned += weight;
      } else if (isWarning) {
        earned += weight * 0.55;
      } else {
        earned += 0;
      }
    });

    const score = maxPossible > 0 ? Math.min(100, Math.max(0, Math.round((earned / maxPossible) * 100))) : 50;

    let statusSummary = 'Moderate configuration';
    if (score >= 85) statusSummary = 'High compliance & optimization';
    else if (score >= 65) statusSummary = 'Acceptable baseline with actionable improvement areas';
    else statusSummary = 'Requires critical remediation';

    return {
      score,
      passedCount: passed,
      warningCount: warnings,
      criticalCount: critical,
      statusSummary
    };
  }

  const seoScore = computeCategory('SEO');
  const aeoScore = computeCategory('AEO');
  const aioScore = computeCategory('AIO');
  const geoScore = computeCategory('GEO');
  const eeatScore = computeCategory('EEAT');

  // Overall score: Weighted average
  const overallScore = Math.round(
    seoScore.score * 0.28 +
    aeoScore.score * 0.20 +
    aioScore.score * 0.18 +
    geoScore.score * 0.18 +
    eeatScore.score * 0.16
  );

  return {
    id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url: crawl.url,
    finalUrl: crawl.finalUrl,
    httpStatus: crawl.status,
    responseTimeMs: crawl.responseTimeMs,
    timestamp: new Date().toISOString(),
    overallScore,
    seo: seoScore,
    aeo: aeoScore,
    aio: aioScore,
    geo: geoScore,
    eeat: eeatScore,
    findings,
    technicalData
  };
}
