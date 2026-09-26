# APIO authentication — production configuration

## Architecture

- **Local accounts:** bcrypt (cost 12) password hash in SQLite; JWT in HttpOnly cookie `apio_token`.
- **Google OAuth:** CLIENT role only; email treated as verified by Google.
- **Email verification:** Required before password login for `local` users (clients, promoters, super-admin bootstrap is verified at creation via migrate).
- **Password reset:** Single-use hashed tokens; email link uses `FRONTEND_URL`.

## Required production environment

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | ≥32 random chars |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Bootstrap (change default password) |
| `FRONTEND_URL` | e.g. `https://dribex.ma/APIO` — used in email links |
| `SMTP_HOST`, `EMAIL_FROM` | Outbound mail (see optional SMTP_* below) |
| `ALLOWED_ORIGINS` | CORS |

Optional SMTP: `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM_NAME`, `EMAIL_VERIFY_TTL_HOURS`, `PASSWORD_RESET_TTL_HOURS`.

## Phone / OTP

Not implemented. `GET /api/auth/email/status` returns `phoneOtpConfigured: false`. Do not enable UI that implies SMS verification until a provider is integrated.

## Security notes

- Verification and reset tokens are stored as SHA-256 hashes only; raw tokens appear only in email bodies.
- Do not set `SMTP_TEST_MODE=capture` in production (test capture transport).
- Promoter creation via admin requires working email delivery.
