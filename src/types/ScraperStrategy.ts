import { type EmbedBuilder } from "discord.js";

export type ScraperStrategy = {
  defaultCookie?: Record<string, string>;
  getId: (element: Element) => string | null;
  getPostData: (element: Element) => [string | null, EmbedBuilder];
  getRequestInit: (cookie: string) => RequestInit | undefined;
  idsSelector: string;
  postsSelector: string;
};
