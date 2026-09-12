import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  tokenVersion: number;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_alchemist_master_key_987654321';
    const decoded = jwt.verify(token, secret) as { id: string; tokenVersion: number; username: string; email: string };

    // Validate token version against DB to ensure revoked/reset sessions cannot be used
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, email: true, tokenVersion: true }
    });

    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      res.status(401).json({ error: 'Session invalidated. Please log in again.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
}
