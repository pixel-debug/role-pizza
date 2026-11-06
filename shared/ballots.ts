import { z } from 'zod';

export const MAX_SAVORY_PIZZAS = 3;
export const MAX_SWEET_PIZZAS = 1;
export const MAX_SLICES = MAX_SAVORY_PIZZAS + MAX_SWEET_PIZZAS;

export const SWEET_PIZZA_NAMES = [
  'Morango com chocolate',
  'Banana com chocolate',
  'Chocolate',
  'Banana',
] as const;

const sweetPizzaNames = new Set<string>(SWEET_PIZZA_NAMES);

export function isSweetPizza(name: string): boolean {
  return sweetPizzaNames.has(name);
}

export function countPizzas(ballot: Ballot, sweet: boolean): number {
  return ballot.reduce((total, item) => total + (isSweetPizza(item.name) === sweet ? item.quantity : 0), 0);
}

export const ballotSchema = z.array(z.object({
  name: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(1).max(MAX_SLICES),
}).strict()).max(MAX_SLICES).superRefine((items, context) => {
  const ballot = items as Ballot;
  if (countPizzas(ballot, false) > MAX_SAVORY_PIZZAS) {
    context.addIssue({ code: 'custom', message: 'Sao permitidas no maximo 3 pizzas salgadas por pessoa.' });
  }
  if (countPizzas(ballot, true) > MAX_SWEET_PIZZAS) {
    context.addIssue({ code: 'custom', message: 'E permitida no maximo 1 pizza doce por pessoa.' });
  }
  if (new Set(items.map(item => item.name)).size !== items.length) {
    context.addIssue({ code: 'custom', message: 'Agrupe os pedacos do mesmo sabor.' });
  }
});

export type Ballot = z.infer<typeof ballotSchema>;
export type BallotItem = Ballot[number];

export const ballotResponseSchema = z.object({ ballot: ballotSchema });
export const resultsSchema = z.object({
  pizzas: z.array(z.object({ name: z.string(), quantity: z.number().int().nonnegative() })),
  participants: z.number().int().nonnegative(),
  slices: z.number().int().nonnegative(),
});

export type BallotResponse = z.infer<typeof ballotResponseSchema>;
export type Results = z.infer<typeof resultsSchema>;

export function countSlices(ballot: Ballot): number {
  return ballot.reduce((total, item) => total + item.quantity, 0);
}
