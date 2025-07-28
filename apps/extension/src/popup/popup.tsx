import '@fontsource/roboto';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getStoredCities,
  getStoredOptions,
  LocalStorageOptions,
  setStoredCities,
  setStoreOptions,
} from '../utils/storage';

import { PictureInPicture } from '@mui/icons-material';
import CoffeeIcon from '@mui/icons-material/Coffee';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import WeatherCard from '../components/WeatherCard';
import { OpenWeatherTempScale } from '../types';
import { getCityNameFromCoords, getWeatherData } from '../utils/api';
import { Messages } from '../utils/messages';
import './popup.css';

const PopupApp: React.FC<{}> = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [newCity, setNewCity] = useState<string>('');
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleCityButtonClick = () => {
    if (newCity.trim() !== '') {
      const updatedCities = [...cities, newCity.trim()];
      setStoredCities(updatedCities)
        .then(() => {
          setCities(updatedCities);
          setNewCity('');
        })
        .catch((error) => {
          console.error('Error updating cities:', error);
        });
    }
  };

  const handleDelete = (index: number) => {
    const updatedCities = [...cities];
    updatedCities.splice(index, 1);

    setStoredCities(updatedCities)
      .then(() => {
        setCities(updatedCities);
      })
      .catch((error) => {
        console.error('Error deleting city:', error);
      });
  };

  useEffect(() => {
    Promise.all([
      getStoredCities(),
      getStoredOptions()
    ]).then(([storedCities, storedOptions]) => {
      setCities(storedCities || []);
      if (storedOptions) {
      setOptions(storedOptions);
      }
    }).catch((error) => {
      console.error('Error loading data:', error);
    });
  }, []);

  if (!options) {
    return null;
  }

  const handleTempScaleButtonClick = () => {
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
      if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) {
        return;
      }

      chrome.tabs.sendMessage(tab.id, Messages.TOGGLE_OVERLAY, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            files: ['contentScript.js']
          }).then(() => {
            setTimeout(() => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, Messages.TOGGLE_OVERLAY, (retryResponse) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to toggle overlay:', chrome.runtime.lastError.message);
                }
              });
              }
            }, 100);
          }).catch((error) => {
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
        const city = await getCityNameFromCoords(pos.coords.latitude, pos.coords.longitude);
        if (city) {
          const updateOptions: LocalStorageOptions = {
            ...options!,
            homeCity: city,
          };
          setStoreOptions(updateOptions).then(() => {
            setOptions(updateOptions);
            setIsLocating(false);
            updateBadge(city, updateOptions.tempScale);
          });
        } else {
          setIsLocating(false);
          alert('Could not determine city from your location.');
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

  const handleSetDefault = (city: string) => {
    const updateOptions: LocalStorageOptions = {
      ...options,
      homeCity: city,
    };
    setStoreOptions(updateOptions).then(() => {
      setOptions(updateOptions);
      updateBadge(city, updateOptions.tempScale);
    });
  };

  return (
    <Box sx={{
      width: '450px',
      minHeight: '600px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Roboto, sans-serif'
    }}>
      {/* Header */}
      <Box sx={{
        p: 3,
        pb: 2,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Typography variant="h5" sx={{
          fontWeight: 600,
          mb: 2,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          🌤️ Weather Extension
        </Typography>

        {/* Search Bar */}
        <Paper elevation={3} sx={{
          borderRadius: 3,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          mb: 2
        }}>
          <Box px={2} py={1.5} display="flex" alignItems="center">
            <SearchIcon sx={{ color: '#666', mr: 1 }} />
            <InputBase
              placeholder="Add a city..."
              inputProps={{ 'aria-label': 'search' }}
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCity.trim() !== '') {
                  handleCityButtonClick();
                }
              }}
              sx={{ flex: 1, color: '#333' }}
            />
            <IconButton
              onClick={handleCityButtonClick}
              sx={{
                ml: 1,
                color: '#667eea',
                '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="center">
          <IconButton
            onClick={handleTempScaleButtonClick}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
            }}
            title={`Switch to ${options.tempScale === 'metric' ? 'Fahrenheit' : 'Celsius'}`}
          >
            {options.tempScale === 'metric' ? '°C' : '°F'}
          </IconButton>
          <IconButton
            onClick={handleOverlayToggle}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
            }}
            title="Toggle overlay"
          >
            <PictureInPicture />
          </IconButton>
          <IconButton
            onClick={handleAutoLocation}
            disabled={isLocating}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
              '&:disabled': { opacity: 0.5 }
            }}
            title="Set location automatically"
          >
            <MyLocationIcon />
          </IconButton>
          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
              '&:disabled': { opacity: 0.5 }
            }}
            title="Refresh weather data"
          >
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, pt: 2 }}>
        {/* Default Location */}
        {options.homeCity && (
          <Box mb={3}>
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOnIcon sx={{ mr: 1, color: '#FFD700' }} />
              <Typography variant="subtitle1" sx={{
                fontWeight: 600,
                color: '#FFD700',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                📍 Current Location: {options.homeCity}
              </Typography>
            </Box>
            <WeatherCard city={options.homeCity} tempScale={options.tempScale} isDefault />
          </Box>
        )}

        {/* User Cities */}
        {cities.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" sx={{
              mb: 2,
              fontWeight: 600,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              🌍 Saved Cities
            </Typography>
            <Stack spacing={2}>
              {cities.map((city, index) => (
                <WeatherCard
                  key={`${city}-${index}`}
                  city={city}
                  onDelete={() => handleDelete(index)}
                  tempScale={options.tempScale}
                  onSetDefault={() => handleSetDefault(city)}
                  isDefault={city === options.homeCity}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Empty State */}
        {cities.length === 0 && !options.homeCity && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
              No cities added yet. Use the search bar above to add your first city!
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{
        mt: 'auto',
        p: 3,
        pt: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.1)'
      }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Powered by OpenWeather
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CoffeeIcon />}
            onClick={() => chrome.tabs.create({ url: 'https://buymeacoffee.com/tanzimhossain' })}
            sx={{
              borderRadius: 20,
              textTransform: 'none',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              color: 'rgba(255, 255, 255, 0.9)',
              px: 3,
              py: 1,
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.6)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }
            }}
          >
            Buy me a coffee ☕
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

const container = document.getElementById('root') || document.createElement('div');
if (!container.id) {
  container.id = 'root';
  document.body.appendChild(container);
}
const root = createRoot(container);
root.render(<PopupApp />);
