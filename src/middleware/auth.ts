import { Request, Response, NextFunction } from 'express';
import { getUserByUid } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = (req.headers['x-user-id'] as string) || req.query.userId as string;
  const authHeader = req.headers.authorization;

  if (userId) {
    req.user = { uid: userId };
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const user = await getUserByUid(token);
      if (user) {
        req.user = user;
        return next();
      }
    } catch {}
    req.user = { uid: token };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Missing user authentication credentials' });
};
