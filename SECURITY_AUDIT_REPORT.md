# Security Audit & Production Hardening Report

**Date:** 18 November 2026
**Branch:** `security/production-hardening`
**Baseline:** `main` @ `0d86c54`
**Scope:** Full Next.js App Router application, MongoDB/Mongoose repository, API routes, admin/portal/auth surfaces, build/test tooling, and deployment configuration.

---

## Executive summary

A full-stack security review was completed and the identified issues were remediated. The application now enforces authenticated, CSRF-protected, strictly validated, and rate-limited API access; production-only fail-closed database configuration; HTTPS/HSTS and hardened security headers; hashed secret-at-rest fields; ownership checks on every portal project resource; and generic error responses with no stack traces or raw database diagnostics.

Automated verification is green:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed (Next.js 16.4.6) |
| `npm run security:scan` | Passed |
| `npm run test:security` | 6/6 passed |
| `npm run test:projects` | 28/28 passed |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm audit` (incl. dev) | 14 high-severity advisories, all dev-only transitive glob-tooling (see Residual Risk) |

---

## Control coverage

### 1. Cookie hardening, expiration, rotation, and CSRF

- `src/lib/auth/cookie.ts`
  - `HttpOnly`, `Secure` in production, `SameSite=Strict`, `Path=/`.
  - Explicit `Max-Age` on every session cookie; no falsy-TTL omission.
  - Reset cookies remain short-lived and are cleared after use.
- `src/lib/auth/token.ts`
  - 7-day standard session / 30-day remembered session.
  - `sessionVersion` is embedded in the signed token and checked against the live user record.
- Session rotation
  - Sign-in increments `sessionVersion`, invalidating older sessions.
  - Password change and password reset increment `sessionVersion` and clear the session cookie.
  - Sign-out increments `sessionVersion` and clears both session and reset cookies.
  - Profile updates re-issue the signed token with current claims.
- CSRF
  - `isSameOrigin()` in `src/lib/security/http.ts` validates `Origin` against the request host and requires `Sec-Fetch-Site: same-origin` when present.
  - Every state-changing `/api/*` route calls `isSameOrigin()` before doing work.
  - `X-Forwarded-Host` is no longer trusted for origin comparisons.
  - `SameSite=Strict` cookies provide defence in depth.

### 2. Zero client-side secret exposure

- `.gitignore` ignores all `.env*` files except `.env.example`.
- `.env.example` contains placeholders only, including:
  - `ADMIN_EMAIL=admin@example.com`
  - `ADMIN_PASSWORD=replace-with-a-long-random-password`
  - `PORTAL_DEMO_CLIENT_EMAIL=client@example.com`
  - `TRUST_PROXY_HEADERS=false`
- Added `scripts/security-scan.mjs` (`npm run security:scan`) which fails on:
  - tracked `.env` files,
  - unignored local `.env`,
  - server-only secret names referenced in `"use client"` code or `public/`,
  - credential-shaped literals in tracked source,
  - non-placeholder admin password in `.env.example`.
- Added `import "server-only"` to database, mail, notification, auth-token, auth-password, WebAuthn, audit, CSV, media-inspection, and contract helpers so accidental client imports fail at build time.
- No live secret value is rendered in server HTML; Playwright asserts this on `/`.

### 3. HTTPS, HSTS, and security headers

- `src/lib/security/headers.ts` is the single shared source of truth.
- `next.config.ts` imports the shared headers; duplicated local CSP was removed.
- `src/proxy.ts` applies the same headers to every response and enforces HTTPS in production via a 308 redirect, except for `localhost`, `127.0.0.1`, and `::1` so local tests keep working.
- Headers include:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (production only)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` disabling camera, microphone, geolocation, payment, USB, accelerometer, gyroscope, magnetometer, and ambient light sensors
  - `Content-Security-Policy` with `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `script-src-attr 'none'`, `upgrade-insecure-requests`, and explicit media/image origins.
- `'unsafe-inline'` remains only for Next.js bootstrap scripts and React inline styles; markup-level handlers are blocked.
- Wildcard `images.remotePatterns` was removed; only explicit Unsplash/GCS origins remain.

### 4. Password hashing and secret fields

- Passwords are bcrypt cost 12 with SHA-256 pre-hashing to avoid bcrypt's 72-byte truncation (`src/lib/auth/password.ts`).
- Mongoose `passwordHash`, `resetTokenHash`, OTP `codeHash`, admin grant `codeHash`, and admin grant `passwordHash` are `select: false`.
- Verifiers explicitly opt in with `.select("+...")`; no other query loads these fields.
- No password, hash, OTP, or reset token is returned by any API or written to logs.
- Removed the hardcoded admin password fallback from `src/lib/db-seed.ts`. Production now requires `ADMIN_EMAIL` and `ADMIN_PASSWORD`; development uses an unguessable random fallback.
- Removed the hardcoded super-admin email fallback from `src/lib/auth/token.ts`. Production with no `ADMIN_EMAIL` grants primary-admin rights to nobody.

### 5. MongoDB ownership / IDOR prevention

- Added `clientEmails: string[]` to project records, derived from the project payload (`projectClientEmails()` in `src/lib/db.ts`).
- Added `listOwnedProjects(email)` and `ownedProject(session, slug)` in `src/lib/auth/guard.ts`.
- `/api/portal/contract` and `/api/portal/milestones` now:
  - require a live, version-checked session,
  - load the project,
  - return **403** when the signed-in client is not an owner,
  - allow admins explicitly.
- Added `/api/portal/projects`, which returns only owned projects. `WorkspaceProvider` uses it on `/portal` routes.
- Public `/api/projects` strips `clientEmails` and owner metadata from its response.
- Project tests confirm cross-account portal reads and sign attempts return 403.

### 6. Strict Zod validation and sanitization

- Added `strictObject()` in `src/lib/security/schemas.ts`; all request schemas reject unknown fields.
- `cleanString()`/`cleanMultiline()` strip HTML tags, `javascript:`/`vbscript:`/`data:` schemes, inline event handlers, control characters, and Unicode line separators.
- Added `safeRecordSchema` for intentionally flexible CMS records, rejecting `$` operator keys and prototype-pollution keys at any depth via `isSafeMongoValue()`.
- Strict schemas now cover:
  - auth: sign-in, sign-up, OTP verify, password reset, forgot password, profile, password change, passkey delete;
  - public: contact, consultation, proposal, newsletter;
  - portal: contract sign, milestone verify, project slug query;
  - admin: project create/update, content update, inquiry status, consultation status, maintenance job, notifications.
- Added `validateSearchParams()` and `readValidatedJson()` helpers in `src/lib/security/http.ts`.
- `contactSchema` now explicitly accepts `consent` and bounded attachment metadata; the previous loose manual parsing was removed.

### 7. NoSQL injection prevention

- `mongoose.set("sanitizeFilter", true)` is enabled globally in `connectMongo()`.
- `mongoose.set("strictQuery", true)` is also enabled.
- `isSafeMongoValue()` rejects `$gt`, `$ne`, `$where`, `$regex`, `__proto__`, `constructor`, and `prototype` recursively.
- Operators arriving in JSON bodies are rejected by strict Zod schemas before any repository call.
- Query strings are parsed through strict schemas; `?projectSlug[$gt]=` returns **400**.
- Client IP is derived only from platform-provided headers (`x-real-ip`, `cf-connecting-ip`, `x-vercel-forwarded-for`); raw `x-forwarded-for` is used only when `TRUST_PROXY_HEADERS=true`.
- Playwright asserts operator payloads never produce 500 responses.

### 8. Rate limiting

- `src/lib/security/rate-limit.ts` adds `rateLimitIdentity()`, consuming both an IP bucket and an identifier bucket so attackers cannot bypass limits by rotating either one.
- Applied to:
  - `/api/auth/sign-in` (8/15m per IP, 12/15m per account)
  - `/api/auth/verify-otp` (12/15m)
  - `/api/auth/reset-password` (8/15m)
  - `/api/auth/sign-up`, forgot-password, admin access, and all public forms already had bounded IP limits.
- All limited responses return **429** with `Retry-After` and `Cache-Control: no-store`.
- Playwright brute-force test confirms 429 after repeated failures.

### 9. Admin protection

- `src/proxy.ts` blocks unauthenticated `/admin/*`, `/api/admin/*`, `/portal/*`, and `/api/portal/*`:
  - pages redirect to `/sign-in`,
  - APIs return JSON 401/403.
- The proxy performs live session lookup and `sessionVersion` reconciliation for guarded paths, so revoked admins lose access immediately.
- Route-level `requireAdmin()` remains on every `/api/admin/*` route; `requirePrimaryAdmin()` protects grant/revoke endpoints.
- Playwright confirms `/admin` redirects and `/api/admin/kpis` returns 401 without a session.

### 10. Error handling, logs, and fail-closed configuration

- `safeLogError()` in `src/lib/security/http.ts` logs only a scope in production; development logs a truncated message without stacks.
- All API and library `console.error(..., error)` calls were replaced with `safeLogError()`.
- Client error boundaries no longer log raw `Error` objects in production.
- No API returns `error.message`, stack traces, SQL/Mongo diagnostics, or third-party response bodies.
- `activeMode()` in `src/lib/db.ts` now throws in production when MongoDB is unavailable. `ALLOW_IN_MEMORY_DB=true` is explicitly ignored in production.
- `default production Node runtime` and `serverExternalPackages` are retained for image processing.

### 11. Dependency hardening

- `sharp` was upgraded to `^0.35.5`, clearing the only production advisory (`GHSA` high severity).
- `npm audit fix` was applied safely; no forced downgrade of Next.js or React was performed.
- Final `npm audit --omit=dev`: **0 vulnerabilities**.
- Build remains green on Next.js 16.4.6 / React 19.3 / Tailwind 4.3.3.

### 12. Automated security tests

- Added `tests/security-hardening.spec.ts` and `npm run test:security`.
- Added a dedicated `security` Playwright project with no stored admin state.
- Tests cover:
  - `/admin` blocked when unauthenticated,
  - `/api/admin/kpis` returns 401,
  - brute-force sign-in returns 429,
  - IDOR cross-account project read/sign returns 403,
  - NoSQL body and query payloads rejected,
  - required security headers present,
  - no secret names rendered into HTML.
- Updated `tests/auth.setup.ts` to send an isolated `X-Real-IP` so in-memory rate-limit buckets do not leak between test runs.

---

## Files of interest

| Area | Key files |
| --- | --- |
| Shared headers | `src/lib/security/headers.ts`, `next.config.ts`, `src/proxy.ts` |
| Request safety | `src/lib/security/http.ts`, `src/lib/security/validation.ts`, `src/lib/security/schemas.ts` |
| Rate limits | `src/lib/security/rate-limit.ts` |
| Auth/session | `src/lib/auth/{cookie,token,guard,password}.ts`, `src/app/api/auth/**` |
| Data layer | `src/lib/db.ts`, `src/lib/db-seed.ts` |
| Portal ownership | `src/app/api/portal/**`, `src/components/providers/WorkspaceProvider.tsx` |
| Tests/tooling | `tests/security-hardening.spec.ts`, `playwright.config.ts`, `scripts/security-scan.mjs` |

---

## Residual risk / accepted exceptions

1. **Dev-only npm advisories (14 high).** All remaining advisories are transitive build/lint tooling (`picomatch`, `tinyglobby`, `fast-glob`, `typescript-eslint`, `@next/eslint-plugin-next`). They are not shipped to production (`npm audit --omit=dev` is clean), no patched `picomatch` release is available at this time, and `npm audit fix --force` would downgrade `eslint-config-next` below the project's Next.js version. No forced downgrade was applied.
2. **CSP `'unsafe-inline'`.** Required for Next.js bootstrap scripts and React inline styles in this version. `script-src-attr 'none'`, strict origin checks, HTML sanitization, and `SameSite=Strict` mitigate the associated risk.
3. **Flexible CMS payloads.** Admin content/project records use `safeRecordSchema` rather than a closed field list because dictionary leaves are inherently open. Operator keys and prototype-pollution keys are still rejected recursively, and all admin routes require an active admin session.
4. **Trusted proxy headers.** `x-real-ip`, `cf-connecting-ip`, and `x-vercel-forwarded-for` are accepted as platform-provided IP sources. `x-forwarded-proto` is used for HTTPS redirects only when `TRUST_PROXY_HEADERS=true`. Deployments behind a different proxy should enable that flag only after ensuring the proxy strips client-supplied `X-Forwarded-For` and sets `X-Forwarded-Proto` itself.

---

## Verification commands

```bash
npm run typecheck
npm run lint
npm run build
npm run security:scan
npm run test:security
npm run test:projects
npm audit --omit=dev
npm audit
```

All were executed successfully on this branch before submission.
