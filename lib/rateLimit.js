const rateLimit = {};

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

  if (!rateLimit[key]) {
    rateLimit[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (now > rateLimit[key].resetTime) {
    rateLimit[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, remaining: maxRequests - 1 };
  }

  rateLimit[key].count++;

  if (rateLimit[key].count > maxRequests) {
    const retryAfter = Math.ceil((rateLimit[key].resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxRequests - rateLimit[key].count };
}

export function applyRateLimit(request, endpoint, maxRequests = 10, windowMs = 60000) {
  const ip = getClientIp(request);
  return checkRateLimit(ip, endpoint, maxRequests, windowMs);
}

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const key in rateLimit) {
    if (now > rateLimit[key].resetTime) {
      delete rateLimit[key];
    }
  }
}, 60000);

if (typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}
