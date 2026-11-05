import { Router, type Request, type Response } from 'express';
import type { BallotResponse, Results } from '../../shared/ballots.ts';
import { saveBallot, type BallotStore } from '../ballots.ts';
import type { DatabaseConfig } from '../config.ts';
import type { ApiError, VoterLocals } from './middleware.ts';

type ApiResponse<Body> = Response<Body, VoterLocals>;
type BallotRequest = Request<Record<string, string>, BallotResponse, unknown>;

export function createApiRouter(store: BallotStore, client: DatabaseConfig['client']): Router {
  const router = Router();

  router.get('/health', (_request, response: Response<{ status: 'ok'; database: DatabaseConfig['client'] }>) => {
    response.json({ status: 'ok', database: client });
  });

  router.get('/me', async (_request, response: ApiResponse<BallotResponse>) => {
    response.json({ ballot: await store.read(response.locals.voter) });
  });

  router.get('/results', async (_request, response: ApiResponse<Results>) => {
    response.json(await store.results());
  });

  router.put('/ballot', async (request: BallotRequest, response: ApiResponse<BallotResponse>) => {
    const ballot = await saveBallot(store, response.locals.voter, request.body);
    response.json({ ballot });
  });

  router.use((_request, response: Response<ApiError>) => {
    response.status(404).json({ error: 'Rota nao encontrada.' });
  });

  return router;
}