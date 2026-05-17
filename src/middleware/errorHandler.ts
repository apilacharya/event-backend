import { NextFunction, Request, Response } from 'express';

interface AppError extends Error {
  status?: number;
  errors?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    errors: err.errors || {},
  });
}
