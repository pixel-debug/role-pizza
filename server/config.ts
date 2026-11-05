import { z } from 'zod';

const portSchema = z.coerce.number().int().min(1).max(65535);
const environmentSchema = z.object({
  DB_CLIENT: z.enum(['sqlite', 'oracle', 'pg']).default('sqlite'),
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: portSchema.optional(),
  DB_SERVICE: z.string().min(1).default('FREEPDB1'),
  DB_DATABASE: z.string().min(1).default('pizza'),
  DB_USER: z.string().min(1).optional(),
  DB_PASSWORD: z.string().min(1).optional(),
  PORT: portSchema.default(3001),
  HOST: z.string().min(1).default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

interface SqlCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
}

export type DatabaseConfig =
  | { client: 'sqlite'; filename: string }
  | (SqlCredentials & { client: 'oracle'; service: string })
  | (SqlCredentials & { client: 'pg'; database: string });

export interface ServerConfig {
  port: number;
  host: string;
  production: boolean;
  database: DatabaseConfig;
}

export function readConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(`Configuracao invalida: ${parsed.error.issues.map(issue => issue.path.join('.')).join(', ')}`);
  }
  const settings = parsed.data;
  let database: DatabaseConfig;

  if (settings.DB_CLIENT === 'sqlite') {
    database = { client: 'sqlite', filename: 'data/pizza.sqlite' };
  } else {
    if (!settings.DB_USER || !settings.DB_PASSWORD) {
      throw new Error('DB_USER e DB_PASSWORD sao obrigatorios para Oracle ou Postgres.');
    }
    const credentials = { host: settings.DB_HOST, user: settings.DB_USER, password: settings.DB_PASSWORD };
    database = settings.DB_CLIENT === 'oracle'
      ? { ...credentials, client: 'oracle', port: settings.DB_PORT ?? 1521, service: settings.DB_SERVICE }
      : { ...credentials, client: 'pg', port: settings.DB_PORT ?? 5432, database: settings.DB_DATABASE };
  }

  return { port: settings.PORT, host: settings.HOST, production: settings.NODE_ENV === 'production', database };
}