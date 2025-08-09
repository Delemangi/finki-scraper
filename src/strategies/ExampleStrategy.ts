import { EmbedBuilder } from 'discord.js';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

import { getThemeColor } from '../configuration/config.js';

export class ExampleStrategy implements ScraperStrategy {
  public idsSelector = 'Selector for a unique identifier within each container';

  public postsSelector = 'Selector for all data containers';

  // Function for returning the ID of each data container
  public getId(element: Element): null | string {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute('href')
      ?.trim();
    return url ?? null;
  }

  // Function for returning an embed representation of each data container
  public getPostData(element: Element): PostData {
    const url = element.querySelector('a')?.getAttribute('href')?.trim();
    const link = url ?? null;
    const title = element.querySelector('a')?.textContent.trim() ?? '?';

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
