import knex, { type Knex } from 'knex';
import type { BallotStore } from '../ballots.ts';
import type { DatabaseConfig } from '../config.ts';
import { summarize } from './results.ts';

type SqlDatabaseConfig = Exclude<DatabaseConfig, { client: 'sqlite' }>;

interface VoterRow {
  id: string;
}

interface VoteRow {
  voter_id: string;
  pizza_name: string;
  quantity: number;
}

interface PizzaTotalRow {
  pizza_name: string;
  total: string | number;
}

interface CountRow {
  total: string | number;
}

function isDuplicateVoter(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return ('code' in error && error.code === '23505') || ('errorNum' in error && error.errorNum === 1);
}

async function ensureSchema(database: Knex): Promise<void> {
  if (!await database.schema.hasTable('pizza_voters')) {
    await database.schema.createTable('pizza_voters', table => { table.string('id', 64).primary(); });
  }
  if (!await database.schema.hasTable('pizza_votes')) {
    await database.schema.createTable('pizza_votes', table => {
      table.string('voter_id', 64).notNullable().references('id').inTable('pizza_voters');
      table.string('pizza_name', 100).notNullable();
      table.integer('quantity').notNullable();
      table.primary(['voter_id', 'pizza_name']);
    });
  }
}

export async function createSqlStore(config: SqlDatabaseConfig): Promise<BallotStore> {
  const database = knex({
    client: config.client === 'oracle' ? 'oracledb' : 'pg',
    connection: config.client === 'oracle' ? {
      user: config.user,
      password: config.password,
      connectString: `${config.host}:${config.port}/${config.service}`,
    } : {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    },
    pool: { min: 0, max: 10 },
  });

  try {
    await ensureSchema(database);
  } catch (error) {
    await database.destroy();
    throw error;
  }

  async function ensureVoter(voter: string): Promise<void> {
    try { await database<VoterRow>('pizza_voters').insert({ id: voter }); }
    catch (error: unknown) { if (!isDuplicateVoter(error)) throw error; }
  }

  return {
    async read(voter) {
      const rows = await database<VoteRow>('pizza_votes').where('voter_id', voter).select('pizza_name', 'quantity');
      return rows.map(row => ({ name: row.pizza_name, quantity: Number(row.quantity) }));
    },
    async replace(voter, ballot) {
      await ensureVoter(voter);
      await database.transaction(async transaction => {
        await transaction<VoterRow>('pizza_voters').where('id', voter).forUpdate().first();
        await transaction<VoteRow>('pizza_votes').where('voter_id', voter).delete();
        for (const pizza of ballot) {
          await transaction<VoteRow>('pizza_votes').insert({ voter_id: voter, pizza_name: pizza.name, quantity: pizza.quantity });
        }
      });
    },
    async results() {
      return database.transaction(async transaction => {
        await transaction<VoterRow>('pizza_voters').select('id').forUpdate();
        const rows = await transaction<VoteRow>('pizza_votes')
          .select('pizza_name')
          .sum<PizzaTotalRow[]>({ total: 'quantity' })
          .groupBy('pizza_name')
          .orderBy('total', 'desc')
          .orderBy('pizza_name');
        const count = await transaction<VoteRow>('pizza_votes').countDistinct<CountRow[]>({ total: 'voter_id' }).first();
        return summarize(rows.map(row => ({ name: row.pizza_name, quantity: Number(row.total) })), Number(count?.total ?? 0));
      });
    },
    async close() { await database.destroy(); },
  };
}