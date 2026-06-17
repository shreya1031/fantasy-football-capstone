export class AppError extends Error {
  constructor(code, message, statusCode = 400, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(code, message) {
  return new AppError(code, message, 404);
}

export function unauthorized(code = 'UNAUTHORIZED', message = 'Authentication required') {
  return new AppError(code, message, 401);
}

export function forbidden(code = 'FORBIDDEN', message = 'Access denied') {
  return new AppError(code, message, 403);
}

export function conflict(code, message) {
  return new AppError(code, message, 409);
}
