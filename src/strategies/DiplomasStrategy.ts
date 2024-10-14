import { type ScraperStrategy } from '../types/Scraper.js';
import { getConfigProperty } from '../utils/config.js';
import { EmbedBuilder } from 'discord.js';

export class DiplomasStrategy implements ScraperStrategy {
  public defaultCookie = getConfigProperty('diplomasCookie');

  public idsSelector = 'div.panel-heading';

  public postsSelector = 'div.panel';

  public getId(element: Element): null | string {
    return element.querySelector(this.idsSelector)?.textContent?.trim() ?? null;
  }

  public getPostData(element: Element): [null | string, EmbedBuilder] {
    const title =
      element.querySelector('div.panel-heading')?.textContent?.trim() ?? '?';
    const [index, student] = element
      .querySelector(
        'div.panel-body > table tr:nth-of-type(1) > td:nth-of-type(2)',
      )
      ?.textContent?.trim()
      .split(' - ') ?? ['?', '?'];
    const mentor =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(2) > td:nth-of-type(2)',
        )
        ?.textContent?.trim() ?? '?';
    const member1 =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(3) > td:nth-of-type(2)',
        )
        ?.textContent?.trim() ?? '?';
    const member2 =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(4) > td:nth-of-type(2)',
        )
        ?.textContent?.trim() ?? '?';
    const date =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(5) > td:nth-of-type(2)',
        )
        ?.textContent?.trim() ?? '?';
    const status =
      element
        .querySelector(
          'div.panel-body > table tr:nth-of-type(6) > td:nth-of-type(2)',
        )
        ?.textContent?.trim() ?? '?';
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
        ?.textContent?.trim()
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
      .setColor('#313183')
      .setTimestamp();

    return [title, embed];
  }

  public getRequestInit(cookie: string): RequestInit {
    return {
      credentials: 'same-origin',
      headers: { Cookie: cookie },
    };
  }
}
