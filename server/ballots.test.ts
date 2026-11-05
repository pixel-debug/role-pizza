import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveBallot } from './ballots.ts';
import { sqliteStore } from './store.ts';

test('limita a tres pedacos e nao altera o banco ao rejeitar', async () => {
  const store = sqliteStore(':memory:');
  try {
    await saveBallot(store, 'alice', [{ name: 'Calabresa', quantity: 3 }]);
    await assert.rejects(saveBallot(store, 'alice', [{ name: 'Calabresa', quantity: 3 }, { name: 'Chocolate', quantity: 1 }]));
    assert.deepEqual(await store.read('alice'), [{ name: 'Calabresa', quantity: 3 }]);
  } finally { await store.close(); }
});

test('reedicao substitui votos e resultados contam pessoas e pedacos', async () => {
  const store = sqliteStore(':memory:');
  try {
    await saveBallot(store, 'alice', [{ name: 'Calabresa', quantity: 3 }]);
    await saveBallot(store, 'bob', [{ name: 'Chocolate', quantity: 2 }]);
    await saveBallot(store, 'alice', [{ name: 'Chocolate', quantity: 1 }]);
    assert.deepEqual(await store.results(), { pizzas: [{ name: 'Chocolate', quantity: 3 }], participants: 2, slices: 3 });
    await saveBallot(store, 'alice', []);
    assert.equal((await store.results()).participants, 1);
  } finally { await store.close(); }
});

test('rejeita duplicatas, fracionarios, negativos e payloads invalidos', async () => {
  const store = sqliteStore(':memory:');
  try {
    for (const input of [[{ name: 'Pizza', quantity: 1.5 }], [{ name: 'Pizza', quantity: -1 }], [{ name: '', quantity: 1 }], [{ name: 'Pizza', quantity: 1 }, { name: 'Pizza', quantity: 1 }], null]) {
      await assert.rejects(saveBallot(store, 'alice', input));
    }
    assert.equal((await store.results()).slices, 0);
  } finally { await store.close(); }
});