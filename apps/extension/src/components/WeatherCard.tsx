import { Box, Button, CardActions, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, { useEffect } from 'react';
import { OpenWeatherData, OpenWeatherTempScale } from '../types';
import { getWeatherData, getWeatherIconUrl } from '../utils/api';
import './weatherCard.css';
import { Stack } from '@mui/material';

const WeatherCardContainer: React.FC<{
  children: React.ReactNode;
  onDelete?: () => void;
  onSetDefault?: () => void;
  isDefault?: boolean;
  overlayMode?: boolean;
}> = ({ children, onDelete, onSetDefault, isDefault, overlayMode }) => {
  const containerClass = `weatherCard-container ${overlayMode ? 'overlay' : ''} ${isDefault ? 'weatherCard-default' : ''}`;
  
  return (
    <Box className={containerClass}>
      <Card elevation={0} sx={{ boxShadow: 'none', background: 'transparent' }}>
        <CardContent sx={{ p: 0 }}>{children}</CardContent>
        <CardActions className="weatherCard-actions">
          {onSetDefault && !isDefault && (
            <Button 
              onClick={onSetDefault} 
              color="primary" 
              size="small" 
              variant="outlined" 
              className="weatherCard-button"
              sx={{ mr: 1 }}
            >
              Set as Default
            </Button>
          )}
          {onDelete && (
            <Button 
              onClick={onDelete} 
              color="error" 
              size="small"
              className="weatherCard-button"
            >
              Delete
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
  onSetDefault,
  isDefault,
  overlayMode,
}: {
  city: string;
  onDelete?: () => void;
  tempScale: OpenWeatherTempScale;
  onSetDefault?: () => void;
  isDefault?: boolean;
  overlayMode?: boolean;
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
      });
  }, [city, tempScale]);

  if (cardState === 'loading') {
    return (
      <WeatherCardContainer overlayMode={overlayMode}>
        <Box className="weatherCard-loading">
          <img 
            src={getWeatherIconUrl('10d')} 
            alt="Loading" 
            className="weatherCard-loading-icon"
          />
          <Typography className="weatherCard-body" mt={2}>Loading...</Typography>
        </Box>
      </WeatherCardContainer>
    );
  }
  
  if (cardState === 'error') {
    return (
      <WeatherCardContainer overlayMode={overlayMode} onDelete={onDelete}>
        <Box className="weatherCard-error">
          <Typography className="weatherCard-title">{city}</Typography>
          <Typography className="weatherCard-body">
            Error fetching weather data for {city}
          </Typography>
        </Box>
      </WeatherCardContainer>
    );
  }
  
  return (
    <WeatherCardContainer 
      onDelete={onDelete} 
      onSetDefault={onSetDefault} 
      isDefault={isDefault} 
      overlayMode={overlayMode}
    >
      {weatherData && (
        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: overlayMode ? '100px' : 'auto' }}>
          <Box flex={1} minWidth={0} pr={2}>
            <Typography 
              className="weatherCard-title" 
              sx={{ fontSize: overlayMode ? 16 : 20 }} 
              noWrap
            >
              {city.charAt(0).toUpperCase() + city.slice(1)}
            </Typography>
            <Stack spacing={1}>
              <Typography 
                className="weatherCard-temperature"
                sx={{ fontSize: overlayMode ? 20 : 24 }}
              >
                {Math.round(weatherData.main.temp)}°{tempScale === 'metric' ? 'C' : 'F'}
              </Typography>
              <Typography className="weatherCard-feels-like" sx={{ fontSize: overlayMode ? 12 : 14 }}>
                Feels like: {Math.round(weatherData.main.feels_like)}°{tempScale === 'metric' ? 'C' : 'F'}
              </Typography>
            </Stack>
          </Box>
          <Box textAlign="center" sx={{ minWidth: overlayMode ? '60px' : 'auto' }}>
            {weatherData?.weather && weatherData.weather.length > 0 && (
              <>
                <img
                  src={getWeatherIconUrl(weatherData.weather[0].icon)}
                  alt={weatherData.weather[0].description}
                  className={`weatherCard-icon ${overlayMode ? 'overlay' : ''}`}
                />
                <Typography className="weatherCard-body" sx={{ fontSize: overlayMode ? 11 : 13 }}>
                  {weatherData.weather[0].description}
                </Typography>
                <Typography className="weatherCard-body" sx={{ fontSize: overlayMode ? 11 : 13 }}>
                  Humidity: {weatherData.main.humidity}%
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}
    </WeatherCardContainer>
  );
};

export default WeatherCard;
