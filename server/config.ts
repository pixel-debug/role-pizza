import { z } from 'zod';

const portSchema = z.coerce.number().int().min(1).max(65535);
const environmentSchema = z.object({
  DB_CLIENT: z.enum(['sqlite', 'oracle', 'pg']).optional(),
  DATABASE_URL: z.string().url().refine(value => {
    if (!URL.canParse(value)) return false;
    const protocol = new URL(value).protocol;
    return protocol === 'postgres:' || protocol === 'postgresql:';
  }).optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(10).default(2),
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
  | ({ client: 'pg'; poolMax: number } & (
    | { connectionString: string }
    | (SqlCredentials & { database: string })
  ));

export interface ServerConfig {
  port: number;
  host: string;
  production: boolean;
  serverless: boolean;
  database: DatabaseConfig;
}

export class ConfigurationError extends Error {}

export function readConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new ConfigurationError(`Configuracao invalida: ${parsed.error.issues.map(issue => issue.path.join('.')).join(', ')}`);
  }
  const settings = parsed.data;
  const serverless = environment.VERCEL === '1';
  const client = settings.DB_CLIENT ?? (settings.DATABASE_URL ? 'pg' : 'sqlite');
  let database: DatabaseConfig;

  if (settings.DATABASE_URL && client !== 'pg') {
    throw new ConfigurationError('DATABASE_URL exige DB_CLIENT=pg ou DB_CLIENT nao definido.');
  }
  if (serverless && client !== 'pg') {
    throw new ConfigurationError('Na Vercel, configure DATABASE_URL para usar Postgres online.');
  }

  if (client === 'sqlite') {
    database = { client: 'sqlite', filename: 'data/pizza.sqlite' };
  } else if (client === 'pg' && settings.DATABASE_URL) {
    database = { client: 'pg', connectionString: settings.DATABASE_URL, poolMax: settings.DB_POOL_MAX };
  } else {
    if (!settings.DB_USER || !settings.DB_PASSWORD) {
      throw new ConfigurationError('DB_USER e DB_PASSWORD sao obrigatorios para Oracle ou Postgres.');
    }
    const credentials = { host: settings.DB_HOST, user: settings.DB_USER, password: settings.DB_PASSWORD };
    database = client === 'oracle'
      ? { ...credentials, client: 'oracle', port: settings.DB_PORT ?? 1521, service: settings.DB_SERVICE }
      : { ...credentials, client: 'pg', port: settings.DB_PORT ?? 5432, database: settings.DB_DATABASE, poolMax: settings.DB_POOL_MAX };
  }

  return {
    port: settings.PORT,
    host: settings.HOST,
    production: serverless || settings.NODE_ENV === 'production',
    serverless,
    database,
  };
}
