// utils.js — domain parsing + category classification

// domains to never track (browser internals, new tab, etc.)
const BLOCKED_SCHEMES = ['chrome://', 'chrome-extension://', 'about:', 'moz-extension://'];

export function isTrackable(url) {
  if (!url) return false;
  return !BLOCKED_SCHEMES.some((s) => url.startsWith(s));
}

export function getDomain(url) {
  try {
    const { hostname } = new URL(url);
    // Strip www. prefix
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// category mapping (for now)
const CATEGORY_MAP = {
  // social
  'twitter.com': 'Social',
  'x.com': 'Social',
  'instagram.com': 'Social',
  'facebook.com': 'Social',
  'linkedin.com': 'Social',
  'reddit.com': 'Social',
  'tiktok.com': 'Social',
  'snapchat.com': 'Social',
  'threads.net': 'Social',

  // work / productivity
  'notion.so': 'Productivity',
  'docs.google.com': 'Productivity',
  'sheets.google.com': 'Productivity',
  'drive.google.com': 'Productivity',
  'calendar.google.com': 'Productivity',
  'mail.google.com': 'Productivity',
  'gmail.com': 'Productivity',
  'slack.com': 'Productivity',
  'linear.app': 'Productivity',
  'asana.com': 'Productivity',
  'trello.com': 'Productivity',
  'figma.com': 'Productivity',
  'airtable.com': 'Productivity',

  // dev
  'github.com': 'Dev',
  'gitlab.com': 'Dev',
  'stackoverflow.com': 'Dev',
  'developer.mozilla.org': 'Dev',
  'vercel.com': 'Dev',
  'netlify.com': 'Dev',
  'supabase.com': 'Dev',
  'npmjs.com': 'Dev',
  'docs.anthropic.com': 'Dev',

  // learning
  'youtube.com': 'Learning',
  'udemy.com': 'Learning',
  'coursera.org': 'Learning',
  'khanacademy.org': 'Learning',
  'learn.uwaterloo.ca': 'Learning',

  // news
  'news.ycombinator.com': 'News',
  'techcrunch.com': 'News',
  'theverge.com': 'News',
  'bbc.com': 'News',
  'cnn.com': 'News',
  'nytimes.com': 'News',

  // entertainment
  'netflix.com': 'Entertainment',
  'spotify.com': 'Entertainment',
  'twitch.tv': 'Entertainment',

  // shopping
  'amazon.com': 'Shopping',
  'aritzia.ca': 'Shopping',
  'garageclothing.ca': 'Shopping',

  // finance
  'robinhood.com': 'Finance',
  'wealthsimple.com': 'Finance',
  'chase.com': 'Finance',
  'coinbase.com': 'Finance',
};

export function getCategory(domain) {
  return CATEGORY_MAP[domain] ?? 'Other';
}
