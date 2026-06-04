import { Response } from 'express';
import { ErrorDetail } from '../errors';

export interface SuccessPayload<T> {
  success: true;
  message: string;
  data: T;
  meta?: object;
}

export interface ErrorPayload {
  success: false;
  message: string;
  errors: ErrorDetail[];
}

/**
 * Standard success response envelope:
 * { success: true, message: "Success", data: {...} }
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: object,
): Response {
  const payload: SuccessPayload<T> = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

/**
 * Standard error response envelope:
 * { success: false, message: "Error", errors: [] }
 */
export function sendError(
  res: Response,
  message = 'Error',
  statusCode = 500,
  errors: ErrorDetail[] = [],
): Response {
  const payload: ErrorPayload = { success: false, message, errors };
  return res.status(statusCode).json(payload);
}
