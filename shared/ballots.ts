import { z } from 'zod';

export const MAX_SLICES = 3;

export const ballotSchema = z.array(z.object({
  name: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(1).max(MAX_SLICES),
}).strict()).max(MAX_SLICES).superRefine((items, context) => {
  if (countSlices(items) > MAX_SLICES) {
    context.addIssue({ code: 'custom', message: 'Calma, calabreso! Sao no maximo 3 pedacos por pessoa.' });
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