# APIO

A complete, bilingual **Moroccan real-estate marketplace** built with React + Vite +
TypeScript + Tailwind CSS.

- **Arabic (RTL) by default**, full **French (LTR)** alternative — switch anytime with `العربية | Français`.
- Realistic, internally consistent seed data: **22 properties**, **8 agents/owners**, 6 cities.
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

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build
npm run preview   # preview the production build
```

## Tech

React 18, React Router 6, i18next / react-i18next, Tailwind CSS 3, lucide-react, Vite 5.

## Structure

```
src/
  data/        # types + seed data (cities, owners, properties, reviews) and selectors
  i18n/        # ar / fr dictionaries + i18n init (sets <html dir> automatically)
  context/     # favorites + auth (localStorage)
  lib/         # locale hook, formatting, filtering/sorting
  components/  # header, footer, cards, gallery, filters, contact modal, ...
  pages/       # home, search, details, owner, agents, favorites, publish, auth, account
```

All data lives in `src/data` and is fully connected by `ownerId` / `cityId`, so the
relationship between **properties and their owners** is consistent across every page.
