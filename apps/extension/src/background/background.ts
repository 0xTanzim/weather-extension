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
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Weather extension installed/updated');
  
  try {
    // Initialize storage with default values
    await setStoredCities([]);
    await setStoreOptions({ 
      tempScale: 'metric', 
      homeCity: '', 
      hasAutoOverlay: false 
    });
    console.log('Storage initialized successfully');

    // Create context menu
    chrome.contextMenus.create({
      contexts: ['selection'],
      title: 'Add selected text as city',
      id: 'addCityFromSelection',
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to create context menu:', chrome.runtime.lastError);
      } else {
        console.log('Context menu created successfully');
      }
    });

    // Create alarm for weather updates
    chrome.alarms.create('weatherUpdate', {
      periodInMinutes: 60,
    });
    console.log('Weather update alarm created');
  } catch (error) {
    console.error('Error during extension initialization:', error);
  }
});

chrome.contextMenus.onClicked.addListener(async (event) => {
  try {
    const cities = await getStoredCities();
    if (event.menuItemId === 'addCityFromSelection' && event.selectionText) {
      const newCity = event.selectionText.trim();
      if (!cities.includes(newCity)) {
        console.log('Adding new city from selection:', newCity);
        await setStoredCities([...cities, newCity]);
        console.log('City added successfully');
      } else {
        console.log('City already exists:', newCity);
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
      if (!options || options.homeCity === '') {
        console.log('No home city set, skipping weather update');
        return;
      }

      const data = await getWeatherData(options.homeCity, options.tempScale);
      if (data) {
        const tempText = `${Math.round(data.main.temp)}°${
          options.tempScale === 'metric' ? 'C' : 'F'
        }`;
        
        chrome.action.setBadgeText({
          text: tempText,
        });
        console.log('Weather badge updated:', tempText);
      }
    } catch (error) {
      console.error('Error updating weather badge:', error);
    }
  }
});

