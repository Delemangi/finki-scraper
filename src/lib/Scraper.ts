import { z } from 'zod';

import type { PostData } from './Post.js';

export const ScraperConfigSchema = z.object({
  cookie: z.record(z.string()).optional(),
  enabled: z.boolean().optional(),
  link: z.string(),
  name: z.string().optional(),
  role: z.string().optional(),
  strategy: z.string(),
  webhook: z.string().optional(),
});

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;

export type ScraperStrategy = {
  defaultCookie?: Record<string, string>;
  getId: (element: Element) => null | string;
  getPostData: (element: Element) => PostData;
  getRequestInit: (cookie: string) => RequestInit | undefined;
  idsSelector: string;
  postsSelector: string;
};
