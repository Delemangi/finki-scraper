import { EmbedBuilder } from 'discord.js';
import { CasAuthentication } from 'finki-auth';
import { Service } from 'finki-auth/dist/lib/Service.js';

import type { PostData } from '../lib/Post.js';

import { getConfigProperty, getThemeColor } from '../configuration/config.js';
import { type ScraperStrategy } from '../lib/Scraper.js';
import { getCookieHeader } from '../utils/cookies.js';

export class DiplomasStrategy implements ScraperStrategy {
  public idsSelector = 'div.panel-heading';

  public postsSelector = 'div.panel';

  public scraperService = Service.DIPLOMAS;

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

    const rawCookies = await auth.authenticate(Service.DIPLOMAS);
    const cookies: Record<string, string> = {};

    for (const cookie of rawCookies) {
      cookies[cookie.key] = cookie.value;
    }

    return getCookieHeader(cookies);
  }

  public getId(element: Element): null | string {
    return element.querySelector(this.idsSelector)?.textContent.trim() ?? null;
  }

  public getPostData(element: Element): PostData {
    const title =
      element.querySelector('div.panel-heading')?.textContent.trim() ?? '?';
    const [index, student] = element
      .querySelector(
        'div.panel-body > table tr:nth-of-type(1) > td:nth-of-type(2)',
      )
      ?.textContent.trim()
      .split(' - ') ?? ['?', '?'];
    const mentor =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(2) > td:nth-of-type(2)',
        )
        ?.textContent.trim() ?? '?';
    const member1 =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(3) > td:nth-of-type(2)',
        )
        ?.textContent.trim() ?? '?';
    const member2 =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(4) > td:nth-of-type(2)',
        )
        ?.textContent.trim() ?? '?';
    const date =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(5) > td:nth-of-type(2)',
        )
        ?.textContent.trim() ?? '?';
    const status =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(6) > td:nth-of-type(2)',
        )
        ?.textContent.trim() ?? '?';
    const url =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(7) > td:nth-of-type(2) a',
        )
        ?.getAttribute('href') ?? null;
    const link =
      url === null || url.includes('javascript')
        ? null
        : `http://diplomski.finki.ukim.mk/${url}`;
    const content =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(8) > td:nth-of-type(2)',
        )
        ?.textContent.trim()
        .slice(0, 500) ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        name: `${index} - ${student}`,
      })
      .setURL(link)
      .addFields([
        {
          inline: true,
          name: 'Ментор',
          value: mentor,
        },
        {
          inline: true,
          name: 'Член 1',
          value: member1,
        },
        {
          inline: true,
          name: 'Член 2',
          value: member2,
        },
        {
          inline: true,
          name: 'Датум',
          value: date,
        },
        {
          inline: true,
          name: 'Статус',
          value: status,
        },
      ])
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
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    };
  }
}
