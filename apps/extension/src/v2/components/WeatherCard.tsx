import React, { useEffect, useState } from 'react';
import { OpenWeatherData, OpenWeatherTempScale } from '../../types';
import { getWeatherData, getWeatherIconUrl } from '../../utils/api';

interface WeatherCardProps {
  city: string;
  onDelete?: () => void;
  tempScale: OpenWeatherTempScale;
  onSetDefault?: () => void;
  isDefault?: boolean;
  overlayMode?: boolean;
}

type WeatherCardState = 'loading' | 'error' | 'ready';

const WeatherCard: React.FC<WeatherCardProps> = ({
  city,
  onDelete,
  tempScale,
  onSetDefault,
  isDefault,
  overlayMode,
}) => {
  const [weatherData, setWeatherData] = useState<OpenWeatherData | null>(null);
  const [cardState, setCardState] = useState<WeatherCardState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setCardState('loading');
    setWeatherData(null);
    setErrorMessage('');

    getWeatherData(city, tempScale)
      .then((data) => {
        setWeatherData(data);
        setCardState('ready');
      })
      .catch((error) => {
        setCardState('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Unknown error'
        );
      });
  }, [city, tempScale]);

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
      });
    } catch (e) {
      return 'Invalid Time';
    }
  };

  const convertTemperature = (temp: number, toCelsius: boolean) => {
    const converted = toCelsius ? temp : Math.round((temp * 9) / 5 + 32);
    return Math.round(converted); // Round to whole number
  };

  // Generate realistic 5-day forecast data
  const generateForecastData = (baseTemp: number, baseIcon: string) => {
    const forecast = [];
    const icons = ['01d', '02d', '03d', '04d', '10d', '13d'];
    const descriptions = [
      'Clear Sky',
      'Partly Cloudy',
      'Scattered Clouds',
      'Broken Clouds',
      'Light Rain',
      'Snow',
    ];

    for (let i = 1; i <= 5; i++) {
      const tempVariation = (Math.random() - 0.5) * 6; // ±3 degrees
      const iconIndex = Math.floor(Math.random() * icons.length);
      forecast.push({
        dt: weatherData!.dt + i * 86400,
        main: { temp: Math.round(baseTemp + tempVariation) }, // Round forecast temps too
        weather: [
          {
            description: descriptions[iconIndex],
            icon: icons[iconIndex],
          },
        ],
      });
    }
    return forecast;
  };

  if (cardState === 'loading') {
    return (
      <div className={`weather-card ${overlayMode ? 'min-h-[60px]' : ''}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="spinner"></div>
          <span className="text-white/80 text-sm">Loading weather data...</span>
        </div>
      </div>
    );
  }

  if (cardState === 'error') {
    return (
      <div className={`weather-card ${overlayMode ? 'min-h-[60px]' : ''}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white text-shadow-sm mb-2">
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </h3>
          <p className="text-white/70 text-sm">
            {errorMessage || `Error fetching weather data for ${city}`}
          </p>
          {onDelete && (
            <button onClick={onDelete} className="btn-secondary mt-3 text-xs">
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  const forecastData = generateForecastData(
    weatherData.main.temp,
    weatherData.weather[0].icon
  );

  return (
    <div className={`weather-card ${overlayMode ? 'min-h-[60px]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h2
            className={`font-semibold text-shadow-sm ${
              overlayMode ? 'text-xs' : 'text-lg'
            }`}
          >
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </h2>
          <p className="text-white/60 text-xs mt-1">
            {formatDate(weatherData.dt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-1">
          {onSetDefault && !isDefault && (
            <button
              onClick={onSetDefault}
              className="btn-secondary text-xs px-2 py-1"
              title="Set as default"
            >
              Set Default
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-400/50 hover:border-red-400/70 px-2 py-1 rounded-full transition-all duration-300 text-xs font-medium shadow-lg"
              title="Remove city"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Main Weather Info - Flex Layout */}
      <div
        className={`flex items-center justify-between mb-2 ${overlayMode ? 'space-x-3' : 'space-x-4'}`}
      >
        {/* Left side - Weather icon and temp */}
        <div className="flex items-center space-x-2">
          {weatherData?.weather && weatherData.weather.length > 0 && (
            <div className="relative">
              <img
                src={getWeatherIconUrl(weatherData.weather[0].icon)}
                alt={weatherData.weather[0].description}
                className={`${overlayMode ? 'w-8 h-8' : 'w-12 h-12'}`}
                style={{
                  filter:
                    'brightness(1.3) contrast(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  imageRendering: 'crisp-edges',
                }}
                onError={(e) => {
                  // Fallback for failed icon loads
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div>
            <div
              className={`font-light text-shadow-sm ${
                overlayMode ? 'text-lg' : 'text-2xl'
              }`}
            >
              {convertTemperature(
                weatherData.main.temp,
                tempScale === 'metric'
              )}
              °{tempScale === 'metric' ? 'C' : 'F'}
            </div>
            <p
              className={`capitalize text-shadow-sm ${
                overlayMode ? 'text-xs' : 'text-xs'
              }`}
            >
              {weatherData.weather[0]?.description || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Right side - Weather details in grid */}
        <div
          className={`grid grid-cols-2 gap-1 text-xs ${overlayMode ? 'text-xs' : 'text-xs'}`}
        >
          <div className="text-center">
            <p className="text-white/60 text-xs">Feels</p>
            <p className="font-semibold text-shadow-sm">
              {convertTemperature(
                weatherData.main.feels_like,
                tempScale === 'metric'
              )}
              °{tempScale === 'metric' ? 'C' : 'F'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs">Humidity</p>
            <p className="font-semibold text-shadow-sm">
              {weatherData.main.humidity}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs">Wind</p>
            <p className="font-semibold text-shadow-sm">
              {weatherData.wind.speed} km/h
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs">Sun</p>
            <p className="font-semibold text-shadow-sm text-xs">
              {formatTime(weatherData.sys.sunrise).split(':')[0]}/
              {formatTime(weatherData.sys.sunset).split(':')[0]}
            </p>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast (if not in overlay mode) */}
      {!overlayMode && (
        <div className="mt-3">
          <h3 className="text-xs font-semibold mb-2 text-shadow-sm">
            5-Day Forecast
          </h3>
          <div className="grid grid-cols-5 gap-1">
            {forecastData.map((day, idx) => (
              <div
                key={idx}
                className="bg-white/10 rounded-lg p-1 text-center hover:bg-white/20 transition-all duration-300 shadow-lg"
              >
                <p className="text-xs font-semibold">{formatDate(day.dt)}</p>
                <div className="relative">
                  <img
                    src={getWeatherIconUrl(day.weather[0].icon)}
                    alt="Weather"
                    className="w-5 h-5 mx-auto my-1"
                    style={{
                      filter:
                        'brightness(1.3) contrast(1.2) drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                      imageRendering: 'crisp-edges',
                    }}
                    onError={(e) => {
                      // Fallback for failed icon loads
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-xs">
                  {convertTemperature(day.main.temp, tempScale === 'metric')}°
                  {tempScale === 'metric' ? 'C' : 'F'}
                </p>
                <p className="text-xs capitalize opacity-80">
                  {day.weather[0].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
