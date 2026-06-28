import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface AuthRequest extends Request {
  userId?: string;
  userPhone?: string;
}

/**
 * Verifies the Bearer JWT from the Authorization header.
 * Attaches userId and userPhone to the request if valid.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      phoneNumber: string;
    };

    req.userId = decoded.userId;
    req.userPhone = decoded.phoneNumber;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
