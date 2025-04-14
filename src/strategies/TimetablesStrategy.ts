import { EmbedBuilder } from 'discord.js';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

import { getThemeColor } from '../configuration/config.js';
import { normalizeURL } from '../utils/links.js';

export class TimetablesStrategy implements ScraperStrategy {
  public idsSelector = 'a';

  public postsSelector = 'div.col-sm-11';

  public getId(element: Element): null | string {
    const url = element.querySelector(this.idsSelector)?.textContent?.trim();
    return url ?? null;
  }

  public getPostData(element: Element): PostData {
    const url = element.querySelector('a')?.getAttribute('href')?.trim();
    const link =
      url === undefined ? null : normalizeURL(url, 'https://finki.ukim.mk');
    const title = element.querySelector('a')?.textContent?.trim() ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setColor(getThemeColor())
      .setTimestamp();

    return {
      embed,
      id: this.getId(element),
    };
  }
}
