import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

import logger from '../../logger';
import Item from '../../models/Item';
import Auction from '../../models/Auction';
import metaWeapon from '../../models/metaWeapon';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/:uuid/:price',
  [
    param('uuid')
      .isUUID(4) // Validate that uuid param matches UUID v4 format
      .withMessage('Invalid UUID format'),
    param('price') // Validate that price param is numeric
      .matches(/^\d+$/).withMessage('Price must be numeric'),
  ], asyncHandler(async (req: Request, res: Response) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uuid, price } = req.params;
    logger.info(`POST /${uuid}/${price}`);

    // We look for the related Item
    const item = await Item.findById(uuid).exec();
    if (!item) {
      logger.warn(`Item.id:${uuid} not found`);
      return res.status(200).json({ 
          success: false,
          msg: `Item.id:${uuid} not found`,
          payload: null
      });
    } else {
      logger.verbose(`Item.id:${uuid} found`);
    }

    // We check if it can be auctioned
    if (item.bound_type != 'BoE' && item.bound) {
      logger.warn(`Item.id:${uuid} cannot be auctioned`);
      return res.status(200).json({ 
          success: false,
          msg: `Item.id:${uuid} cannot be auctioned`,
          payload: item
      });
    }

    // We look for the related meta (Item.metaid)
    const meta = await metaWeapon.findOne({ _id: Number(item.metaid) }).exec();
    if (!meta) {
      logger.warn(`metaWeapon.id:${item.metaid} not found`);
      return res.status(200).json({ 
          success: false,
          msg: `metaWeapon.id:${item.metaid} not found`,
          payload: null
      });
    } else {
      logger.verbose(`metaWeapon.id:${item.metaid} found`);
    }

    try {
      const auction = await Auction.create({
        item: {
          id: item.id,
          metaid: item.metaid,
          metatype: item.metatype,
          name: meta.name,
          rarity: item.rarity,
        },
        price: price,
        seller: {
          id: item.bearer,
          name: 'Best Seller',
        }
      });

      logger.verbose(`Auction.id:${auction.id} created`);
      return res.status(201).json({
        success: true,
        msg: `Auction.id:${auction.id} created successfully`,
        payload: {
          auction: auction,
          item: item,
        }
      });
    } catch (err) {
      logger.error(`Auction.id:${uuid} creation failed: ${err}`)
      if (err instanceof Error) {
        if (err.name === 'ValidationError') {
          return res.status(400).json({ success: false, msg: err.message, payload: null });
        }
      }
    }
}));

export default router;