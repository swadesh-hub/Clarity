const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

const memoryStore = new Map();

export async function checkRateLimit(env, ip) {
  const key = `rl:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  if (env.RATE_LIMIT_KV) {
    const raw = await env.RATE_LIMIT_KV.get(key, 'json');

    if (!raw || raw.windowStart + WINDOW_SECONDS < now) {
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
