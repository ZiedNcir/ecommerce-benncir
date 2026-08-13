import type { HydratedDocument } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<Record<string, unknown>> & {
        _id: unknown;
        role?: string;
        email?: string;
        name?: string;
      };
    }
  }
}

export {};
