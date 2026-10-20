# Bookmarks — Docker Compose Practice App

A small bookmarks manager: save links, tag them, delete them, and track click counts.

Deliberately different from the `expense` app in a few ways, so you hit new decisions:
- **Postgres** instead of MongoDB (different port, different env var shape, different official image)
- **Redis** added as a second data store (click counters) — a 4th service in your compose file
- **Frontend has no build step** — plain HTML/CSS/JS, no Vite/React. This means your frontend Dockerfile doesn't need a multi-stage build the way the last one did — think about what that changes.

No Dockerfiles or compose file are included. That's for you to write, using everything you already worked through on the `expense` app.

## Structure

```
bookmarks-app/
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── redisClient.js
│       └── routes/bookmarks.js
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── nginx/default.conf
└── .env.example
```

## What the backend needs to run

- Listens on `process.env.PORT`, defaulting to **4000** if unset
- Reads `DATABASE_URL` — a full Postgres connection string
- Reads `REDIS_URL` — a full Redis connection string
- Reads `CORS_ORIGIN` (optional, defaults to `*`)
- On startup, it creates its own `bookmarks` table automatically — no manual migration step needed, just a reachable, running Postgres instance
- Entry point: `src/server.js`

## API routes

- `GET /api/health` — reports Postgres and Redis connection status
- `GET /api/bookmarks` — list all bookmarks
- `POST /api/bookmarks` — create one (`{ title, url, tag }`)
- `DELETE /api/bookmarks/:id` — delete one
- `POST /api/bookmarks/:id/click` — increment a Redis counter
- `GET /api/bookmarks/:id/clicks` — read the current click count

## What the frontend needs

- Static files only (`index.html`, `style.css`, `script.js`) — no build tooling required at all
- `nginx/default.conf` is provided, already configured to proxy `/api/` to a host named `backend` on port `4000` — matching the backend's default port above
- NGINX listens on port 80 internally, same as before

## Things you'll need to research/decide yourself this time (deliberately not told here)

- The official Postgres image's required environment variables to initialize a database, user, and password on first run
- The official Redis image — does it need any environment variables at all for a basic setup?
- Whether Postgres and Redis need Dockerfiles of their own (think back to how you reasoned about Mongo)
- How your backend's `DATABASE_URL` needs to be shaped once you decide Postgres's service name, user, password, and database name
- Whether your frontend Dockerfile needs one stage or two, given there's no build step this time
