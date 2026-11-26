import { HttpError } from '../utils/httpError.js';

export const notFound = (req, res, next) => {
  const error = new HttpError(404, `Route Not Found - ${req.originalUrl}`);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  console.error('[Error]:', err.message || err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
};
