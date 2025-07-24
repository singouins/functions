import express, { Request, Response, NextFunction } from 'express';
import logger from '../../logger';
import Item from '../../models/Item';
import metaWeapon from '../../models/metaWeapon';
import Satchel, { SatchelAmmo } from '../../models/Satchel';
import { consumePA, getPA } from '../../redis/redisUtils';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post('/:uuid/unload', asyncHandler(async (req: Request, res: Response) => {
  logger.info(`POST /${req.params.uuid}/unload`);

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

  // We look for the related metaWeapon (Item.metaid)
  const meta = await metaWeapon.findOne({ _id: Number(item.metaid) }).exec();
  if (!meta) {
    logger.warn(`metaWeapon.id:${item.metaid} not found`);
    return res.status(200).json({ 
        success: false,
        msg: `metaWeapon.id:${item.metaid} not found`,
        payload: null
     });
  } else {
    logger.debug(`metaWeapon.id:${item.metaid} found`);
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

  if (typeof item.ammo !== 'number') {
    logger.warn(`Item.id:${uuid} has no ammo field or ammo is not a number`);
    return res.status(200).json({ 
        success: false,
        msg: `Item.id:${uuid} has no ammo field or ammo is not a number`,
        payload: null
     });
  }

  if (item.ammo == 0) {
    logger.warn(`Item.id:${uuid} is already empty (item.ammo == ${item.ammo})`);
    return res.status(200).json({ 
        success: false,
        msg: `Item.id:${uuid} is already empty (item.ammo == ${item.ammo})`,
        payload: item
     });
  }

  // We add back in the Satchel the amount of ammo we unloaded
  try {
    if (meta.caliber){
      logger.debug(`Item.id:${uuid} is using ${meta.caliber} ammo`);
      satchel.ammo[meta.caliber as keyof SatchelAmmo] += item.ammo;
      satchel.updated = new Date();
      await satchel.save();
    }
  } catch (err) {
    logger.error(`Item.id:${uuid} Unable to store ammo in Satchel: ${err}`)
  }

  // We empty the amount of item.ammo
  try {
    item.ammo = 0;
    item.updated = new Date();
    await item.save();
  } catch (err) {
    logger.error(`Item.id:${uuid} Unable to empty item.ammo: ${err}`)
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

  logger.info(`Item.id:${uuid} unloaded`);
  return res.status(200).json({
    success: true,
    msg: `Item.id:${uuid} unloaded successfully`,
    payload: {
      item: item,
      pa: await getPA(item.bearer),
      satchel: satchel
    }
  });
}));

export default router;
