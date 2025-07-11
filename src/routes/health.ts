import { Router } from 'express';

import logger from '../logger';

const router = Router();

router.get('/health', (_req, res) => {
  logger.debug(`GET /health`);
  res.status(200).json({
    success: true,
    msg: 'Health check OK',
    payload: null
  });
});

export default router;