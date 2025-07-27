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
chrome.runtime.onInstalled.addListener(() => {
  setStoredCities([]);
  setStoreOptions({ tempScale: 'metric', homeCity: '', hasAutoOverlay: false });

  chrome.contextMenus.create({
    contexts: ['selection'],
    title: 'Add selected text as city',
    id: 'addCityFromSelection',
  });


  

  chrome.alarms.create({
    periodInMinutes: 60,
  });
});

chrome.contextMenus.onClicked.addListener((event) => {
  getStoredCities().then((cities) => {
    if (event.menuItemId === 'addCityFromSelection' && event.selectionText) {
      const newCity = event.selectionText.trim();
      if (!cities.includes(newCity)) {
        console.log('Adding new city from selection:', newCity);
        return setStoredCities([...cities, newCity]);
      }
    }
    return Promise.resolve();
  });
});

chrome.alarms.onAlarm.addListener(() => {
  getStoredOptions().then((options) => {
    if (options.homeCity === '') {
      console.warn('Home city is not set. Please set it in the options.');
      return;
    }

    getWeatherData(options.homeCity, options.tempScale).then((data) => {
      if (data) {
        chrome.action.setBadgeText({
          text: `${Math.round(data.main.temp)}°${
            options.tempScale === 'metric' ? 'C' : 'F'
          }`,
        });
      }
    });
  });
});
