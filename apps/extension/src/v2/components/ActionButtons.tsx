import React from 'react';
import { OpenWeatherTempScale } from '../../types';

interface ActionButtonsProps {
  tempScale: OpenWeatherTempScale;
  onToggleTempScale: () => void;
  onToggleOverlay: () => void;
  onAutoLocation: () => void;
  onRefresh: () => void;
  isLocating: boolean;
  isRefreshing: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  tempScale,
  onToggleTempScale,
  onToggleOverlay,
  onAutoLocation,
  onRefresh,
  isLocating,
  isRefreshing,
}) => {
  const getTempScaleLabel = (scale: OpenWeatherTempScale) => {
    switch (scale) {
      case 'metric':
        return '°C / °F';
      case 'imperial':
        return '°F / °C';
      case 'standard':
        return '°K / °C';
      default:
        return '°C / °F';
    }
  };

  const actions = [
    {
      onClick: onToggleTempScale,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: `Toggle ${tempScale === 'metric' ? 'Fahrenheit' : 'Celsius'}`,
      label: getTempScaleLabel(tempScale),
      loading: false,
    },
    {
      onClick: onToggleOverlay,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      ),
      title: 'Toggle overlay',
      label: 'Overlay',
      loading: false,
    },
    {
      onClick: onAutoLocation,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      title: 'Auto-detect location',
      label: 'Location',
      loading: isLocating,
    },
    {
      onClick: onRefresh,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      title: 'Refresh weather data',
      label: 'Refresh',
      loading: isRefreshing,
    },
  ];

  return (
    <div className="flex justify-center space-x-3 mb-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.loading}
          className="glassmorphism p-3 rounded-xl transition-all duration-300 flex flex-col items-center space-y-2 hover:scale-105 hover:bg-white/20"
          title={action.title}
        >
          <div className="flex items-center justify-center">
            {action.loading ? (
              <div className="spinner w-4 h-4"></div>
            ) : (
              action.icon
            )}
          </div>
          <span className="text-xs font-medium text-white/90">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
