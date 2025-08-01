const start = performance.now();
import express, { Request, Response, NextFunction } from 'express';

import { connectMongo } from './mongo/mongoClient';
import ammoRoute from './routes/bazaar/ammo';
import itemRoute from './routes/bazaar/item';
import healthRoute from './routes/health';
import logger from './logger';

logger.info(`Server starting`)

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', healthRoute);    // GET    /health
app.use('/', ammoRoute);      // POST   /:creature_uuid/:action/ammo/:caliber
app.use('/', itemRoute);      // POST   /:creature_uuid/:action/item/:item_uuid

connectMongo()
  .then(() => {
    app.listen(PORT, () => logger.info(`Server running on port ${PORT} after ${performance.now() - start} ms`));
  })
  .catch(err => {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  });

// Custom error handler (must be last)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || 'Internal Server Error',
    payload: null
  });
});