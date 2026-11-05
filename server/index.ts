import { createApp } from './app.ts';
import { readConfig } from './config.ts';
import { createStore } from './store.ts';

const config = readConfig();
const store = await createStore(config.database);
const app = createApp(store, config);
const server = app.listen(config.port, config.host, () => {
  console.log(`Pizza API: http://localhost:${config.port} | banco: ${config.database.client}`);
  if (config.database.client === 'sqlite') console.log('Modo demonstracao SQLite. Configure .env para usar Oracle.');
});

let shuttingDown = false;

function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => {
    void store.close().catch((error: unknown) => {
      console.error('Falha ao fechar o banco:', error);
      process.exitCode = 1;
    });
  });
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, shutdown);
server.on('error', (error: Error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exitCode = 1;
  shutdown();
});