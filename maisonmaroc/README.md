# APIO

A complete, bilingual **Moroccan real-estate marketplace** built with React + Vite +
TypeScript + Tailwind CSS.

- **Arabic (RTL) by default**, full **French (LTR)** alternative — switch anytime with `العربية | Français`.
- Realistic, internally consistent seed data: **20 properties**, **8 agents/owners**, focused on **Oujda and the Oriental region** (9 cities).
- Connected marketplace: property → owner → all of that owner's listings → another property.

## Features

- Homepage: hero search, featured, popular cities, verified owners, latest listings.
- Search page: rich filters (transaction, city, neighborhood, type, price, surface, rooms,
  amenities, verified), sorting, grid/list views, pagination, mobile filter drawer.
- Property details: image gallery, key facts, description, amenities, OpenStreetMap, similar
  properties, and a trustworthy owner/agent contact card.
- Owner profiles: bio, rating, reviews, contact, and **all** of the owner's properties.
- Favorites (persisted in `localStorage`), publish wizard with live preview (new listings are
  saved to `localStorage` and appear in search/home), login/register, and a user account page.
- Contact flow: call / WhatsApp / prefilled contact form per property.
- Fully responsive with a mobile bottom navigation and sticky contact bar.

## Getting started

### Frontend (marketplace)

```bash
cd maisonmaroc
npm install
cp server/.env.example server/.env
npm run migrate
npm run dev       # Node 18+ — API :3001 + Vite :5173
# Frontend only (API must run separately): npm run dev:web
# See DEV.md if you see ECONNREFUSED :3001
npm run build        # default: works at site root **or** in /apio, /AIPO, /APIO
npm run build:dribex # explicit base for https://dribex.ma/apio/ (same as before)
npm run build:aipo   # explicit base for https://your-domain.com/AIPO/
npm run preview      # preview the production build
```

### Deploy on dribex.ma (`/apio`) or `/AIPO`

**If it worked yesterday and shows 404 today**, the files are usually missing on the server or the wrong build was uploaded (root `/` assets into a subfolder). Re-upload after building:

```bash
npm run build:dribex   # for dribex.ma/apio/
# or
npm run build          # one build for /apio, /AIPO, or domain root (relative assets)
```

Upload everything inside **`dist/`** into the folder that maps to that URL (e.g. `public_html/apio/` or `AIPO/`). Open **`https://dribex.ma/apio/`** or **`https://your-domain.com/AIPO/`** with a trailing slash.

Apache: `public/.htaccess` is copied into `dist/` for SPA fallback. Nginx example:

```nginx
location /apio/ {
  alias /var/www/.../apio/;
  try_files $uri $uri/ /apio/index.html;
}
```

### Backend (auth API)

```bash
cd maisonmaroc/server
cp .env.example .env
npm install
npm run migrate   # SQLite schema + bootstrap super-admin (+ optional demo owner)
npm run dev       # http://localhost:3001
```

See [AUTH.md](./AUTH.md) for roles, Google OAuth setup, and security notes.

**Google button on login/register:** set the same client ID in both places, then rebuild the frontend:

```env
# maisonmaroc/.env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# maisonmaroc/server/.env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...   # optional if you use the popup/button flow only
```

### Auth routes (frontend)

| Path | Purpose |
|------|---------|
| `/client/login`, `/client/register` | Client email/password + Google |
| `/client/account` | Client dashboard |
| `/owner/login`, `/owner` | Owner portal (admin-provisioned accounts) |
| `/admin/login`, `/admin` | Super-admin owner management |

Legacy `/login` and `/register` redirect to client auth.

## Tech

React 18, React Router 6, i18next / react-i18next, Tailwind CSS 3, lucide-react, Vite 5.

## Structure

```
src/
  data/        # types + seed data (cities, owners, properties, reviews) and selectors
  i18n/        # ar / fr dictionaries + i18n init (sets <html dir> automatically)
  context/     # favorites + auth (API session cookie)
  lib/         # locale hook, formatting, filtering/sorting
  components/  # header, footer, cards, gallery, filters, contact modal, ...
  pages/       # home, search, details, owner, agents, favorites, publish, auth, account
```

All data lives in `src/data` and is fully connected by `ownerId` / `cityId`, so the
relationship between **properties and their owners** is consistent across every page.
