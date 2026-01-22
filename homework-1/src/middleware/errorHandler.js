class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const response = {
    error: err.message || 'Internal Server Error'
  };

  if (err.details && err.details.length > 0) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  errorHandler,
  ValidationError,
  NotFoundError
};
