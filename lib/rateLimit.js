const rateLimit = new Map();

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

export function checkRateLimit(ip, endpoint, maxRequests = 10, windowMs = 60000) {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const existing = rateLimit.get(key);

  if (!existing || now > existing.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  existing.count++;

  if (existing.count > maxRequests) {
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxRequests - existing.count };
}

export function applyRateLimit(request, endpoint, maxRequests = 10, windowMs = 60000) {
  const ip = getClientIp(request);
  return checkRateLimit(ip, endpoint, maxRequests, windowMs);
}
