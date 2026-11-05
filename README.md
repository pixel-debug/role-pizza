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

Para usar Neon localmente, crie `.env` com base em `.env.example` e substitua
`DATABASE_URL` pela URL real do seu banco. O arquivo de exemplo nao contem
credenciais validas. Nao e necessario alterar codigo nem instalar outro driver.

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
- `api/index.ts`: entrada serverless para a Vercel, sem `listen` e sem SQLite.
- `vercel.json`: build Vite e encaminhamento de `/api/*` para a funcao.

Para mudar a regra de quantidade, comece por `MAX_SLICES` e ajuste os textos
de interface correspondentes. Alteracoes de restricoes em bancos existentes
precisam de migracao de esquema.

## Vercel e Neon

O projeto esta preparado para frontend estatico e API Node.js no mesmo
dominio. Nenhuma conta, banco ou publicacao e criada pelos comandos de build.

Configuracao minima para Neon:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-ENDPOINT-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require
DB_POOL_MAX=2
```

Use a URL **pooled** fornecida pelo Neon (host com `-pooler`) e preserve os
parametros de seguranca da URL, incluindo `sslmode=require`. As opcoes de SSL
sao interpretadas pelo driver Postgres; a validacao de certificados nao e
desabilitada pelo aplicativo. `DB_CLIENT=pg` e opcional: a URL seleciona
Postgres automaticamente. Remova um eventual `DB_CLIENT=oracle` ou `sqlite`
antigo ao usar a URL.

Quando voce decidir publicar:

1. Selecione a pasta que contem `package.json` e `vercel.json` como **Root
	Directory**. Se o repositorio contiver a pasta `role-pizza`, selecione-a;
	se ela ja for a raiz do repositorio, mantenha a raiz.
2. Cadastre `DATABASE_URL` nas **Environment Variables** do projeto na Vercel.
	Opcionalmente cadastre `DB_POOL_MAX=2`. Use os ambientes desejados
	(Production e/ou Preview). O `.env` local nao e enviado automaticamente.
3. Use o preset Vite. Build e pasta de saida ja estao configurados em
	`vercel.json`: `npm run build` e `dist`.
4. Publique ou refaca o deploy depois de mudar variaveis na Vercel.

O primeiro acesso a API prepara as tabelas `pizza_voters` e `pizza_votes`
ausentes no banco configurado. Isso exige permissao para criar tabelas;
**nao cria o banco nem a conta no provedor**. Inicializacoes simultaneas sao
serializadas com um lock transacional do Postgres. Os builds nao executam SQL.
Nenhuma conexao e feita apenas por importar os arquivos ou verificar tipos.

A funcao reutiliza sua instancia e pool enquanto estiver ativa. O pool tem
no maximo duas conexoes por instancia por padrao, minimo zero e timeout de
ociosidade. Esse limite nao e global: a Vercel pode iniciar varias instancias.
SQLite e Oracle sao recusados no ambiente Vercel, evitando usar arquivos
efemeros como persistencia. A API e o frontend usam a mesma origem; nao e
necessario configurar CORS ou uma URL de API no React.

Nao use prefixo `VITE_` para credenciais ou para `DATABASE_URL`. Elas devem
ficar apenas no backend. `.env`, variantes locais e `.vercel/` sao ignorados
pelo Git. O rate limit em memoria e por instancia e nao substitui uma
protecao distribuida; o limite de pedacos continua validado no servidor.

## Oracle e Postgres Local

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

Para Postgres com `DATABASE_URL`, nao e preciso preencher `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD` ou `DB_DATABASE`; a URL tem precedencia sobre esses
campos. Os campos opcionais podem ser omitidos, mas nao devem ficar vazios.

`PORT` (3001), `HOST` (0.0.0.0) e `NODE_ENV` (development) tambem sao
configuraveis. Em producao, use HTTPS: o cookie recebe a flag `secure`.
Configuracao ou conexao invalida interrompe a inicializacao, sem fallback.

O adaptador cria as tabelas ausentes na inicializacao. Alteracoes futuras de
esquema ainda exigem migracoes; a preparacao automatica nao altera tabelas
existentes. Trocar `DB_CLIENT` escolhe o adaptador, mas nao transfere dados
entre bancos. A demo SQLite continua disponivel localmente sem variaveis.

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