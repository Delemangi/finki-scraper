import { EmbedBuilder } from 'discord.js';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

import { getThemeColor } from '../configuration/config.js';

const PARTNER_LABELS = ['Gold partner', 'Silver partner'] as const;

const cleanPartnerName = (name: null | string): null | string => {
  if (name === null) {
    return null;
  }

  let cleanedName = name;

  for (const label of PARTNER_LABELS) {
    cleanedName = cleanedName.replace(label, '').trim();
  }

  return cleanedName.replaceAll(/\s+/gu, ' ').trim();
};

const isSupportedByPartner = (url: string): boolean => url.includes('a1.com');

export class PartnersStrategy implements ScraperStrategy {
  public idsSelector = 'a';

  public postsSelector = 'div.card, div.support';

  public getId(element: Element): null | string {
    const url =
      element.querySelector('a')?.getAttribute('href')?.trim() ?? null;

    if (url && isSupportedByPartner(url)) {
      return 'A1';
    }

    const name = cleanPartnerName(element.textContent);

    return name ?? null;
  }

  public getPostData(element: Element): PostData {
    const url =
      element.querySelector('a')?.getAttribute('href')?.trim() ?? null;
    let name = cleanPartnerName(element.textContent) ?? '?';

    if (url && isSupportedByPartner(url)) {
      name = 'A1';
    }

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setDescription('Нов партнер на ФИНКИ')
      .setURL(url)
      .setColor(getThemeColor())
      .setTimestamp();

    return {
      embed,
      id: this.getId(element),
    };
  }
}
