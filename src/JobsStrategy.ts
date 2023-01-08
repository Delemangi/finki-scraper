import { EmbedBuilder } from 'discord.js';

export class JobsStrategy implements ScraperStrategy {
  public postsSelector = 'div.views-row';

  public idsSelector = 'a + a';

  public getPostData (e: Element): [string | null, EmbedBuilder] {
    const url = e.querySelector('a + a')?.getAttribute('href')?.trim();
    const link = url === undefined ? null : `https://finki.ukim.mk${url}`;
    const title = e.querySelector('a + a')?.textContent?.trim() ?? '?';
    const content = e.querySelector('div.col-xs-12.col-sm-8 > div.field-content')?.textContent?.trim().slice(0, 500) ?? '?';
    const image = e.querySelector('img')?.getAttribute('src')?.split('?').at(0) ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setThumbnail(image)
      .setDescription(content)
      .setColor('#313183')
      .setTimestamp();

    return [link, embed];
  }

  public getRequestInit (): RequestInit | undefined {
    return undefined;
  }

  public getId (e: Element): string | null {
    return e.querySelector(this.idsSelector)?.getAttribute('href')?.trim() ?? null;
  }
}
