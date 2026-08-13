export function notFound(req, res, next) {
  const error: any = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error: any, req, res, next) {
  const statusCode = error.statusCode || res.statusCode || 500;
  res.status(statusCode === 200 ? 500 : statusCode).json({
    code: error.code || 'SERVER_ERROR',
    message: error.message || 'Internal server error',
  });
}
