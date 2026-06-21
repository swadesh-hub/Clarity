import { checkRateLimit } from './lib/rate-limit.js';
import { runPipeline } from './lib/pipeline.js';

const MAX_DUMP_LENGTH = 5000;

function corsHeaders(env, request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || '*').split(',').map((s) => s.trim());
  const isAllowed = allowed.includes('*') || allowed.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function handleOptions(env, request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env, request),
  });
}

function jsonResponse(body, status, env, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env, request),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handleOptions(env, request);
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, 200, env, request);
    }

    if (url.pathname === '/api/triage' && request.method === 'POST') {
      return handleTriage(request, env);
    }

    return jsonResponse({ error: 'Not found' }, 404, env, request);
  },
};

async function handleTriage(request, env) {
  const clientIP =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';

  const rateCheck = await checkRateLimit(env, clientIP);

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment.',
        retry_after: rateCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfter),
          ...corsHeaders(env, request),
        },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body.' }, 400, env, request);
  }

  const dump = typeof body.dump === 'string' ? body.dump.trim() : '';

  if (!dump) {
    return jsonResponse({ error: '"dump" field is required and must be a non-empty string.' }, 400, env, request);
  }

  if (dump.length > MAX_DUMP_LENGTH) {
    return jsonResponse({ error: `Input too long (${dump.length} chars). Please keep your brain dump under ${MAX_DUMP_LENGTH} characters.` }, 400, env, request);
  }

  const stream = runPipeline(env, dump);

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...corsHeaders(env, request),
    },
  });
}
