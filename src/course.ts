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
import { getLogger } from './logger.js';

const [course, url] = argv.slice(2);
let cache = argv[4];

if (course === undefined || course === '') {
  throw new Error('No course specified');
}

if (url === undefined || url === '') {
  throw new Error('No url specified');
}

const logger = getLogger(course);

if (!(course in config.courses)) {
  throw new Error(`Course ${course} not found in config`);
}

// @ts-expect-error Cannot happen
const webhook = new WebhookClient({ url: config.courses[course].url });
// @ts-expect-error Cannot happen
const role = config.courses[course].role;
const successDelay = config.successDelay;
const errorDelay = config.errorDelay;

while (true) {
  logger.info('Searching...');

  let response: Response;
  let text: string;

  try {
    response = await fetch(url, {
      credentials: 'omit',
      headers: { Cookie: `MoodleSession=${config.CoursesCookie}` }
    });
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

  if (cache === undefined) {
    cache = await readFile(`./cache/${course}`, {
      encoding: 'utf8',
      flag: 'a+'
    });
    cache = cache.trim();
  }

  const DOM = new JSDOM(text);
  const threads = DOM.window.document.querySelectorAll('article');

  const posts = [];

  for (const thread of Array.from(threads)) {
    const link = thread.querySelector('[title="Permanent link to this post"]')?.getAttribute('href');
    const ID = link?.split('#').at(-1);

    if (ID === cache) {
      break;
    }

    posts.push({
      authorImage: thread.querySelector('img[title*="Picture of"]')?.getAttribute('src'),
      authorName: thread.querySelector('h4 + div > a')?.textContent,
      content: thread.querySelector('div.post-content-container')?.textContent?.trim(),
      link,
      title: thread.querySelector('h4 > a:last-of-type')?.textContent
    });
  }

  for (const post of posts.reverse()) {
    if (post.content === undefined || post.content === null || post.content === '') {
      post.content = 'No description provided.';
    } else if (post.content.length > 200) {
      post.content = post.content.slice(0, 200) + '...';
    }

    const embed = new EmbedBuilder()
      .setTitle(post.title ?? null)
      .setAuthor({
        iconURL: post.authorImage as string,
        name: post.authorName as string
      })
      .setURL(post.link ?? null)
      .setDescription(post.content)
      .setColor('#313183')
      .setTimestamp();

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

  if (posts.length === 0) {
    logger.info('No announcements found');
  } else {
    logger.info(`Found ${posts.length} announcements`);

    cache = posts.at(-1)?.link?.split('#').at(-1);

    await writeFile(`./cache/${course}`, cache?.trim() ?? '', {
      encoding: 'utf8',
      flag: 'w'
    });
  }

  logger.info('Finished');
  await setTimeout(successDelay);
}
