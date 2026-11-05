import { z } from 'zod';
import { ballotResponseSchema, resultsSchema, type Ballot, type BallotResponse, type Results } from '../../shared/ballots.ts';

const errorSchema = z.object({ error: z.string() });

async function request<Output>(path: string, schema: z.ZodType<Output>, options?: RequestInit): Promise<Output> {
  const headers = new Headers(options?.headers);
  if (options?.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api/${path}`, { ...options, headers });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = errorSchema.safeParse(payload);
    throw new Error(error.success ? error.data.error : 'Não foi possível falar com o forno. Tente novamente.');
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new Error('O forno enviou uma resposta inesperada. Tente novamente.');
  return parsed.data;
}

export const pizzaApi = {
  readBallot(signal?: AbortSignal): Promise<BallotResponse> {
    return request('me', ballotResponseSchema, { signal });
  },
  saveBallot(ballot: Ballot, signal?: AbortSignal): Promise<BallotResponse> {
    return request('ballot', ballotResponseSchema, { method: 'PUT', body: JSON.stringify(ballot), signal });
  },
  results(signal?: AbortSignal): Promise<Results> {
    return request('results', resultsSchema, { signal });
  },
};