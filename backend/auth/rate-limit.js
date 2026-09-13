const buckets = new Map();
const MAX_BUCKETS = 10_000;

function bucketId(scope, key) {
  return `${scope}:${String(key || 'unknown')}`;
}

function prune(now) {
  if (buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey === undefined) break;
    buckets.delete(oldestKey);
  }
}

export function consumeRateLimit({ scope, key, limit, windowMs, now = Date.now() }) {
  if (!scope || !limit || !windowMs) throw new TypeError('Invalid rate limit configuration');
  prune(now);

  const id = bucketId(scope, key);
  const existing = buckets.get(id);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(id, bucket);
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.resetAt - now),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterMs: 0,
  };
}

export function resetRateLimit({ scope, key }) {
  buckets.delete(bucketId(scope, key));
}

export function clearRateLimitsForTests() {
  buckets.clear();
}
