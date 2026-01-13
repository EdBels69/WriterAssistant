import rateLimit from 'express-rate-limit'

export const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: options.skip || ((req) => false),
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      })
    }
  })
}

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI rate limit exceeded. Please wait before making more AI requests.' }
})

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
})

export const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later.' }
})

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Upload rate limit exceeded.' }
})
