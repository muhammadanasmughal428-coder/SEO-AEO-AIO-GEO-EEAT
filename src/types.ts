export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'email' | 'google' | 'facebook';
  emailVerified: boolean;
  role: 'user' | 'admin';
  company?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

export type AuditStatus = 'PASS' | 'WARNING' | 'CRITICAL' | 'FOUND' | 'NOT_FOUND' | 'UNABLE_TO_VERIFY';

export interface AuditFinding {
  id: string;
  category: 'SEO' | 'AEO' | 'AIO' | 'GEO' | 'EEAT';
  title: string;
  status: AuditStatus;
  scoreImpact: number; // e.g. -5, 0, +5
  evidence: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CategoryScore {
  score: number; // 0 - 100
  passedCount: number;
  warningCount: number;
  criticalCount: number;
  statusSummary: string;
}

export interface TechnicalData {
  title?: string;
  metaDescription?: string;
  canonical?: string;
  robotsMeta?: string;
  hasRobotsTxt: boolean;
  robotsTxtSnippet?: string;
  hasSitemap: boolean;
  sitemapSnippet?: string;
  h1Count: number;
  h1Text?: string;
  h2Count: number;
  h3Count: number;
  imagesCount: number;
  imagesMissingAlt: number;
  internalLinksCount: number;
  externalLinksCount: number;
  openGraph: Record<string, string>;
  twitterCards: Record<string, string>;
  jsonLdSchemas: Array<{ type?: string; snippet?: string }>;
  hasSchemaOrg: boolean;
  language?: string;
  viewport?: string;
  securityHeaders: {
    hsts: boolean;
    xContentTypeOptions: boolean;
    xFrameOptions: boolean;
    contentSecurityPolicy: boolean;
  };
  isHttps: boolean;
  contentWordCount: number;
  hasFaqSection: boolean;
  hasAuthorBio: boolean;
  hasAboutPageLink: boolean;
  hasContactInfo: boolean;
  hasPrivacyPolicyLink: boolean;
  hasTermsLink: boolean;
  hasEditorialPolicy: boolean;
  foundEntities: string[];
  sampleQuestions: string[];
}

export interface AIInsights {
  summary: string;
  aeoDirectAnswerAssessment: string;
  aioDiscoverabilityAssessment: string;
  geoGenerativeEngineAssessment: string;
  eeatAssessment: string;
  keyActionItems: string[];
}

export interface PageAuditReport {
  id: string;
  url: string;
  finalUrl: string;
  httpStatus: number;
  responseTimeMs: number;
  timestamp: string;
  overallScore: number;
  seo: CategoryScore;
  aeo: CategoryScore;
  aio: CategoryScore;
  geo: CategoryScore;
  eeat: CategoryScore;
  findings: AuditFinding[];
  technicalData: TechnicalData;
  aiInsights?: AIInsights;
}

export interface AuditProject {
  id: string;
  userId: string;
  baseDomain: string;
  rootUrl: string;
  createdAt: string;
  overallAverageScore: number;
  status: 'completed' | 'failed' | 'in_progress';
  errorMessage?: string;
  pages: PageAuditReport[];
}
