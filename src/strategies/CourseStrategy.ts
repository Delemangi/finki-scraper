import { EmbedBuilder } from 'discord.js';

import type { PostData } from '../lib/Post.js';

import { type ScraperStrategy } from '../lib/Scraper.js';
import { getConfigProperty } from '../utils/config.js';

export class CourseStrategy implements ScraperStrategy {
  public defaultCookie = getConfigProperty('coursesCookie');

  public idsSelector = '[title="Permanent link to this post"]';

  public postsSelector = 'article';

  public getId(element: Element): null | string {
    return (
      element.querySelector(this.idsSelector)?.getAttribute('href')?.trim() ??
      null
    );
  }

  public getPostData(element: Element): PostData {
    const link =
      element
        .querySelector('[title="Permanent link to this post"]')
        ?.getAttribute('href')
        ?.trim() ?? null;
    const authorImage =
      element
        .querySelector('img[title*="Picture of"]')
        ?.getAttribute('src')
        ?.trim() ?? '?';
    const authorName =
      element.querySelector('h4 + div > a')?.textContent?.trim() ?? '?';
    const authorLink =
      element
        .querySelector('div.d-flex.flex-column > div > a')
        ?.getAttribute('href')
        ?.trim()
        .split('&')
        .at(0) ?? '?';
    const content =
      element
        .querySelector('div.post-content-container')
        ?.textContent?.trim()
        .slice(0, 500) ?? '?';
    const title =
      element.querySelector('h4 > a:last-of-type')?.textContent?.trim() ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        iconURL: authorImage,
        name: authorName,
        url: authorLink,
      })
      .setURL(link)
      .setDescription(content === '' ? 'Нема опис.' : content)
      .setColor('#313183')
      .setTimestamp();

    return {
      embed,
      id: this.getId(element),
    };
  }

  public getRequestInit(cookie: string): RequestInit {
    return {
      credentials: 'omit',
      headers: { Cookie: cookie },
    };
  }
}
