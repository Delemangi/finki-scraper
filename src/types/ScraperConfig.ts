export type ScraperConfig = {
  cookie?: Record<string, string>;
  enabled: boolean;
  link: string;
  name?: string;
  role?: string;
  strategy: string;
  webhook: string;
};
