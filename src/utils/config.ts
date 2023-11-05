import { ConfigSchema } from "../schema/ConfigSchema.js";
import { type Config, type ConfigKeys } from "../types/Config.js";
import { errors } from "./constants.js";
import { readFileSync } from "node:fs";

const initializeConfig = () => {
  try {
    return ConfigSchema.parse(
      JSON.parse(readFileSync("./config/config.json", "utf8")),
    );
  } catch {
    throw new Error(errors.configParseFailed);
  }
};

const config = initializeConfig();

const defaultConfig: Config = {
  coursesCookie: {},
  diplomasCookie: {},
  errorDelay: 60_000,
  maxPosts: 20,
  scrapers: {},
  successDelay: 180_000,
};

export const getConfigProperty = <T extends ConfigKeys>(
  property: T,
): Config[T] => {
  return config[property] ?? defaultConfig[property];
};
