import {
  writeFile,
  readFile
} from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import {
  EmbedBuilder,
  WebhookClient
} from 'discord.js';
import { JSDOM } from 'jsdom';
import config from '../config/config.json' assert {'type': 'json'};
import { logger } from './logger.js';

const url = 'https://www.finki.ukim.mk/mk/fcse-jobs-internships';
const webhook = new WebhookClient({ url: config.jobsURL });

while (true) {
  logger.info('Searching for jobs...');

  logger.debug('Fetching...');
  const response = await fetch(url);
  const text = await response.text();
  const DOM = new JSDOM(text);

  const element = DOM.window.document.querySelector('#block-system-main > div > div.view-content');

  if (element === null) {
    logger.warn('Jobs container is null');
    // 30 seconds
    await setTimeout(30 * 1_000);
    continue;
  }

  const posts = element.querySelectorAll('div.views-row');

  const firstTitle = posts.item(0).querySelector('a + a')?.textContent;
  const cachedTitle = await readFile('cache', {
    encoding: 'utf8',
    flag: 'a+'
  });

  if (firstTitle === null || firstTitle === undefined) {
    logger.warn('First title is null or undefined');
    // 30 seconds
    await setTimeout(30 * 1_000);
    continue;
  }

  if (cachedTitle === firstTitle) {
    logger.info('No new jobs');
    // 1 hour
    await setTimeout(60 * 60 * 1_000);
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

    await webhook.send({ embeds: [embed] });

    logger.info('Job sent');
  }

  await writeFile('cache', firstTitle, {
    encoding: 'utf8',
    flag: 'w'
  });

  logger.info('Cache updated');
}
