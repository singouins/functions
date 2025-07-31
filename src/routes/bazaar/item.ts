// routes/bazaar/item.ts

import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../../logger';

import { fetchItemMiddleware, assertItemPresent } from '../../middlewares/fetch-item';
import { fetchSatchelMiddleware, assertSatchelPresent} from '../../middlewares/fetch-satchel';

import metaArmor from '../../models/metaArmor';
import metaWeapon from '../../models/metaWeapon';

import { ITEM_RARITIES } from '../../globals';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/:creature_uuid/:action/item/:item_uuid',
  [
    param('creature_uuid')
      .isUUID(3)
      .withMessage('Invalid UUID format'),
    param('action')
      .matches(/^sell$/).withMessage('Action must be (sell)'),
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

    const { creature_uuid, action, item_uuid } = req.params;
    logger.info(`POST /${creature_uuid}/${action}/item/${item_uuid}`);

    // We check middleware functions didn't screw up
    assertItemPresent(req)
    assertSatchelPresent(req)

    // We look for the related meta
    if (req.item.metatype = 'weapon') {
      var meta = await metaWeapon.findOne({ _id: Number(req.item.metaid) }).exec();
    } else if (req.item.metatype = 'armor') {
      var meta = await metaArmor.findOne({ _id: Number(req.item.metaid) }).exec();
    } else {
      const msg = `metaWeapon.id:${req.item.metaid} not defined`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }
    if (!meta) {
      const msg = `metaWeapon.id:${req.item.metaid} not found`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    } else {
      logger.verbose(`metaWeapon.id:${req.item.metaid} found`);
    }

    const [sizexStr, sizeyStr] = meta.size.split('x');
    const sizex = parseInt(sizexStr, 10);
    const sizey = parseInt(sizeyStr, 10);
    const rarityIndex = ITEM_RARITIES.indexOf(req.item.rarity);

    // With the actual price formula, the price range is (0 =<>= 90)
    const price = Math.floor((sizex * sizey * (meta.tier + 1) * rarityIndex) / 2);
    logger.debug(`Math.floor((${sizex} * ${sizey} * (${meta.tier} + 1) * ${rarityIndex}) / 2) = ${price}`)

    // We update Satchel
    try {
      req.satchel.currency.banana += price
      req.satchel.updated = new Date()
      await req.satchel.save()
    } catch (err) {
      const msg = `Satchel.id:${req.satchel.id} Unable to UPDATE: ${err}`
      logger.error(msg)
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }

    // We update Item
    try {
      req.item.bearer = '00000000-cafe-3333-8888-000000000000' // Placeholder for Items sold to the bazaar
      req.item.updated = new Date();
      await req.item.save();
    } catch (err) {
      const msg = `Item.id:${req.item.id} Unable to UPDATE: ${err}`
      logger.error(msg)
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }

    const msg = `Item.id:${req.item.id} sold successfully (${price})`
    logger.verbose(msg);
    return res.status(200).json({
      success: true,
      msg: msg,
      payload: {
        satchel: req.satchel
      }
    });

}));

export default router;