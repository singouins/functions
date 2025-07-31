import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../../logger';

import { fetchItemMiddleware, assertItemPresent } from '../../middlewares/fetch-item';

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
  ],
  asyncHandler(fetchItemMiddleware),
  asyncHandler(async (req: Request, res: Response) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uuid, price } = req.params;
    logger.info(`POST /${uuid}/${price}`);

    // We check middleware functions didn't screw up
    assertItemPresent(req)

    // We check if it can be auctioned
    if (req.item.bound_type != 'BoE' && req.item.bound) {
      const msg = `Item.id:${uuid} cannot be auctioned`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: req.item });
    }

    // We look for the related meta (Item.metaid)
    const meta = await metaWeapon.findOne({ _id: Number(req.item.metaid) }).exec();
    if (!meta) {
      const msg = `metaWeapon.id:${req.item.metaid} not found`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    } else {
      logger.verbose(`metaWeapon.id:${req.item.metaid} found`);
    }

    try {
      const auction = await Auction.create({
        item: {
          id: req.item.id,
          metaid: req.item.metaid,
          metatype: req.item.metatype,
          name: meta.name,
          rarity: req.item.rarity,
        },
        price: price,
        seller: {
          id: req.item.bearer,
          name: 'Best Seller',
        }
      });

      const msg = `Auction.id:${auction.id} created`
      logger.verbose(msg);
      return res.status(201).json({
        success: true,
        msg: msg,
        payload: {
          auction: auction,
          item: req.item,
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