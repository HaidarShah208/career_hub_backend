/**
 * Typed application errors.
 *
 * Anything thrown that is an `AppError` (or subclass) is considered an
 * "operational" error: an expected failure we want to translate into a clean
 * HTTP response. The centralised error middleware uses `isOperational` to
 * decide between a controlled response and a generic 500.
 */

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: ErrorDetail[];

  constructor(
    message: string,
    statusCode = 500,
    errors: ErrorDetail[] = [],
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors: ErrorDetail[] = []) {
    super(message, 400, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors: ErrorDetail[] = []) {
    super(message, 422, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', errors: ErrorDetail[] = []) {
    super(message, 409, errors);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required') {
    super(message, 402);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, [], false);
  }
}
