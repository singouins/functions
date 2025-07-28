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

router.delete(
  '/:uuid',
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
    logger.info(`DELETE /${uuid}`);

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
      logger.verbose(`Auction.id:${uuid} found`);
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
      logger.verbose(`Item.id:${auction.item.id} found`);
    }

    try {
      await auction.deleteOne(); // This deletes the document from MongoDB
      logger.verbose(`Auction.id:${uuid} destroyed`);
      return res.status(204).json({
        success: true,
        msg: `Auction.id:${uuid} destroyed successfully`,
        payload: null
      });
    } catch (err) {
      logger.error(`Auction.id:${uuid} deletion failed: ${err}`)
      return res.status(200).json({
        success: true,
        msg: `Auction.id:${uuid} deletion failed: ${err}`,
        payload: null,
      });
    }
}));

export default router;