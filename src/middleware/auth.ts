import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  id: number;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ message: 'Unauthorized', errors: {} });
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', errors: {} });
  }
}
