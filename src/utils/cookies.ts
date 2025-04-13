export const getCookieHeader = (cookies: Record<string, string>): string =>
  Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
