# Production deployment runbook

This is the release checklist for Ahmed Elattar General Contracting. The app is a
Next.js 16 application; the reference platform is Vercel with MongoDB Atlas, but
any Node host that serves the built output with the same environment works.

## 1. Preconditions

- Node 20+ (CI and Vercel use the current LTS).
- A MongoDB database reachable from the deployment region. The in-process
  repository is **development only**: `activeMode()` fails closed in production
  when the database is missing or unreachable, even if `ALLOW_IN_MEMORY_DB=true`.
- An HTTPS public domain. WebAuthn/passkeys cannot be registered on `*.vercel.app`
  preview URLs — enrol on the production hostname.
- A 32+ character signing secret. Generate one with `openssl rand -base64 48`.

## 2. Environment variables

Required in production:

| Variable | Purpose |
| :--- | :--- |
| `MONGODB_URI` (or `MONGODB_URL`) | MongoDB connection string; `MONGODB_DB` selects the database. |
| `AUTH_SECRET` (or `JWT_SECRET`) | HMAC signing for sessions, challenges and reset tokens. 32+ chars. |
| `WEBAUTHN_RP_ID` | Bare production hostname, e.g. `alattar.sa`. Must be in the allowlist. |
| `NEXT_PUBLIC_SITE_URL` | Canonical `https://` origin used in redirects, links and emails. |
| `RESEND_API_KEY`, `OTP_FROM_EMAIL` | Transactional OTP delivery. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_COMPANY` | First super-admin bootstrap, consumed by `npm run seed`. `ADMIN_EMAIL` is the **Primary Admin** identity: only that verified session may promote admins or remove accounts. |

Optional:

| Variable | Purpose |
| :--- | :--- |
| `WEBAUTHN_RP_ID_ALLOWLIST` | Comma-separated extra RP IDs for staging/custom domains. |
| `ADMIN_ALERT_EMAIL`, `WHATSAPP_*` | Admin alert transports. |
| `TRUST_PROXY_HEADERS` | Set `true` only when a trusted proxy strips client-supplied forwarding headers. |
| `ALLOW_IN_MEMORY_DB` | Must be `false`/unset in production; ignored (fails closed) anyway. |

Never commit `.env`. `npm run security:scan` verifies that no env file or
credential literal is tracked and that no server secret is referenced from
client code.

Validate a deployment's environment before release:

```bash
npm run check:deploy
```

The check prints only variable names and reasons — never values.

## 3. Release verification

Run locally before every production commit:

```bash
npm ci
npm run typecheck
npm run lint              # ESLint + semantic color guardrail
npm run check:colors
npm run security:scan
npm run check:deploy      # with production env exported
npm run check:indexes     # with MongoDB env exported; append -- --ensure to create missing indexes
npm run build
```

Then verify the browser contracts with Playwright against a running server:

```bash
npx playwright test --project=setup --project=chromium --project=security
npx playwright test --project=theme --project=mobile --project=enterprise --project=pwa
```

Passkeys in `tests/auth.setup.ts` use a virtual authenticator; the admin e2e
session is only valid when a credential was actually registered. The setup
enrols one on first use and reuses the persisted credential afterwards.

## 4. Deploy

1. Set every variable above in the hosting provider for **Production** (and the
   intended Preview targets). Use a *different* `AUTH_SECRET` per environment;
   rotating it signs everyone out, which is the desired emergency response.
2. Run `npm run seed` once against the production database to create the first
   super-admin and catalogue records. Do not re-run it with a changed
   `ADMIN_PASSWORD` on live data.
3. Deploy the build. Mongoose schema changes are additive; `npm run seed`
   now calls `createIndexes()` for every declared index, including the
   account-directory and public-feed compound indexes. `npm run check:indexes`
   verifies the live database without dropping anything; `--ensure` adds any
   missing indexes. Old documents are left untouched.
4. After the first deploy, sign in as the super-admin and enrol a passkey on the
   production domain. Privileged sessions are refused by `src/proxy.ts` and by
   every `/api/admin` route until that credential exists.

## 5. Post-deploy smoke checks

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://alattar.sa/                       # 200
curl -sS -o /dev/null -w '%{http_code}\n' https://alattar.sa/admin                  # 307 to sign-in
curl -sS -o /dev/null -w '%{http_code}\n' https://alattar.sa/api/admin/projects     # 401/403
curl -sSI https://alattar.sa/sw.js | grep -iE 'service-worker-allowed|cache-control'
curl -sS https://alattar.sa/manifest.webmanifest | head -c 200
```

