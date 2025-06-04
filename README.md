# ENS PG

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)
- [Docker Engine](https://docs.docker.com/engine/install/)

## Development Quickstart

1. Install dependencies

```
yarn install
```

2. Copy *packages/nextjs/.env.example* file to *packages/nextjs/.env.development* and review the data.

3. Spin up the Postgres database service + create database + seed

```
docker-compose up -d
yarn drizzle-kit push
yarn seed
```

See more info about the database in the section below

4. Run a local network in the first terminal:

```
yarn chain
```

5. On a second terminal, deploy the contract:

```
yarn deploy
```

6. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`

## Database (dev info)

We are using Drizzle with Postgres. You can run `drizzle-kit` from the root with `yarn drizzle-kit`

To iterate on the database:

- Tweak the schema in `schema.ts`
- Run `yarn drizzle-kit push` to apply the changes.
- Tweak `seed.js` if needed + run `yarn seed` (will delete existing data)
- You can explore the database with `yarn drizzle-kit studio`

After the initial iterations, we can start using migrations (`yarn drizzle-kit generate` & `yarn drizzle-kit migrate`)

## Ponder info

After deploying contract on testnet/mainnet update `packages/ponder/ponder.config.ts` with respective network, contract address and startBlock.

To run ponder dev server:

```bash
yarn ponder:dev
```
