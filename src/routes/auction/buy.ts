import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../../logger';

import { fetchAuctionMiddleware, assertAuctionPresent } from '../../middlewares/fetch-auction';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/:auction_uuid/buy',
  [
    param('auction_uuid')
      .isUUID(4) // Validate that uuid param matches UUID v4 format
      .withMessage('Invalid UUID format'),
  ],
  asyncHandler(fetchAuctionMiddleware),
  asyncHandler(async (req: Request, res: Response) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { auction_uuid } = req.params;
    logger.info(`POST /${auction_uuid}/buy`);

    // We check middleware functions didn't screw up
    assertAuctionPresent(req)

    try {
      await req.auction.deleteOne(); // This deletes the document from MongoDB
      logger.debug(`Auction.id:${auction_uuid} destroyed`);
    } catch (err) {
      logger.error(`Auction.id:${auction_uuid} deletion failed: ${err}`)
    }
}));

export default router;