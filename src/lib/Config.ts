import { z } from 'zod';

import { ScraperConfigSchema } from './Scraper.js';

export const RequiredConfigSchema = z.object({
  color: z.string().optional(),
  coursesCookie: z.record(z.string()).optional(),
  diplomasCookie: z.record(z.string()).optional(),
  errorDelay: z.number().optional(),
  maxPosts: z.number().optional(),
  scrapers: z.record(ScraperConfigSchema).optional(),
  sendPosts: z.boolean().optional(),
  successDelay: z.number().optional(),
  webhook: z.string().optional(),
});
export type RequiredConfig = z.infer<typeof RequiredConfigSchema>;

export const ConfigSchema = RequiredConfigSchema.optional();
export type Config = z.infer<typeof ConfigSchema>;

export const ConfigKeysSchema = RequiredConfigSchema.keyof();
export type ConfigKeys = z.infer<typeof ConfigKeysSchema>;

export const FullyRequiredConfigSchema = RequiredConfigSchema.required();
export type FullyRequiredConfig = z.infer<typeof FullyRequiredConfigSchema>;
