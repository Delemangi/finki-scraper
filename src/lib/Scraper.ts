import { z } from 'zod';

import type { PostData } from './Post.js';

export const ScraperConfigSchema = z.object({
  enabled: z.boolean().optional(),
  link: z.string(),
  name: z.string().optional(),
  role: z.string().optional(),
  strategy: z.string(),
  webhook: z.string().optional(),
});

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;

export type ScraperStrategy = {
  getCookie: (() => Promise<string>) | undefined;
  getId: (element: Element) => null | string;
  getPostData: (element: Element) => PostData;
  getRequestInit: (cookie: string | undefined) => RequestInit | undefined;
  idsSelector: string;
  postsSelector: string;
};
