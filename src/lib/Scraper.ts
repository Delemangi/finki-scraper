import type { PostData } from './Post.js';

export type ScraperConfig = {
  cookie?: Record<string, string>;
  enabled: boolean;
  link: string;
  name?: string;
  role?: string;
  strategy: string;
  webhook?: string;
};

export type ScraperStrategy = {
  defaultCookie?: Record<string, string>;
  getId: (element: Element) => null | string;
  getPostData: (element: Element) => PostData;
  getRequestInit: (cookie: string) => RequestInit | undefined;
  idsSelector: string;
  postsSelector: string;
};
