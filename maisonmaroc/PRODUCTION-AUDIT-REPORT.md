# APIO Production Readiness Audit (A–Z)

**Date:** 2026-09-26  
**Branch audited:** `cursor/production-audit-3967` (based on `cursor/actualites-news-portal-3967`)  
**Scope:** APIO stack under `maisonmaroc/` — public SPA, public API (:3001), admin API/UI (:7217), SQLite, uploads, Docker/Nginx examples. Dribex core unchanged.

---

## Executive Summary

| Metric | Value |
|--------|--------|
| **Production readiness** | **CONDITIONAL PASS** — no open **CRITICAL** code issues after fixes; **HIGH** items remain for ops (backups, dependency upgrades, live origin currently unreachable). |
| **Findings total** | 24 |
| **CRITICAL** | 0 (after fixes) |
| **HIGH** | 4 |
| **MEDIUM** | 9 |
| **LOW** | 7 |
| **INFORMATIONAL** | 4 |

---

## Findings

| ID | Severity | Component | Description | Evidence | Risk | Fix | Status |
|----|----------|-----------|-------------|----------|------|-----|--------|
| AUD-001 | **HIGH** | Email / auth | Client registration could **500** when `SMTP_TEST_MODE=capture` without `EMAIL_FROM`. | Server log: `TypeError: Cannot read properties of undefined (reading 'trim')` at `mail.js:81`; `test-auth.js` failed Client register. | Broken sign-up in misconfigured/staging envs; possible 500 in prod if SMTP flags inconsistent. | Default capture-from address; guard before `.trim()`. | **FIXED** |
| AUD-002 | **HIGH** | Session | `apio_token` used `Path=/`, sent on **all** `dribex.ma` paths. | `middleware.js` cookie `path: "/"`. | Cookie leakage to Dribex routes; cross-app noise; weaker isolation vs Dribex. | Derive `COOKIE_PATH` from `FRONTEND_URL` (e.g. `/APIO`); override via env. | **FIXED** |
| AUD-003 | **HIGH** | Dependencies | **nodemailer** ^6.10.1 — multiple advisories (DoS, SMTP injection, SSRF in edge transports). | `npm audit` in `maisonmaroc/server` (high/moderate on nodemailer). | Email pipeline abuse if attacker influences mail options. | Plan upgrade to supported 7.x/9.x+ after SMTP regression tests. | **OPEN** |
| AUD-004 | **HIGH** | Ops / backup | No automated DB/upload backup or restore procedure in repo. | No backup scripts/cron in `deploy/` or docs beyond SQLite file path. | Data loss on disk failure. | Document + implement host-level backup for `/data/apio.sqlite` and upload volume. | **OPEN** |
| AUD-005 | **MEDIUM** | Build | Production build failed: `clientAccountHint` missing from `ar` i18n dict. | `npm run build:apio` TS2353 on `fr.ts`. | CI/deploy blocked. | Add key to `ar.ts`. | **FIXED** |
| AUD-006 | **MEDIUM** | Tests | Avatar sync test flaky: Member B not email-verified before upload. | `test-avatar-sync.js` FAIL Member B upload. | False negatives in CI. | `markUserEmailVerified(ownerBEmail)` after create. | **FIXED** |
| AUD-007 | **MEDIUM** | Frontend | Messaging uses **localStorage fallback** when API unreachable (`mm.messaging.v1`). | `MessagingContext.tsx`. | Stale/offline data shown; not a secret store but confusing UX. | Prefer empty state; gate fallback behind dev flag. | **OPEN** |
| AUD-008 | **MEDIUM** | Frontend | Main JS bundle ~615 kB gzip ~187 kB. | Vite build warning. | Slower mobile first load. | Route-based code splitting (follow-up). | **OPEN** |
| AUD-009 | **MEDIUM** | Dependencies | **vite** / **react-router** audit findings (dev/build; path traversal in dev server). | `npm audit` in `maisonmaroc`. | Dev-only exposure unless dev server exposed publicly. | Keep dev server off public network; plan vite 6+ upgrade. | **OPEN** |
| AUD-010 | **MEDIUM** | Rate limiting | Authenticated GETs (e.g. `/api/auth/me`, owner reads) largely unlimited. | `index.js` limiters on auth/contact/public content only. | Scraping / abuse at session layer. | Add per-user rate limits on sensitive reads (optional). | **OPEN** |
| AUD-011 | **MEDIUM** | Config | Local `server/.env` contains **demo owner** placeholders (`DEMO_OWNER_*`). | `.env` gitignored; grep in workspace. | Accidental use in shared env. | Remove from prod env files; use migrate/bootstrap only. | **OPEN** (ops) |
| AUD-012 | **MEDIUM** | Production smoke | `https://dribex.ma/APIO/` returns **HTTP 521** (Cloudflare origin down). | `curl -sI https://dribex.ma/APIO/` 2026-09-26. | Cannot validate live routing/headers/cookies today. | Restore origin; re-run smoke checklist. | **NOT TESTED** (live) |
| AUD-013 | **LOW** | Dead code | Legacy admin pages remain in public SPA tree (`src/pages/admin/*`, `adminContentApi.ts`) but `/admin/*` → 403. | `App.tsx` route; APIs 404 on :3001. | Maintenance burden; confusion. | Remove or relocate to `admin/` package only. | **OPEN** |
| AUD-014 | **LOW** | i18n | `interpolation: { escapeValue: false }`. | `i18n/index.ts`. | XSS if dynamic strings ever passed to `t()`. | Keep user HTML out of i18n; render user text as React children (current news body pattern). | **ACCEPTED** |
| AUD-015 | **LOW** | API headers | Public API Helmet CSP present; **no HSTS** on API responses (expected if Nginx terminates TLS). | `curl -sI localhost:3001/api/health`. | HSTS must be on edge. | Ensure Nginx `Strict-Transport-Security` on dribex.ma. | **WARNING** (verify on live) |
| AUD-016 | **LOW** | Git / uploads | Institutional PDFs tracked under `server/data/uploads/*.pdf`. | `git ls-files`. | Correct for templates; ensure prod uses volume not git checkout. | Deploy via Docker volume `/data/uploads`. | **INFORMATIONAL** |
| AUD-017 | **LOW** | Secrets in git | `.env` not tracked; `.env.example` uses placeholders only. | `git log -- server/.env` empty. | Historical leaks not scanned exhaustively in this run. | Rotate if secrets ever committed; use host secrets manager. | **PASS** (sample) |
| AUD-018 | **INFORMATIONAL** | Admin isolation | Public port returns **404** for `/api/admin/*` and `/api/auth/admin/login`. | curl + `publicAdminGuard.js` logs. | Good defense in depth. | Keep admin on :7217 + Tailscale nginx. | **PASS** |
| AUD-019 | **INFORMATIONAL** | Docker | Services bind **127.0.0.1:3001** and **127.0.0.1:7217**; `USER node`. | `docker-compose.apio.yml`, Dockerfile. | Reduces public exposure. | Do not map to 0.0.0.0 on host. | **PASS** |
| AUD-020 | **INFORMATIONAL** | Database | SQLite `DATABASE_PATH` / `apio.sqlite` — separate from Dribex. | `db.js`, deploy docs. | Cross-DB risk low. | Dedicated volume per APIO. | **PASS** |
| AUD-021 | **INFORMATIONAL** | XSS / content | News body rendered as plain text (`whitespace-pre-wrap`); no `dangerouslySetInnerHTML` in app. | Static search + `NewsArticlePage.tsx`. | Reduced XSS from CMS. | Admin should still avoid pasting HTML in body if renderer changes. | **PASS** |
| AUD-022 | **MEDIUM** | Authorization | Server-side matrix enforced in tests (CLIENT/OWNER/SUPER_ADMIN, IDOR, admin port). | `test-authorization.js`, `test-client-security.js`, `test-e2e-readiness.js`. | Regressions if routes added without tests. | Require tests for new routes. | **PASS** (automated) |
| AUD-023 | **LOW** | uuid package | Moderate advisory via dependency tree. | `npm audit`. | Low practical impact for UUID v4 usage. | Patch on next dependency refresh. | **OPEN** |
| AUD-024 | **LOW** | Performance | N+1 not fully profiled under load. | No load test in CI. | Unknown latency at scale. | Add staging load test before high traffic. | **NOT TESTED** |

