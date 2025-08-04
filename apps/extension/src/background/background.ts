import { getWeatherData } from '../utils/api';
import {
  getStoredCities,
  getStoredOptions,
  setStoredCities,
  setStoreOptions,
} from '../utils/storage';

/**
 * Background script for the weather extension.
 * Initializes the extension, sets up context menus, and handles alarms.
 */

// Store references for cleanup
let weatherAlarmName: string | null = null;
let contextMenuId: string | null = null;

// Function to update badge with weather data
async function updateBadgeWithWeather() {
  try {
    const options = await getStoredOptions();
    if (!options || !options.homeCity || options.homeCity === '') {
      // Clear badge if no home city is set
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const data = await getWeatherData(options.homeCity!, options.tempScale);
    if (data) {
      const tempText = `${Math.round(data.main.temp)}°${
        options.tempScale === 'metric' ? 'C' : 'F'
      }`;

      chrome.action.setBadgeText({
        text: tempText,
      });

      // Set badge color based on temperature
      const temp = data.main.temp;
      let badgeColor = '#4CAF50'; // Green for moderate temps

      if (temp < 0) {
        badgeColor = '#2196F3'; // Blue for cold
      } else if (temp > 30) {
        badgeColor = '#F44336'; // Red for hot
      }

      chrome.action.setBadgeBackgroundColor({
        color: badgeColor,
      });
    }
  } catch (error) {
    console.error('Error updating weather badge:', error);
    // Clear badge on error
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Initialize storage with default values
    await setStoredCities([]);
    await setStoreOptions({
      tempScale: 'metric',
      homeCity: '',
      hasAutoOverlay: false,
    });

    // Create context menu
    chrome.contextMenus.create(
      {
        contexts: ['selection'],
        title: 'Add selected text as city',
        id: 'addCityFromSelection',
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            'Failed to create context menu:',
            chrome.runtime.lastError
          );
        } else {
          contextMenuId = 'addCityFromSelection';
        }
      }
    );

    // Create alarm for weather updates
    await chrome.alarms.create('weatherUpdate', {
      periodInMinutes: 60,
    });
    weatherAlarmName = 'weatherUpdate';

    // Update badge immediately on installation
    await updateBadgeWithWeather();
  } catch (error) {
    console.error('Error during extension initialization:', error);
  }
});

// Update badge when extension starts (browser startup)
chrome.runtime.onStartup.addListener(async () => {
  try {
    await updateBadgeWithWeather();
  } catch (error) {
    console.error('Error updating badge on startup:', error);
  }
});

// Update badge when popup opens
chrome.action.onClicked.addListener(async () => {
  try {
    await updateBadgeWithWeather();
  } catch (error) {
    console.error('Error updating badge on popup open:', error);
  }
});

// Handle messages from popup to update badge
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    if (message.type === 'UPDATE_BADGE') {
      await updateBadgeWithWeather();
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Error handling badge update message:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Cleanup function for extension uninstall
chrome.runtime.onSuspend.addListener(async () => {
  try {
    // Clear alarms
    if (weatherAlarmName) {
      await chrome.alarms.clear(weatherAlarmName);
      weatherAlarmName = null;
    }

    // Clear context menus
    if (contextMenuId) {
      await chrome.contextMenus.remove(contextMenuId);
      contextMenuId = null;
    }

    console.log('Extension cleanup completed');
  } catch (error) {
    console.error('Error during extension cleanup:', error);
  }
});

chrome.contextMenus.onClicked.addListener(async (event) => {
  try {
    const cities = await getStoredCities();
    if (event.menuItemId === 'addCityFromSelection' && event.selectionText) {
      const newCity = event.selectionText.trim();
      if (!cities.includes(newCity)) {
        await setStoredCities([...cities, newCity]);
      }
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'weatherUpdate') {
    try {
      await updateBadgeWithWeather();
    } catch (error) {
      console.error('Error updating weather badge from alarm:', error);
    }
  }
});
