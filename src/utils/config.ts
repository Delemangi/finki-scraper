import { readFileSync } from 'node:fs';

import {
  type ConfigKeys,
  ConfigSchema,
  type FullyRequiredConfig,
} from '../lib/Config.js';
import { errors } from './constants.js';

const initializeConfig = () => {
  try {
    const contents = readFileSync('./config/config.json', 'utf8');
    const parsedContents: unknown = JSON.parse(contents);

    return ConfigSchema.parse(parsedContents);
  } catch {
    throw new Error(errors.configParseFailed);
  }
};

const config = initializeConfig();

const DEFAULT_CONFIGURATION: FullyRequiredConfig = {
  coursesCookie: {},
  diplomasCookie: {},
  errorDelay: 60_000,
  maxPosts: 20,
  scrapers: {},
  sendPosts: false,
  successDelay: 180_000,
  webhook: '',
} as const;

export const getConfigProperty = <T extends ConfigKeys>(property: T) =>
  config?.[property] ?? DEFAULT_CONFIGURATION[property];
