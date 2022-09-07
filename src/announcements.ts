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
import { logger } from './logger.js';

const url = 'https://www.finki.ukim.mk/mk/student-announcement';
const webhook = new WebhookClient({ url: config.announcementsURL });
const role = config.announcementsRole;

while (true) {
  logger.info('Searching for announcements...');

  logger.debug('Fetching...');
  const response = await fetch(url);
  const text = await response.text();
  const DOM = new JSDOM(text);

  const element = DOM.window.document.querySelector('#block-system-main > div > div.view-content.row');

  if (element === null) {
    logger.warn('Announcements container is null, trying again in 30 seconds...');
    // 30 seconds
    await setTimeout(30 * 1_000);
    continue;
  }

  const posts = element.querySelectorAll('div.views-row');
  const firstTitle = posts.item(0).querySelector('a')?.textContent?.trim();

  if (!existsSync('cache')) {
    logger.debug('Creating cache directory...');
    await mkdir('cache');
  }

  let cachedTitle = await readFile('./cache/announcements', {
    encoding: 'utf8',
    flag: 'a+'
  });
  cachedTitle = cachedTitle.trim();

  if (firstTitle === null || firstTitle === undefined) {
    logger.warn('First title is null or undefined, trying again in 30 seconds...');
    // 30 seconds
    await setTimeout(30 * 1_000);
    continue;
  }

  if (cachedTitle === firstTitle) {
    logger.info('No new announcements, trying again in 1 hour...');
    // 1 hour
    await setTimeout(60 * 60 * 1_000);
    continue;
  }

  const announcements = [];

  for (const post of Array.from(posts)) {
    const postElement = post.querySelector('a');
    const title = postElement?.textContent;

    if (title === cachedTitle) {
      logger.info('Found all new announcements');
      break;
    }

    announcements.push({
      link: `https://finki.ukim.mk${postElement?.getAttribute('href')}`,
      title
    });
  }

  for (const announcement of announcements.reverse()) {
    const embed = new EmbedBuilder()
      .setTitle(announcement.title as string)
      .setURL(announcement.link)
      .setColor('#313183');

    try {
      await webhook.send({
        content: `${role === undefined || role === '' ? null : roleMention(role)}`,
        embeds: [embed]
      });
      logger.info(`Sent announcement ${announcement.title}`);
    } catch (error) {
      logger.error(`Failed to send announcement ${announcement.title}\n${error}`);
    }
  }

  await writeFile('./cache/announcements', firstTitle, {
    encoding: 'utf8',
    flag: 'w'
  });

  logger.debug('Cache updated');
}
