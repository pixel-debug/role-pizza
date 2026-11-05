import { countSlices, type Ballot, type Results } from '../../shared/ballots.ts';

export function summarize(pizzas: Ballot, participants: number): Results {
  return { pizzas, participants, slices: countSlices(pizzas) };
}