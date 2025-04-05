import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { errors, messages } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { getNamedScrapers } from './utils/scrapers.js';

const app = express();
app.use(cors());
app.use(morgan('combined'));

morgan(':method :url :status :res[content-length] - :response-time ms');
const port = 3_000;

logger.info(messages.initializing);

const scrapers = getNamedScrapers();

app.get('/', (_, response) => {
  response.send(messages.appRunning);
});

app.get('/list', (_, response) => {
  response.send({
    scrapers: Object.keys(scrapers),
  });
});

app.get('/get/:name', async (request, response) => {
  const { name } = request.params;

  const scraper = scrapers[name];

  if (scraper === undefined) {
    response.status(404).send({
      error: errors.scraperNotFound,
    });
    return;
  }

  const posts = await scraper.runOnce();

  if (posts === null) {
    response.status(500).send({
      error: errors.postsNotFound,
    });
    return;
  }

  response.send({
    posts,
  });
});

app.delete('/delete', async (_, response) => {
  for (const scraper of Object.values(scrapers)) {
    await scraper.clearCache();
  }

  response.send({
    message: messages.cacheCleared,
  });
});

app.delete('/delete/:name', async (request, response) => {
  const { name } = request.params;

  const scraper = scrapers[name];

  if (scraper === undefined) {
    response.status(404).send({
      error: errors.scraperNotFound,
    });
    return;
  }

  await scraper.clearCache();

  response.send({
    message: messages.cacheCleared,
  });
});

app.listen(port, () => {
  logger.info(messages.appRunning);
});
