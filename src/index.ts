import { setTimeout } from 'node:timers/promises';

import { messages } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { getNamedScrapers } from './utils/scrapers.js';

logger.info(messages.initializing);

const scrapers = getNamedScrapers();

for (const scraper of Object.values(scrapers)) {
  void scraper.run();

  await setTimeout(1_000);
}
