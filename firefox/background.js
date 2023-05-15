const KEEP_ALIVE_INTERVAL = 20e3;
const FETCH_URL = 'https://wilderness.spegal.dev/api/';
const FIVE_MINUTES_MS = 300000;
const ONE_MINUTE_MS = 60000;
const EVENT_ICONS = {
  'King Black Dragon Rampage': 'icons/kbd-icon.png',
  'Infernal Star': 'icons/star-icon.png',
  'Evil Bloodwood Tree': 'icons/tree-icon.png',
  default: 'icons/icon.png',
};

let TIMEOUT_TIME = ONE_MINUTE_MS;
let NOTIFICATION_THRESHOLD = 5;
let isNotificationPlayed = false;
let nextEventName = null;
let nextEventTime = null;
let fetchTimer = null;

browser.runtime.onStartup.addListener(keepAlive);
keepAlive();

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateBadgeText') checkFlashEvent();
});

backgroundInit();

async function backgroundInit() {
  await browser.browserAction.setBadgeBackgroundColor({ color: '#CCCCCC' });
  await updateBadgeText('?');
  checkFlashEvent();
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error occurred while fetching data:', error);
    throw error;
  }
}

async function processEventData(data) {
  clearTimeout(fetchTimer);
  const { time: remainingTime, name: upcomingEventName } = data;
  nextEventName = upcomingEventName;
  nextEventTime = remainingTime;
  await updateBadgeText(remainingTime);
  updateIcon(upcomingEventName);
  await handleNotification(remainingTime, upcomingEventName);
  TIMEOUT_TIME = remainingTime > 60 ? FIVE_MINUTES_MS : ONE_MINUTE_MS;
  await browser.storage.sync.set({ nextEventName, nextEventTime });
  fetchTimer = setTimeout(checkFlashEvent, TIMEOUT_TIME);
}

async function updateBadgeText(remainingTime) {
  const { badgeDisabled, badgeColor } = await browser.storage.sync.get(['badgeDisabled', 'badgeColor']);
  if (!badgeDisabled) {
    const color = badgeColor || '#CCCCCC';
    browser.browserAction.setBadgeBackgroundColor({ color });
    let displayTime = `${remainingTime}m`;
    if (remainingTime > 60) displayTime = `${Math.floor(remainingTime / 60)}h`;
    if (remainingTime <= 1) displayTime = 'RN';
    browser.browserAction.setBadgeText({ text: displayTime });
  } else {
    browser.browserAction.setBadgeText({ text: '' });
  }
}

function updateIcon(upcomingEventName) {
  browser.browserAction.setIcon({ path: { "128": `${getIcon(upcomingEventName)}` } });
}

async function handleNotification(remainingTime, upcomingEventName) {
  const { notificationsEnabled, notificationTime } = await browser.storage.sync.get(['notificationsEnabled', 'notificationTime']);
  if (notificationsEnabled) {
    NOTIFICATION_THRESHOLD = notificationTime || NOTIFICATION_THRESHOLD;
    if (remainingTime <= NOTIFICATION_THRESHOLD && !isNotificationPlayed) {
      showNotification(upcomingEventName);
      isNotificationPlayed = true;
    } else if (remainingTime > NOTIFICATION_THRESHOLD) {
      isNotificationPlayed = false;
    }
  }
}

function getIcon(upcomingEventName) {
  const eventName = Object.keys(EVENT_ICONS).find(name => upcomingEventName.includes(name));
  return EVENT_ICONS[eventName] || EVENT_ICONS.default;
}

function showNotification(upcomingEventName) {
  const options = {
    type: 'basic',
    iconUrl: getIcon(upcomingEventName),
    title: 'Wilderness Flash Event',
    message: getNotificationMessage(upcomingEventName),
  };
  browser.notifications.create("wildernessEvent", options);
}

function getNotificationMessage(upcomingEventName) {
  if (upcomingEventName.includes('King Black Dragon Rampage')) {
    return 'The King Black Dragon is infuriated by the disturbances in the Wilderness and is preparing to take out his rage on all combatants near Daemonheim.';
  }
  if (upcomingEventName.includes('Infernal Star')) {
    return 'The Wilderness Volcano has launched a large rock high into the air above the wilderness. It will land soon near the Chaos Temple.';
  }
  if (upcomingEventName.includes('Evil Bloodwood Tree')) {
    return 'Bloodshed in the Wilderness has encouraged the growth of a particularly powerful evil tree it will sprout soon south of the Wilderness Crater.';
  }
  return upcomingEventName;
}

function checkFlashEvent() {
  fetchData(FETCH_URL)
    .then(data => processEventData(data))
    .catch(error => console.error('Error occurred while fetching data:', error));
}

function keepAlive() {
  setInterval(browser.runtime.getPlatformInfo, KEEP_ALIVE_INTERVAL);
}