---

## Fixed Issues (this audit)

1. **AUD-001** — Safe `EMAIL_FROM` handling in `mail.js` for capture mode.
2. **AUD-002** — `resolveAuthCookiePath()` + cookie path on set/clear (`cookiePath.js`, `middleware.js`); startup hint when `FRONTEND_URL` lacks path prefix.
3. **AUD-005** — Arabic translation key `clientAccountHint`.
4. **AUD-006** — Avatar sync test verifies Member B email before upload.

---

## Remaining Issues (cannot auto-fix safely)

- **AUD-003** — nodemailer major upgrade (needs SMTP QA).
- **AUD-004** — Production backup/restore (host infrastructure).
- **AUD-007–AUD-012** — UX/perf/live smoke (product/ops).
- **AUD-013** — Legacy admin UI cleanup (large delete; defer to dedicated PR).

---

## Authorization Matrix (verified via automated tests)

| Capability | Public | CLIENT | REAL_ESTATE_OWNER | SUPER_ADMIN (admin port) |
|------------|--------|--------|-------------------|---------------------------|
| Public content/news/docs | Yes | Yes | Yes | Yes |
| Client register/login | Yes | — | — | — |
| Owner portal APIs | No | No | Own data | Via admin APIs |
| Admin content/members | 404 on :3001 | 404 | Denied on admin port | Yes on :7217 |
| IDOR other owner project | — | Blocked | Blocked | — |

