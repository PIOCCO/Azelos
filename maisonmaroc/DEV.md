# Local development

## Quick start

```bash
cd maisonmaroc
npm install          # also installs server/ (postinstall)
cp server/.env.example server/.env
npm run migrate      # from maisonmaroc/ (runs server migrate)
npm run dev          # Node 18+ — starts API (:3001) then Vite (:5173)
```

Open **http://localhost:5173**

## `ECONNREFUSED 127.0.0.1:3001`

Vite proxies `/api/*` to the backend. This error means **only the frontend is running**.

| Command | What it does |
|---------|----------------|
| `npm run dev` | API + Vite (use this) |
| `npm run dev:web` | Vite only — `/api` will fail unless you start the server yourself |
| `npm run dev:api` | Backend only on port **3001** |

Check API: http://localhost:3001/api/health → `{"ok":true}`

## `EADDRINUSE` port 3001

Another process is already listening on **3001** (often a previous `npm run dev` or `npm run dev:api` still running).

```bash
# See what holds the port (Linux)
ss -ltnp 'sport = :3001'
# or: lsof -i :3001

# Stop that PID (replace 12345)
kill 12345

# If it does not exit:
kill -9 12345
```

Then start the API again. Alternative: use another port:

```bash
PORT=3002 npm run dev --prefix server
# and set Vite proxy target to 3002 if you use dev:web only
```

Prefer a single **`npm run dev`** from `maisonmaroc/` so you do not start the API twice.

## Two terminals (optional)

```bash
# Terminal 1
cd maisonmaroc/server && npm run dev

# Terminal 2
cd maisonmaroc && npm run dev:web
```
