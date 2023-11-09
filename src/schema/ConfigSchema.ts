import { z } from "zod";

export const ConfigSchema = z.object({
  coursesCookie: z.record(z.string()),
  diplomasCookie: z.record(z.string()),
  errorDelay: z.number().optional(),
  maxPosts: z.number().optional(),
  scrapers: z.record(
    z.object({
      cookie: z.record(z.string()).optional(),
      enabled: z.boolean(),
      link: z.string(),
      name: z.string().optional(),
      role: z.string().optional(),
      strategy: z.string(),
      webhook: z.string().optional(),
    }),
  ),
  sendPosts: z.boolean().optional(),
  successDelay: z.number().optional(),
  webhook: z.string().optional(),
});
