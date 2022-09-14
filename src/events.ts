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

const logger = getLogger('events');
const url = 'https://finki.ukim.mk/mk/fcse-events';
const webhook = new WebhookClient({ url: config.eventsURL });
const role = config.eventsRole;

while (true) {
  logger.info('Searching...');

  let response: Response;
  let text: string;

  try {
    response = await fetch(url);
    text = await response.text();
  } catch (error) {
    logger.warn(`Error while fetching, trying again in 10 seconds...\n${error}`);
    await setTimeout(10 * 1_000);
    continue;
  }

  if (!response.ok) {
    logger.warn(`Received response code ${response.status}, trying again in 10 seconds...`);
    await setTimeout(10 * 1_000);
    continue;
  }

  const DOM = new JSDOM(text);
  const element = DOM.window.document.querySelector('#block-system-main > div > div.view-content');

  if (element === null) {
    logger.warn('Container is empty, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  const posts = element.querySelectorAll('div.news-item');
  const lastPostID = posts.item(0).querySelector('a + a')?.getAttribute('href')?.split('/').at(-1);

  if (!existsSync('cache')) {
    logger.debug('Creating cache directory...');
    await mkdir('cache');
  }

  let cache = await readFile('./cache/events', {
    encoding: 'utf8',
    flag: 'a+'
  });
  cache = cache.trim();

  if (lastPostID === null || lastPostID === undefined) {
    logger.warn('First title is empty, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  if (cache === lastPostID) {
    logger.info('No new events, trying again in 10 minutes...');
    await setTimeout(10 * 60 * 1_000);
    continue;
  }

  const events = [];

  for (const post of Array.from(posts)) {
    const postElement = post.querySelector('a + a');
    const link = postElement?.getAttribute('href')?.trim();
    const title = postElement?.textContent?.trim();

    if (link?.split('/').at(-1) === cache) {
      logger.info('Found cached event');
      break;
    }

    logger.info(`Found event ${title}`);

    events.push({
      content: post.querySelector('div.col-xs-12.col-sm-8 > div.field-content')?.textContent,
      img: post.querySelector('img')?.getAttribute('src')?.split('?')[0],
      link: `https://finki.ukim.mk${link}`,
      title
    });
  }

  for (const event of events.reverse()) {
    if (event.content === '') {
      event.content = 'No description provided.';
    }

    const embed = new EmbedBuilder()
      .setTitle(event.title as string)
      .setURL(event.link)
      .setThumbnail(event.img as string)
      .setDescription(event.content ?? 'No description provided.')
      .setColor('#313183')
      .setTimestamp();

    try {
      await webhook.send({
        content: role === undefined || role === '' ? null : roleMention(role),
        embeds: [embed]
      });
      logger.info(`Sent event ${event.title}`);
    } catch (error) {
      logger.error(`Failed to send event ${event.title}\n${error}`);
    }
  }

  await writeFile('./cache/events', lastPostID, {
    encoding: 'utf8',
    flag: 'w'
  });

  logger.debug('Cache updated');

  logger.info('Trying again in 10 minutes...');
  await setTimeout(10 * 60 * 1_000);
}
