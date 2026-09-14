import { GoogleGenAI } from '@google/genai';
import type { TechnicalData, AIInsights } from '../src/types.js';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateAIInsights(
  url: string,
  technicalData: TechnicalData,
  overallScore: number
): Promise<AIInsights | undefined> {
  const ai = getGenAI();
  if (!ai) {
    // If Gemini API key is not configured, generate rule-based factual synthesis based purely on audit findings
    return {
      summary: `Automated analysis for ${url}. Page achieved an overall audit index of ${overallScore}/100 with ${technicalData.contentWordCount} readable words, ${technicalData.h1Count} H1 heading(s), and ${technicalData.jsonLdSchemas.length} JSON-LD schemas.`,
      aeoDirectAnswerAssessment: technicalData.hasFaqSection
        ? 'Page contains Q&A structure suitable for search voice answer boxes and direct answer extraction.'
        : 'Lack of explicit question-and-answer markup limits visibility in voice engines (Perplexity, Siri, Google Assistant).',
      aioDiscoverabilityAssessment: technicalData.hasSchemaOrg
        ? 'Semantic metadata enables AI crawlers (GPTBot, ClaudeBot, Perplexity) to parse entity relationships cleanly.'
        : 'Absence of schema metadata requires AI models to infer entity structure heuristically.',
      geoGenerativeEngineAssessment: technicalData.foundEntities.length > 0
        ? `Entities detected: ${technicalData.foundEntities.join(', ')}. Solid foundation for generative synthesis.`
        : 'Weak entity definition. Add explicit Organization and WebSite schemas.',
      eeatAssessment: technicalData.hasAuthorBio && technicalData.hasContactInfo
        ? 'Author and contact indicators present, corroborating publisher authenticity.'
        : 'Critical trust signals (author byline, verified contact channels, or privacy policies) require reinforcement.',
      keyActionItems: [
        technicalData.h1Count !== 1 ? 'Correct <h1> structure to exactly one primary heading.' : 'Maintain concise <h1> keyword hierarchy.',
        !technicalData.hasSchemaOrg ? 'Implement Schema.org JSON-LD structured data.' : 'Audit schema accuracy in Rich Results Test.',
        !technicalData.hasAboutPageLink ? 'Add prominent link to About Us page.' : 'Ensure About Us page includes corporate registration details.',
        technicalData.imagesMissingAlt > 0 ? `Add descriptive alt attributes to ${technicalData.imagesMissingAlt} image(s).` : 'Keep media files optimized for mobile performance.'
      ]
    };
  }

  try {
    const prompt = `You are a high-level Search & AI Engine Optimization Auditor inspecting a real crawled website.
Website URL: ${url}
Calculated Audit Score: ${overallScore}/100
Technical Crawl Signals:
- Page Title: "${technicalData.title || 'None'}"
- Meta Description: "${technicalData.metaDescription || 'None'}"
- Heading H1: "${technicalData.h1Text || 'None'}" (Count: ${technicalData.h1Count})
- Subheadings: H2=${technicalData.h2Count}, H3=${technicalData.h3Count}
- Word Count: ${technicalData.contentWordCount} words
- Images Count: ${technicalData.imagesCount} (Missing alt: ${technicalData.imagesMissingAlt})
- Internal Links: ${technicalData.internalLinksCount}, External Links: ${technicalData.externalLinksCount}
- JSON-LD Schemas: ${JSON.stringify(technicalData.jsonLdSchemas)}
- Security Headers: HSTS=${technicalData.securityHeaders.hsts}, CSP=${technicalData.securityHeaders.contentSecurityPolicy}
- Detected Questions: ${JSON.stringify(technicalData.sampleQuestions)}
- Trust Signals: AboutLink=${technicalData.hasAboutPageLink}, Contact=${technicalData.hasContactInfo}, Privacy=${technicalData.hasPrivacyPolicyLink}, AuthorBio=${technicalData.hasAuthorBio}

Provide a strictly factual, actionable executive analysis in JSON format with exactly these keys:
{
  "summary": "2-3 concise sentences summarizing performance across SEO, AEO, AIO, GEO, and EEAT",
  "aeoDirectAnswerAssessment": "Evaluation of how well this page satisfies Answer Engines (ChatGPT Search, Perplexity, Google SGE)",
  "aioDiscoverabilityAssessment": "Evaluation of LLM crawlability, tokenization, semantic chunking, and JSON-LD discoverability",
  "geoGenerativeEngineAssessment": "Evaluation of entity disambiguation and factual citations for generative engines",
  "eeatAssessment": "Evaluation of Experience, Expertise, Authoritativeness, and Trust signals found on the page",
  "keyActionItems": ["action item 1", "action item 2", "action item 3", "action item 4"]
}
Do NOT invent claims or statistics that are not present in the crawl signals. Output ONLY the valid JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        summary: String(parsed.summary || ''),
        aeoDirectAnswerAssessment: String(parsed.aeoDirectAnswerAssessment || ''),
        aioDiscoverabilityAssessment: String(parsed.aioDiscoverabilityAssessment || ''),
        geoGenerativeEngineAssessment: String(parsed.geoGenerativeEngineAssessment || ''),
        eeatAssessment: String(parsed.eeatAssessment || ''),
        keyActionItems: Array.isArray(parsed.keyActionItems) ? parsed.keyActionItems : []
      };
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to local factual assessment:', err);
  }

  return undefined;
}
