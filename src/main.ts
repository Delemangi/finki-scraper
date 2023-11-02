import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { Scraper } from "./utils/Scraper.js";
import { argv } from "node:process";
import { setTimeout } from "node:timers/promises";

const names = argv.slice(2);

logger.info(
  `Initializing ${names.length === 0 ? "all" : names.length} scrapers`,
);

const scrapers =
  names.length === 0
    ? Object.entries(config.scrapers)
        .filter(([, cfg]) => cfg.enabled)
        .map(([name]) => new Scraper(name))
    : names.map((name) => new Scraper(name));

for (const scraper of scrapers) {
  void scraper.run();
  await setTimeout(1_000);
}
