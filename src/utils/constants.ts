export const LOG_MESSAGES = {
  appRunning: 'App running',
  cacheCleared: 'Cache cleared',
  cookieInvalid: 'Cookie is invalid',
  fetchedCookie: 'Fetched cookie',
  initializing: 'Initializing...',
  noNewPosts: 'No new posts',
  postAlreadySent: 'Post already sent',
  postSent: 'Post sent',
  searching: 'Searching...',
  sentNewPosts: 'Sent new posts',
} as const;

export const ERROR_MESSAGES = {
  badResponseCode: 'Bad response code',
  configParseFailed: 'Failed to parse configuration file',
  fetchFailed: 'Failed to fetch',
  fetchParseFailed: 'Failed to parse fetch result',
  postIdNotFound: 'Post ID not found',
  postSendFailed: 'Failed to send post',
  postsNotFound: 'Posts not found',
  scraperNotFound: 'Scraper not found',
  strategyNotFound: 'Strategy not found',
} as const;

export const CACHE_PATH = 'cache';
