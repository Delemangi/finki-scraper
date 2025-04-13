import { z } from 'zod';

import { ScraperConfigSchema } from './Scraper.js';

const CookiesSchema = z.object({
  courses: z.record(z.string()).optional(),
  diplomas: z.record(z.string()).optional(),
});

export const CookiesKeysSchema = CookiesSchema.keyof();
export type CookiesKeys = z.infer<typeof CookiesKeysSchema>;

const CredentialsSchema = z.object({
  password: z.string(),
  username: z.string(),
});

export const RequiredConfigSchema = z.object({
  color: z.string().optional(),
  credentials: CredentialsSchema.optional(),
  errorDelay: z.number().optional(),
  errorWebhook: z.string().optional(),
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

export const FullyRequiredConfigSchema = RequiredConfigSchema.required().extend(
  {
    credentials: CredentialsSchema.optional(),
  },
);
export type FullyRequiredConfig = z.infer<typeof FullyRequiredConfigSchema>;
