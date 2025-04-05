import type { ColorResolvable } from 'discord.js';

import { readFileSync } from 'node:fs';

import { type ConfigKeys, ConfigSchema } from '../lib/Config.js';
import { errors } from '../utils/constants.js';
import { DEFAULT_CONFIGURATION } from './defaults.js';

const initializeConfig = () => {
  try {
    const contents = readFileSync('./config/config.json', 'utf8');
    const parsedContents: unknown = JSON.parse(contents);

    return ConfigSchema.parse(parsedContents);
  } catch (error) {
    throw new Error(errors.configParseFailed, {
      cause: error,
    });
  }
};

const config = initializeConfig();

export const getConfigProperty = <T extends ConfigKeys>(property: T) =>
  config?.[property] ?? DEFAULT_CONFIGURATION[property];

export const getThemeColor = () =>
  getConfigProperty('color') as ColorResolvable;
