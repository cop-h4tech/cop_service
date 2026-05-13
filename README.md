# Citizen On Petrol API

NestJS REST API with PostgreSQL, served behind Nginx as a reverse proxy. Provides user authentication via email OTP and password, session management, and user profile handling.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Setup — Docker (recommended)](#setup--docker-recommended)
- [Setup — Local (without Docker)](#setup--local-without-docker)
- [Database Migrations](#database-migrations)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Contribution Guide](#contribution-guide)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Database | PostgreSQL 15 |
| ORM | TypeORM 0.3 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Email | Nodemailer |
| SMS | Twilio (scaffolded, not yet active) |
| Reverse Proxy | Nginx 1.27 |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
citizen-on-petrol-api/
├── src/
│   ├── main.ts                          # Entry point — bootstraps NestJS app
│   ├── app.module.ts                    # Root module (ConfigModule, TypeORM, feature modules)
│   ├── data-source.ts                   # TypeORM DataSource for CLI migrations
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.ts       # Auth routes (signup, login, logout, OTP)
│       │   ├── user.controller.ts       # Profile routes (GET/PATCH /profile)
│       │   ├── auth.module.ts           # Auth feature module
│       │   ├── decorators/
│       │   │   └── current-user.decorator.ts
│       │   ├── dto/
│       │   │   ├── sign-up.dto.ts
│       │   │   ├── sign-in.dto.ts
│       │   │   ├── verify-otp.dto.ts
│       │   │   ├── verify-sms-otp.dto.ts
│       │   │   ├── send-otp.dto.ts
│       │   │   └── update-profile.dto.ts
│       │   ├── entities/
│       │   │   ├── user.entity.ts
│       │   │   ├── otp.entity.ts
│       │   │   ├── session.entity.ts
│       │   │   └── payment-info.entity.ts
│       │   ├── guards/
│       │   │   └── auth.guard.ts        # JWT session guard
│       │   └── services/
│       │       ├── auth.service.ts      # Signup, login, OTP verification, logout
│       │       ├── user.service.ts      # Profile read/update
│       │       ├── session.service.ts   # Session create/validate/revoke
│       │       ├── otp.service.ts       # OTP generation and verification
│       │       ├── email.service.ts     # Nodemailer email delivery
│       │       └── sms.service.ts       # Twilio SMS (not yet active)
│       └── health/
│           ├── health.controller.ts     # GET /health
│           ├── health.module.ts
│           └── health.service.ts
├── test/                                # e2e tests
├── nginx/
│   └── default.conf                     # Nginx reverse proxy config
├── Dockerfile                           # Multi-stage build (dev → builder → runner)
├── docker-compose.yml                   # postgres + pgadmin + api + nginx services
├── .env.example                         # All required environment variables (copy to .env)
├── API_DOCUMENTATION.md                 # Full endpoint reference
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## Prerequisites

### Docker setup
- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+

### Local setup
- [Node.js](https://nodejs.org/) 20+
- [npm](https://www.npmjs.com/) 10+
- PostgreSQL 15 running locally

---

## Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `3000` | Port the API listens on |
| `JWT_SECRET` | *(required)* | Secret key for signing JWT tokens — change this |
| `SESSION_TTL_DAYS` | `30` | Session expiry in days. Set to `0` for no expiry. |
| `DB_HOST` | `postgres` | Database host (`localhost` for local, `postgres` for Docker) |
| `DB_PORT` | `5432` | Database port |
| `DB_USERNAME` | `citizen_on_petrol` | Database user |
| `DB_PASSWORD` | `citizen123` | Database password |
| `DB_NAME` | `citizen_on_petrol` | Database name |
| `DB_TIMEZONE` | `UTC` | Database timezone |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP server host |
| `MAIL_PORT` | `587` | SMTP server port |
| `EMAIL_HOST_USER` | *(required)* | SMTP login email |
| `EMAIL_HOST_PASSWORD` | *(required)* | SMTP app password |
| `TWILIO_ACCOUNT_SID` | *(optional)* | Twilio account SID (SMS not yet active) |
| `TWILIO_AUTH_TOKEN` | *(optional)* | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | *(optional)* | Twilio sender phone number |
| `TWILIO_VERIFY_SERVICE_SID` | *(optional)* | Twilio Verify service SID |

> **Important:** Never commit `.env` to version control. It is git-ignored by default.

---

## Setup — Docker (recommended)

Docker Compose starts PostgreSQL, PgAdmin, the API, and Nginx together.

### 1. Clone and configure

```bash
git clone <repo-url>
cd citizen-on-petrol-api
cp .env.example .env
# Edit .env — set JWT_SECRET, email credentials, etc.
```

### 2. Start all services

```bash
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| API (via Nginx) | http://localhost |
| API (direct) | http://localhost:3000 |
| PgAdmin | http://localhost:5050 |

PgAdmin credentials: `admin@citizen-on-petrol.com` / `admin123`

### 3. Run migrations (first time or after schema changes)

```bash
docker compose run --rm migration npm run migration:run
```

### 4. Check health

```bash
curl http://localhost/health
```

### 5. Stop services

```bash
docker compose down
# To also remove the database volume:
docker compose down -v
```

### Docker service overview

| Service | Image | Role |
|---------|-------|------|
| `postgres` | postgres:15-alpine | Primary database |
| `pgadmin` | dpage/pgadmin4 | Database GUI |
| `api` | local build | NestJS application |
| `nginx` | nginx:1.27-alpine | Reverse proxy on port 80 |
| `migration` | local build | One-shot migration runner (profile: `migration`) |

---

## Setup — Local (without Docker)

Use this when you want to run the API directly on your machine with a local or remote PostgreSQL instance.

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd citizen-on-petrol-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — set `DB_HOST=localhost` and fill in your local PostgreSQL credentials.

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE citizen_on_petrol_db;"
```

### 4. Run migrations

```bash
# to genarte new migrations
npm run migration:generate 
# in dev server
npm run migration:run
# if in production server
npm run migrtion:run:prod
```

### 5. Start the development server

```bash
npm run start:dev
```

The API is available at http://localhost:3000.

```bash
curl http://localhost:3000/health
```

---

## Database Migrations

TypeORM migrations are used to manage schema changes. The `src/data-source.ts` file is the CLI entry point.

| Command | Description |
|---------|-------------|
| `npm run migration:run` | Apply all pending migrations |
| `npm run migration:revert` | Revert the last applied migration |
| `npm run migration:generate` | Generate a migration from entity diff |
| `npm run migration:create` | Create an empty migration file |
| `npm run migration:run:prod` | Run migrations from compiled `dist/` (production) |

> **Docker:** Prefix any migration command with `docker compose run --rm migration` to run it inside the container.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start with hot-reload (development) |
| `npm run start` | Start without hot-reload |
| `npm run start:prod` | Start compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Run ESLint (zero warnings enforced) |
| `npm run test` | Run unit tests with Jest |
| `npm run test:e2e` | Run end-to-end tests |

---

## API Overview

Full endpoint reference is in [API_DOCUMENTATION.md](API_DOCUMENTATION.md). Quick summary:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register a new user |
| POST | `/auth/verify/email-otp` | No | Activate account with email OTP |
| POST | `/auth/login` | No | Login (OTP or password mode) |
| POST | `/auth/login/otp` | No | Step 2 of OTP login — submit OTP |
| POST | `/auth/logout` | Yes | Revoke session token |
| GET | `/profile` | Yes | Get authenticated user profile |
| PATCH | `/profile` | Yes | Update profile fields |
| PATCH | `/profile/payment-info` | Yes | Upsert payment information |
| GET | `/health` | No | Health check |

Authenticated endpoints require:
```
Authorization: Bearer <token>
```

---

## Contribution Guide

### Branching

| Branch pattern | Purpose |
|----------------|---------|
| `main` | Production-ready code |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Tooling, deps, config |
| `docs/<name>` | Documentation only |

Always branch off `main` and open a pull request back to `main`.

### Development workflow

```bash
# 1. Create a branch
git checkout -b feat/my-feature

# 2. Make changes — keep commits focused and descriptive
git commit -m "feat: add password reset endpoint"

# 3. Ensure lint passes with zero warnings
npm run lint

# 4. Run tests
npm run test

# 5. Push and open a PR
git push origin feat/my-feature
```

### Code conventions

- **TypeScript strict mode** — no implicit `any`, no unused variables.
- **NestJS patterns** — one module per domain, services handle business logic, controllers handle HTTP only.
- **DTOs** — all request bodies must have a DTO with `class-validator` decorators.
- **Entities** — all schema changes go through a TypeORM migration. Never use `synchronize: true` in production.
- **Naming** — acronyms (DTO, OTP, SMS, JWT) are always ALL-CAPS in class names, method names, and variables.
- **Comments** — only when the *why* is non-obvious. No docblocks for self-explanatory methods.
- **Lint** — `npm run lint` must pass with zero warnings before opening a PR.

### Adding a new module

1. Create `src/modules/<name>/` with a module, controller, service, entities, and DTOs.
2. Import the new module in `src/app.module.ts`.
3. Register any new entities in both `app.module.ts` and `src/data-source.ts`.
4. Generate and run a migration for schema changes.

### Pull request checklist

- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run test` passes
- [ ] Migrations generated and committed for any entity changes
- [ ] `.env.example` updated for any new environment variables
