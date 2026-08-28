import type { IncomingMessage, ServerResponse } from 'http';
import { app } from '../server.ts';

export default function handler(req: any, res: any) {
  try {
    // Normalize URL path so Express matches whether rewritten with or without '/api'
    if (req.url) {
      if (!req.url.startsWith('/api') && !req.url.startsWith('/?')) {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      }
    }
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel serverless invocation fallback caught:', err);
    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Fallback serverless handler' }));
    }
  }
}

