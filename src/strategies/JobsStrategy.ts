import { EmbedBuilder } from 'discord.js';

import type { PostData } from '../lib/Post.js';

import { type ScraperStrategy } from '../lib/Scraper.js';

export class JobsStrategy implements ScraperStrategy {
  public idsSelector = 'a + a';

  public postsSelector = 'div.views-row';

  public getId(element: Element): null | string {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute('href')
      ?.trim();
    return url === undefined ? null : `https://finki.ukim.mk${url}`;
  }

  public getPostData(element: Element): PostData {
    const url = element.querySelector('a + a')?.getAttribute('href')?.trim();
    const link = url === undefined ? null : `https://finki.ukim.mk${url}`;
    const title = element.querySelector('a + a')?.textContent?.trim() ?? '?';
    const content =
      element
        .querySelector('div.col-xs-12.col-sm-8 > div.field-content')
        ?.textContent?.trim()
        .slice(0, 500) ?? '?';
    const image =
      element.querySelector('img')?.getAttribute('src')?.split('?').at(0) ??
      '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setThumbnail(image)
      .setDescription(content === '' ? 'Нема опис.' : content)
      .setColor('#313183')
      .setTimestamp();

    return {
      embed,
      id: this.getId(element),
    };
  }

  public getRequestInit(): RequestInit | undefined {
    return undefined;
  }
}
