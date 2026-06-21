// ─── Per-IP Rate Limiting ─────────────────────────────────────────
// Uses Cloudflare KV (production) or an in-memory Map (dev / when
// KV is not bound) to enforce request-count limits per IP address.
// ──────────────────────────────────────────────────────────────────

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

/**
 * In-memory fallback for local `wrangler dev` when KV isn't bound.
 * Entries are `{ count, expiresAt }`.
 */
const memoryStore = new Map();

/**
 * Check whether the given IP is under the rate limit.
 * If under the limit, increments the counter and returns `{ allowed: true }`.
 * If over, returns `{ allowed: false, retryAfter }`.
 *
 * @param {object}  env  Cloudflare env bindings (may contain RATE_LIMIT_KV)
 * @param {string}  ip   Client IP address
 * @returns {Promise<{ allowed: boolean, remaining?: number, retryAfter?: number }>}
 */
export async function checkRateLimit(env, ip) {
  const key = `rl:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  // ── KV-backed path (production) ──
  if (env.RATE_LIMIT_KV) {
    const raw = await env.RATE_LIMIT_KV.get(key, 'json');

    if (!raw || raw.windowStart + WINDOW_SECONDS < now) {
      // New window
      const entry = { count: 1, windowStart: now };
      await env.RATE_LIMIT_KV.put(key, JSON.stringify(entry), {
        expirationTtl: WINDOW_SECONDS,
      });
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if (raw.count >= MAX_REQUESTS) {
      const retryAfter = raw.windowStart + WINDOW_SECONDS - now;
      return { allowed: false, retryAfter };
    }

    raw.count += 1;
    const ttl = raw.windowStart + WINDOW_SECONDS - now;
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(raw), {
      expirationTtl: Math.max(ttl, 1),
    });
    return { allowed: true, remaining: MAX_REQUESTS - raw.count };
  }

  // ── In-memory fallback (dev) ──
  const entry = memoryStore.get(key);

  if (!entry || entry.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + WINDOW_SECONDS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: entry.expiresAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}
