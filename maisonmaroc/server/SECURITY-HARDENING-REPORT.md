# APIO security hardening report (normal users / CLIENT focus)

Audit and remediation branch: `cursor/client-security-hardening-3967` (based on auth + Google CLIENT minimal stack).

## Executive summary

The APIO backend already used parameterized SQL (better-sqlite3), JWT HttpOnly cookies, RBAC middleware, rate limits, Helmet, CORS allowlists, upload magic-byte checks, and conversation IDOR checks. This pass adds **defense-in-depth for hostile CLIENT input**: stricter plain-text validation, registration/contact allowlists, expanded SSRF URL rules, prototype-pollution rejection, production Host-header validation, and automated CLIENT security tests.

There is **no server-side arbitrary URL fetch** for user-supplied URLs in application code (only Google OAuth via google-auth-library). `imageUrl` on news/events is validated but not fetched by the API.

---

## Vulnerabilities discovered and fixes

| Area | Finding | Attack path | Fix |
|------|---------|-------------|-----|
| Input (CLIENT register) | Weak name/phone rules; extra JSON fields ignored | Mass-assignment / odd chars in profile | Allowlisted body keys; `validatePersonName` / `validateOptionalPhone`; `rejectForbiddenBodyFields` for privilege keys |
| Input (contact) | Extra fields accepted | Hidden field injection | Allowlisted keys only |
| Input (messages) | Control chars/null bytes allowed | Log/UI oddities, some parser edge cases | `validateMessagePlainText` (control/BiDi strip policy) |
| SSRF (URL fields) | 172.16/12, CGNAT, metadata names not all blocked | Admin `imageUrl` could point at internal ranges if a fetcher were added | Expanded `validateExternalMediaUrl` patterns + metadata/docker host blocklist + decimal IPv4 |
| Prototype pollution | No deep JSON scan | `nested.__proto__` in bodies | `rejectPrototypePollutionMiddleware` + `assertNoPrototypePollution` |
| Host header | No production Host allowlist | Cache poisoning / mis-generated URLs behind proxies | `trustedHostMiddleware` (production); `TRUSTED_HOSTS` env |
| Error leakage | 4xx handler could fall through to 500 | — | Express error handler returns safe 4xx messages |

**Not vulnerabilities (verified):** CLIENT has no upload routes; messages use server `req.user.id` as sender; SQL uses bound parameters; document paths use validated IDs + controlled storage.

---

## Endpoints audited (CLIENT-relevant)

- `POST /api/auth/client/register`, `POST /api/auth/client/login`
- `POST /api/auth/register` (alias)
- Google OAuth callback (existing state + minimal scopes)
- `POST /api/contact`
- `GET/POST /api/messages/*` (conversations, messages, read, archive, unread-count)
- Public read: properties, listings, documents, news, events
- Denied for CLIENT: `/api/admin/*`, `/api/owner/*` (403/401)

Admin/member upload and content routes were reviewed via existing `test-security.js` / `test-authorization.js`.

---

## Authentication / authorization

- Unchanged core: bcrypt passwords, JWT in HttpOnly cookie, `requireAuth` / `requireClient` / `requireOwner` / `requireSuperAdmin`.
- CLIENT cannot receive or set `owner_profile_id`; role never taken from client on register (expanded forbidden fields).
- Email verification required for local CLIENT login (prior auth branch).

---

## SSRF protections

- **No user-driven server fetch** in app code.
- **`validateExternalMediaUrl`**: https only in production; blocks private/reserved IPs, link-local, metadata-style hostnames, userinfo in URL, control chars, length cap.
- Tests: loopback, 172.16.0.1, javascript:, metadata host.

---

## Upload protections

- Unchanged: multer size limits, UUID filenames, magic bytes for PDF/images, path traversal checks (`uploads.js`, `test-security.js`).
- CLIENT has no upload endpoints.

---

## XSS protections

- Messages/contact/names stored as plain text with control-character rejection; React frontend should still escape on render (primary XSS layer).
- Helmet CSP on API responses; PDF downloads use `X-Content-Type-Options: nosniff`.
- No `dangerouslySetInnerHTML` audit in this pass (frontend); stored HTML in names rejected at register.

---

## SQL injection protections

- Parameterized queries throughout; pagination via `clampPagination` (numeric bounds).
- Admin sort fields allowlisted in `adminMembers.js` (existing).

---

## IDOR protections

- Conversations/messages: `validateUuid` + `canAccessConversation`; 404 on miss (no leak).
- Owner projects: covered in `test-authorization.js`.
- Tests: random conversation UUID as CLIENT → 404.

---

## Rate limits

Existing in `index.js`: auth, auth email, contact, messages, public content, admin/owner mutations, uploads. No change in this branch.

---

## Security headers / CORS

- Helmet (CSP, HSTS in production, Referrer-Policy, Permissions-Policy) via `security.js`.
- CORS: explicit `ALLOWED_ORIGINS` + credentials; no `*` for authenticated API.

---

## Infrastructure isolation

- `docker-compose.apio.yml`: API bound to `127.0.0.1:3001`; data volume only; no DB/Redis/MinIO in this compose file.
- Production assumes reverse proxy; DB is local SQLite file on server volume.

---

## Secrets findings

- Default `JWT_SECRET` and bootstrap admin password flagged in `startup.js` for production.
- No production secrets committed; `.env.example` documents required vars.
- Recommend periodic scan with gitleaks/trufflehog in CI.

---

## Security tests performed

- `npm run test:security` (path traversal, SSRF URL validation, fake PDF upload, message IDOR)
- `npm run test:client-security` (CLIENT RBAC, pollution, contact/register validation)
- `npm run test:auth`, `test-authorization`, `test-email-verification`, `test-google-client-flow`
- Manual: restarted API and verified health after middleware changes

---

## Residual risks (honest)

1. **Stored message HTML**: Angle brackets allowed in message bodies; XSS depends on frontend escaping everywhere messages render.
2. **SSRF without DNS resolution**: Hostnames are pattern-blocked but not resolved to IP before any future fetch; if URL fetching is added, use DNS resolve + IP revalidation and redirect checks.
3. **Rate limits**: IP-based only; distributed abuse or shared NAT may need stricter per-user limits on messaging.
4. **SQLite file**: Filesystem permissions and backup access are out of app scope.
5. **Dependency CVEs**: Requires ongoing `npm audit` / dependency updates.
6. **Avatar sync test**: One integration assertion intermittently fails (`Member B upload only affects self`); unrelated to CLIENT hardening but should be fixed for CI signal.
7. **Trusted Host**: Production must set `ALLOWED_ORIGINS` / `TRUSTED_HOSTS` to include the public hostname seen by nginx.

---

## Files changed (this hardening pass)

- `src/validateUserText.js` (new)
- `src/requestSecurity.js` (new)
- `src/validateUrls.js`, `src/messages.js`, `src/contact.js`, `src/index.js`
- `scripts/test-client-security.js` (new), `scripts/test-security.js`
- `package.json`, `.env.example`
