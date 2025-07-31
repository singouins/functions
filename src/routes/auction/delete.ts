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

router.delete(
  '/:auction_uuid',
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
    logger.info(`DELETE /${auction_uuid}`);

    // We check middleware functions didn't screw up
    assertAuctionPresent(req)

    try {
      await req.auction.deleteOne(); // This deletes the document from MongoDB
      const msg = `Auction.id:${auction_uuid} destroyed`
      logger.verbose(msg);
      return res.status(204).json({ success: true, msg: msg, payload: null });
    } catch (err) {
      const msg = `Auction.id:${auction_uuid} deletion failed: ${err}`
      logger.error(msg)
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }
}));

export default router;