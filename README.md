# Pizza do time

Votacao de pedacos para a confraternizacao, com React, TypeScript e Express.

## Executar

Requer Node.js >= 22.18.0.

```sh
npm install
npm run dev
```

Frontend: http://localhost:5173. API: http://localhost:3001/api.
Sem configuracao, usa SQLite em `data/pizza.sqlite`.

```sh
npm run typecheck
npm run build
npm start
```

`typecheck` verifica tipos sem executar testes. `build` gera o frontend em
`dist`; `start` serve a API e esse build na porta da API.

## Estrutura

- `shared/ballots.ts`: contratos, validacao Zod e limite de pedacos compartilhados.
- `src/App.tsx`: composicao da pagina, sem acesso direto a HTTP ou banco.
- `src/components/`: cardapio, cartoes, resumo do pedido e dialogs acessiveis.
- `src/hooks/usePizzaOrder.ts`: estado, envio, sincronizacao e ciclo das requisicoes.
- `src/services/pizza-api.ts`: HTTP e validacao das respostas em tempo de execucao.
- `src/menu.ts`: catalogo e imagens exclusivamente no frontend.
- `server/index.ts`: inicializacao e encerramento do servidor.
- `server/config.ts`: leitura e validacao das variaveis de ambiente.
- `server/app.ts`: composicao do Express com dependencias injetadas.
- `server/http/`: rotas, identificacao anonima, protecoes e tratamento de erros.
- `server/ballots.ts`: regra de gravacao e interface `BallotStore`.
- `server/store.ts`: fabrica de persistencia e exports compativeis.
- `server/stores/`: adaptadores SQLite e SQL (Oracle/Postgres).

Para mudar a regra de quantidade, comece por `MAX_SLICES` e ajuste os textos
de interface correspondentes. Alteracoes de restricoes em bancos existentes
precisam de migracao de esquema.

## Oracle e Postgres

Defina em `.env` os valores do seu ambiente. Nao versione credenciais.

| Variavel | Oracle | Postgres |
| --- | --- | --- |
| DB_CLIENT | oracle | pg |
| DB_HOST | localhost | localhost |
| DB_PORT | 1521 | 5432 |
| DB_USER | obrigatorio | obrigatorio |
| DB_PASSWORD | obrigatorio | obrigatorio |
| DB_SERVICE | FREEPDB1 | nao utilizado |
| DB_DATABASE | nao utilizado | pizza |

`PORT` (3001), `HOST` (0.0.0.0) e `NODE_ENV` (development) tambem sao
configuraveis. Em producao, use HTTPS: o cookie recebe a flag `secure`.
Configuracao ou conexao invalida interrompe a inicializacao, sem fallback.

O adaptador cria as tabelas ausentes na inicializacao para uso local. Em
producao, gerencie o esquema com migracoes e privilegios restritos. Trocar
`DB_CLIENT` escolhe o adaptador, mas nao transfere dados entre bancos.

## Contrato HTTP

- `GET /api/me`: retorna `{ ballot: [{ name, quantity }] }` da pessoa atual.
- `PUT /api/ballot`: recebe um array de `{ name, quantity }` e substitui o pedido.
- `GET /api/results`: retorna `{ pizzas, participants, slices }` com totais.
- `GET /api/health`: informa o processo e o adaptador configurado; nao verifica conectividade.

Quantidades devem ser inteiras positivas, nomes nao podem se repetir e a
soma deve ser no maximo tres. Um array vazio cancela os votos. Erros HTTP
usam `{ error: string }`. A substituicao dos votos ocorre em transacao.

O banco guarda apenas o identificador anonimo, o nome do sabor e a quantidade.
O limite e por cookie/navegador, nao por identidade autenticada: trocar de
navegador ou apagar cookies permite outro pedido. Para garantir um pedido por
pessoa em producao, sera necessario autenticar os participantes.

As fotos sao ilustrativas. Alergenicos devem ser confirmados com a pizzaria.