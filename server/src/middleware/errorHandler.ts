import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err);
  if (res.headersSent) return;
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}
