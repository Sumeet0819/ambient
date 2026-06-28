import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger';

// ── Routers ──────────────────────────────────────────────────────────────────
import authRouter from './modules/auth/auth.router';
import transactionsRouter from './modules/transactions/transactions.router';
import analyticsRouter from './modules/analytics/analytics.router';
import categoriesRouter from './modules/categories/categories.router';
import usersRouter from './modules/users/users.router';

const app: Application = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/users', usersRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
