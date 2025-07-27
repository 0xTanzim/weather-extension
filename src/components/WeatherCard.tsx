import { Box, Button, CardActions, Grid, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, { useEffect } from 'react';
import { OpenWeatherData, OpenWeatherTempScale } from '../types';
import { getWeatherData, getWeatherIconUrl } from '../utils/api';
import './weatherCard.css';

const WeatherCardContainer: React.FC<{
  children: React.ReactNode;
  onDelete?: () => void;
}> = ({ children, onDelete }) => {
  return (
    <Box mx={'4px'} my={'14px'}>
      <Card>
        <CardContent>{children}</CardContent>
        <CardActions>
          {onDelete && (
            <Button onClick={onDelete} color="secondary">
              <Typography
                variant="body2"
                color="error"
                className="weatherCard-body"
              >
                Delete
              </Typography>
            </Button>
          )}
        </CardActions>
      </Card>
    </Box>
  );
};

type WeatherCardState = 'loading' | 'error' | 'ready';

const WeatherCard = ({
  city,
  onDelete,
  tempScale,
}: {
  city: string;
  onDelete?: () => void;
  tempScale: OpenWeatherTempScale;
}) => {
  const [weatherData, setWeatherData] = React.useState<OpenWeatherData | null>(
    null
  );

  const [cardState, setCardState] = React.useState<WeatherCardState>('loading');

  useEffect(() => {
    setCardState('loading');
    setWeatherData(null);

    getWeatherData(city, tempScale)
      .then((data) => {
        setWeatherData(data);
        setCardState('ready');
      })
      .catch((error) => {
        setCardState('error');
      })
      .finally(() => {
        // Optionally handle any final state updates
      });
  }, [city, tempScale]);

  if (cardState === 'loading' || cardState === 'error') {
    return (
      <WeatherCardContainer onDelete={onDelete}>
        <Typography className="weatherCard-title">{city}</Typography>

        <Typography className="weatherCard-body">
          {cardState === 'loading'
            ? 'Loading...'
            : `Error fetching weather data for ${city}`}
        </Typography>
      </WeatherCardContainer>
    );
  }

  return (
    <div>
      <WeatherCardContainer onDelete={onDelete}>
        {weatherData && (
          <Grid container justifyContent={'space-around'}>
            <Grid>
              <Typography className="weatherCard-title">
                Weather in {city}
              </Typography>

              <Typography>
                Temperature: {Math.round(weatherData.main.temp)}°
                {tempScale === 'metric' ? 'C' : 'F'}
              </Typography>

              <Typography className="weatherCard-body">
                Feels like: {Math.round(weatherData.main.feels_like)}°
                {tempScale === 'metric' ? 'C' : 'F'}
              </Typography>
            </Grid>

            <Grid>
              {weatherData?.weather && weatherData.weather.length > 0 && (
                <>
                  <img
                    src={getWeatherIconUrl(weatherData.weather[0].icon)}
                    alt={weatherData.weather[0].description}
                  />
                  <Typography className="weatherCard-body">
                    Condition: {weatherData.weather[0].description}
                  </Typography>
                  <Typography className="weatherCard-body">
                    Humidity: {weatherData.main.humidity}%
                  </Typography>
                </>
              )}
            </Grid>
          </Grid>
        )}
      </WeatherCardContainer>
    </div>
  );
};

export default WeatherCard;
