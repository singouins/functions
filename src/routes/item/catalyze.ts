import express, { Request, Response, NextFunction } from 'express';
import logger from '../../logger';
import Item from '../../models/Item';
import Satchel from '../../models/Satchel';
import { consumePA, getPA } from '../../redis/redisUtils';

import { ITEM_RARITIES } from '../../globals';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post('/:uuid/catalyze', asyncHandler(async (req: Request, res: Response) => {
  logger.info(`POST /${req.params.uuid}/catalyze`);

  const { uuid } = req.params;

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
    logger.debug(`Item.id:${uuid} found`);
  }

  // We look for the related Satchel (Item.bearer)
  const satchel = await Satchel.findById(item.bearer).exec();
  if (!satchel) {
    logger.warn(`Satchel.id:${uuid} not found`);
    return res.status(200).json({ 
        success: false,
        msg: `Satchel.id:${uuid} not found`,
        payload: null
     });
  } else {
    logger.debug(`Satchel.id:${uuid} found`);
  }

  // Find index of current item rarity and get next rarity
  const rarityIndex = ITEM_RARITIES.indexOf(item.rarity);
  if (rarityIndex === -1 || rarityIndex === ITEM_RARITIES.length - 1) {
    // Current rarity not found or already at max rarity
    const msg = `Item rarity '${item.rarity}' is invalid or at max level.`;
    logger.warn(msg);
    return res.status(200).json({ 
        success: false,
        msg: msg,
        payload: null
     });
  }
  const nextRarity = ITEM_RARITIES[rarityIndex + 1];
  const nextRarityKey = nextRarity.toLowerCase();

  // We check that there is enough shards
  if (satchel.shard[nextRarityKey] < 10) {
    logger.warn(`Satchel.id:${satchel.id} not enough shard.${nextRarityKey}`);
    return res.status(200).json({ 
        success: false,
        msg: `Satchel.id:${satchel.id} not enough shard.${nextRarityKey}`,
        payload: null
     });
  } else {
    logger.debug(`Satchel.id:${satchel.id} enough shard.${nextRarityKey}`);
  }

  // Update Item
  try {
    item.rarity = nextRarity;
    item.updated = new Date();
    await item.save();
  } catch (err) {
    logger.error(`Item.id:${uuid} Unable to UPDATE: ${err}`)
  }

  // Update Satchel amount
  try {
    // Decrement shard count by 10
    if (typeof satchel.shard[nextRarityKey] === 'number') {
      satchel.shard[nextRarityKey] -= 10;

      // Optional: ensure it doesn't go below zero
      if (satchel.shard[nextRarityKey] < 0) {
        satchel.shard[nextRarityKey] = 0;
      }
    }
    satchel.updated = new Date();
    await satchel.save();
  } catch (err) {
  logger.error(`Satchel.id:${satchel.id} Unable to UPDATE: ${err}`)
  }

  // We consume 2 🔵 for this action
  try {
    await consumePA({
      creatureUUID: item.bearer,   // The creature UUID
      bluepa: 2,                   // Number of blue PA to consume
      redpa: 0,                    // Number of red PA to consume
      duration: 3600               // Each PA lasts 1 hours (in seconds)
    });
  } catch (err) {
    logger.error(`Creature.id:${item.bearer} Unable to consume PA: ${err}`)
  }

  logger.info(`Item.id:${uuid} catalyzed`);
  return res.status(200).json({
    success: true,
    msg: `Item.id:${uuid} catalyzed successfully`,
    payload: {
      item: item,
      pa: await getPA(item.bearer),
      satchel: satchel
    }
  });
}));

export default router;
