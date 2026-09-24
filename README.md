# Azelos

Client project: **APIO** — bilingual Moroccan real-estate marketplace.

## Run the marketplace

From the **repo root** (`Azelos/`) or from `maisonmaroc/`:

```bash
# Repo root (Azelos/)
npm run install:app
cp maisonmaroc/server/.env.example maisonmaroc/server/.env
npm run migrate
npm run dev

# Or inside the app folder
cd maisonmaroc
npm install
cp server/.env.example server/.env
npm run migrate
npm run dev
```

Open **http://localhost:5173**. Auth and messaging need the API on **http://localhost:3001** (`npm run dev` starts both).

See [maisonmaroc/DEV.md](maisonmaroc/DEV.md) for troubleshooting (`ECONNREFUSED :3001`, Node 18+).

See [maisonmaroc/README.md](maisonmaroc/README.md) for features, pages, and data model.
