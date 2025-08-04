import React, { useEffect, useState } from 'react';
import { OpenWeatherData, OpenWeatherTempScale } from '../../types';
import {
  getForecastData,
  getWeatherData,
  getWeatherIconUrl,
} from '../../utils/api';

interface WeatherCardProps {
  city: string;
  onDelete?: () => void;
  tempScale: OpenWeatherTempScale;
  onSetDefault?: () => void;
  isDefault?: boolean;
  overlayMode?: boolean;
  theme?: 'dark' | 'light';
}

type WeatherCardState = 'loading' | 'error' | 'ready';

const WeatherCard: React.FC<WeatherCardProps> = ({
  city,
  onDelete,
  tempScale,
  onSetDefault,
  isDefault,
  overlayMode,
  theme = 'dark',
}) => {
  const [weatherData, setWeatherData] = useState<OpenWeatherData | null>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [cardState, setCardState] = useState<WeatherCardState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setCardState('loading');
    setWeatherData(null);
    setForecastData(null);
    setErrorMessage('');

    // Fetch both current weather and forecast data
    const fetchData = async () => {
      try {
        const [weather, forecast] = await Promise.all([
          getWeatherData(city, tempScale),
          getForecastData(city, tempScale),
        ]);

        setWeatherData(weather);
        setForecastData(forecast);
        setCardState('ready');
      } catch (error) {
        setCardState('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    };

    fetchData();
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

  const convertTemperature = (
    temp: number,
    tempScale: OpenWeatherTempScale
  ) => {
    // The API already provides temperatures in the correct scale, so we just round them
    return Math.round(temp);
  };

  const getTempUnit = (tempScale: OpenWeatherTempScale) => {
    switch (tempScale) {
      case 'metric':
        return 'C';
      case 'imperial':
        return 'F';
      case 'standard':
        return 'K';
      default:
        return 'C';
    }
  };

  // Theme-based text colors
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-gray-600';
  const textSecondary = theme === 'dark' ? 'text-white/70' : 'text-gray-700';

  if (cardState === 'loading') {
    return (
      <div className={`weather-card ${overlayMode ? 'min-h-[80px]' : ''}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="spinner"></div>
          <span className={`${textSecondary} text-sm`}>
            Loading weather data...
          </span>
        </div>
      </div>
    );
  }

  if (cardState === 'error') {
    return (
      <div className={`weather-card ${overlayMode ? 'min-h-[80px]' : ''}`}>
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </h3>
          <p className={`${textSecondary} text-sm`}>
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

  return (
    <div className={`weather-card ${overlayMode ? 'min-h-[80px]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h2
            className={`font-semibold ${
              overlayMode ? 'text-sm' : 'text-lg'
            } ${textColor}`}
          >
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </h2>
          <p className={`${textMuted} text-xs mt-1`}>
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
        className={`flex items-center justify-between mb-3 ${overlayMode ? 'space-x-4' : 'space-x-4'}`}
      >
        {/* Left side - Weather icon and temp */}
        <div className="flex items-center space-x-3">
          {weatherData?.weather && weatherData.weather.length > 0 && (
            <div className="relative">
              <img
                src={getWeatherIconUrl(weatherData.weather[0].icon)}
                alt={weatherData.weather[0].description}
                className={`${overlayMode ? 'w-10 h-10' : 'w-12 h-12'}`}
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
              className={`font-light ${
                overlayMode ? 'text-xl' : 'text-2xl'
              } ${textColor}`}
            >
              {convertTemperature(weatherData.main.temp, tempScale)}°
              {getTempUnit(tempScale)}
            </div>
            <p
              className={`capitalize ${textMuted} ${
                overlayMode ? 'text-xs' : 'text-xs'
              }`}
            >
              {weatherData.weather[0]?.description || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Right side - Weather details in grid */}
        <div
          className={`grid grid-cols-2 gap-2 text-xs ${overlayMode ? 'text-xs' : 'text-xs'}`}
        >
          <div className="text-center">
            <p className={`${textMuted} text-xs`}>Feels</p>
            <p className={`font-semibold ${textColor}`}>
              {convertTemperature(weatherData.main.feels_like, tempScale)}°
              {getTempUnit(tempScale)}
            </p>
          </div>
          <div className="text-center">
            <p className={`${textMuted} text-xs`}>Humidity</p>
            <p className={`font-semibold ${textColor}`}>
              {weatherData.main.humidity}%
            </p>
          </div>
          <div className="text-center">
            <p className={`${textMuted} text-xs`}>Wind</p>
            <p className={`font-semibold ${textColor}`}>
              {weatherData.wind?.speed || 'N/A'} km/h
            </p>
          </div>
          <div className="text-center">
            <p className={`${textMuted} text-xs`}>Sun</p>
            <p className={`font-semibold ${textColor} text-xs`}>
              {weatherData.sys?.sunrise
                ? formatTime(weatherData.sys.sunrise).split(':')[0]
                : 'N/A'}
              /
              {weatherData.sys?.sunset
                ? formatTime(weatherData.sys.sunset).split(':')[0]
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast (if not in overlay mode) */}
      {!overlayMode && forecastData && (
        <div className="mt-4">
          <h3 className={`text-xs font-semibold mb-2 ${textColor}`}>
            5-Day Forecast
          </h3>
          <div className="grid grid-cols-5 gap-1">
            {forecastData.list.slice(0, 5).map((day: any, idx: number) => (
              <div
                key={idx}
                className={`${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100/80'} rounded-lg p-1 text-center hover:${theme === 'dark' ? 'bg-white/20' : 'bg-gray-200/80'} transition-all duration-300 shadow-lg`}
              >
                <p className={`text-xs font-semibold ${textColor}`}>
                  {formatDate(day.dt)}
                </p>
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
                <p className={`text-xs ${textColor}`}>
                  {convertTemperature(day.main.temp, tempScale)}°
                  {getTempUnit(tempScale)}
                </p>
                <p className={`text-xs capitalize ${textMuted}`}>
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
