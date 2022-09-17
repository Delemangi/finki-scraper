import { existsSync } from 'node:fs';
import {
  writeFile,
  readFile,
  mkdir
} from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import {
  EmbedBuilder,
  roleMention,
  WebhookClient
} from 'discord.js';
import { JSDOM } from 'jsdom';
import config from '../config/config.json' assert {'type': 'json'};
import { getLogger } from './logger.js';

const logger = getLogger('announcements');
const url = 'https://www.finki.ukim.mk/mk/student-announcement';

const webhook = new WebhookClient({ url: config.announcementsURL });
const role = config.announcementsRole;
const successDelay = config.successDelay;
const errorDelay = config.errorDelay;

while (true) {
  logger.info('Searching...');

  let response: Response;
  let text: string;

  try {
    response = await fetch(url);
  } catch (error) {
    logger.warn(`Error while fetching\n${error}`);
    await setTimeout(errorDelay);
    continue;
  }

  try {
    text = await response.text();
  } catch (error) {
    logger.warn(`Error while parsing fetch results\n${error}`);
    await setTimeout(errorDelay);
    continue;
  }

  if (!response.ok) {
    logger.warn(`Received response code ${response.status}`);
    await setTimeout(errorDelay);
    continue;
  }

  if (!existsSync('cache')) {
    logger.debug('Creating cache directory...');
    await mkdir('cache');
  }

  let cache = await readFile('./cache/announcements', {
    encoding: 'utf8',
    flag: 'a+'
  });
  cache = cache.trim();

  const DOM = new JSDOM(text);
  const element = DOM.window.document.querySelector('#block-system-main > div > div.view-content.row');

  if (element === null) {
    logger.warn('Container is empty');
    await setTimeout(errorDelay);
    continue;
  }

  const posts = element.querySelectorAll('div.views-row');
  const lastPostID = posts.item(0).querySelector('a')?.getAttribute('href')?.split('/').at(-1);

  if (lastPostID === null || lastPostID === undefined) {
    logger.warn('First title is empty');
    await setTimeout(errorDelay);
    continue;
  }

  if (cache === lastPostID) {
    logger.info('No new announcements');
    await setTimeout(successDelay);
    continue;
  }

  const announcements = [];

  for (const post of Array.from(posts)) {
    const postElement = post.querySelector('a');
    const link = postElement?.getAttribute('href')?.trim();
    const title = postElement?.textContent?.trim();

    if (link?.split('/').at(-1) === cache) {
      logger.info('Found cached announcement');
      break;
    }

    logger.info(`Found announcement ${title}`);

    announcements.push({
      link: `https://finki.ukim.mk${link}`,
      title
    });
  }

  for (const announcement of announcements.reverse()) {
    const embed = new EmbedBuilder()
      .setTitle(announcement.title as string)
      .setURL(announcement.link)
      .setColor('#313183')
      .setTimestamp();

    try {
      await webhook.send({
        content: role === undefined || role === '' ? null : roleMention(role),
        embeds: [embed]
      });
      logger.info(`Sent announcement ${announcement.title}`);
    } catch (error) {
      logger.error(`Failed to send announcement ${announcement.title}\n${error}`);
    }
  }

  await writeFile('./cache/announcements', lastPostID, {
    encoding: 'utf8',
    flag: 'w'
  });

  logger.info('Finished');
  await setTimeout(successDelay);
}
