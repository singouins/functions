import { Request, Response, NextFunction } from 'express';
import Auction, { IAuction } from '../models/Auction';
import logger from '../logger';

// Extend Express Request interface to include auction property
declare module 'express-serve-static-core' {
  interface Request {
    auction?: IAuction | null;
  }
}

/**
 * Middleware to find a Auction by ID (auction_uuid param).
 * If found, attaches it to req.auction and calls next().
 * If not found, returns HTTP 200 response.
 * If error, passes error to next middleware.
 */
export async function fetchAuctionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { auction_uuid } = req.params;

  try {
    const auction = await Auction.findById(auction_uuid).exec();

    if (!auction) {
      const msg = `Auction.id:${auction_uuid} not found`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }

    logger.verbose(`Auction.id:${auction.id} found`);
    req.auction = auction;
    next();
  } catch (error) {
    next(error);
  }
}

export function assertAuctionPresent(req: Request): asserts req is Request & { auction: IAuction } {
  if (!req.auction) {
    throw new Error('Auction not set on request');
  }
}