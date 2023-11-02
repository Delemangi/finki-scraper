import { type ScraperConfig } from "./ScraperConfig.js";

export type Config = {
  coursesCookie: Record<string, string>;
  diplomasCookie: Record<string, string>;
  errorDelay: number;
  maxPosts: number;
  scrapers: Record<string, ScraperConfig>;
  successDelay: number;
};
