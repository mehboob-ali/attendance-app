# Copilot instructions for attendance-app

This repository is a small two-part app: a Vite + React client and an Express + Mongoose API server.

Quick orientation
- Root layout: `client/` (React + Vite + Leaflet) and `server/` (Express, MongoDB via Mongoose).
- API base path: server mounts routes under `/api/*` (see `server/src/app.js`).
- Auth: JWT-based. Server expects `Authorization: Bearer <token>` and sets `req.user` in `server/src/middleware/auth.js`.
- Client stores session in localStorage via `client/src/lib/auth.js` and the axios instance in `client/src/lib/api.js` attaches the Bearer token automatically.

Run & dev commands (project-specific)
- Start server in dev: from `server/` run `npm run dev` (uses nodemon; ensure `JWT_SECRET` and `MONGO_URI` are set).
- Start client in dev: from `client/` run `npm run dev` (Vite). The client uses `VITE_API_URL` to override the API base URL (default `http://localhost:4000/api`).
- Seed DB: `npm run seed` in `server/` (script at `server/scripts/seed.js`).
- Health: server provides `/health` for quick checks.

Important env variables
- `JWT_SECRET` — required by the server (app will fail fast if missing).
- `MONGO_URI` — MongoDB connection string used by `server/src/config/db.js`.
- `CORS_ORIGINS` — comma-separated origins allowed by CORS; if empty, same-origin/non-browser requests are allowed (see `server/src/app.js`).

Architecture & patterns to follow
- Layering: controllers -> services -> models. Controllers in `server/src/controllers/*` call services in `server/src/services/*`; services handle DB via models in `server/src/models/*`.
  - Example: `geofences.controller.js` calls `geofence.service.js` which updates `Geofence` and `User` models.
- Soft deletes & side-effects: geofence deletion marks `active: false` and removes references from users (`server/src/services/geofence.service.js`). Prefer marking inactive rather than hard deletes where shown.
- Geo data: geofences use a `2dsphere` geometry with `{ type: 'Point'|'Polygon', coordinates: [...] }` and optional `radiusMeters` (see `server/src/models/Geofence.js`). Use GeoJSON order (longitude, latitude).
- Auth & roles: use `server/src/middleware/auth.js` to enforce JWT auth and `server/src/middleware/roles.js` (`allowRoles(...)`) for role-based routes.

Client-side conventions
- API helper: use `client/src/lib/api.js` for all HTTP requests to leverage auth handling and automatic 401 redirect behavior.
- Session: use `setSession`/`getUser`/`clearSession` in `client/src/lib/auth.js` to manage token and user.
- UI pattern: small presentational components live in `client/src/components/ui/*`. Map editors are in `client/src/components/map/*` (e.g. `GeofenceEditor.jsx`). Pages call the API via `api` (example: `client/src/pages/admin/Geofences.jsx`).

Integration notes & gotchas
- The client assumes the API supports standard REST under `/geofences`, `/punch`, `/auth`, etc. Look at `server/src/routes/*` to confirm request shapes.
- On 401 responses the client will `clearSession()` and redirect to `/login?next=...` (see `client/src/lib/api.js`). If adding endpoints that require auth, ensure they return 401 when token is missing/invalid to trigger this behavior.
- CORS: the server restricts origins using `CORS_ORIGINS`; update this when running the client from a different host/port.
- Rate limiting: applied to `/api/` (see `server/src/app.js`). Request-heavy tests may be rate-limited during development.

Where to look for examples
- Auth flow: `server/src/controllers/auth.controller.js`, `server/src/middleware/auth.js`, `client/src/lib/auth.js`, `client/src/pages/Login.jsx`.
- Geofencing flow: `server/src/models/Geofence.js`, `server/src/services/geofence.service.js`, `client/src/pages/admin/Geofences.jsx`, `client/src/components/map/GeofenceEditor.jsx`.
- Error handling: `server/src/middleware/error.js` logs server errors and includes stack traces only when `NODE_ENV === 'development'`.

Editing & testing guidance for AI agents
- Preserve ES module syntax (repo uses `type: module`) and follow existing filenames/exports.
- Add new API routes under `server/src/routes/` and follow controller -> service -> model layering.
- When modifying client API usage, prefer `client/src/lib/api.js` so auth & redirects remain centralized.
- No automated tests were discovered; validate changes by running the server (`npm run dev`) and client (`npm run dev`) and exercising endpoints from the UI or curl/postman.

If unsure, read these files first:
- `server/src/app.js`, `server/src/middleware/auth.js`, `server/src/middleware/roles.js`
- `server/src/services/geofence.service.js`, `server/src/models/Geofence.js`
- `client/src/lib/api.js`, `client/src/lib/auth.js`, `client/src/pages/admin/Geofences.jsx`

If anything above is missing or unclear, ask a human for the expected behavior (especially schema changes or security-sensitive changes like auth flows).
