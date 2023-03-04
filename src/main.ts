import { argv } from 'node:process';
import { Scraper } from './utils/Scraper.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';

const names = argv.slice(2);

logger.info(`Initializing ${names.length === 0 ? 'all' : names.length} scrapers`);

if (names.length === 0) {
  const allScrapers = Object.entries(config.scrapers).filter(([, cfg]) => cfg.enabled).map(([name]) => new Scraper(name));
  await Promise.all(allScrapers.map((scraper) => scraper.run()));
} else {
  const scrapers = names.map((name) => new Scraper(name));
  await Promise.all(scrapers.map((scraper) => scraper.run()));
}

logger.warn('No scrapers have been defined');
