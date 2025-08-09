import type { Service } from 'finki-auth';

import { z } from 'zod';

import type { PostData } from './Post.js';

export const ScraperConfigSchema = z.object({
  enabled: z.boolean().optional(),
  link: z.string(),
  maxPosts: z.number().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  strategy: z.string(),
  webhook: z.string().optional(),
});

export enum Strategy {
  Announcements = 'announcements',
  Course = 'course',
  Diplomas = 'diplomas',
  Events = 'events',
  Example = 'example',
  Jobs = 'jobs',
  Partners = 'partners',
  Projects = 'projects',
  Timetables = 'timetables',
}

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;

export type ScraperStrategy = {
  getCookie?: () => Promise<string>;
  getId: (element: Element) => null | string;
  getPostData: (element: Element) => PostData;
  getRequestInit?: (cookie: string | undefined) => RequestInit | undefined;
  idsSelector: string;
  postsSelector: string;
  scraperService?: Service;
};

export const StrategySchema = z.enum(Strategy);
