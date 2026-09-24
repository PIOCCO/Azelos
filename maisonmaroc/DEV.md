# Local development

## Quick start

```bash
cd maisonmaroc
npm install          # also installs server/ (postinstall)
cd server && cp .env.example .env && npm run migrate && cd ..
npm run dev          # starts API (:3001) then Vite (:5173)
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

## Two terminals (optional)

```bash
# Terminal 1
cd maisonmaroc/server && npm run dev

# Terminal 2
cd maisonmaroc && npm run dev:web
```
