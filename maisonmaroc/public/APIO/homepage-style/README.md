# APIO homepage style assets

Static **decorative** images for the institutional homepage only (not listings, members, projects, or CMS uploads).

## Replace an image

1. Drop a new file **with the same filename** (e.g. replace `about-wide.webp`).
2. Run `npm run build` and deploy `dist/`.

No React or admin changes required.

## Hero sequence

Files in `hero/`:

- `hero-01.webp` … `hero-09.webp`

To change the sequence order or add slides, edit `HERO_SLIDE_FILES` in `src/config/apioHomepageImages.ts`.

## Refresh from stock sources (optional)

```bash
./scripts/fetch-homepage-style-images.sh
```

## URLs in production

Served as `{app base}/homepage-style/...` (e.g. `https://dribex.ma/APIO/homepage-style/cta.webp`).
