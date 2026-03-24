# Temporal Backend

Backend phase 1 for the Temporal app uses Go, PostgreSQL, and Docker.

## What is included

- HTTP API skeleton with a JSON health endpoint at `GET /v1/health`
- Environment-based configuration
- PostgreSQL schema migrations for users, refresh tokens, countdowns, day notes, favorite days, and user preferences
- Auth endpoints for register, login, refresh, logout, and `GET /v1/me`
- Sync-ready endpoints for countdowns, day notes, and favorite days
- `docker-compose.yml` at the repo root to run `postgres`, `migrate`, and `api`

## Local run without Docker

```bash
go test ./...
go run ./cmd/api
```

The API listens on `http://localhost:8080` by default.

## Local run with Docker

1. Copy `.env.example` to `.env` if you want to override defaults.
2. Start the stack:

```bash
docker compose up --build
```

After startup, the health endpoint will be available at `http://localhost:8080/v1/health`.

## Phase 1 scope

- `countdowns`, `day_notes`, and `favorite_days` are prepared for sync
- `history` remains local-only for now to keep the first sync model simpler
- auth now uses signed access tokens plus refresh token rotation stored in PostgreSQL