---

## Production Checklist

| Item | Result |
|------|--------|
| Project structure mapped | **PASS** |
| Public routes + 403 admin in SPA | **PASS** |
| Email/password + Google flows (code + tests) | **PASS** |
| Session cookie scoped under `/APIO` when configured | **PASS** (after fix) |
| Server-side authorization | **PASS** (tests) |
| API input validation / client hardening | **PASS** (see SECURITY-HARDENING-REPORT.md) |
| Upload validation (magic bytes, PDF/images) | **PASS** (code review + tests) |
| Draft news not public | **PASS** (`test:news` 8/8) |
| Admin not on public `/APIO/admin` | **PASS** |
| Docker localhost bind | **PASS** |
| Nginx example `/APIO/` + `/APIO/api/` | **PASS** (config review) |
| CORS restrictive (no `*` with credentials) | **PASS** |
| CSRF mitigated (SameSite + JSON API) | **PASS** |
| Security headers (API Helmet) | **PASS** (local) |
| Rate limits on auth/contact/uploads | **PASS** |
| SSRF user URL fetch | **PASS** (no user-controlled fetch) |
| Dependency audit | **WARNING** (nodemailer, vite) |
| Secrets not in git (sample) | **PASS** |
| Logging without passwords/tokens | **PASS** (sample logs) |
| Error responses non-verbose | **PASS** (tests) |
| `npm test` full suite | **PASS** (after fixes) |
| `npm run build:apio` | **PASS** |
| Live https://dribex.ma/APIO smoke | **FAIL** (521 origin down) |
| Backups | **FAIL** (not implemented in repo) |

---

## Commands Executed

```bash
# Structure / secrets grep (sample)
rg -i 'TODO|demo|mock|bypass' maisonmaroc --glob '*.{js,ts,tsx}'

# Dependency audit
cd maisonmaroc/server && npm audit
cd maisonmaroc && npm audit

# Local API checks
curl -s http://127.0.0.1:3001/api/health
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/api/admin/news   # 404
curl -sI http://127.0.0.1:3001/api/health | rg -i 'content-security|x-content|referrer'

# Tests (public :3001 + admin :7217, guard disabled for localhost)
cd maisonmaroc/server
APIO_ADMIN_NETWORK_GUARD=false APIO_ADMIN_ALLOWED_NETWORKS=127.0.0.0/8 SMTP_TEST_MODE=capture npm test
npm run test:news
npm run test:cookie-path

# Build
cd maisonmaroc && npm run build:apio

# Production smoke (origin unreachable at audit time)
curl -sI https://dribex.ma/APIO/
curl -sI https://dribex.ma/APIO/api/health
```

---

## Final Security Verdict

**Do not declare fully production-ready on the public internet until:**

1. Live origin serves `/APIO/` and `/APIO/api/` (currently **521**).  
2. **AUD-004** backups are in place and restore is tested once.  
3. **AUD-003** nodemailer is upgraded or risk accepted with compensating SMTP controls.

With **STRICT_CONFIG=true**, weak JWT/admin secrets and missing SMTP/FRONTEND_URL block production boot — appropriate for go-live.

After this audit’s code fixes, the **application layer** meets pre-production expectations; **operational** items (origin up, backups, dependency upgrades, live header verification) remain.
