import { EmbedBuilder } from "discord.js";

export class AnnouncementsStrategy implements ScraperStrategy {
  public postsSelector = "div.views-row";

  public idsSelector = "a";

  public getPostData(element: Element): [string | null, EmbedBuilder] {
    const url = element.querySelector("a")?.getAttribute("href")?.trim();
    const link = url === undefined ? null : `https://finki.ukim.mk${url}`;
    const title = element.querySelector("a")?.textContent?.trim() ?? "?";

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setColor("#313183")
      .setTimestamp();

    return [link, embed];
  }

  public getRequestInit(): RequestInit | undefined {
    return undefined;
  }

  public getId(element: Element): string | null {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute("href")
      ?.trim();
    return url === undefined ? null : `https://finki.ukim.mk${url}`;
  }
}
