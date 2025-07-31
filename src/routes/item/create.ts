// routes/item/create.ts

import express, { Request, Response, NextFunction } from 'express';
import logger from '../../logger';

import Item from '../../models/Item';
import metaWeapon from '../../models/metaWeapon';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
  
    const item_base = req.body
    logger.info(`POST /`);

    if (item_base.bound_type == 'BoE') { item_base.bound = false }

    // We look for the related metaWeapon (Item.metaid)
    if (req.body.metatype == 'weapon') {
      const meta = await metaWeapon.findOne({ _id: Number(req.body.metaid) }).exec();
      if (!meta) {
        const msg = `metaWeapon.id:${req.body.metaid} not found`
        logger.warn(msg);
        return res.status(200).json({ success: false, msg: msg, payload: null });
      } else {
        logger.verbose(`metaWeapon.id:${req.body.metaid} found`);
        item_base.ammo = meta.max_ammo
      }
    }

    try {
      const item = await Item.create(item_base);
      const msg = `Item.id:${item.id} created`
      logger.verbose(msg);
      return res.status(201).json({ success: true, msg: msg, payload: {item: item} });
    } catch (err) {
      logger.error(`Item.id:null creation failed: ${err}`)
    }
  }
));

export default router;
