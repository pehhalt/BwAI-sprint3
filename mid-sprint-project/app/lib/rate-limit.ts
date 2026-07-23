// --- Best-effort in-process rate limiting -----------------------------------
//
// LIMITATION: this state lives in module-level memory inside a single
// serverless function instance. On Vercel, separate invocations can land on
// separate (or freshly cold-started) instances that don't share this Map, and
// any instance can be recycled at any time. This is therefore *best-effort*
// throttling within one warm instance — not a hard, globally-enforced rate
// limit. It raises the bar against naive scripted abuse and complements (does
// not replace) Supabase Auth's own server-side rate limits. A real guarantee
// would need shared external state (e.g. Upstash Redis) or a platform-level
// control (e.g. Vercel Firewall rate-limiting rules).

type RateLimitEntry = { count: number; windowStart: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();

  // Opportunistic cleanup so the map doesn't grow unbounded across the
  // lifetime of a warm instance.
  if (rateLimitStore.size > 500) {
    for (const [k, v] of rateLimitStore) {
      if (now - v.windowStart > windowMs) rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count += 1;
  return true;
}
