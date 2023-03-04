import { type EmbedBuilder } from 'discord.js';

declare global {
  type Config = {
    coursesCookie: { [index: string]: string };
    diplomasCookie: { [index: string]: string };
    errorDelay: number;
    maxPosts: number;
    scrapers: { [index: string]: ScraperConfig };
    successDelay: number;
  };

  type ScraperConfig = {
    cookie?: { [index: string]: string };
    enabled: boolean;
    link: string;
    name?: string;
    role?: string;
    strategy: string;
    webhook: string;
  };

  type ScraperStrategy = {
    defaultCookie?: { [index: string]: string };
    getId: (e: Element) => string | null;
    getPostData: (e: Element) => [string | null, EmbedBuilder];
    getRequestInit: (cookie: string) => RequestInit | undefined;
    idsSelector: string;
    postsSelector: string;
  };

}

export { };
