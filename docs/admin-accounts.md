# Admin accounts, idle sessions, and performance

## Idle sessions

`src/components/auth/IdleGuard.tsx` is active **only** for verified sessions
whose role is exactly `admin`. Managers and clients are never warned for
inactivity and are never idle-signed-out. Explicit "sign out" broadcasts from
another tab still end any active session; that is a user action, not idle
timeout.

Admins get one warning after 10 minutes without pointer, keyboard, wheel, or
touch activity. The dialog counts down 60 seconds and signs out across all tabs
when it reaches zero. "Stay signed in" resets the activity clock and clears the
warning cycle; a `warnedActivityRef` keyed to the cycle and a shared
`BroadcastChannel`/localStorage signal prevent a second dialog for the same
idle period or after another tab has already raised the warning.

## Primary Admin authority

The designated Primary Admin is the environment-configured `ADMIN_EMAIL`
(`primaryAdminEmail()` in `src/lib/auth/token.ts`). In production an unset
value means nobody holds the role. Every privileged write checks the live
session (`activeSession()`), the admin role, and the Primary Admin email on the
server before touching data:

- `POST /api/admin/access/request` — starts promotion/create with password
  re-entry and email OTP.
- `POST /api/admin/access/confirm` — completes promotion after OTP plus a
  recent passkey step-up.
- `POST /api/admin/access/revoke` — removes co-admin access.
- `POST /api/admin/access/remove` — permanently removes an account.

The last route also requires password re-entry in the same request, refuses the
Primary Admin/self target, deletes only that user's auth material
(passkeys, OTPs, pending grants), and writes an `admin.account.removed` audit
entry containing the actor, target email, role, and account ID. Business
records keep the historical email reference; use the UI confirmation (typed
email + password) deliberately.

## Account directory

`GET /api/admin/access` is paginated (`page`, `limit` ≤ 50) and supports
`role`, `query` (name/email/company), and `excludeTest`. Synthetic accounts
matching `*@example.com` are hidden by default; toggle "Hide test accounts" in
the UI to inspect them. Counts are computed in MongoDB with an indexed
`role + createdAt` sort, so the list never ships every user document.

## Caching and indexes

Public `/api/projects` and `/api/content` reads use tagged `use cache`
helpers, a one-hour server revalidation window, and a public `Cache-Control`
header suitable for a CDN. Admin saves call `revalidatePublicContent()`, which
invalidates the shared tag. Admin and portal feeds stay `no-store`.

Run `npm run check:indexes` to verify the required indexes against MongoDB
(and add `--ensure` to create missing ones additively). `npm run seed` also
calls `createIndexes()` for all declared schemas. See `docs/deployment.md` §8
for the infrastructure required to scale beyond a single instance.
