type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
};

function prune(now: number) {
  if (buckets.size < 500) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Applies a shared IP bucket plus a tighter per-identifier bucket. Both are
 * consumed so an attacker cannot bypass the account limit by rotating IPs (or
 * bypass the IP limit by rotating accounts).
 */
export function rateLimitIdentity(
  prefix: string,
  ip: string,
  identifier: string | null | undefined,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const results = [rateLimit(`${prefix}:ip:${ip}`, limit, windowMs)];
  if (identifier) {
    results.push(rateLimit(`${prefix}:id:${identifier}`, Math.ceil(limit * 1.5), windowMs));
  }
  return results.find((result) => !result.ok) ?? results[0];
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    prune(now);
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: 0,
  };
}
