import cors from 'cors';
import express, { type Express } from 'express';
import { getEnv } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';

export function createApp(): Express {
  const { FRONTEND_URL } = getEnv();
  const app = express();

  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
