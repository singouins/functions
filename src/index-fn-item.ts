import express, { Request, Response, NextFunction } from 'express';

import { connectMongo } from './mongo/mongoClient';
import createRoute from './routes/item/create';
import deleteRoute from './routes/item/delete';
import reloadRoute from './routes/item/reload';
import unloadRoute from './routes/item/unload';
import healthRoute from './routes/health';
import logger from './logger';

logger.info(`Server starting`)

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', healthRoute);  // GET    /health
app.use('/', createRoute);  // POST   /
app.use('/', deleteRoute);  // DELETE /:uuid
app.use('/', reloadRoute);  // POST   /:uuid/reload
app.use('/', unloadRoute);  // POST   /:uuid/unload

connectMongo()
  .then(() => {
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
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