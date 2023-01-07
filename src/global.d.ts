import { type EmbedBuilder } from 'discord.js';

declare global {
  type ScraperStrategy = {
    getPostData: (e: Element) => [string | null, EmbedBuilder];
    getRequestInit: (cookie: string) => RequestInit | undefined;
    linksSelector: string;
    postsSelector: string;
  };

  type ScraperConfig = {
    cookie?: string;
    link: string;
    role?: string;
    strategy: string;
    webhook: string;
  };
}

export { };
