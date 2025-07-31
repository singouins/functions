// routes/item/catalize.ts

import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../../logger';

import { fetchItemMiddleware, assertItemPresent } from '../../middlewares/fetch-item';
import { fetchSatchelMiddleware, assertSatchelPresent} from '../../middlewares/fetch-satchel';

import { consumePA, getPA } from '../../redis/redisUtils';
import { ITEM_RARITIES } from '../../globals';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/:item_uuid/catalyze',
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
    logger.info(`POST /${item_uuid}/catalyze`);

    // We check middleware functions didn't screw up
    assertItemPresent(req)
    assertSatchelPresent(req)

    // Find index of current item rarity and get next rarity
    const rarityIndex = ITEM_RARITIES.indexOf(req.item.rarity);
    if (rarityIndex === -1 || rarityIndex === ITEM_RARITIES.length - 1) {
      // Current rarity not found or already at max rarity
      const msg = `Item rarity '${req.item.rarity}' is invalid or at max level.`;
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }
    const nextRarity = ITEM_RARITIES[rarityIndex + 1];
    const nextRarityKey = nextRarity.toLowerCase();

    // We check that there is enough shards
    if (req.satchel.shard[nextRarityKey] < 10) {
      const msg = `Satchel.id:${req.satchel.id} not enough shard.${nextRarityKey}`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    } else {
      logger.verbose(`Satchel.id:${req.satchel.id} enough shard.${nextRarityKey}`);
    }

    // Update Item
    try {
      req.item.rarity = nextRarity;
      req.item.updated = new Date();
      await req.item.save();
    } catch (err) {
      logger.error(`Item.id:${item_uuid} Unable to UPDATE: ${err}`)
    }

    // Update Satchel amount
    try {
      req.satchel.shard[nextRarityKey] -= 10;
      req.satchel.updated = new Date();
      await req.satchel.save();
    } catch (err) {
    logger.error(`Satchel.id:${req.satchel.id} Unable to UPDATE: ${err}`)
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

    const msg = `Item.id:${item_uuid} catalyzed`
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
