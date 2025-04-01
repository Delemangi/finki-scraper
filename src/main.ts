import { setTimeout } from 'node:timers/promises';

import { getConfigProperty } from './utils/config.js';
import { messages } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { Scraper } from './utils/Scraper.js';

const names = process.argv.slice(2);

logger.info(messages.initializing);

const scrapers =
  names.length === 0
    ? Object.entries(getConfigProperty('scrapers'))
        .filter(([, cfg]) => cfg.enabled)
        .map(([name]) => new Scraper(name))
    : names.map((name) => new Scraper(name));

for (const scraper of scrapers) {
  void scraper.run();

  await setTimeout(1_000);
}
