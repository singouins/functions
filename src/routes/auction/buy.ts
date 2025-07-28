import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

import logger from '../../logger';
import Item from '../../models/Item';
import Auction from '../../models/Auction';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/:uuid/buy',
  [
    param('uuid')
      .isUUID(4) // Validate that uuid param matches UUID v4 format
      .withMessage('Invalid UUID format'),
  ], asyncHandler(async (req: Request, res: Response) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uuid } = req.params;
    logger.info(`POST /${uuid}/buy`);

    // We look for the related Auction
    const auction = await Auction.findById(uuid).exec();
    if (!auction) {
      logger.warn(`Auction.id:${uuid} not found`);
      return res.status(200).json({ 
          success: false,
          msg: `Auction.id:${uuid} not found`,
          payload: null
      });
    } else {
      logger.debug(`Auction.id:${uuid} found`);
    }

    // We look for the related Item
    const item = await Item.findById(auction.item.id).exec();
    if (!item) {
      logger.warn(`Item.id:${auction.item.id} not found`);
      return res.status(200).json({ 
          success: false,
          msg: `Item.id:${auction.item.id} not found`,
          payload: null
      });
    } else {
      logger.debug(`Item.id:${auction.item.id} found`);
    }

    try {
      await auction.deleteOne(); // This deletes the document from MongoDB
      logger.debug(`Auction.id:${uuid} destroyed`);
    } catch (err) {
      logger.error(`Auction.id:${uuid} deletion failed: ${err}`)
    }
}));

export default router;