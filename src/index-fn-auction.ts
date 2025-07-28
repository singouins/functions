import express, { Request, Response, NextFunction } from 'express';

import { connectMongo } from './mongo/mongoClient';
import createRoute from './routes/auction/create';
import deleteRoute from './routes/auction/delete';
import searchRoute from './routes/auction/search';
import healthRoute from './routes/health';
import logger from './logger';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', healthRoute);    // GET    /health
app.use('/', createRoute);    // POST   /:uuid/:price
app.use('/', deleteRoute);    // DELETE /:uuid
app.use('/', searchRoute);    // POST   /search

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

/*
async function startServer() {
  try {
    logger.info('Connecting to MongoDB');
    await connectMongo();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  }
}

startServer();
*/