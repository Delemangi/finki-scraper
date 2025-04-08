import { WebhookClient } from 'discord.js';

import { getConfigProperty } from '../configuration/config.js';

const errorWebhookUrl = getConfigProperty('errorWebhook');

export const errorWebhook =
  errorWebhookUrl === ''
    ? undefined
    : new WebhookClient({
        url: errorWebhookUrl,
      });
