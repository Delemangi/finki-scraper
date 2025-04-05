import { getConfigProperty } from '../configuration/config.js';
import { Scraper } from '../Scraper.js';

const getScrapers = () => {
  const names = process.argv.slice(2);

  if (names.length === 0) {
    const scrapers = getConfigProperty('scrapers');

    return Object.entries(scrapers)
      .filter(([, scraper]) => scraper.enabled)
      .map(([name]) => new Scraper(name));
  }

  return names.map((name) => new Scraper(name));
};

export const getNamedScrapers = () => {
  const scrapers = getScrapers();

  return Object.fromEntries(scrapers.map((scraper) => [scraper.name, scraper]));
};
