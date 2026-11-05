import { ballotSchema, type Ballot, type Results } from '../shared/ballots.ts';

export { ballotSchema } from '../shared/ballots.ts';
export type { Ballot, Results } from '../shared/ballots.ts';
export interface BallotStore {
  read(voter: string): Promise<Ballot>;
  replace(voter: string, ballot: Ballot): Promise<void>;
  results(): Promise<Results>;
  close(): Promise<void>;
}

export async function saveBallot(store: BallotStore, voter: string, input: unknown): Promise<Ballot> {
  const ballot = ballotSchema.parse(input);
  await store.replace(voter, ballot);
  return ballot;
}