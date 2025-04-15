import { EmbedBuilder } from 'discord.js';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

import { getThemeColor } from '../configuration/config.js';

export class PartnersStrategy implements ScraperStrategy {
  public idsSelector = 'a';

  public postsSelector = 'div.card, div.support';

  public getId(element: Element): null | string {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute('href')
      ?.trim();

    const name = element.textContent?.trim();

    return url ?? name ?? null;
  }

  public getPostData(element: Element): PostData {
    const url =
      element.querySelector('a')?.getAttribute('href')?.trim() ?? null;
    let name =
      // eslint-disable-next-line regexp/no-super-linear-move
      element.textContent?.replaceAll(/.*partner/giu, '').trim() ?? '?';

    if (name.length === 0) {
      name = 'A1';
    }

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setDescription('Нов партнер на ФИНКИ')
      .setURL(url)
      .setColor(getThemeColor())
      .setTimestamp();

    return {
      embed,
      id: this.getId(element),
    };
  }
}
