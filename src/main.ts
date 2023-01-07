import { argv } from 'node:process';
import { Scraper } from './Scraper.js';

const name = argv[2];

if (name === undefined) {
  throw new Error('No scraper name provided');
}

const scraper = new Scraper(name);
await scraper.run();
