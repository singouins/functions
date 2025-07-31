import { Request, Response, NextFunction } from 'express';
import Item, { IItem } from '../models/Item';
import logger from '../logger';

// Extend Express Request interface to include item property
declare module 'express-serve-static-core' {
  interface Request {
    item?: IItem | null;
  }
}

/**
 * Middleware to find a Item by ID (item_uuid param).
 * If found, attaches it to req.item and calls next().
 * If not found, returns HTTP 200 response.
 * If error, passes error to next middleware.
 */
export async function fetchItemMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { item_uuid } = req.params;

  try {
    const item = await Item.findById(item_uuid).exec();

    if (!item) {
      const msg = `Item.id:${item_uuid} not found`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }

    logger.verbose(`Item.id:${item.id} found`);
    req.item = item;
    next();
  } catch (error) {
    next(error);
  }
}

export function assertItemPresent(req: Request): asserts req is Request & { item: IItem } {
  if (!req.item) {
    throw new Error('Item not set on request');
  }
}