import { type EmbedBuilder } from 'discord.js';

declare global {
  type ScraperStrategy = {
    defaultCookie?: { [index: string]: string };
    getId: (e: Element) => string | null;
    getPostData: (e: Element) => [string | null, EmbedBuilder];
    getRequestInit: (cookie: string) => RequestInit | undefined;
    idsSelector: string;
    postsSelector: string;
  };

  type ScraperConfig = {
    cookie?: { [index: string]: string };
    link: string;
    role?: string;
    strategy: string;
    webhook: string;
  };
}

export { };
