import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';

import { errors, messages } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { getNamedScrapers } from './utils/scrapers.js';

const app = new Hono();
app.use('*', cors());
app.use('*', honoLogger());

const port = 3_000;

logger.info(messages.initializing);

const scrapers = getNamedScrapers();

app.get('/', (c) => c.text(messages.appRunning));

app.get('/list', (c) =>
  c.json({
    scrapers: Object.keys(scrapers),
  }),
);

app.get('/get/:name', async (c) => {
  const name = c.req.param('name');

  const scraper = scrapers[name];

  if (scraper === undefined) {
    return c.json(
      {
        error: errors.scraperNotFound,
      },
      404,
    );
  }

  const posts = await scraper.runOnce();

  if (posts === null) {
    return c.json(
      {
        error: errors.postsNotFound,
      },
      500,
    );
  }

  return c.json({
    posts,
  });
});

app.delete('/delete', async (c) => {
  for (const scraper of Object.values(scrapers)) {
    await scraper.clearCache();
  }

  return c.json({
    message: messages.cacheCleared,
  });
});

app.delete('/delete/:name', async (c) => {
  const name = c.req.param('name');

  const scraper = scrapers[name];

  if (scraper === undefined) {
    return c.json(
      {
        error: errors.scraperNotFound,
      },
      404,
    );
  }

  await scraper.clearCache();

  return c.json({
    message: messages.cacheCleared,
  });
});

serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    logger.info(messages.appRunning);
  },
);
