# LawyerUp Backend

Backend API service for the LawyerUp platform, built with Express and MongoDB (Mongoose), with integrations for AWS S3, SendGrid, and Firebase Cloud Messaging.

## Tech Stack

- Node.js + Express
- Babel (ES module transpilation/runtime)
- MongoDB + Mongoose
- Swagger UI for API docs
- AWS S3 for document uploads
- SendGrid for email delivery

## Project Structure

- `index.js` - entrypoint that loads env vars and starts the app
- `app.js` - HTTP server bootstrap
- `bin/server.js` - Express app wiring, middleware, routes, DB init, S3 bucket check/create
- `src/` - feature modules and services
  - `src/auth` - authentication endpoints
  - `src/user` - user/profile/notification/transaction and upload endpoints
  - `src/states`, `src/settings`, `src/contactUs`, `src/raiseLaw`, `src/lawsCategories`, `src/dashboard`
  - `src/services/common` - shared integrations (S3, SendGrid, Firebase, Stripe/Twilio stubs)
- `database/models` - Mongoose models
- `database/Seed` - seed data loaded at startup
- `config/` - environment-based config and Swagger spec
- `docker-compose.yml` / `Dockerfile` - containerized local setup

## Prerequisites

- Node.js (recommended LTS)
- npm or yarn
- MongoDB (local or remote)

## Environment Variables

Create a `.env` file in the project root. The app reads variables via `dotenv`.

```bash
# App
PORT=3000
MONGO_DB_URI=mongodb://localhost:27017/lawyerup
PRIVATE_JWT_SECRET=replace-with-strong-secret
WEB_URL_LANDING=https://example.com/
LAWYER_UP_HELP_EMAIL=no-reply@example.com

# Mongo-related config object fields (legacy/shared config usage)
DB_HOST=localhost
DB_USER_NAME=root
DB_PASSWORD=secret
DB_PORT=3306
DB_DATABASE=lawyerup
DB_DIALECT=mysql

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET=your-bucket-name

# Email
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_EMAIL=no-reply@example.com
GMAIL_USERNAME=your-gmail@example.com
GMAIL_PASSWORD=your-gmail-password

# Push notifications
FCM_SERVER_KEY=your-fcm-server-key

# Location tracking and reverse geocoding
LOCATION_MIN_UPDATE_SECONDS=30
REVERSE_GEOCODE_URL=https://nominatim.openstreetmap.org/reverse
REVERSE_GEOCODE_USER_AGENT=lawyerup-backend/1.0
REVERSE_GEOCODE_COUNTRY=us
```

Notes:
- On startup, the app attempts to ensure `AWS_BUCKET` exists.
- The server auto-runs seed insertion from `database/Seed` when core role data is missing.

## Install

Using npm:

```bash
npm install
```

Using yarn:

```bash
yarn install
```

## Run Locally

Development (nodemon):

```bash
npm run dev
```

Staging:

```bash
npm run staging
```

Production:

```bash
npm start
```

Server defaults:
- Base URL: `http://localhost:3000`
- Health check: `GET /`
- API docs: `GET /api-docs`

## Docker

Build and run with Docker Compose:

```bash
docker compose up --build
```

This starts:
- `mongo_db` on `2717 -> 27017`
- API service on `3000`

The API container reads environment variables from `.env`.

## Routes (Top-level prefixes)

- `/auth`
- `/user`
- `/states`
- `/settings`
- `/contact-us`
- `/laws`
- `/category`
- `/api-docs`

## Migrations and Seeds

Package scripts include:

```bash
npm run migration
npm run seed
```

These scripts call `sequelize-cli` and are kept for compatibility; current runtime data access in this codebase uses Mongoose models and startup seeding in `src/helpers/db.js`.

## Testing and Linting

- `npm test` is currently a placeholder and exits with an error.
- `npm run pretest` runs ESLint with auto-fix.

## Deployment

A PM2 config is provided at `ecosystem.config.js`.

## Additional API Docs

- Location tracking APIs for Flutter: `docs/location-tracking-apis.md`
- System architecture (APIs + DB): `docs/system-architecture.md`
- Laws CSV template spec: `docs/laws-csv-template.md`
- CSV sample files: `docs/samples/laws-template.csv`, `docs/samples/laws-template-invalid.csv`
- Law storage schema (implemented models): `docs/law-storage-schema.md`
- Admin laws APIs: `docs/admin-laws-apis.md`
