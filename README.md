# K01 Poker

Private poker club app: leaderboard, stats, games, net balances, and admin session management.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind
- **API:** Vercel serverless (`api/`)
- **Database:** PostgreSQL (Neon in prod, Docker locally)

## Local setup

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:init
npm run dev:full    # Vite + API on http://localhost:3000
```

`DATABASE_URL` in `.env` should point at Docker Postgres (`localhost:5433` by default).

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run db:reset` | Clear all tables |
| `npm run db:seed` | Seed member list (dev) |
| `npm run import:csv` | One-time historical import |

```bash
npm run import:csv -- --type offline --file ./data/offline_game_results_k01.csv
npm run import:csv -- --type online --file ./data/online_game_results_k01.csv
npm run import:csv -- --type tournament --file ./data/tournament.csv --format transposed
```

## Admin

Login in the Admin tab (client-side). Create offline/online cash sessions, online/offline tournaments, record payments, manage members.
