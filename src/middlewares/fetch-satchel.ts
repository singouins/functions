import { Request, Response, NextFunction } from 'express';
import Satchel, { ISatchel } from '../models/Satchel';
import logger from '../logger';

// Extend Express Request interface to include satchel property
declare module 'express-serve-static-core' {
  interface Request {
    satchel?: ISatchel | null;
  }
}

/**
 * Middleware to find a Satchel by ID (creature_uuid param).
 * If found, attaches it to req.satchel and calls next().
 * If not found, returns HTTP 200 response.
 * If error, passes error to next middleware.
 */
export async function fetchSatchelMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { creature_uuid } = req.params;

  try {
    const satchel = await Satchel.findById(creature_uuid).exec();

    if (!satchel) {
      const msg = `Satchel.id:${creature_uuid} not found`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }

    logger.verbose(`Satchel.id:${satchel.id} found`);
    req.satchel = satchel;
    next();
  } catch (error) {
    next(error);
  }
}

export function assertSatchelPresent(req: Request): asserts req is Request & { satchel: ISatchel } {
  if (!req.satchel) {
    throw new Error('Satchel not set on request');
  }
}