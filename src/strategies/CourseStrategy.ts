import { EmbedBuilder } from 'discord.js';
import { config } from '../utils/config.js';

export class CourseStrategy implements ScraperStrategy {
  public postsSelector = 'article';

  public idsSelector = '[title="Permanent link to this post"]';

  public defaultCookie = config.coursesCookie;

  public getPostData (e: Element): [string | null, EmbedBuilder] {
    const link = e.querySelector('[title="Permanent link to this post"]')?.getAttribute('href')?.trim() ?? null;
    const authorImage = e.querySelector('img[title*="Picture of"]')?.getAttribute('src')?.trim() ?? '?';
    const authorName = e.querySelector('h4 + div > a')?.textContent?.trim() ?? '?';
    const authorLink = e.querySelector('div.d-flex.flex-column > div > a')?.getAttribute('href')?.trim().split('&').at(0) ?? '?';
    const content = e.querySelector('div.post-content-container')?.textContent?.trim().slice(0, 500) ?? '?';
    const title = e.querySelector('h4 > a:last-of-type')?.textContent?.trim() ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        iconURL: authorImage,
        name: authorName,
        url: authorLink
      })
      .setURL(link)
      .setDescription(content === '' ? 'Нема опис.' : content)
      .setColor('#313183')
      .setTimestamp();

    return [link, embed];
  }

  public getRequestInit (cookie: string): RequestInit {
    return {
      credentials: 'omit',
      headers: { Cookie: cookie }
    };
  }

  public getId (e: Element): string | null {
    return e.querySelector(this.idsSelector)?.getAttribute('href')?.trim() ?? null;
  }
}
