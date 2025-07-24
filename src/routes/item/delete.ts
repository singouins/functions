import express, { Request, Response, NextFunction } from 'express';
import logger from '../../logger';
import Item from '../../models/Item';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.delete('/:uuid', asyncHandler(async (req: Request, res: Response) => {
  logger.info(`DELETE /${req.params.uuid}`);

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
    await item.deleteOne(); // This deletes the document from MongoDB
  }

  logger.info(`Item.id:${uuid} destroyed`);
  return res.status(204).json({
    success: true,
    msg: `Item.id:${uuid} destroyed successfully`,
    payload: null
  });
}));

export default router;
