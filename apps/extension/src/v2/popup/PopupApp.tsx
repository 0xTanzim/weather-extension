import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OpenWeatherTempScale } from '../../types';
import { getCityNameFromCoords, getWeatherData } from '../../utils/api';
import { Messages } from '../../utils/messages';
import {
  getStoredCities,
  getStoredOptions,
  LocalStorageOptions,
  setStoredCities,
  setStoreOptions,
} from '../../utils/storage';
import ActionButtons from '../components/ActionButtons';
import Carousel from '../components/Carousel';
import SearchBar from '../components/SearchBar';
import WeatherCard from '../components/WeatherCard';
import '../styles/globals.css';

const PopupApp: React.FC = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backgroundClass, setBackgroundClass] = useState(
    'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'
  );

  useEffect(() => {
    Promise.all([getStoredCities(), getStoredOptions()])
      .then(([storedCities, storedOptions]) => {
        setCities(storedCities || []);
        if (storedOptions) {
          setOptions(storedOptions);
        }
      })
      .catch((error) => {
        console.error('Error loading data:', error);
      });
  }, []);

  useEffect(() => {
    if (cities.length > 0) {
      setStoredCities(cities).catch((error) => {
        console.error('Error saving cities:', error);
      });
    }
  }, [cities]);

  const handleAddCity = (cityName: string) => {
    if (cities.some((city) => city.toLowerCase() === cityName.toLowerCase())) {
      alert('City already added!');
      return;
    }
    const updatedCities = [...cities, cityName];
    setCities(updatedCities);
    setCurrentIndex(updatedCities.length - 1);
  };

  const handleRemoveCity = (index: number) => {
    if (cities.length === 1) {
      alert('At least one city must remain!');
      return;
    }
    const updatedCities = cities.filter((_, i) => i !== index);
    setCities(updatedCities);
    setCurrentIndex(Math.min(currentIndex, updatedCities.length - 1));
  };

  const handleSetDefault = (city: string) => {
    if (!options) return;

    const updateOptions: LocalStorageOptions = {
      ...options,
      homeCity: city,
    };
    setStoreOptions(updateOptions)
      .then(() => {
        setOptions(updateOptions);
        updateBadge(city, updateOptions.tempScale);
      })
      .catch((error) => {
        console.error('Error updating default city:', error);
      });
  };

  const handleToggleTempScale = () => {
    if (!options) return;

    const updateOptions: LocalStorageOptions = {
      ...options,
      tempScale: options.tempScale === 'metric' ? 'imperial' : 'metric',
    };
    setStoreOptions(updateOptions)
      .then(() => {
        setOptions(updateOptions);
      })
      .catch((error) => {
        console.error('Error updating temperature scale:', error);
      });
  };

  const handleOverlayToggle = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab.id) {
        console.error('No active tab found');
        return;
      }

      chrome.tabs.sendMessage(tab.id, Messages.TOGGLE_OVERLAY, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting
            .executeScript({
              target: { tabId: tab.id! },
              files: ['contentScript.js'],
            })
            .then(() => {
              // Use a more reliable timeout mechanism
              const retryTimeout = setTimeout(() => {
                if (tab.id) {
                  chrome.tabs.sendMessage(
                    tab.id,
                    Messages.TOGGLE_OVERLAY,
                    (retryResponse) => {
                      if (chrome.runtime.lastError) {
                        console.error(
                          'Failed to toggle overlay:',
                          chrome.runtime.lastError.message
                        );
                      }
                    }
                  );
                }
              }, 100);

              // Clean up timeout if component unmounts
              return () => clearTimeout(retryTimeout);
            })
            .catch((error) => {
              console.error('Failed to inject content script:', error);
            });
        }
      });
    });
  };

  const handleAutoLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const city = await getCityNameFromCoords(
            pos.coords.latitude,
            pos.coords.longitude
          );
          if (city && options) {
            const updateOptions: LocalStorageOptions = {
              ...options,
              homeCity: city,
            };
            await setStoreOptions(updateOptions);
            setOptions(updateOptions);
            updateBadge(city, updateOptions.tempScale);
          } else {
            alert('Could not determine city from your location.');
          }
        } catch (error) {
          alert('Error getting location. Please try again.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Location access denied or unavailable.');
      }
    );
  };

  const updateBadge = async (city: string, tempScale: OpenWeatherTempScale) => {
    try {
      const data = await getWeatherData(city, tempScale);
      if (data) {
        const tempText = `${Math.round(data.main.temp)}°${tempScale === 'metric' ? 'C' : 'F'}`;
        chrome.action.setBadgeText({ text: tempText });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      }
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    const refreshTimeout = setTimeout(() => setIsRefreshing(false), 1000);

    // Clean up timeout if component unmounts
    return () => clearTimeout(refreshTimeout);
  };

  const setDynamicBackground = (description: string) => {
    if (description.includes('clear')) {
      setBackgroundClass(
        'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900'
      );
    } else if (description.includes('cloud')) {
      setBackgroundClass(
        'bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900'
      );
    } else if (description.includes('rain')) {
      setBackgroundClass(
        'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'
      );
    } else {
      setBackgroundClass(
        'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'
      );
    }
  };

  if (!options) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${backgroundClass}`}
      >
        <div className="glassmorphism rounded-2xl p-8 text-center shadow-2xl">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white/80">Loading weather extension...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${backgroundClass} transition-all duration-500 shadow-2xl`}
    >
      <div className="p-4">
        {/* Search Bar - Direct start like idea.html */}
        <SearchBar onAddCity={handleAddCity} />

        {/* Action Buttons - After search like idea.html */}
        <ActionButtons
          tempScale={options.tempScale}
          onToggleTempScale={handleToggleTempScale}
          onToggleOverlay={handleOverlayToggle}
          onAutoLocation={handleAutoLocation}
          onRefresh={handleRefresh}
          isLocating={isLocating}
          isRefreshing={isRefreshing}
        />

        {/* Default Location */}
        {options.homeCity && (
          <div className="mb-4 animate-slide-up">
            <div className="flex items-center mb-2">
              <div className="text-yellow-400 mr-2">📍</div>
              <h2 className="text-sm font-semibold text-yellow-400 text-shadow-sm">
                Current Location: {options.homeCity}
              </h2>
            </div>
            <WeatherCard
              city={options.homeCity}
              tempScale={options.tempScale}
              isDefault={true}
            />
          </div>
        )}

        {/* User Cities Carousel */}
        {cities.length > 0 && (
          <div className="mb-4 animate-slide-up">
            <h2 className="text-sm font-semibold text-white text-shadow-sm mb-3 text-center">
              🌍 Saved Cities
            </h2>
            <Carousel
              cities={cities}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onRemoveCity={handleRemoveCity}
              onSetDefault={handleSetDefault}
              tempScale={options.tempScale}
              homeCity={options.homeCity}
            />
          </div>
        )}

        {/* Empty State */}
        {cities.length === 0 && !options.homeCity && (
          <div className="text-center py-6 animate-fade-in">
            <div className="glassmorphism rounded-2xl p-6 shadow-2xl">
              <div className="text-4xl mb-3">🌤️</div>
              <h3 className="text-base font-semibold text-white text-shadow-sm mb-2">
                Welcome to Weather Extension!
              </h3>
              <p className="text-white/70 text-sm mb-3">
                Add your first city to get started with beautiful weather
                information.
              </p>
              <div className="text-xs text-white/50">
                Use the search bar above or set your current location
                automatically.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/50 text-xs mb-2">Powered by OpenWeather</p>
            <button
              onClick={() =>
                chrome.tabs.create({
                  url: 'https://buymeacoffee.com/tanzimhossain',
                })
              }
              className="btn-secondary text-xs flex items-center justify-center space-x-2 mx-auto"
            >
              <span>☕</span>
              <span>Buy me a coffee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const container =
  document.getElementById('root') || document.createElement('div');
if (!container.id) {
  container.id = 'root';
  document.body.appendChild(container);
}

const root = createRoot(container);
root.render(<PopupApp />);
