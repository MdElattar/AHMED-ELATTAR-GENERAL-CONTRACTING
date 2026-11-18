# Passkeys, backup codes and step-up authentication

This project uses WebAuthn discoverable credentials (passkeys) for passwordless
sign-in and for **step-up re-authentication** before sensitive administrator
actions. All ceremony state is server-side; the browser only holds an HttpOnly,
SameSite=Strict cookie containing a signed reference to a single-use database
challenge.

## Environment

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` (or `JWT_SECRET` / `NEXTAUTH_SECRET`) | ≥32 characters. Signs session tokens, reset tokens and challenge cookies. Required in production. |
| `WEBAUTHN_RP_ID` | Optional. The relying-party ID (hostname only, no protocol or port) when it differs from the request host. |
| `WEBAUTHN_RP_ID_ALLOWLIST` | Optional comma-separated extra RP IDs for custom deployments. |

The default RP ID allowlist is `localhost`, `127.0.0.1`, `alattar.sa` and
`www.alattar.sa`. Any configured or derived RP ID outside the allowlist is
rejected with `AuthConfigError`, which routes translate into a `503
auth_unavailable` response (or `passkey_unavailable` on WebAuthn endpoints).

> **Passkeys cannot be tested on `*.vercel.app` preview URLs.** Browsers bind a
> credential to the exact RP ID it was registered with, and those hostnames are
> neither stable nor in the allowlist. Use `localhost` for local development or
> a production/custom domain listed above (or in
> `WEBAUTHN_RP_ID_ALLOWLIST`) for previewing the enrollment flow.

## Session model

- Signed HMAC token in the `alattar_session` cookie: HttpOnly, Secure in
  production, SameSite=Strict, absolute TTL of 12 hours.
- The token carries `passkeyEnrolled` and `stepUpAt` in addition to the usual
  identity/role claims.
- `sessionVersion` is **only** incremented by explicit revocations: role
  changes, admin revocation, sign-out and administrator passkey resets. Sign-in
  never rotates it, so a freshly issued token always matches the persisted
  version and cannot trigger a redirect loop.
- `activeSession()` reconciles the token with the live user record on every
  privileged route, so role changes and revocations take effect immediately.

## Enrollment

1. `POST /api/auth/passkey/register/options` (authenticated) generates
   registration options with `residentKey: "required"` and
   `userVerification: "required"`, and stores a 5-minute single-use challenge.
2. `POST /api/auth/passkey/register/verify` verifies the attestation, saves the
   credential (including a sanitised `deviceName`, default `"This device"`),
   issues ten backup codes on first enrollment, and reissues the session cookie
   with `passkeyEnrolled: true` and a fresh `stepUpAt`.
3. Response: `201 { passkey, user, redirectTo, backupCodes? }`. Plaintext backup
   codes appear only in this response and in `POST /api/auth/backup-codes`.

Managers and admins without a passkey are optimistically redirected to
`/passkey-enroll?next=…` by `src/proxy.ts`. Clients are never forced to enroll.

## Sign-in and recovery

- `POST /api/auth/passkey/authenticate/options` accepts an optional `email` for
  discoverable credentials, or `{ purpose: "step-up" }` (requires an active
  session and uses its email).
- `POST /api/auth/passkey/authenticate/verify` returns
  `{ user, redirectTo }` for sign-in, or `{ user, stepUpAt, ok: true }` for
  step-up. Failed attempts are audited as `login_failed`; successful sign-ins
  as `login_success`.
- `POST /api/auth/backup-codes/redeem` accepts `{ email, code }`, atomically
  consumes one hashed code, and signs in with `stepUpAt: 0` and
  `passkeyEnrolled` reflecting the remaining passkeys.

## Management and step-up

- `GET /api/auth/passkey` → `{ passkeys, hasBackupCodes }` (includes
  `deviceName`, `backedUp`, `lastUsedAt`).
- `PATCH /api/auth/passkey` renames a device from `{ credentialId, deviceName }`.
- `DELETE /api/auth/passkey` requires a step-up within the last 5 minutes. A
  user's last passkey cannot be removed unless backup codes exist (`409
  backup_codes_required`). Successful revocation is audited as
  `passkey_revoked`.
- `POST /api/auth/backup-codes` regenerates ten codes, but only after a recent
  step-up.
- `POST /api/admin/security/passkey-reset` lets an active admin (with a recent
  step-up) reset a different user's passkeys. It deletes the target's
  credentials, increments their `sessionVersion` (invalidating existing
  sessions) and records `admin_passkey_reset` with the supplied reason.

Sensitive admin routes (admin access confirm/revoke, project archive/delete)
return `428 { error: "step_up_required" }` when `stepUpAt` is missing or too
old. Client-initiated step-up uses the passkey authenticate endpoints with
`purpose: "step-up"`.

## Audit actions

`login_success`, `login_failed`, `passkey_registered`, `passkey_revoked`,
`role_changed` and `admin_passkey_reset` are emitted with actor, entity and IP
metadata. Older dotted actions remain for backward compatibility.

## Proxy checks

`src/proxy.ts` is intentionally optimistic: it verifies the signed cookie and
enforces roles from token claims only, and never queries MongoDB. Invalid or
expired cookies are cleared on denial to prevent redirect loops. Authoritative
role/sessionVersion checks always happen inside the route handler.
