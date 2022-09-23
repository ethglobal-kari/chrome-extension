'use strict';

import { Storage, StorageType } from './helper.js';
// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

const channelAddr = '0x70589220023a0A4075923B96e6f2188464eFBce3'; /// kari
// const channelAddr = '0x96546DeadDCBb28fa917eF29E2EF1D5a8FEc7794'; // minion
const userAddress = '0x929Aa59D8bA002258Fc9CAEd9303f96E1aba3C5c';

const URLS = {
  getChanel: `https://backend-staging.epns.io/apis/v1/channels/eip155:42:${channelAddr}`,
  userFeeds: `https://backend-staging.epns.io/apis/v1/users/eip155:42:${userAddress}/feeds?page=1&limit=30&spam=false`,
};

const setDefaultValue = () => {
  Storage.set(StorageType.history, 0);
  Storage.set(StorageType.current, 0);
  Storage.set(StorageType.latest, 0);
};

const restoreCounter = async () => {
  console.log('run on start');
  // Restore count value
  const [history, current, latest] = await Promise.all([
    Storage.get(StorageType.history),
    Storage.get(StorageType.current),
    Storage.get(StorageType.latest),
  ]);

  if (
    history === 'undefined' ||
    current === 'undefined' ||
    latest === 'undefined'
  ) {
    setDefaultValue();
  }
};

chrome.runtime.onStartup.addListener(restoreCounter);

chrome.runtime.onInstalled.addListener(async () => {
  setDefaultValue();

  console.log('Installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  let url = 'https://kari-receiver-interface.vercel.app/';
  await chrome.tabs.create({ url });

  Storage.set(StorageType.history, await Storage.get(StorageType.current));
  chrome.action.setBadgeText({ text: '' });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon_48.png',
    title: '[New event title]',
    message: 'New campaign is coming',
    // buttons: [{ title: 'Keep it Flowing.' }],
    priority: 0,
  });
});

const loadNotifications = async () => {
  const response = await (
    await fetch(URLS.userFeeds, { method: 'GET' })
  ).json();
  return response.itemcount;
};

const refresh = async () => {
  const [history, current, latest] = await Promise.all([
    Storage.get(StorageType.history),
    Storage.get(StorageType.current),
    loadNotifications(),
  ]);

  console.log({
    history: history,
    current: current,
    latest: latest,
  });

  if (latest != current) {
    chrome.alarms.create('New event', { when: Date.now() });
  }

  if (latest != history) {
    chrome.action.setBadgeText({
      text: (latest - history || 0).toString(),
    });
  }

  Storage.set(StorageType.current, latest);
};

refresh();
setInterval(async () => {
  console.log('Interval');
  await refresh();
  // TODO: change set refresh time
}, 10000);
