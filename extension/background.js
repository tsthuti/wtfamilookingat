// background.js - svc worker
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { getDomain, getCategory, isTrackable } from './utils.js';

// state

let activeTab = {
  domain: null,
  startTime: null,
  tabId: null,
};

let isUserIdle = false;
const FLUSH_INTERVAL_MINUTES = 2;
const IDLE_THRESHOLD_SECONDS = 60;

// visit queue - batch db before write

async function enqueueVisit(domain, durationSeconds) {
  if (!domain || durationSeconds < 2) return; // ignore blips

  const record = {
    domain,
    duration_seconds: Math.round(durationSeconds),
    category: getCategory(domain),
    visited_at: new Date().toISOString(),
    hour_of_day: new Date().getHours(),
    day_of_week: new Date().getDay(),
  };

  const { queue } = await chrome.storage.local.get({ queue: [] });
  queue.push(record);
  await chrome.storage.local.set({ queue });
  console.log(`[BrowseWise] Queued: ${domain} (${Math.round(durationSeconds)}s)`);
}

// sb flush

async function flushQueue() {
  const { queue } = await chrome.storage.local.get({ queue: [] });
  if (queue.length === 0) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(queue),
    });

    if (res.ok) {
      console.log(`[BrowseWise] Flushed ${queue.length} records to Supabase`);
      await chrome.storage.local.set({ queue: [] });
    } else {
      const err = await res.text();
      console.error('[BrowseWise] Flush failed:', err);
    }
  } catch (e) {
    console.error('[BrowseWise] Network error during flush:', e);
    // queue stays intact — will retry next alarm
  }
}

// active tabs

function stopTracking() {
  if (activeTab.domain && activeTab.startTime && !isUserIdle) {
    const duration = (Date.now() - activeTab.startTime) / 1000;
    enqueueVisit(activeTab.domain, duration);
  }
  activeTab = { domain: null, startTime: null, tabId: null };
}

async function startTracking(tabId, url) {
  stopTracking();

  if (!url || !isTrackable(url)) return;

  const domain = getDomain(url);
  if (!domain) return;

  activeTab = { domain, startTime: Date.now(), tabId };
}

// reg event listeners

// tab activated (user switches tabs)
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    await startTracking(tabId, tab.url);
  } catch (e) {
    // tab may have been closed already
  }
});

// tab updated (navigation within a tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    startTracking(tabId, tab.url);
  }
});

// winfow focus lost (user switches apps)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs[0]) startTracking(tabs[0].id, tabs[0].url);
    });
  }
});

// idle detection
chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'idle' || state === 'locked') {
    isUserIdle = true;
    stopTracking(); // record time up to idle
  } else if (state === 'active') {
    isUserIdle = false;
    // resume tracking current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) startTracking(tabs[0].id, tabs[0].url);
    });
  }
});

// tab closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTab.tabId === tabId) stopTracking();
});

// periodic flush alarm

chrome.alarms.create('flush', { periodInMinutes: FLUSH_INTERVAL_MINUTES });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flush') flushQueue();
});

// popup msg handler

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FLUSH') {
    flushQueue().then(() => sendResponse({ ok: true }));
    return true; // async response
  }
});

// startup - resume tracking curr tab

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) startTracking(tabs[0].id, tabs[0].url);
  });
});
