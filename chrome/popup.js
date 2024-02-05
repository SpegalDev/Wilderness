document.addEventListener('DOMContentLoaded', function () {
    popupInit();

    async function popupInit() {
        const { notificationsEnabled, notificationTime, badgeColor, badgeDisabled, nextEventName, nextEventTime } 
            = await chrome.storage.sync.get(['notificationsEnabled', 'notificationTime', 'badgeColor', 'badgeDisabled', 'nextEventName', 'nextEventTime']);

        setupNotifications(notificationsEnabled);
        setupNotificationTime(notificationTime);
        setupBadgeColor(badgeColor);
        setupBadgeDisabled(badgeDisabled);
        setupEventDetails(nextEventName, nextEventTime);
    }

    function setupNotifications(enabled) {
        const notificationsCheckbox = document.getElementById('notificationsCheckbox');
        notificationsCheckbox.checked = enabled !== false;
        notificationsCheckbox.addEventListener('change', function () {
            chrome.storage.sync.set({ notificationsEnabled: this.checked });
        });
    }

    function setupNotificationTime(time) {
        const notificationTimeElement = document.getElementById('notificationTime');
        notificationTimeElement.value = time || '5';
        notificationTimeElement.addEventListener('change', function() {
            chrome.storage.sync.set({notificationTime: this.value});
        });
    }

    function setupBadgeDisabled(enabled) {
        const badgeCheckbox = document.getElementById('badgeCheckbox');
        badgeCheckbox.checked = enabled;
        badgeCheckbox.addEventListener('change', function () {
            chrome.storage.sync.set({ badgeDisabled: this.checked }, function() {
                chrome.runtime.sendMessage({ action: 'updateBadgeText' });
            });
        });
    }

    function setupBadgeColor(color) {
      const badgeColorElement = document.getElementById('badgeColor');
      badgeColorElement.value = color;

      badgeColorElement.addEventListener('change', function() {
          const newColor = this.value;
          chrome.storage.sync.set({ badgeColor: newColor }, function() {
              console.log('Badge color is set to ' + newColor);
              chrome.action.setBadgeBackgroundColor({ color: newColor });
          });
      });

      chrome.storage.sync.get('badgeColor', function(result) {
          const storedColor = result.badgeColor;
          if (storedColor) {
              badgeColorElement.value = storedColor;
              chrome.action.setBadgeBackgroundColor({ color: storedColor });
          }
      });
  }




    function setupEventDetails(eventName, eventTime) {
        const EVENT_DETAILS = {
            'King Black Dragon Rampage': {
                link: 'https://runescape.wiki/w/Wilderness_Flash_Events#King_Black_Dragon_Rampage',
                icon: 'icons/kbd-icon.png'
            },
            'Infernal Star': {
                link: 'https://runescape.wiki/w/Wilderness_Flash_Events#Infernal_Star',
                icon: 'icons/star-icon.png'
            },
            'Evil Bloodwood Tree': {
                link: 'https://runescape.wiki/w/Wilderness_Flash_Events#Evil_Bloodwood_Tree',
                icon: 'icons/tree-icon.png'
            },
            'Stryke the Wyrm': {
                link: 'https://runescape.wiki/w/Wilderness_Flash_Events#Stryke_the_Wyrm',
                icon: 'icons/wyrm-icon.png'
            },
            default: {
                link: 'https://runescape.wiki/w/Wilderness_Flash_Events',
                icon: 'icons/icon.png'
            }
        };

        const details = EVENT_DETAILS[eventName] || EVENT_DETAILS.default;
        document.getElementById('eventLink').href = details.link;
        document.getElementById('eventImage').src = details.icon;
        document.getElementById('eventName').textContent = eventName.replace("King Black Dragon", "KBD");

        const eventTimeElement = document.getElementById('eventTime');
        eventTimeElement.textContent = eventTime;
        document.getElementById('eventTimeS').textContent = eventTime === 1 ? '' : 's';
    }
});