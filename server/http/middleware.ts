import { createHash, randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export interface VoterLocals {
  voter: string;
}

export interface ApiError {
  error: string;
}

const VOTER_COOKIE = 'pizza_voter';
const VOTER_TOKEN_PATTERN = /^[0-9a-f-]{36}$/i;
const COOKIE_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

export const apiHeaders: RequestHandler = (_request, response, next): void => {
  response.set('Cache-Control', 'no-store');
  response.set('X-Content-Type-Options', 'nosniff');
  next();
};

export function identifyVoter(production: boolean): RequestHandler<Record<string, string>, ApiError, unknown, unknown, VoterLocals> {
  return (request, response, next): void => {
    if (request.method !== 'GET' && request.headers['sec-fetch-site'] === 'cross-site') {
      response.status(403).json({ error: 'Pedido de outra origem nao permitido.' } satisfies ApiError);
      return;
    }

    const cookie = request.headers.cookie?.split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(`${VOTER_COOKIE}=`))
      ?.slice(VOTER_COOKIE.length + 1);
    const token = cookie && VOTER_TOKEN_PATTERN.test(cookie) ? cookie : randomUUID();

    if (token !== cookie) {
      response.cookie(VOTER_COOKIE, token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: production,
        maxAge: COOKIE_LIFETIME_MS,
      });
    }
    response.locals.voter = createHash('sha256').update(token).digest('hex');
    next();
  };
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next): void => {
  if (response.headersSent) { next(error); return; }
  if (error instanceof ZodError) {
    response.status(400).json({ error: error.issues[0]?.message || 'Pedido invalido.' } satisfies ApiError);
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'JSON invalido.' } satisfies ApiError);
    return;
  }
  if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
    response.status(413).json({ error: 'Pedido grande demais. Envie apenas seus pedacos.' } satisfies ApiError);
    return;
  }
  console.error(error);
  response.status(500).json({ error: 'O forno deu uma pausa. Tente novamente.' } satisfies ApiError);
};