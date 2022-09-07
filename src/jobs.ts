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

const url = 'https://www.finki.ukim.mk/mk/fcse-jobs-internships';
const webhook = new WebhookClient({ url: config.jobsURL });
const role = config.jobsRole;

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
    logger.warn('container is empty, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  const posts = element.querySelectorAll('div.views-row');
  const firstTitle = posts.item(0).querySelector('a + a')?.textContent?.trim();

  if (!existsSync('cache')) {
    logger.debug('Creating cache directory...');
    await mkdir('cache');
  }

  let cachedTitle = await readFile('./cache/jobs', {
    encoding: 'utf8',
    flag: 'a+'
  });
  cachedTitle = cachedTitle.trim();

  if (firstTitle === null || firstTitle === undefined) {
    logger.warn('First title is null or undefined, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  if (cachedTitle === firstTitle) {
    logger.info('No new jobs, trying again in 10 minutes...');
    await setTimeout(10 * 60 * 1_000);
    continue;
  }

  const jobs = [];

  for (const post of Array.from(posts)) {
    const postElement = post.querySelector('a + a');
    const title = postElement?.textContent;

    if (title === cachedTitle) {
      logger.info('Found all new jobs');
      break;
    }

    jobs.push({
      content: post.querySelector('div.col-xs-12.col-sm-8 > div.field-content')?.textContent,
      img: post.querySelector('img')?.getAttribute('src')?.split('?')[0],
      link: `https://finki.ukim.mk${postElement?.getAttribute('href')}`,
      title
    });
  }

  for (const job of jobs.reverse()) {
    const embed = new EmbedBuilder()
      .setTitle(job.title as string)
      .setURL(job.link)
      .setThumbnail(job.img as string)
      .setDescription(job.content as string)
      .setColor('#313183');

    try {
      await webhook.send({
        content: `${role === undefined || role === '' ? null : roleMention(role)}`,
        embeds: [embed]
      });
      logger.info(`Sent job ${job.title}`);
    } catch (error) {
      logger.error(`Failed to send job ${job.title}\n${error}`);
    }
  }

  await writeFile('./cache/jobs', firstTitle, {
    encoding: 'utf8',
    flag: 'w'
  });

  logger.debug('Cache updated');
}
