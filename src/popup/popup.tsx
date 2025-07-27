import '@fontsource/roboto';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Typography,
} from '@mui/material';
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
import WeatherCard from '../components/WeatherCard';
import { Messages } from '../utils/messages';
import './popup.css';

const App: React.FC<{}> = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [newCity, setNewCity] = useState<string>('');
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);

  const handleCityButtonClick = () => {
    if (newCity.trim() !== '') {
      const updatedCities = [...cities, newCity.trim()];
      setStoredCities(updatedCities)
        .then(() => {
          setCities((prevCities) => [...prevCities, newCity.trim()]);
          setNewCity('');
          console.log('Cities updated successfully');
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
        console.log('City deleted successfully');
      })
      .catch((error) => {
        console.error('Error deleting city:', error);
      });
  };

  useEffect(() => {
    getStoredCities().then((storedCities) => {
      if (storedCities.length > 0) {
        setCities(storedCities);
      }
    });

    getStoredOptions().then((options) => setOptions(options));
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
        console.log('Temperature scale updated successfully');
      })
      .catch((error) => {
        console.error('Error updating temperature scale:', error);
      });
  };

  const handleOverlayToggle = () => {
    chrome.tabs.query(
      {
        active: true,
      },
      (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id!, Messages.TOGGLE_OVERLAY);
        }
      }
    );
  };

  return (
    <div>
      <Box mx="8px" my="16px">
        <Grid container justifyContent={'space-evenly'}>
          <Grid>
            <Paper>
              <Box px="15px" py="8px" display="flex" alignItems="center">
                <InputBase
                  placeholder="Add a city"
                  inputProps={{ 'aria-label': 'search' }}
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value.trim())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCity.trim() !== '') {
                      setCities((prevCities) => [
                        ...prevCities,
                        newCity.trim(),
                      ]);
                      setNewCity('');
                    }
                  }}
                />

                <IconButton onClick={handleCityButtonClick}>
                  <AddIcon />
                </IconButton>
              </Box>
            </Paper>
          </Grid>

          <Grid size="auto">
            <Paper>
              <Box py="4px">
                <IconButton onClick={handleTempScaleButtonClick}>
                  {options.tempScale === 'metric' ? '\u2103' : '\u2109'}
                </IconButton>
              </Box>
            </Paper>
          </Grid>

          <Grid size="auto">
            <Paper>
              <Box py="4px">
                <IconButton onClick={handleOverlayToggle}>
                  <PictureInPicture />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {options.homeCity != '' && (
          <WeatherCard city={options.homeCity} tempScale={options.tempScale} />
        )}

        {cities.map((city, index) => (
          <WeatherCard
            key={`${city}-${index}`}
            city={city}
            onDelete={() => handleDelete(index)}
            tempScale={options.tempScale}
          />
        ))}
        <Box mt={4} textAlign="center">
          <Typography variant="caption" color="textSecondary">
            Powered by OpenWeather
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
