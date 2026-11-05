import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BallotStore } from './ballots.ts';
import type { ServerConfig } from './config.ts';
import { apiHeaders, errorHandler, identifyVoter } from './http/middleware.ts';
import { createApiRouter } from './http/routes.ts';

export function createApp(store: BallotStore, config: ServerConfig): Express {
  const app = express();
  const staticDirectory = resolve('dist');
  const indexFile = resolve(staticDirectory, 'index.html');

  app.disable('x-powered-by');
  if (config.serverless) app.set('trust proxy', 1);
  app.use('/api', apiHeaders);
  app.use('/api', rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Pausa para mastigar. Tente novamente em um minuto.' },
  }));
  app.use('/api', identifyVoter(config.production));
  app.use('/api', express.json({ limit: '4kb' }));
  app.use('/api', createApiRouter(store, config.database.client));

  if (!config.serverless && existsSync(indexFile)) {
    app.use(express.static(staticDirectory));
    app.get('/{*path}', (_request, response) => { response.sendFile(indexFile); });
  }

  app.use(errorHandler);
  return app;
}