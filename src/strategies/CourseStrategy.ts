import { EmbedBuilder } from 'discord.js';
import { CasAuthentication, Service } from 'finki-auth';

import type { PostData } from '../lib/Post.js';

import { getConfigProperty, getThemeColor } from '../configuration/config.js';
import { type ScraperStrategy } from '../lib/Scraper.js';
import { getCookieHeader } from '../utils/cookies.js';

export class CourseStrategy implements ScraperStrategy {
  public idsSelector = '[title="Permanent link to this post"]';

  public postsSelector = 'article';

  public scraperService = Service.COURSES;

  public filterPosts(posts: Element[]): Element[] {
    return posts.toReversed().slice(0.3 * posts.length);
  }

  public async getCookie(): Promise<string> {
    const credentials = getConfigProperty('credentials');

    if (credentials === undefined) {
      throw new Error(
        'Credentials are not defined. Please check your configuration.',
      );
    }

    const auth = new CasAuthentication(
      credentials.username,
      credentials.password,
    );

    const rawCookies = await auth.authenticate(Service.COURSES);
    const cookies: Record<string, string> = {};

    for (const { key, value } of rawCookies) {
      cookies[key] = value;
    }

    return getCookieHeader(cookies);
  }

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
      element.querySelector('h4 + div > a')?.textContent.trim() ?? '?';
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
        ?.textContent.trim()
        .slice(0, 500) ?? '?';
    const title =
      element.querySelector('h4 > a:last-of-type')?.textContent.trim() ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        iconURL: authorImage,
        name: authorName,
        url: authorLink,
      })
      .setURL(link)
      .setDescription(content === '' ? 'Нема опис.' : content)
      .setColor(getThemeColor())
      .setTimestamp();

    return {
      embed,
      id: this.getId(element),
    };
  }

  public getRequestInit(cookie: string | undefined): RequestInit | undefined {
    if (cookie === undefined) {
      return undefined;
    }

    return {
      credentials: 'include',
      headers: {
        Cookie: cookie,
      },
    };
  }
}
