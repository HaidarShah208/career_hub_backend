# Pakistan Career Hub — Backend

A production-grade **monolithic** backend for the Pakistan Career Hub job
portal, built with **Node.js + TypeScript + Express**, **PostgreSQL (TypeORM)**,
and **Redis**. It follows a feature-based clean architecture: each domain is an
isolated module with its own controller, service, repository, routes,
validation, and types.

## Tech Stack

| Concern          | Choice                              |
| ---------------- | ----------------------------------- |
| Runtime          | Node.js (>= 20) + TypeScript        |
| Framework        | Express.js                          |
| Database         | PostgreSQL                          |
| ORM              | TypeORM (`DataSource`, migrations)  |
| Caching          | Redis (`ioredis`)                   |
| Auth             | JWT access + refresh tokens         |
| Password hashing | bcrypt (`bcryptjs`, drop-in compat) |
| Validation       | Zod                                 |
| Logging          | Winston                             |
| File uploads     | Cloudinary + Multer                 |
| API docs         | Swagger UI (`/api-docs`)            |
| Dev runner       | ts-node-dev                         |

## Architecture

```
src/
├── app/            # app.ts (express), routes.ts (router), server.ts (bootstrap)
├── config/         # env, database (DataSource), redis, swagger
├── modules/        # feature modules (auth, users, companies, jobs, applications, admin)
│   └── <feature>/  # *.controller / *.service / *.repository / *.routes / *.validation / *.types / *.entity
├── shared/         # middleware, utils, constants, errors, logger, types, validators
├── database/       # migrations + seeds
└── docs/           # documentation notes
```

**Layering:** `routes → middleware (auth/role/validate) → controller → service
(business rules) → repository (TypeORM) → database`. Controllers never touch the
ORM; repositories never contain business logic.

## Getting Started

### 1. Prerequisites

PostgreSQL and Redis must be reachable. The quickest way is Docker:

```bash
docker compose up -d        # starts postgres:16 + redis:7
```

### 2. Install & configure

```bash
npm install
cp .env.example .env         # then adjust values if needed
```

### 3. Create the schema

Either run the migration (recommended for production):

```bash
npm run migration:run
```

…or let TypeORM auto-create it for local dev by setting `DB_SYNCHRONIZE=true`
in `.env` (the default in `.env.example`).

### 4. Seed the admin & run

```bash
npm run seed                 # creates admin@careerhub.pk / Admin@123 (idempotent)
npm run dev                  # http://localhost:4000
```

