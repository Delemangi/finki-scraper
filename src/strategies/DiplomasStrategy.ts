import { EmbedBuilder } from 'discord.js';
import { config } from '../utils/config.js';

export class DiplomasStrategy implements ScraperStrategy {
  public postsSelector = 'div.panel';

  public idsSelector = 'div.panel-heading';

  public defaultCookie = config.diplomasCookie;

  public getPostData (e: Element): [string | null, EmbedBuilder] {
    const title = e.querySelector('div.panel-heading')?.textContent?.trim() ?? '?';
    const [index, student] = e.querySelector('div.panel-body > table tr:nth-of-type(1) > td:nth-of-type(2)')?.textContent?.trim().split(' - ') ?? ['?', '?'];
    const mentor = e.querySelector('div.panel-body > table tr:nth-of-type(2) > td:nth-of-type(2)')?.textContent?.trim() ?? '?';
    const member1 = e.querySelector('div.panel-body > table tr:nth-of-type(3) > td:nth-of-type(2)')?.textContent?.trim() ?? '?';
    const member2 = e.querySelector('div.panel-body > table tr:nth-of-type(4) > td:nth-of-type(2)')?.textContent?.trim() ?? '?';
    const date = e.querySelector('div.panel-body > table tr:nth-of-type(5) > td:nth-of-type(2)')?.textContent?.trim() ?? '?';
    const status = e.querySelector('div.panel-body > table tr:nth-of-type(6) > td:nth-of-type(2)')?.textContent?.trim() ?? '?';
    const url = e.querySelector('div.panel-body > table tr:nth-of-type(7) > td:nth-of-type(2) a')?.getAttribute('href') ?? null;
    const link = url === null || url.includes('javascript') ? null : `http://diplomski.finki.ukim.mk/${url}`;
    const content = e.querySelector('div.panel-body > table tr:nth-of-type(8) > td:nth-of-type(2)')?.textContent?.trim().slice(0, 500) ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        name: `${index} - ${student}`
      })
      .setURL(link)
      .addFields([
        {
          inline: true,
          name: 'Ментор',
          value: mentor
        },
        {
          inline: true,
          name: 'Член 1',
          value: member1
        },
        {
          inline: true,
          name: 'Член 2',
          value: member2
        },
        {
          inline: true,
          name: 'Датум',
          value: date
        },
        {
          inline: true,
          name: 'Статус',
          value: status
        }
      ])
      .setDescription(content === '' ? 'Нема опис.' : content)
      .setColor('#313183')
      .setTimestamp();

    return [title, embed];
  }

  public getRequestInit (cookie: string): RequestInit {
    return {
      credentials: 'same-origin',
      headers: { Cookie: cookie }
    };
  }

  public getId (e: Element): string | null {
    return e.querySelector(this.idsSelector)?.textContent?.trim() ?? null;
  }
}
