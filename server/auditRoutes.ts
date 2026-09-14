import { Router, Request, Response } from 'express';
import { authenticateUser } from './auth.js';
import { db } from './db.js';
import { crawlPage, validateAndNormalizeUrl } from './crawler.js';
import { analyzeHtml } from './analyzer.js';
import { generateAIInsights } from './aiAgent.js';
import type { AuditProject, PageAuditReport } from '../src/types.js';

export const auditRouter = Router();

// 1. RUN AUDIT
auditRouter.post('/run', authenticateUser, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { url, multiPage = false, maxPages = 3 } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Please enter a valid website URL to audit.' });
  }

  const normalized = validateAndNormalizeUrl(url);
  if (!normalized.valid || !normalized.normalizedUrl) {
    return res.status(400).json({ success: false, error: normalized.error || 'Invalid URL format' });
  }

  const rootUrl = normalized.normalizedUrl;
  const domain = new URL(rootUrl).hostname;

  try {
    // 1. Crawl Primary URL
    const mainCrawl = await crawlPage(rootUrl);

    // If website returned an error code like 404, 500, or blocked
    if (mainCrawl.status >= 400) {
      const failedAudit: AuditProject = {
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user.id,
        baseDomain: domain,
        rootUrl,
        createdAt: new Date().toISOString(),
        overallAverageScore: 0,
        status: 'failed',
        errorMessage: `Website returned HTTP error status ${mainCrawl.status} (${mainCrawl.statusText}). The page could not be audited.`,
        pages: []
      };
      db.saveAudit(failedAudit);
      return res.status(200).json({
        success: false,
        status: 'failed',
        error: `HTTP ${mainCrawl.status} error: ${mainCrawl.statusText}`,
        audit: failedAudit
      });
    }

    // 2. Perform deep analysis on main page
    const mainReport = analyzeHtml(mainCrawl);

    // 3. Generate grounded AI Insights via Gemini if configured
    try {
      const aiInsights = await generateAIInsights(rootUrl, mainReport.technicalData, mainReport.overallScore);
      if (aiInsights) {
        mainReport.aiInsights = aiInsights;
      }
    } catch (aiErr) {
      console.warn('AI insight generation skipped:', aiErr);
    }

    const pages: PageAuditReport[] = [mainReport];

    // 4. Multi-Page Crawling (if user requested deep multi-URL auditing)
    if (multiPage) {
      const limit = Math.min(Math.max(1, Number(maxPages) || 3), 5); // cap at 5 for server performance
      const discoveredUrls = new Set<string>();

      // Extract internal links from main crawl HTML
      const linkRegex = /href=["']([^"'#\s>]+)["']/gi;
      let match;
      while ((match = linkRegex.exec(mainCrawl.html)) !== null) {
        const rawHref = match[1];
        if (rawHref && !rawHref.startsWith('javascript:') && !rawHref.startsWith('mailto:') && !rawHref.startsWith('tel:')) {
          try {
            const resolved = new URL(rawHref, rootUrl);
            if (
              resolved.hostname.toLowerCase() === domain.toLowerCase() &&
              resolved.toString() !== rootUrl &&
              !/\.(png|jpe?g|gif|svg|pdf|css|js|woff2?|zip)$/i.test(resolved.pathname)
            ) {
              discoveredUrls.add(resolved.toString());
              if (discoveredUrls.size >= limit - 1) break;
            }
          } catch {
            // ignore
          }
        }
      }

      // Crawl each discovered sub-URL
      for (const subUrl of discoveredUrls) {
        try {
          const subCrawl = await crawlPage(subUrl);
          if (subCrawl.status < 400) {
            const subReport = analyzeHtml(subCrawl);
            pages.push(subReport);
          }
        } catch (subErr) {
          console.warn(`Sub-page crawl failed for ${subUrl}:`, subErr);
        }
      }
    }

    // Calculate overall average score across all audited URLs
    const totalScore = pages.reduce((acc, p) => acc + p.overallScore, 0);
    const overallAverageScore = Math.round(totalScore / pages.length);

    const auditProject: AuditProject = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      baseDomain: domain,
      rootUrl,
      createdAt: new Date().toISOString(),
      overallAverageScore,
      status: 'completed',
      pages
    };

    db.saveAudit(auditProject);

    return res.status(200).json({
      success: true,
      audit: auditProject
    });
  } catch (err: any) {
    console.error('Audit execution failure:', err);

    // Save failed audit attempt in history with the exact error cause
    const failedAudit: AuditProject = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      baseDomain: domain,
      rootUrl,
      createdAt: new Date().toISOString(),
      overallAverageScore: 0,
      status: 'failed',
      errorMessage: err.message || 'Audit execution failed unexpectedly.',
      pages: []
    };
    db.saveAudit(failedAudit);

    return res.status(400).json({
      success: false,
      status: 'failed',
      error: err.message || 'Audit execution encountered a fatal error.',
      audit: failedAudit
    });
  }
});

// 2. LIST USER'S AUDIT HISTORY
auditRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const userAudits = db.getAuditsByUserId(user.id);
  return res.status(200).json({ success: true, audits: userAudits });
});

// 3. GET SINGLE AUDIT
auditRouter.get('/:id', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const audit = db.getAuditById(req.params.id);

  if (!audit) {
    return res.status(404).json({ success: false, error: 'Audit record not found.' });
  }

  // Security: only owner can access
  if (audit.userId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied: You do not have permission to view this audit.' });
  }

  return res.status(200).json({ success: true, audit });
});

// 4. DELETE AUDIT
auditRouter.delete('/:id', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const deleted = db.deleteAudit(req.params.id, user.id);

  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Audit not found or already deleted.' });
  }

  return res.status(200).json({ success: true, message: 'Audit deleted successfully.' });
});

// 5. EXPORT CSV
auditRouter.get('/:id/export-csv', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const audit = db.getAuditById(req.params.id);

  if (!audit || (audit.userId !== user.id && user.role !== 'admin')) {
    return res.status(404).json({ success: false, error: 'Audit not found.' });
  }

  // Build CSV rows
  const headers = ['URL', 'Category', 'Finding Title', 'Status', 'Score Impact', 'Priority', 'Evidence', 'Recommendation'];
  const rows: string[][] = [headers];

  audit.pages.forEach(page => {
    page.findings.forEach(f => {
      rows.push([
        `"${page.url.replace(/"/g, '""')}"`,
        `"${f.category}"`,
        `"${f.title.replace(/"/g, '""')}"`,
        `"${f.status}"`,
        `"${f.scoreImpact}"`,
        `"${f.priority}"`,
        `"${f.evidence.replace(/"/g, '""')}"`,
        `"${f.recommendation.replace(/"/g, '""')}"`
      ]);
    });
  });

  const csvContent = rows.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-report-${audit.baseDomain}-${Date.now()}.csv"`);
  return res.send(csvContent);
});
