// Error carrying an HTTP status, thrown by services and turned into a response by errorHandler.
export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (message) => new HttpError(404, message);

export const conflict = (message) => new HttpError(409, message);

export function badRequest(message = 'Bad Request') {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export function unauthorized(message = 'Unauthorized') {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}
