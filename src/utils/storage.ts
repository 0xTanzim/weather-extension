import { OpenWeatherTempScale } from '../types';

export interface LocalStorage {
  cities?: string[];
  options?: LocalStorageOptions;
}

export type LocalStorageKey = keyof LocalStorage;

export interface LocalStorageOptions {
  tempScale: OpenWeatherTempScale;
  homeCity: string;
  hasAutoOverlay: boolean;
}

export function setStoredCities(cities: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const storageData: LocalStorage = { cities };
      chrome.storage.local.set(storageData, () => {
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function getStoredCities(): Promise<string[]> {
  const keys: LocalStorageKey[] = ['cities'];

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result: LocalStorage) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.cities || []);
      }
    });
  });
}

export function setStoreOptions(options: LocalStorageOptions): Promise<void> {
  const vals: LocalStorage = {
    options,
  };
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(vals, () => {
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function getStoredOptions(): Promise<LocalStorageOptions | undefined> {
  const keys: LocalStorageKey[] = ['options'];

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result: LocalStorage) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.options);
      }
    });
  });
}
