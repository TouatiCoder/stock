type Bucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

export function enforceSimpleRateLimit(params: {
  key: string;
  max: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = buckets.get(params.key);

  if (!current || now >= current.resetAt) {
    buckets.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return { allowed: true, remaining: params.max - 1 };
  }

  if (current.count >= params.max) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, current.resetAt - now) };
  }

  current.count += 1;
  buckets.set(params.key, current);
  return { allowed: true, remaining: Math.max(0, params.max - current.count) };
}
