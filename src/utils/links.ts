export const normalizeURL = (url: string, baseUrl: string): string => {
  if (url.startsWith('http')) {
    return url;
  }

  if (url.startsWith('/')) {
    return baseUrl + url;
  }

  const baseUrlParts = baseUrl.split('/');
  baseUrlParts.pop();

  return `${baseUrlParts.join('/')}/${url}`;
};
