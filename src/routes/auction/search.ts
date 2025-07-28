import express, { Request, Response, NextFunction } from 'express';
import { parseFilter } from 'mongodb-query-parser';
import logger from '../../logger';

import Auction from '../../models/Auction';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post('/search', asyncHandler(async (req: Request, res: Response) => {
  logger.info(`POST /search`);
  logger.debug(JSON.stringify(req.body))

  // If req.body is already an object, stringify and re-parse for validation
  const filter = parseFilter(JSON.stringify(req.body));
  const results = await Auction.find(filter).exec();

  logger.verbose(`Search request successful`);
  return res.status(200).json({
    success: true,
    msg: `Search request successful`,
    payload: results
  });
}));

export default router;
