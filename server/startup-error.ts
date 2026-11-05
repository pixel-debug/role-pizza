import { ConfigurationError } from './config.ts';

const databaseErrors: Record<string, string> = {
  '28P01': 'Autenticacao Postgres recusada. Confira as credenciais na Vercel.',
  '28000': 'Acesso Postgres recusado. Confira o usuario e os requisitos de SSL.',
  '3D000': 'O banco Postgres configurado nao existe.',
  '42501': 'Permissao insuficiente no Postgres para preparar ou acessar as tabelas.',
  '53300': 'Limite de conexoes Postgres atingido. Use a URL pooled do Neon.',
  ENOTFOUND: 'Host do Postgres nao encontrado. Confira o endpoint na Vercel.',
  EAI_AGAIN: 'Falha temporaria ao resolver o host do Postgres.',
  ECONNREFUSED: 'Conexao Postgres recusada pelo endpoint configurado.',
  ECONNRESET: 'Conexao Postgres interrompida.',
  ETIMEDOUT: 'Tempo limite ao conectar ao Postgres.',
  CERT_HAS_EXPIRED: 'O certificado TLS do Postgres expirou.',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'Certificado TLS do Postgres nao confiavel.',
  SELF_SIGNED_CERT_IN_CHAIN: 'Cadeia de certificados TLS do Postgres nao confiavel.',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'Nao foi possivel validar o certificado TLS do Postgres.',
};

export function startupErrorDetails(error: unknown): { stage: string; code: string; message: string } {
  if (error instanceof ConfigurationError) {
    return { stage: 'configuration', code: 'INVALID_CONFIGURATION', message: error.message };
  }
  if (typeof error === 'object' && error !== null && 'code' in error &&
      typeof error.code === 'string' && Object.hasOwn(databaseErrors, error.code)) {
    return { stage: 'database', code: error.code, message: databaseErrors[error.code]! };
  }
  if (error instanceof Error && error.name === 'KnexTimeoutError') {
    return { stage: 'database', code: 'POOL_TIMEOUT', message: 'Tempo limite ao obter conexao Postgres. Confira endpoint, disponibilidade do Neon e limite do pool.' };
  }
  return { stage: 'initialization', code: 'UNKNOWN', message: 'Falha nao classificada na inicializacao da API.' };
}
