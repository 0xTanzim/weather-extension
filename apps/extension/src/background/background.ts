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
  } catch (error) {
    console.error('Error during extension initialization:', error);
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
      const options = await getStoredOptions();
      if (!options || !options.homeCity || options.homeCity === '') {
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
      }
    } catch (error) {
      console.error('Error updating weather badge:', error);
    }
  }
});
