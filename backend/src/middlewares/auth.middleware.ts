import jwt, { type JwtPayload } from 'jsonwebtoken';
import User from '../models/User.ts';

function readToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

export async function protect(req, res, next) {
  try {
    const token = readToken(req);

    if (!token) {
      return res.status(401).json({
        code: 'AUTH_REQUIRED',
        message: 'Authentication required. Please login to access this resource.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        code: 'AUTH_USER_NOT_FOUND',
        message: 'The authenticated user no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 'AUTH_INVALID_TOKEN',
      message: 'Your session is invalid or expired. Please login again.',
    });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      code: 'ADMIN_REQUIRED',
      message: 'Admin access required.',
    });
  }
  next();
}
