// routes/bazaar/ammo.ts

import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../../logger';

import { fetchSatchelMiddleware, assertSatchelPresent } from '../../middlewares/fetch-satchel';

import { AMMUNITIONS } from '../../globals';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/:creature_uuid/:action/ammo/:caliber',
  [
    param('creature_uuid')
      .isUUID(3)
      .withMessage('Invalid UUID format'),
    param('action')
      .matches(/^buy|sell$/).withMessage('Action must be (buy|sell)'),
    param('caliber')
      .isIn(Object.keys(AMMUNITIONS))
      .withMessage('Invalid caliber'),
    ], 
    asyncHandler(fetchSatchelMiddleware),
    asyncHandler(async (req: Request, res: Response) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { creature_uuid, action, caliber } = req.params;
    logger.info(`POST /${creature_uuid}/${action}/ammo/${caliber}`);

    // We check middleware functions didn't screw up
    assertSatchelPresent(req)

    if ( action == 'sell')
    {
      var price = + AMMUNITIONS[caliber]['price'] * 10
      var quantity = - 10

      // We need to check there is enough ammo to sell
      if (req.satchel.ammo[caliber] < Math.abs(quantity)) {
        const msg = `Satchel.id:${req.satchel.id} has not enough ${caliber} (${req.satchel.ammo[caliber]})`
        logger.verbose(msg);
        return res.status(200).json({
          success: false,
          msg: msg,
          payload: {
            satchel: req.satchel
          }
        });
      }

      var ret_msg = `Ammo:${caliber} sold successfully (${quantity} for ${Math.abs(price)})`
    } else if ( action == 'buy') {
      var price = - AMMUNITIONS[caliber]['price'] * 10
      var quantity = 10

      // We need to check there is enough currency to buy
      const curr = req.satchel.currency.banana
      if (curr < Math.abs(price)) {
        const msg = `Satchel.id:${req.satchel.id} has not enough currency to buy (${curr})`
        logger.verbose(msg);
        return res.status(200).json({
          success: false,
          msg: msg,
          payload: {
            satchel: req.satchel
          }
        });
      }

      var ret_msg = `Ammo:${caliber} bought successfully (${quantity} for ${Math.abs(price)})`
    } else {
      const msg = `Price:${caliber} not found`
      logger.warn(msg);
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }

    // We update Satchel
    try {
      req.satchel.ammo[caliber] += quantity
      req.satchel.currency.banana += price
      req.satchel.updated = new Date()
      await req.satchel.save()
    } catch (err) {
      const msg = `Satchel.id:${req.satchel.id} Unable to UPDATE: ${err}`
      logger.error(msg)
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }

    logger.verbose(ret_msg);
    return res.status(200).json({
      success: true,
      msg: ret_msg,
      payload: {
        satchel: req.satchel
      }
    });

}));

export default router;