Also confirm in a browser:

- the admin-only light/dark toggle persists with no flash on reload and never
  changes the public palette;
- `/portal` and `/admin` show localized loading, empty and error states;
- service worker installs with scope `/` and never caches private routes;
- axe reports no color-contrast violations in light or dark theme.

## 6. Monitoring and rollback

- Audit events are written to the `auditlogs` collection (`login_success`,
  `passkey_registered`, `step_up_verified`, privileged writes). Alert on
  repeated `login_failed` / `step_up_failed` for one actor.
- Rate limits are process-local. On serverless or multi-instance hosting, keep
  the platform-level WAF/rate-limit in front of the app; the in-process limiter
  is a second line of defence, not a distributed one.
- Roll back with the host's instant rollback. Database changes are additive, so
  an older build remains compatible with the current schema. Do not roll back
  by deleting collections or by resetting the admin password.
- Rotating `AUTH_SECRET` or `WEBAUTHN_RP_ID` invalidates existing sessions or
  credentials respectively. Schedule those changes and re-enrol privileged
  users immediately afterwards.

## 7. Known constraints

- Passkeys require HTTPS and a stable RP ID; localhost, `127.0.0.1` and the
  domains in `WEBAUTHN_RP_ID_ALLOWLIST` are the only accepted values.
- The service worker precaches only the public shell. Admin, portal, auth and
  passkey routes are always network-only by design.
- `public/fonts/NotoNaskhArabic.ttf` must ship with the build for Arabic PDF
  shaping in server-generated proposals.

## 8. Scaling beyond a single instance

The current reference deployment is one Next.js instance plus one MongoDB
database. That is appropriate for the current traffic profile, but it is **not**
an architecture for extreme targets (for example, tens of thousands of
concurrent visitors or sustained 10k+ RPS). No amount of per-request query
tuning makes a single process a credible answer to that scale. Use the
following layered plan when targets grow:

1. **CDN / edge cache first.** `/api/projects` and `/api/content` return
   `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, and
   their data is read through tagged `use cache` helpers. Put Cloudflare,
   Fastly or the platform CDN in front so portfolio reads are served from the
   edge and admin saves call `revalidatePublicContent()` to purge the tag.
   Static public pages and `/_next/image` variants should also be edge-cached.
2. **Horizontal application scaling.** Run multiple stateless Next.js
   instances behind a load balancer (or a serverless platform with generous
   concurrency). Sessions are signed cookies, not server memory, so any
   instance can serve any request. The in-memory rate limiter is deliberately
   process-local: replace or supplement it with edge/WAF rate limits and a
   shared Redis store before adding instances.
3. **Database connection pooling and read replicas.** Keep MongoDB's
   `maxPoolSize` bounded per instance (`src/lib/db.ts`); behind a load balancer
   the aggregate pool is `instances × maxPoolSize`, so recalculate it rather
   than raising it blindly. Use an Atlas connection pooler or a managed proxy
   for short-lived/serverless runtimes. Add read replicas for the public
   portfolio and account reads, and keep privileged writes on the primary;
   run `npm run check:indexes -- --ensure` against every cluster before promoting
   a replica to serve reads.
4. **Object storage for media.** Uploaded bytes already fall back to MongoDB;
   at scale, configure Firebase/Google Cloud Storage (or S3-compatible object
   storage) so large binaries stay out of the database working set.
5. **Background work and queues.** Email/OTP delivery, audit fan-out and PDF
   generation should move to a queue with bounded workers. Keep web responses
   short even when a third-party email provider is slow.
6. **Observability and budgets.** Track p95/p99 latency, DB pool saturation,
   cache hit rate, replica lag, 429 rates and audit-log volume. Load-test the
   full path with realistic concurrency; set error budgets and autoscale
   thresholds from measured data, not from a single-box benchmark.

Vertical scaling of one host buys limited headroom. The realistic answer for
extreme traffic is the combination above: CDN reads, stateless horizontal app
instances, pooled connections with read replicas, external object storage and
shared rate limiting.
