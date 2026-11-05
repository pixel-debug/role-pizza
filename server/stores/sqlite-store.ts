import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { MAX_SLICES } from '../../shared/ballots.ts';
import type { BallotStore } from '../ballots.ts';
import { summarize } from './results.ts';

const voteRowsSchema = z.array(z.object({ name: z.string(), quantity: z.number().int().positive() }));
const countSchema = z.object({ count: z.number().int().nonnegative() });

export function sqliteStore(filename = 'data/pizza.sqlite'): BallotStore {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const database = new DatabaseSync(filename);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pizza_voters (id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS pizza_votes (
      voter_id TEXT NOT NULL REFERENCES pizza_voters(id),
      pizza_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND ${MAX_SLICES}),
      PRIMARY KEY (voter_id, pizza_name)
    );
  `);

  const readVotes = database.prepare('SELECT pizza_name AS name, quantity FROM pizza_votes WHERE voter_id = ? ORDER BY pizza_name');
  const insertVoter = database.prepare('INSERT OR IGNORE INTO pizza_voters(id) VALUES (?)');
  const deleteVotes = database.prepare('DELETE FROM pizza_votes WHERE voter_id = ?');
  const insertVote = database.prepare('INSERT INTO pizza_votes(voter_id, pizza_name, quantity) VALUES (?, ?, ?)');
  const totalVotes = database.prepare('SELECT pizza_name AS name, SUM(quantity) AS quantity FROM pizza_votes GROUP BY pizza_name ORDER BY quantity DESC, pizza_name');
  const totalVoters = database.prepare('SELECT COUNT(DISTINCT voter_id) AS count FROM pizza_votes');

  return {
    async read(voter) {
      return voteRowsSchema.parse(readVotes.all(voter));
    },
    async replace(voter, ballot) {
      database.exec('BEGIN IMMEDIATE');
      try {
        insertVoter.run(voter);
        deleteVotes.run(voter);
        for (const pizza of ballot) insertVote.run(voter, pizza.name, pizza.quantity);
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
    async results() {
      const pizzas = voteRowsSchema.parse(totalVotes.all());
      const { count } = countSchema.parse(totalVoters.get());
      return summarize(pizzas, count);
    },
    async close() { database.close(); },
  };
}