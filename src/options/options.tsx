import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getStoredOptions,
  LocalStorageOptions,
  setStoreOptions,
} from '../utils/storage';
import './options.css';

type FormState = 'ready' | 'saving';

const App: React.FC<{}> = () => {
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);
  const [formState, setFormState] = useState<FormState>('ready');

  useEffect(() => {
    getStoredOptions().then((options) => setOptions(options));
  }, []);

  const handleHomeCityChange = (homeCity: string) => {
    if (!options) return;
    if (homeCity.length > 50) {
      console.warn('Home city name is too long. Please shorten it.');
      return;
    }

    setOptions({
      ...options,
      homeCity,
    });
  };

  const handleAutoOverlayChange = (hasAutoOverlay: boolean) => {
    setOptions({
      ...options,
      hasAutoOverlay,
    });
  };

  const handleSaveButtonClick = () => {
    setFormState('saving');
    setStoreOptions(options).then(() => {
      setTimeout(() => {
        setFormState('ready');
      }, 1000);
    });
  };

  if (!options) {
    return null;
  }

  const isFieldsDisabled = formState === 'saving';

  return (
    <Box mx="10%" my="5%">
      <Card>
        <CardContent>
          <Grid container direction={'column'} spacing={2}>
            <Grid>
              <Typography variant="h4">Weather Extension Options</Typography>
            </Grid>

            <Grid>
              <Typography variant="body1" color="textSecondary" my={2}>
                Home City
              </Typography>
              <TextField
                placeholder="Enter Your Home City"
                label="Home City"
                aria-describedby="home-city-helper-text"
                fullWidth
                variant="outlined"
                id="home-city"
                name="home-city"
                helperText="This will be used to fetch the weather data for your home city."
                value={options.homeCity}
                onChange={(e) => handleHomeCityChange(e.target.value)}
                disabled={isFieldsDisabled}
                autoFocus
              />
            </Grid>

            <Grid>
              <Typography variant="body1" color="textSecondary" my={2}>
                Auto toggle overlay on webpage load
              </Typography>
              <Switch
                color="primary"
                checked={options.hasAutoOverlay}
                onChange={(e) => handleAutoOverlayChange(e.target.checked)}
                disabled={isFieldsDisabled}
              />
            </Grid>

            <Grid>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveButtonClick}
                disabled={isFieldsDisabled}
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
