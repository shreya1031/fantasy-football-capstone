import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function start() {
  await connectDB();
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server', error.message);
  process.exit(1);
});
