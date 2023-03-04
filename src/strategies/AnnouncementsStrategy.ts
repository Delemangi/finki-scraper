import { EmbedBuilder } from 'discord.js';

export class AnnouncementsStrategy implements ScraperStrategy {
  public postsSelector = 'div.views-row';

  public idsSelector = 'a';

  public getPostData (e: Element): [string | null, EmbedBuilder] {
    const url = e.querySelector('a')?.getAttribute('href')?.trim();
    const link = url === undefined ? null : `https://finki.ukim.mk${url}`;
    const title = e.querySelector('a')?.textContent?.trim() ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setColor('#313183')
      .setTimestamp();

    return [link, embed];
  }

  public getRequestInit (): RequestInit | undefined {
    return undefined;
  }

  public getId (e: Element): string | null {
    const url = e.querySelector(this.idsSelector)?.getAttribute('href')?.trim();
    return url === undefined ? null : `https://finki.ukim.mk${url}`;
  }
}