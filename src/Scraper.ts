import {
  type APIEmbed,
  type EmbedBuilder,
  roleMention,
  WebhookClient,
} from 'discord.js';
import { isCookieValid } from 'finki-auth';
import { JSDOM } from 'jsdom';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { type Logger } from 'pino';

import { getConfigProperty } from './configuration/config.js';
import {
  type ScraperConfig,
  type ScraperStrategy,
  Strategy,
  StrategySchema,
} from './lib/Scraper.js';
import { AnnouncementsStrategy } from './strategies/AnnouncementsStrategy.js';
import { CourseStrategy } from './strategies/CourseStrategy.js';
import { DiplomasStrategy } from './strategies/DiplomasStrategy.js';
import { EventsStrategy } from './strategies/EventsStrategy.js';
import { ExampleStrategy } from './strategies/ExampleStrategy.js';
import { JobsStrategy } from './strategies/JobsStrategy.js';
import { PartnersStrategy } from './strategies/PartnersStrategy.js';
import { ProjectsStrategy } from './strategies/ProjectsStrategy.js';
import { TimetablesStrategy } from './strategies/TimetablesStrategy.js';
import { CACHE_PATH, ERROR_MESSAGES, LOG_MESSAGES } from './utils/constants.js';
import { logger } from './utils/logger.js';
import { errorWebhook } from './utils/webhooks.js';

export class Scraper {
  public get name() {
    return this.scraperName;
  }

  private cookie: string | undefined;

  private readonly logger: Logger;

  private readonly scraperConfig: ScraperConfig;

  private readonly scraperName: string;

  private readonly strategy: ScraperStrategy;

  private readonly webhook?: WebhookClient;

  public constructor(scraperName: string) {
    const scraper = getConfigProperty('scrapers')[scraperName];

    if (scraper === undefined) {
      throw new Error(`[${scraperName}] ${ERROR_MESSAGES.scraperNotFound}`);
    }

    this.scraperName = scraperName;
    this.scraperConfig = scraper;
    this.strategy = this.getStrategy();
    this.logger = logger;

    const webhookUrl =
      this.scraperConfig.webhook ?? getConfigProperty('webhook');

    if (webhookUrl !== '') {
      this.webhook = new WebhookClient({ url: webhookUrl });
    }
  }

  public static async sleep(ms: number): Promise<void> {
    await setTimeout(ms);
  }

  public checkStatusCode(statusCode: number): void {
    if (statusCode === 401) {
      throw new Error(`${ERROR_MESSAGES.badResponseCode}: ${statusCode}`);
    }

    if (statusCode !== 200) {
      throw new Error(`${ERROR_MESSAGES.badResponseCode}: ${statusCode}`);
    }
  }

  public async clearCache(): Promise<void> {
    await writeFile(this.getFullCachePath(), '', {
      encoding: 'utf8',
      flag: 'w',
    });
  }

  public getFullCachePath(): string {
    return `./${CACHE_PATH}/${this.scraperName}`;
  }

