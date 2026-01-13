class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400, 'VALIDATION_ERROR')
    this.field = field
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR')
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error', service) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR')
    this.service = service
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    const message = 'Invalid input data'
    error = new ValidationError(message)
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = new AuthenticationError(message)
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = new AuthenticationError(message)
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new ConflictError(message)
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorHandler]', {
      error: err,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode
    })
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      ...(error.field && { field }),
      ...(error.service && { service }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      })
    }
  })
}

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  errorHandler,
  asyncHandler,
  notFound
}
