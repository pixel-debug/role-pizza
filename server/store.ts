import type { BallotStore } from './ballots.ts';
import { readConfig, type DatabaseConfig } from './config.ts';
import { sqliteStore } from './stores/sqlite-store.ts';
import { createSqlStore } from './stores/sql-store.ts';

export { sqliteStore } from './stores/sqlite-store.ts';

export async function createStore(config: DatabaseConfig): Promise<BallotStore> {
  return config.client === 'sqlite' ? sqliteStore(config.filename) : createSqlStore(config);
}

export async function sqlStore(client: 'oracledb' | 'pg'): Promise<BallotStore> {
  const { database } = readConfig({ ...process.env, DB_CLIENT: client === 'oracledb' ? 'oracle' : 'pg' });
  if (database.client === 'sqlite') throw new Error('Configuracao SQL esperada.');
  return createSqlStore(database);
}