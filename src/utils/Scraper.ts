import { AnnouncementsStrategy } from '../strategies/AnnouncementsStrategy.js';
import { CourseStrategy } from '../strategies/CourseStrategy.js';
import { DiplomasStrategy } from '../strategies/DiplomasStrategy.js';
import { EventsStrategy } from '../strategies/EventsStrategy.js';
import { JobsStrategy } from '../strategies/JobsStrategy.js';
import { ProjectsStrategy } from '../strategies/ProjectsStrategy.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { roleMention, WebhookClient } from 'discord.js';
import { JSDOM } from 'jsdom';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { type Logger } from 'pino';

export class Scraper {
  private readonly strategy: ScraperStrategy;

  private readonly scraperConfig: ScraperConfig;

  private readonly scraperName: string;

  private readonly cookie: string;

  private readonly webhook: WebhookClient;

  private readonly logger: Logger;

  public constructor(scraperName: string) {
    if (!Object.keys(config.scrapers).includes(scraperName)) {
      throw new Error(`[${scraperName}] Scraper not found in config`);
    }

    this.scraperName = scraperName;
    // @ts-expect-error this is a valid property
    this.scraperConfig = config.scrapers[scraperName];
    this.strategy = Scraper.getStrategy(
      this.scraperConfig.strategy,
      this.scraperName,
    );
    this.webhook = new WebhookClient({ url: this.scraperConfig.webhook });
    this.cookie = Scraper.getCookie(
      this.scraperConfig.cookie ?? this.strategy.defaultCookie ?? {},
    );
    this.logger = logger;
  }

  public static getStrategy(
    strategyName: string,
    scraperName: string,
  ): ScraperStrategy {
    switch (strategyName) {
      case 'announcements':
        return new AnnouncementsStrategy();
      case 'course':
        return new CourseStrategy();
      case 'events':
        return new EventsStrategy();
      case 'jobs':
        return new JobsStrategy();
      case 'projects':
        return new ProjectsStrategy();
      case 'diplomas':
        return new DiplomasStrategy();
      default:
        throw new Error(
          `Strategy ${strategyName} for scraper ${scraperName} not found`,
        );
    }
  }

  public static getCookie(cookie: { [index: string]: string }): string {
    return Object.entries(cookie)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  public async run() {
    while (true) {
      this.logger.info(`[${this.scraperName}] Searching...`);

      let response;

      try {
        response = await fetch(
          this.scraperConfig.link,
          this.strategy.getRequestInit(this.cookie),
        );
      } catch (error) {
        this.logger.warn(`[${this.scraperName}] Fetch failed\n${error}`);
        await setTimeout(config.errorDelay);
        continue;
      }

      let text;

      try {
        text = await response.text();
      } catch (error) {
        this.logger.warn(
          `[${this.scraperName}] Failed parsing fetch result\n${error}`,
        );
        await setTimeout(config.errorDelay);
        continue;
      }

      if (!response.ok) {
        this.logger.warn(
          `[${this.scraperName}] Received response code ${response.status}`,
        );
        await setTimeout(config.errorDelay);
        continue;
      }

      if (!existsSync('cache')) {
        await mkdir('cache');
      }

      const cache = (
        await readFile(`./cache/${this.scraperName}`, {
          encoding: 'utf8',
          flag: 'a+',
        })
      )
        .trim()
        .split('\n');

      const dom = new JSDOM(text);
      const posts = Array.from(
        dom.window.document.querySelectorAll(this.strategy.postsSelector),
      ).slice(0, config.maxPosts);

      if (posts.length === 0) {
        this.logger.warn(`[${this.scraperName}] No posts found`);
        await setTimeout(config.errorDelay);
        continue;
      }

      const ids = posts.map((post) => this.strategy.getId(post));

      if (
        ids.length === cache.length &&
        ids.every((value) => value === null || cache.includes(value))
      ) {
        this.logger.info(`[${this.scraperName}] No new posts`);
        await setTimeout(config.successDelay);
        continue;
      }

      for (const post of [...posts].reverse().slice(0.3 * posts.length)) {
        const [id, embed] = this.strategy.getPostData(post);

        if (id === null || cache.includes(id)) {
          this.logger.info(`[${this.scraperName}] Post already sent: ${id}`);
          continue;
        }

        try {
          await this.webhook.send({
            content:
              this.scraperConfig.role === undefined ||
              this.scraperConfig.role === ''
                ? ''
                : roleMention(this.scraperConfig.role),
            embeds: [embed],
            ...(this.scraperConfig.name !== undefined && {
              username: this.scraperConfig.name,
            }),
          });
          this.logger.info(`[${this.scraperName}] Sent post: ${id}`);
        } catch (error) {
          this.logger.error(
            `[${this.scraperName}] Failed to send post ${id}\n${error}`,
          );
        }
      }

      await writeFile(`./cache/${this.scraperName}`, ids.join('\n'), {
        encoding: 'utf8',
        flag: 'w',
      });

      this.logger.info(`[${this.scraperName}] Finished`);
      await setTimeout(config.successDelay);
    }
  }
}
