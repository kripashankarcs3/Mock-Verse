/**
 * Minimal in-memory rate limiter (no extra dependency).
 * Good enough for a single-instance deployment; use a shared store (Redis)
 * if the API is ever scaled horizontally.
 */
const buckets = new Map();

// Periodically drop empty buckets so the map cannot grow forever.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
if (cleanup.unref) cleanup.unref();

const createRateLimiter = ({ windowMs = 60_000, max = 60, name = "default" } = {}) => {
  return (req, res, next) => {
    const identity = req.user?.uid || req.ip || "unknown";
    const key = `${name}:${identity}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - bucket.count));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Too many requests. Please slow down.",
        retryAfter,
      });
    }

    return next();
  };
};

module.exports = { createRateLimiter };
