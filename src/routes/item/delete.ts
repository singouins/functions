// routes/item/delete.ts

import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../../logger';

import { fetchItemMiddleware, assertItemPresent } from '../../middlewares/fetch-item';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.delete(
  '/:item_uuid',
  [
    param('item_uuid')
      .isUUID(4)
      .withMessage('Invalid UUID format'),
    ],
  asyncHandler(fetchItemMiddleware),
  asyncHandler(async (req: Request, res: Response) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { item_uuid } = req.params;
    logger.info(`DELETE /${req.params.item_uuid}`);

    // We check middleware functions didn't screw up
    assertItemPresent(req)

    try {
      await req.item.deleteOne(); // This deletes the document from MongoDB
      const msg = `Item.id:${item_uuid} destroyed`
      logger.verbose(msg);
      return res.status(204).json({ success: true, msg: msg, payload: {item: req.item} });
    } catch (err) {
      const msg = `Item.id:${item_uuid} deletion failed: ${err}`
      logger.error(msg)
      return res.status(200).json({ success: false, msg: msg, payload: null });
    }
  }
));

export default router;
