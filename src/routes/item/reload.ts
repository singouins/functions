// routes/item/reload.ts

import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../../logger';

import { fetchItemMiddleware, assertItemPresent } from '../../middlewares/fetch-item';
import { fetchSatchelMiddleware, assertSatchelPresent} from '../../middlewares/fetch-satchel';

import metaWeapon from '../../models/metaWeapon';
import { consumePA, getPA } from '../../redis/redisUtils';
import { SatchelAmmo } from '../../models/Satchel';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/:item_uuid/reload',
  [
    param('item_uuid')
      .isUUID(4)
      .withMessage('Invalid UUID format'),
    ],
  asyncHandler(fetchItemMiddleware),
  asyncHandler(fetchSatchelMiddleware),
  asyncHandler(async (req: Request, res: Response) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { item_uuid } = req.params;
    logger.info(`POST /${item_uuid}/reload`);

    // We check middleware functions didn't screw up
    assertItemPresent(req)
    assertSatchelPresent(req)

    // We look for the related metaWeapon
    const meta = await metaWeapon.findOne({ _id: Number(req.item.metaid) }).exec();
    if (!meta) {
      const msg = `metaWeapon.id:${req.item.metaid} not found`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: req.item });
    } else {
      logger.verbose(`metaWeapon.id:${req.item.metaid} found`);
    }

    if (typeof req.item.ammo !== 'number') {
      const msg = `Item.id:${req.item.id} has no ammo field or ammo is not a number`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: req.item });
    }

    if (req.item.ammo == meta.max_ammo) {
      const msg = `Item.id:${req.item.id} is already full (req.item.ammo == ${meta.max_ammo})`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: req.item });
    }

    // We remove from the Satchel the amount of ammo we reloaded
    try {
      if (meta.caliber && typeof meta.max_ammo === 'number'){
        logger.debug(`Item.id:${req.item.id} is using ${meta.caliber} ammo`);
        req.satchel.ammo[meta.caliber as keyof SatchelAmmo] -= meta.max_ammo;
        req.satchel.updated = new Date();
        await req.satchel.save();
      }
    } catch (err) {
      logger.error(`Item.id:${req.item.id} Unable to store ammo in Satchel: ${err}`)
    }

    // We maxx the amount of req.item.ammo
    try {
      if (typeof meta.max_ammo === 'number'){
        req.item.ammo = meta.max_ammo;
        req.item.updated = new Date();
        await req.item.save();
      }
    } catch (err) {
      logger.error(`Item.id:${req.item.id} Unable to empty req.item.ammo: ${err}`)
    }

    // We consume 2 🔵 for this action
    try {
      await consumePA({
        creatureUUID: req.item.bearer,  // The creature UUID
        bluepa: 2,                      // Number of blue PA to consume
        redpa: 0,                       // Number of red PA to consume
        duration: 3600                  // Each PA lasts 1 hours (in seconds)
      });
    } catch (err) {
      logger.error(`Creature.id:${req.item.bearer} Unable to consume PA: ${err}`)
    }

    const msg = `Item.id:${req.item.id} reloaded`
    logger.verbose(msg);
    return res.status(200).json({
      success: true,
      msg: msg,
      payload: {
        item: req.item,
        pa: await getPA(req.item.bearer),
        satchel: req.satchel
      }
    });
  }
));

export default router;
