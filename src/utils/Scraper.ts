import { AnnouncementsStrategy } from "../strategies/AnnouncementsStrategy.js";
import { CourseStrategy } from "../strategies/CourseStrategy.js";
import { DiplomasStrategy } from "../strategies/DiplomasStrategy.js";
import { EventsStrategy } from "../strategies/EventsStrategy.js";
import { JobsStrategy } from "../strategies/JobsStrategy.js";
import { ProjectsStrategy } from "../strategies/ProjectsStrategy.js";
import { type ScraperConfig } from "../types/ScraperConfig.js";
import { type ScraperStrategy } from "../types/ScraperStrategy.js";
import { config } from "./config.js";
import { cachePath, errors, messages, strategies } from "./constants.js";
import { logger } from "./logger.js";
import { roleMention, WebhookClient } from "discord.js";
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

  private readonly webhook: WebhookClient;

  private readonly logger: Logger;

  public constructor(scraperName: string) {
    if (config.scrapers[scraperName] === undefined) {
      throw new Error(`[${scraperName}] ${errors.scraperNotFound}`);
    }

    this.scraperName = scraperName;
    this.scraperConfig = config.scrapers[scraperName] as ScraperConfig;
    this.strategy = Scraper.getStrategy(this.scraperConfig.strategy);
    this.webhook = new WebhookClient({ url: this.scraperConfig.webhook });
    this.cookie = Scraper.getCookie(
      this.scraperConfig.cookie ?? this.strategy.defaultCookie ?? {},
    );
    this.logger = logger;
  }

  public static getStrategy(strategyName: string): ScraperStrategy {
    switch (strategyName) {
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

  public static getCookie(cookie: Record<string, string>): string {
    return Object.entries(cookie)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  public getFullCachePath(): string {
    return `./${cachePath}/${this.scraperName}`;
  }

  public async run() {
    while (true) {
      this.logger.info(`[${this.scraperName}] ${messages.searching}`);

      let response: Response;

      try {
        response = await fetch(
          this.scraperConfig.link,
          this.strategy.getRequestInit(this.cookie),
        );
      } catch (error) {
        this.logger.warn(
          `[${this.scraperName}] ${errors.fetchFailed}\n${error}`,
        );
        await setTimeout(config.errorDelay);
        continue;
      }

      let text: string;

      try {
        text = await response.text();
      } catch (error) {
        this.logger.warn(
          `[${this.scraperName}] ${errors.fetchParseFailed}\n${error}`,
        );
        await setTimeout(config.errorDelay);
        continue;
      }

      if (!response.ok) {
        this.logger.warn(
          `[${this.scraperName}] ${errors.badResponseCode}: ${response.status}`,
        );
        await setTimeout(config.errorDelay);
        continue;
      }

      if (!existsSync(cachePath)) {
        await mkdir(cachePath);
      }

      const cache = (
        await readFile(this.getFullCachePath(), {
          encoding: "utf8",
          flag: "a+",
        })
      )
        .trim()
        .split("\n");

      const dom = new JSDOM(text);
      const posts = Array.from(
        dom.window.document.querySelectorAll(this.strategy.postsSelector),
      ).slice(0, config.maxPosts);

      if (posts.length === 0) {
        this.logger.warn(`[${this.scraperName}] ${errors.postsNotFound}`);
        await setTimeout(config.errorDelay);
        continue;
      }

      const ids = posts.map((post) => this.strategy.getId(post));

      if (
        ids.length === cache.length &&
        ids.every((value) => value === null || cache.includes(value))
      ) {
        this.logger.info(`[${this.scraperName}] ${messages.noNewPosts}`);
        await setTimeout(config.successDelay);
        continue;
      }

      for (const post of [...posts].reverse().slice(0.3 * posts.length)) {
        const [id, embed] = this.strategy.getPostData(post);

        if (id === null || cache.includes(id)) {
          this.logger.info(
            `[${this.scraperName}] ${messages.postAlreadySent}: ${id}`,
          );
          continue;
        }

        try {
          await this.webhook.send({
            content:
              this.scraperConfig.role === undefined ||
              this.scraperConfig.role === ""
                ? ""
                : roleMention(this.scraperConfig.role),
            embeds: [embed],
            ...(this.scraperConfig.name !== undefined && {
              username: this.scraperConfig.name,
            }),
          });
          this.logger.info(`[${this.scraperName}] ${messages.postSent}: ${id}`);
        } catch (error) {
          this.logger.error(
            `[${this.scraperName}] ${errors.postSendFailed}: ${id}\n${error}`,
          );
        }
      }

      await writeFile(this.getFullCachePath(), ids.join("\n"), {
        encoding: "utf8",
        flag: "w",
      });

      this.logger.info(`[${this.scraperName}] Finished`);
      await setTimeout(config.successDelay);
    }
  }
}
