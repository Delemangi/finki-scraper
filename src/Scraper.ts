import {
  type APIEmbed,
  type EmbedBuilder,
  roleMention,
  WebhookClient,
} from 'discord.js';
import { JSDOM } from 'jsdom';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { type Logger } from 'pino';

import { getConfigProperty } from './configuration/config.js';
import { type ScraperConfig, type ScraperStrategy } from './lib/Scraper.js';
import { Strategy, StrategySchema } from './lib/Strategy.js';
import { AnnouncementsStrategy } from './strategies/AnnouncementsStrategy.js';
import { CourseStrategy } from './strategies/CourseStrategy.js';
import { DiplomasStrategy } from './strategies/DiplomasStrategy.js';
import { EventsStrategy } from './strategies/EventsStrategy.js';
import { JobsStrategy } from './strategies/JobsStrategy.js';
import { ProjectsStrategy } from './strategies/ProjectsStrategy.js';
import { TimetablesStrategy } from './strategies/TimetablesStrategy.js';
import { cachePath, errors, messages } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { errorWebhook } from './utils/webhooks.js';

export class Scraper {
  public get name() {
    return this.scraperName;
  }

  private readonly cookie: string;

  private readonly logger: Logger;

  private readonly scraperConfig: ScraperConfig;

  private readonly scraperName: string;

  private readonly strategy: ScraperStrategy;

  private readonly webhook?: WebhookClient;

  public constructor(scraperName: string) {
    const scraper = getConfigProperty('scrapers')[scraperName];

    if (scraper === undefined) {
      throw new Error(`[${scraperName}] ${errors.scraperNotFound}`);
    }

    this.scraperName = scraperName;
    this.scraperConfig = scraper;
    this.strategy = this.getStrategy();
    this.cookie = this.getCookie();
    this.logger = logger;

    const webhookUrl =
      this.scraperConfig.webhook ?? getConfigProperty('webhook');

    if (webhookUrl !== '') {
      this.webhook = new WebhookClient({ url: webhookUrl });
    }
  }

  public static checkStatusCode(statusCode: number): void {
    if (statusCode !== 200) {
      throw new Error(`${errors.badResponseCode}: ${statusCode}`);
    }
  }

  public static async sleep(ms: number): Promise<void> {
    await setTimeout(ms);
  }

  public async clearCache(): Promise<void> {
    await writeFile(this.getFullCachePath(), '', {
      encoding: 'utf8',
      flag: 'w',
    });
  }

  public getFullCachePath(): string {
    return `./${cachePath}/${this.scraperName}`;
  }

  public async run(): Promise<void> {
    while (true) {
      this.logger.info(`[${this.scraperName}] ${messages.searching}`);

      try {
        await this.getAndSendPosts(true);
      } catch (error) {
        await this.handleError(`${error}`);
        await Scraper.sleep(getConfigProperty('errorDelay'));

        continue;
      }

      await Scraper.sleep(getConfigProperty('successDelay'));
    }
  }

  public async runOnce(): Promise<APIEmbed[] | null> {
    this.logger.info(`[${this.scraperName}] ${messages.searching}`);

    try {
      return await this.getAndSendPosts(false);
    } catch (error) {
      await this.handleError(`${error}`);
      return null;
    }
  }

  private async fetchData(): Promise<Response> {
    try {
      return await fetch(
        this.scraperConfig.link,
        this.strategy.getRequestInit(this.cookie),
      );
    } catch (error) {
      throw new Error(errors.fetchFailed, {
        cause: error,
      });
    }
  }

  private async getAndSendPosts(checkCache: boolean): Promise<APIEmbed[]> {
    const response = await this.fetchData();

    Scraper.checkStatusCode(response.status);

    const text = await this.getTextFromResponse(response);
    const cache = await this.readCacheFile();
    const posts = this.getPostsFromDOM(text);
    const ids = this.getIdsFromPosts(posts);

    if (checkCache && this.hasNoNewPosts(ids, cache)) {
      this.logger.info(`[${this.scraperName}] ${messages.noNewPosts}`);

      return [];
    }

    const validPosts = await this.processNewPosts(posts, cache, checkCache);
    await this.writeCacheFile(ids);

    const sendPosts = getConfigProperty('sendPosts');

    if (sendPosts) {
      logger.info(`[${this.scraperName}] ${messages.sentNewPosts}`);
    }

    return validPosts;
  }

