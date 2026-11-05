import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import { createApp } from '../server/app.ts';
import { ConfigurationError, readConfig } from '../server/config.ts';
import { startupErrorDetails } from '../server/startup-error.ts';
import { createSqlStore } from '../server/stores/sql-store.ts';

let application: Promise<Express> | undefined;

async function initialize(): Promise<Express> {
  const config = readConfig();
  if (config.database.client !== 'pg') {
    throw new ConfigurationError('Configure DATABASE_URL com a conexao Postgres para a API serverless.');
  }
  const store = await createSqlStore(config.database);
  return createApp(store, { ...config, serverless: true });
}

function getApplication(): Promise<Express> {
  application ??= initialize().catch((error: unknown) => {
    application = undefined;
    throw error;
  });
  return application;
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const app = await getApplication();
    app(request, response);
  } catch (error: unknown) {
    console.error('Falha ao inicializar a API serverless:', startupErrorDetails(error));
    response.statusCode = 503;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Retry-After', '10');
    response.end(JSON.stringify({ error: 'O forno esta aquecendo. Tente novamente em instantes.' }));
  }
}
