import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/auth.js';
import { auditRouter } from './server/auditRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Security and Cache headers for API
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: 'SEO AEO AIO GEO E-E-A-T Auditor' });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/audits', auditRouter);

  // Global API 404 handler for unknown /api routes
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler for API
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server exception:', err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(500).json({
      success: false,
      error: err.message || 'An unexpected internal server error occurred.'
    });
  });

  // Vite middleware for frontend development / production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SEO-AEO-AIO-GEO-EEAT-Auditor] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot failure:', err);
  process.exit(1);
});