  private getCookie(): string {
    const cookie =
      this.scraperConfig.cookie ?? this.strategy.defaultCookie ?? {};

    return Object.entries(cookie)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  private getIdsFromPosts(posts: Element[]): Array<null | string> {
    return posts.map((post) => this.strategy.getId(post));
  }

  private getPostsFromDOM(html: string) {
    const { window } = new JSDOM(html);
    const posts = Array.from(
      window.document.querySelectorAll(this.strategy.postsSelector),
    );

    const lastPosts = posts.slice(0, getConfigProperty('maxPosts'));

    if (lastPosts.length === 0) {
      throw new Error(errors.postsNotFound);
    }

    return lastPosts;
  }

  private getStrategy(): ScraperStrategy {
    const { data: scraperStrategy, success } = StrategySchema.safeParse(
      this.scraperConfig.strategy,
    );

    if (!success) {
      throw new Error(`${errors.strategyNotFound}: ${errors.strategyNotFound}`);
    }

    switch (scraperStrategy) {
      case Strategy.Announcements:
        return new AnnouncementsStrategy();
      case Strategy.Course:
        return new CourseStrategy();
      case Strategy.Diplomas:
        return new DiplomasStrategy();
      case Strategy.Events:
        return new EventsStrategy();
      case Strategy.Jobs:
        return new JobsStrategy();
      case Strategy.Projects:
        return new ProjectsStrategy();
      case Strategy.Timetables:
        return new TimetablesStrategy();
      default:
        throw new Error(errors.strategyNotFound);
    }
  }

  private async getTextFromResponse(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch (error) {
      throw new Error(errors.fetchParseFailed, {
        cause: error,
      });
    }
  }

  private async handleError(message: string): Promise<void> {
    this.logger.error(`[${this.scraperName}] ${message}`);
    await (errorWebhook ?? this.webhook)?.send({
      content: message,
      username: this.scraperConfig.name ?? this.scraperName,
    });
  }

  private hasNoNewPosts(ids: Array<null | string>, cache: string[]) {
    return (
      ids.length === cache.length &&
      ids.every((value) => value === null || cache.includes(value))
    );
  }

  private async processNewPosts(
    posts: Element[],
    cache: string[],
    checkCache: boolean,
  ): Promise<APIEmbed[]> {
    const allPosts =
      cache.length === 0
        ? posts.toReversed()
        : posts.toReversed().slice(0.3 * posts.length);
    const validPosts: EmbedBuilder[] = [];
    const sendPosts = getConfigProperty('sendPosts');

    for (const post of allPosts) {
      const { embed, id } = this.strategy.getPostData(post);

      if (id === null) {
        await this.handleError(
          `${errors.postIdNotFound}: ${embed.data.title ?? 'Unknown'}`,
        );

        continue;
      }

      if (checkCache && cache.includes(id)) {
        this.logger.info(
          `[${this.scraperName}] ${messages.postAlreadySent}: ${id}`,
        );

        continue;
      }

      validPosts.push(embed);

      if (sendPosts) {
        try {
          await this.sendPost(embed, id);
        } catch {
          await this.handleError(`${errors.postSendFailed}: ${id}`);
        }
      }
    }

    return validPosts.map((embed) => embed.data);
  }

  private async readCacheFile(): Promise<string[]> {
    if (!existsSync(cachePath)) {
      await mkdir(cachePath, {
        recursive: true,
      });
    }

    const content = await readFile(this.getFullCachePath(), {
      encoding: 'utf8',
      flag: 'a+',
    });

    return content.trim().split('\n').filter(Boolean);
  }

  private async sendPost(embed: EmbedBuilder, id: string): Promise<void> {
    await this.webhook?.send({
      content:
        this.scraperConfig.role === undefined || this.scraperConfig.role === ''
          ? ''
          : roleMention(this.scraperConfig.role),
      embeds: [embed],
      username: this.scraperConfig.name ?? this.scraperName,
    });
    this.logger.info(`[${this.scraperName}] ${messages.postSent}: ${id}`);
  }

  private async writeCacheFile(ids: Array<null | string>): Promise<void> {
    await writeFile(this.getFullCachePath(), ids.join('\n'), {
      encoding: 'utf8',
      flag: 'w',
    });
  }
}
