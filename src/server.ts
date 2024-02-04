import { getConfigProperty } from './utils/config.js';
import { errors, messages } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { Scraper } from './utils/Scraper.js';
import express from 'express';
import morgan from 'morgan';

const app = express();
morgan(':method :url :status :res[content-length] - :response-time ms');
const port = 3_000;

const names = process.argv.slice(2);

logger.info(messages.initializing);

const scrapers: Record<string, Scraper> = {};

app.use(morgan('combined'));

if (names.length === 0) {
  for (const [name, cfg] of Object.entries(getConfigProperty('scrapers'))) {
    if (cfg.enabled) {
      scrapers[name] = new Scraper(name);
    }
  }
} else {
  for (const name of names) {
    scrapers[name] = new Scraper(name);
  }
}

app.get('/', (_, response) => {
  response.send(messages.appRunning);
});

app.get('/list', (_, response) => {
  response.send({
    scrapers: Object.keys(scrapers),
  });
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
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
