import { type ConfigSchema } from "../schema/ConfigSchema.js";
import { type z } from "zod";

export type Config = z.infer<typeof ConfigSchema>;
export type ConfigKeys = keyof Config;