- API base path: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api-docs`

## NPM Scripts

| Script                       | Description                                |
| ---------------------------- | ------------------------------------------ |
| `npm run dev`                | Start in watch mode (ts-node-dev)          |
| `npm run build`              | Compile TypeScript to `dist/`              |
| `npm start`                  | Run the compiled server                    |
| `npm run typecheck`          | Type-check without emitting                |
| `npm run seed`               | Seed the default admin user                |
| `npm run migration:generate` | Generate a migration from entity changes   |
| `npm run migration:run`      | Apply pending migrations                   |
| `npm run migration:revert`   | Revert the last migration                  |

> Generate example: `npm run migration:generate -- src/database/migrations/MyChange`

## Authentication

The seeded **admin** can sign in, and **candidates** can self-register via signup.

```
POST /api/v1/auth/signup     { firstName, lastName, email, password } -> { user, accessToken, refreshToken }   (role: CANDIDATE)
POST /api/v1/auth/signin     { email, password }  -> { user, accessToken, refreshToken }
POST /api/v1/auth/refresh    { refreshToken }      -> { accessToken, refreshToken }
POST /api/v1/auth/logout     (Bearer)              -> revokes refresh token
GET  /api/v1/auth/me         (Bearer)              -> current user
```

Candidate signup creates the `User` and an empty `CandidateProfile` in a single
transaction.

Send the access token as `Authorization: Bearer <accessToken>` on protected
routes. Refresh tokens are tracked in Redis to support logout / revocation, and
degrade to signature-only verification if Redis is unavailable.

## API Surface

| Group        | Endpoints                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| Auth         | `POST /auth/signup`, `/auth/signin`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Users        | `GET /users/me`                                                           |
| Candidates   | `GET /candidates/profile`, `PUT /candidates/profile` (candidate only)     |
| Employer Auth| `POST /employers/signup`, `POST /employers/signin`                        |
| Employer     | `POST/GET/PUT/DELETE /employer/company`, `POST/GET /employer/jobs`, `GET/PUT/DELETE /employer/jobs/:id`, `PATCH /employer/jobs/:id/publish`, `PATCH /employer/jobs/:id/close`, `GET /employer/applicants`, `GET /employer/applicants/:id`, `PATCH /employer/applications/:id/status`, `GET /employer/dashboard` (EMPLOYER only) |
| Jobs         | `GET /jobs`, `GET /jobs/:id`, `POST /jobs`, `PUT /jobs/:id`, `DELETE /jobs/:id` (writes admin only) |
| Companies    | `GET /companies`, `GET /companies/:id`, `POST/PUT/DELETE /companies` (writes admin only) |
| Applications | `POST /applications` (candidate), `GET /applications/my` (candidate), `GET /applications/:id`, `PATCH /applications/:id/status` (admin) |
| Admin        | `GET /admin/dashboard`, `/admin/jobs`, `/admin/applications`, `/admin/companies` |
| Uploads      | `POST/DELETE /uploads/avatar`, `/uploads/resume` (candidate), `/uploads/company-logo` (employer) |

**Employer recruiter workflow:** employers self-register (`/employers/signup`),
create exactly **one** company, post/publish/close their own jobs, view only the
applicants for their jobs, and move applicants through the hiring statuses
(`UNDER_REVIEW → SHORTLISTED → INTERVIEW_SCHEDULED → HIRED/REJECTED`). Every
employer route is guarded to the `EMPLOYER` role and scoped to the employer's own
company — they cannot touch admin APIs or another company's data.

**Application timeline:** every status change is recorded in
`application_status_history`. `GET /applications/:id` returns the application
with its ordered `history` (Applied → Under Review → Shortlisted → Hired, etc.),
and status changes are written transactionally alongside the history entry.

`GET /jobs` (default, unfiltered first page) is cached in Redis under
`jobs:all` for 5 minutes; any job create/update/delete invalidates it.

## File Uploads (Cloudinary)

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
in `.env`. When unset, upload endpoints return `503` instead of crashing.

Files stream straight to Cloudinary via `multer-storage-cloudinary`; mime-type,
extension, and size are validated before upload. Replacing a file deletes the
previous asset.

| Upload       | Field  | Formats             | Max   | Stored on                       |
| ------------ | ------ | ------------------- | ----- | ------------------------------- |
| Avatar       | `file` | PNG, JPG, JPEG, WEBP | 5 MB  | `candidate_profiles.avatarUrl`  |
| Resume       | `file` | PDF, DOC, DOCX       | 10 MB | `candidate_profiles.resumeUrl`  |
| Company logo | `file` | PNG, JPG, SVG, WEBP  | 5 MB  | `companies.logo`                |

All upload requests are `multipart/form-data` with a single `file` field and
require a Bearer token (avatar/resume → candidate, company-logo → employer).

## Response Format

```jsonc
// success
{ "success": true, "message": "Success", "data": { } }

// error
{ "success": false, "message": "Error", "errors": [ { "field": "...", "message": "..." } ] }
```

List endpoints add a `meta` object with pagination details.

## Notes

- Role/status fields are stored as `varchar` (backed by TypeScript enums + Zod)
  to keep migrations simple and avoid native PG enum migration pain.
- `bcryptjs` is used in place of native `bcrypt` so the project installs
  cleanly on every OS; the hashing format is identical.
```



# for swager
localhost:4000/api-docs