  public async run(): Promise<void> {
    while (true) {
      this.logger.info(`[${this.scraperName}] ${LOG_MESSAGES.searching}`);

      await this.validateCookie();

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
    this.logger.info(`[${this.scraperName}] ${LOG_MESSAGES.searching}`);

    await this.validateCookie();

    try {
      return await this.getAndSendPosts(false);
    } catch (error) {
      await this.handleError(`${error}`);
      return null;
    }
  }

  public async validateCookie(): Promise<void> {
    const usesCookies = this.strategy.getCookie !== undefined;

    if (!usesCookies) {
      return;
    }

    const isValidCookie = Boolean(
      this.strategy.scraperService &&
        this.cookie &&
        (await isCookieValid(this.strategy.scraperService, this.cookie)),
    );

    if (!isValidCookie) {
      this.logger.info(`[${this.scraperName}] ${LOG_MESSAGES.cookieInvalid}`);
      this.cookie = undefined;
    }
  }

  private async fetchData(): Promise<Response> {
    try {
      const response = await fetch(
        this.scraperConfig.link,
        this.strategy.getRequestInit?.(this.cookie),
      );

      return response;
    } catch (error) {
      throw new Error(ERROR_MESSAGES.fetchFailed, {
        cause: error,
      });
    }
  }

  private async getAndSendPosts(checkCache: boolean): Promise<APIEmbed[]> {
    if (this.cookie === undefined && this.strategy.getCookie !== undefined) {
      this.cookie = await this.strategy.getCookie();
      logger.info(`[${this.scraperName}] ${LOG_MESSAGES.fetchedCookie}`);
    }

    const response = await this.fetchData();

    this.checkStatusCode(response.status);

    const text = await this.getTextFromResponse(response);
    const cache = await this.readCacheFile();
    const posts = this.getPostsFromDOM(text);
    const ids = this.getIdsFromPosts(posts);

    if (checkCache && this.hasNoNewPosts(ids, cache)) {
      this.logger.info(`[${this.scraperName}] ${LOG_MESSAGES.noNewPosts}`);

      return [];
    }

    const validPosts = await this.processNewPosts(posts, cache, checkCache);
    await this.writeCacheFile(ids);

    const sendPosts = getConfigProperty('sendPosts');

    if (sendPosts) {
      logger.info(`[${this.scraperName}] ${LOG_MESSAGES.sentNewPosts}`);
    }

    return validPosts;
  }

  private getIdsFromPosts(posts: Element[]): Array<null | string> {
    return posts.map((post) => this.strategy.getId(post));
  }

  private getPostsFromDOM(html: string) {
    const { window } = new JSDOM(html);
    const posts = Array.from(
      window.document.querySelectorAll(this.strategy.postsSelector),
    );

    const maxPosts =
      this.scraperConfig.maxPosts ?? getConfigProperty('maxPosts');

    const lastPosts = posts.slice(0, maxPosts);

    if (lastPosts.length === 0) {
      throw new Error(ERROR_MESSAGES.postsNotFound);
    }

    return lastPosts;
  }

  private getStrategy(): ScraperStrategy {
    const { data: scraperStrategy, success } = StrategySchema.safeParse(
      this.scraperConfig.strategy,
    );

    if (!success) {
      throw new Error(ERROR_MESSAGES.strategyNotFound);
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
      case Strategy.Example:
        return new ExampleStrategy();
      case Strategy.Jobs:
        return new JobsStrategy();
      case Strategy.Partners:
        return new PartnersStrategy();
      case Strategy.Projects:
        return new ProjectsStrategy();
      case Strategy.Timetables:
        return new TimetablesStrategy();
      default:
        throw new Error(ERROR_MESSAGES.strategyNotFound);
    }
  }

  private async getTextFromResponse(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch (error) {
      throw new Error(ERROR_MESSAGES.fetchParseFailed, {
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
    // TODO: Consider moving to ScraperStrategy
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    const isCourses = this.scraperConfig.strategy === Strategy.Course;

    const allPosts =
      !isCourses || cache.length === 0
        ? posts.toReversed()
        : posts.toReversed().slice(0.3 * posts.length);
    const validPosts: EmbedBuilder[] = [];
    const sendPosts = getConfigProperty('sendPosts');

    for (const post of allPosts) {
      const { embed, id } = this.strategy.getPostData(post);

      if (id === null) {
        await this.handleError(
          `${ERROR_MESSAGES.postIdNotFound}: ${embed.data.title ?? 'Unknown'}`,
        );

        continue;
      }

      if (checkCache && cache.includes(id)) {
        this.logger.info(
          `[${this.scraperName}] ${LOG_MESSAGES.postAlreadySent}: ${id}`,
        );

        continue;
      }

      validPosts.push(embed);

      if (sendPosts) {
        try {
          await this.sendPost(embed, id);
        } catch {
          await this.handleError(`${ERROR_MESSAGES.postSendFailed}: ${id}`);
        }
      }
    }

    return validPosts.map((embed) => embed.data);
  }

  private async readCacheFile(): Promise<string[]> {
    if (!existsSync(CACHE_PATH)) {
      await mkdir(CACHE_PATH, {
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
    this.logger.info(`[${this.scraperName}] ${LOG_MESSAGES.postSent}: ${id}`);
  }

  private async writeCacheFile(ids: Array<null | string>): Promise<void> {
    await writeFile(this.getFullCachePath(), ids.join('\n'), {
      encoding: 'utf8',
      flag: 'w',
    });
  }
}
