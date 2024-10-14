import { type ScraperStrategy } from '../types/Scraper.js';
import { EmbedBuilder } from 'discord.js';

export class AnnouncementsStrategy implements ScraperStrategy {
  public idsSelector = 'a';

  public postsSelector = 'div.views-row';

  public getId(element: Element): null | string {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute('href')
      ?.trim();
    return url === undefined ? null : `https://finki.ukim.mk${url}`;
  }

  public getPostData(element: Element): [null | string, EmbedBuilder] {
    const url = element.querySelector('a')?.getAttribute('href')?.trim();
    const link = url === undefined ? null : `https://finki.ukim.mk${url}`;
    const title = element.querySelector('a')?.textContent?.trim() ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setColor('#313183')
      .setTimestamp();

    return [link, embed];
  }

  public getRequestInit(): RequestInit | undefined {
    return undefined;
  }
}
