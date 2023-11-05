import { AnnouncementsStrategy } from "../strategies/AnnouncementsStrategy.js";
import { CourseStrategy } from "../strategies/CourseStrategy.js";
import { DiplomasStrategy } from "../strategies/DiplomasStrategy.js";
import { EventsStrategy } from "../strategies/EventsStrategy.js";
import { JobsStrategy } from "../strategies/JobsStrategy.js";
import { ProjectsStrategy } from "../strategies/ProjectsStrategy.js";
import { type ScraperConfig, type ScraperStrategy } from "../types/Scraper.js";
import { getConfigProperty } from "./config.js";
import { cachePath, errors, messages, strategies } from "./constants.js";
import { logger } from "./logger.js";
import { type EmbedBuilder, roleMention, WebhookClient } from "discord.js";
import { JSDOM } from "jsdom";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { type Logger } from "pino";

export class Scraper {
  private readonly strategy: ScraperStrategy;

  private readonly scraperConfig: ScraperConfig;

  private readonly scraperName: string;

  private readonly cookie: string;

  private readonly webhook?: WebhookClient;

  private readonly globalWebhook?: WebhookClient;

  private readonly logger: Logger;

  public constructor(scraperName: string) {
    const scraper = getConfigProperty("scrapers")[scraperName];

    if (scraper === undefined) {
      throw new Error(`[${scraperName}] ${errors.scraperNotFound}`);
    }

    this.scraperName = scraperName;
    this.scraperConfig = scraper as ScraperConfig;
    this.strategy = this.getStrategy();
    this.cookie = this.getCookie();
    this.logger = logger;

    const webhookUrl = this.scraperConfig.webhook;

    if (webhookUrl !== undefined) {
      this.webhook = new WebhookClient({ url: webhookUrl });
    }

    const globalWebhookUrl = getConfigProperty("webhook");

    if (globalWebhookUrl !== undefined) {
      this.globalWebhook = new WebhookClient({ url: globalWebhookUrl });
    }
  }

  public async run() {
    while (true) {
      this.logger.info(`[${this.scraperName}] ${messages.searching}`);

      try {
        await this.getAndSendPosts();
      } catch (error) {
        await this.handleError(`${error}`);
        await this.delay(getConfigProperty("errorDelay") as number);

        continue;
      }

      await this.delay(getConfigProperty("successDelay") as number);
    }
  }

  private async getAndSendPosts() {
    const response = await this.fetchData();

    this.checkStatusCode(response.status);

    const text = await this.getTextFromResponse(response);
    const fullCachePath = this.getFullCachePath();
    const cache = await this.readCacheFile(fullCachePath);
    const posts = this.getPostsFromDOM(text);
    const ids = this.getIdsFromPosts(posts);

    if (this.hasNoNewPosts(ids, cache)) {
      this.logger.info(`[${this.scraperName}] ${messages.noNewPosts}`);

      return [];
    }

    const validPosts = await this.processNewPosts(posts, cache);
    await this.writeCacheFile(cachePath, ids);

    return validPosts;
  }

  private getStrategy(): ScraperStrategy {
    switch (this.scraperConfig.strategy) {
      case strategies.announcements:
        return new AnnouncementsStrategy();
      case strategies.course:
        return new CourseStrategy();
      case strategies.events:
        return new EventsStrategy();
      case strategies.jobs:
        return new JobsStrategy();
      case strategies.projects:
        return new ProjectsStrategy();
      case strategies.diplomas:
        return new DiplomasStrategy();
      default:
        throw new Error(errors.strategyNotFound);
    }
  }

  private getCookie(): string {
    const cookie =
      this.scraperConfig.cookie ?? this.strategy.defaultCookie ?? {};

    return Object.entries(cookie)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  private async fetchData(): Promise<Response> {
    try {
      return await fetch(
        this.scraperConfig.link,
        this.strategy.getRequestInit(this.cookie),
      );
    } catch {
      throw new Error(errors.fetchFailed);
    }
  }

  private checkStatusCode(statusCode: number) {
    if (statusCode !== 200) {
      throw new Error(`${errors.badResponseCode}: ${statusCode}`);
    }
  }

  private async getTextFromResponse(response: Response) {
    try {
      return await response.text();
    } catch {
      throw new Error(errors.fetchParseFailed);
    }
  }

  private getFullCachePath(): string {
    return `./${cachePath}/${this.scraperName}`;
  }

  private async readCacheFile(path: string) {
    if (!existsSync(path)) {
      await mkdir(path);
    }

    const content = await readFile(path, { encoding: "utf8", flag: "a+" });

    return content.trim().split("\n");
  }

  private getPostsFromDOM(html: string) {
    const dom = new JSDOM(html);
    const posts = Array.from(
      dom.window.document.querySelectorAll(this.strategy.postsSelector),
    );

    const lastPosts = posts.slice(0, getConfigProperty("maxPosts"));

    if (lastPosts.length === 0) {
      throw new Error(errors.postsNotFound);
    }

    return lastPosts;
  }

  private getIdsFromPosts(posts: Element[]) {
    return posts.map((post) => this.strategy.getId(post));
  }

  private hasNoNewPosts(ids: Array<string | null>, cache: string[]) {
    return (
      ids.length === cache.length &&
      ids.every((value) => value === null || cache.includes(value))
    );
  }

  private async processNewPosts(posts: Element[], cache: string[]) {
    const allPosts = [...posts].reverse().slice(0.3 * posts.length);
    const validPosts: EmbedBuilder[] = [];

    for (const post of allPosts) {
      const [id, embed] = this.strategy.getPostData(post);

      if (id === null) {
        await this.handleError(
          `${errors.postIdNotFound}: ${embed.data.title ?? "Unknown"}`,
        );

        continue;
      }

      if (cache.includes(id)) {
        this.logger.info(
          `[${this.scraperName}] ${messages.postAlreadySent}: ${id}`,
        );

        continue;
      }

      try {
        await this.sendPost(embed, id);
        validPosts.push(embed);
      } catch {
        await this.handleError(`${errors.postSendFailed}: ${id}`);
      }
    }

    return validPosts.map((embed) => embed.data);
  }

  private async sendPost(embed: EmbedBuilder, id: string) {
    await this.webhook?.send({
      content:
        this.scraperConfig.role === undefined || this.scraperConfig.role === ""
          ? ""
          : roleMention(this.scraperConfig.role),
      embeds: [embed],
      username: this.scraperConfig.name ?? this.scraperName,
    });
    this.logger.info(`[${this.scraperName}] ${messages.postSent}: ${id}`);
  }

  private async writeCacheFile(path: string, ids: Array<string | null>) {
    await writeFile(path, ids.join("\n"), { encoding: "utf8", flag: "w" });
  }

  private async handleError(message: string) {
    this.logger.error(`[${this.scraperName}] ${message}`);
    await this.globalWebhook?.send({
      content: message,
      username: this.scraperConfig.name ?? this.scraperName,
    });
  }

  private async delay(milliseconds: number) {
    await setTimeout(milliseconds);
  }
}
