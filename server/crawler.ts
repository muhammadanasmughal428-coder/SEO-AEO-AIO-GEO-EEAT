import dns from 'dns/promises';
import { URL } from 'url';

export interface CrawlResult {
  url: string;
  finalUrl: string;
  status: number;
  statusText: string;
  responseTimeMs: number;
  html: string;
  headers: Record<string, string>;
  isHttps: boolean;
  robotsTxt?: {
    found: boolean;
    content?: string;
  };
  sitemap?: {
    found: boolean;
    content?: string;
  };
}

export function validateAndNormalizeUrl(rawUrl: string): { valid: boolean; normalizedUrl?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // SSRF Checks
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '169.254.169.254'
    ) {
      return { valid: false, error: 'SSRF Protection: Access to localhost or local metadata addresses is blocked.' };
    }

    // IP format checks
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const p1 = parseInt(ipMatch[1], 10);
      const p2 = parseInt(ipMatch[2], 10);

      // Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16
      if (
        p1 === 10 ||
        p1 === 127 ||
        (p1 === 172 && p2 >= 16 && p2 <= 31) ||
        (p1 === 192 && p2 === 168) ||
        (p1 === 169 && p2 === 254) ||
        p1 === 0
      ) {
        return { valid: false, error: 'SSRF Protection: Private and local IP address ranges are prohibited.' };
      }
    }

    return { valid: true, normalizedUrl: parsed.toString() };
  } catch (err: any) {
    return { valid: false, error: `Invalid URL format: ${err.message}` };
  }
}

async function verifyDns(hostname: string): Promise<{ safe: boolean; error?: string }> {
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      const ip = record.address;
      if (
        ip.startsWith('127.') ||
        ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('169.254.') ||
        ip === '::1' ||
        ip === '0.0.0.0'
      ) {
        return { safe: false, error: 'SSRF Protection: Hostname resolves to private/loopback IP address.' };
      }
      if (ip.startsWith('172.')) {
        const parts = ip.split('.');
        const second = parseInt(parts[1], 10);
        if (second >= 16 && second <= 31) {
          return { safe: false, error: 'SSRF Protection: Hostname resolves to private IP address.' };
        }
      }
    }
    return { safe: true };
  } catch (err: any) {
    return { safe: false, error: `DNS resolution failed: ${err.message}` };
  }
}

export async function fetchWithSafeRedirects(
  targetUrl: string,
  timeoutMs = 12000,
  maxRedirects = 5
): Promise<{ res: Response; finalUrl: string; responseTimeMs: number }> {
  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const validated = validateAndNormalizeUrl(currentUrl);
    if (!validated.valid || !validated.normalizedUrl) {
      throw new Error(validated.error || 'Invalid redirect URL');
    }

    const parsed = new URL(validated.normalizedUrl);
    const dnsCheck = await verifyDns(parsed.hostname);
    if (!dnsCheck.safe) {
      throw new Error(dnsCheck.error);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      const res = await fetch(validated.normalizedUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html; SEO-Auditor-Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timer);
      const responseTimeMs = Date.now() - start;

      // Handle redirect status codes
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) {
          return { res, finalUrl: validated.normalizedUrl, responseTimeMs };
        }
        redirectsCount++;
        currentUrl = new URL(location, validated.normalizedUrl).toString();
        continue;
      }

      return { res, finalUrl: validated.normalizedUrl, responseTimeMs };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out after ${timeoutMs / 1000}s while attempting to fetch ${targetUrl}`);
      }
      throw new Error(`Failed to fetch ${currentUrl}: ${err.message}`);
    }
  }

  throw new Error(`Too many redirects encountered (limit ${maxRedirects})`);
}

export async function crawlPage(urlToAudit: string): Promise<CrawlResult> {
  const validated = validateAndNormalizeUrl(urlToAudit);
  if (!validated.valid || !validated.normalizedUrl) {
    throw new Error(validated.error || 'Invalid URL supplied.');
  }

  const { res, finalUrl, responseTimeMs } = await fetchWithSafeRedirects(validated.normalizedUrl);

  const status = res.status;
  const statusText = res.statusText;
  const isHttps = finalUrl.startsWith('https://');

  const headers: Record<string, string> = {};
  res.headers.forEach((val, key) => {
    headers[key.toLowerCase()] = val;
  });

  const html = await res.text();

  // Fetch robots.txt and sitemap asynchronously from origin
  const origin = new URL(finalUrl).origin;
  let robotsTxtData: { found: boolean; content?: string } | undefined;
  let sitemapData: { found: boolean; content?: string } | undefined;

  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': 'SEO-Auditor-Bot/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (robotsRes.ok) {
      const text = await robotsRes.text();
      robotsTxtData = { found: true, content: text.slice(0, 1000) };
    } else {
      robotsTxtData = { found: false };
    }
  } catch {
    robotsTxtData = { found: false };
  }

  try {
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, {
      headers: { 'User-Agent': 'SEO-Auditor-Bot/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (sitemapRes.ok) {
      const text = await sitemapRes.text();
      sitemapData = { found: true, content: text.slice(0, 1000) };
    } else {
      sitemapData = { found: false };
    }
  } catch {
    sitemapData = { found: false };
  }

  return {
    url: validated.normalizedUrl,
    finalUrl,
    status,
    statusText,
    responseTimeMs,
    html,
    headers,
    isHttps,
    robotsTxt: robotsTxtData,
    sitemap: sitemapData
  };
}
