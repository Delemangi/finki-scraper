import { existsSync } from 'node:fs';
import {
  writeFile,
  readFile,
  mkdir
} from 'node:fs/promises';
import { argv } from 'node:process';
import { setTimeout } from 'node:timers/promises';
import {
  EmbedBuilder,
  roleMention,
  WebhookClient
} from 'discord.js';
import { JSDOM } from 'jsdom';
import config from '../config/config.json' assert {'type': 'json'};
import { logger } from './logger.js';

// eslint-disable-next-line prefer-const
let [course, url, cache] = argv.slice(2);

if (course === undefined || course === '') {
  throw new Error('No course specified');
}

if (url === undefined || url === '') {
  throw new Error('No url specified');
}

if (!(course in config.courses)) {
  throw new Error('Course not found');
}

// @ts-expect-error Cannot happen
const webhook = new WebhookClient({ url: config.courses[course].url });
// @ts-expect-error Cannot happen
const role = config.courses[course].role;

while (true) {
  logger.info('Searching...');

  let response: Response;
  let text: string;

  try {
    response = await fetch(url, {
      credentials: 'omit',
      headers: { Cookie: `MoodleSession=${config.CoursesCookie}` }
    });
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
  const element = DOM.window.document.querySelector('table.table.discussion-list');

  if (element === null) {
    logger.warn('Container is empty, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  const discussions = element.querySelectorAll('tr.discussion');
  const linkElement = discussions.item(0).querySelector('div > a');

  if (linkElement === null) {
    logger.warn('Anchor is empty, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  const link = linkElement.getAttribute('href');

  if (link === null) {
    logger.warn('Link is empty, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  const firstDiscussion = await fetch(link, {
    credentials: 'omit',
    headers: { Cookie: `MoodleSession=${config.CoursesCookie}` }
  });
  const firstPost = await firstDiscussion.text();
  const firstPostDOM = new JSDOM(firstPost);

  const articles = firstPostDOM.window.document.querySelectorAll('article');
  const firstID = articles.item(articles.length - 1).querySelector('[title="Permanent link to this post"]')?.getAttribute('href')?.split('#').at(-1);

  if (!existsSync('cache')) {
    logger.debug('Creating cache directory...');
    await mkdir('cache');
  }

  let cachedID: string;

  if (cache === undefined) {
    cachedID = await readFile(`./cache/${course}`, {
      encoding: 'utf8',
      flag: 'a+'
    });
  } else {
    cachedID = cache;
  }

  cachedID = cachedID.trim();

  if (firstID === null || firstID === undefined) {
    logger.warn('First ID is empty, trying again in 10 seconds...');
    await setTimeout(10 * 1_000);
    continue;
  }

  if (cachedID === firstID) {
    logger.info('No new course announcements, trying again in 10 minutes...');
    await setTimeout(10 * 60 * 1_000);
    continue;
  }

  const announcements = [];

  for (const discussion of Array.from(discussions)) {
    const postLinks = [];
    const postLink = discussion.querySelector('div > a')?.getAttribute('href');

    if (postLink === null || postLink === undefined) {
      logger.warn('Post link is empty, trying again in 10 seconds...');
      await setTimeout(10 * 1_000);
      continue;
    }

    const discussionFetch = await fetch(postLink, {
      credentials: 'omit',
      headers: { Cookie: `MoodleSession=${config.CoursesCookie}` }
    });
    const thread = await discussionFetch.text();
    const threadDOM = new JSDOM(thread);
    const threadArticles = threadDOM.window.document.querySelectorAll('article');
    let flag = false;

    for (const threadArticle of Array.from(threadArticles)) {
      const ID = threadArticle.querySelector('[title="Permanent link to this post"]')?.getAttribute('href')?.split('#').at(-1);

      if (ID === cachedID) {
        logger.info('Found all new course announcements');
        flag = true;
        break;
      }

      postLinks.push({
        content: threadArticle.querySelector('div.post-content-container')?.textContent?.trim(),
        link: threadArticle.querySelector('[title="Permanent link to this post"]')?.getAttribute('href'),
        title: threadArticle.querySelector('h3')?.textContent
      });
    }

    announcements.push(postLinks);

    if (flag) {
      break;
    }
  }

  for (const thread of announcements.reverse()) {
    for (const post of thread) {
      if (post.content === undefined || post.content === null || post.content === '') {
        post.content = 'No description provided.';
      } else if (post.content.length > 200) {
        post.content = post.content.slice(0, 200) + '...';
      }

      const embed = new EmbedBuilder()
        .setTitle(post.title ?? null)
        .setURL(post.link ?? null)
        .setDescription(post.content)
        .setColor('#313183');

      try {
        await webhook.send({
          content: role === undefined || role === '' ? null : roleMention(role),
          embeds: [embed]
        });
        logger.info(`Sent announcement ${post.title}`);
      } catch (error) {
        logger.error(`Failed to send announcement ${post.title}\n${error}`);
      }
    }
  }

  await writeFile(`./cache/${course}`, firstID, {
    encoding: 'utf8',
    flag: 'w'
  });

  cache = undefined;

  logger.debug('Cache updated');
}
