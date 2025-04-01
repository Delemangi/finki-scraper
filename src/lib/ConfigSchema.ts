import { z } from 'zod';

export const RequiredConfigSchema = z.object({
  coursesCookie: z.record(z.string()).optional(),
  diplomasCookie: z.record(z.string()).optional(),
  errorDelay: z.number().optional(),
  maxPosts: z.number().optional(),
  scrapers: z
    .record(
      z.object({
        cookie: z.record(z.string()).optional(),
        enabled: z.boolean(),
        link: z.string(),
        name: z.string().optional(),
        role: z.string().optional(),
        strategy: z.string(),
        webhook: z.string().optional(),
      }),
    )
    .optional(),
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
