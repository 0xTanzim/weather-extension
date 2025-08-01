import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getForecastData, getWeatherData } from '../../utils/api';
import WeatherCard from '../../v2/components/WeatherCard';

// Mock the API functions
vi.mock('../../utils/api', () => ({
  getWeatherData: vi.fn(),
  getForecastData: vi.fn(),
  getWeatherIconUrl: vi.fn(
    () => 'https://openweathermap.org/img/wn/01d@2x.png'
  ),
}));

const mockWeatherData = {
  name: 'Dhaka',
  main: {
    temp: 30,
    feels_like: 32,
    humidity: 70,
    pressure: 1013,
  },
  weather: [
    {
      id: 800,
      main: 'Clear',
      description: 'clear sky',
      icon: '01d',
    },
  ],
  wind: {
    speed: 5.2,
    deg: 180,
  },
  sys: {
    sunrise: 1640995200,
    sunset: 1641038400,
  },
  dt: 1640995200,
};

const mockForecastData = {
  city: { name: 'Dhaka' },
  list: [
    {
      dt: 1640995200,
      main: { temp: 30 },
      weather: [{ description: 'clear sky', icon: '01d' }],
    },
    {
      dt: 1641081600,
      main: { temp: 28 },
      weather: [{ description: 'cloudy', icon: '02d' }],
    },
    {
      dt: 1641168000,
      main: { temp: 29 },
      weather: [{ description: 'rain', icon: '10d' }],
    },
    {
      dt: 1641254400,
      main: { temp: 27 },
      weather: [{ description: 'snow', icon: '13d' }],
    },
    {
      dt: 1641340800,
      main: { temp: 31 },
      weather: [{ description: 'haze', icon: '50d' }],
    },
  ],
};

describe('WeatherCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (getWeatherData as any).mockResolvedValue(mockWeatherData);
    (getForecastData as any).mockResolvedValue(mockForecastData);

    render(<WeatherCard city="Dhaka" tempScale="metric" />);

    expect(screen.getByText('Loading weather data...')).toBeInTheDocument();
  });

  it('renders weather data when API calls succeed', async () => {
    (getWeatherData as any).mockResolvedValue(mockWeatherData);
    (getForecastData as any).mockResolvedValue(mockForecastData);

    render(<WeatherCard city="Dhaka" tempScale="metric" />);

    await waitFor(() => {
      expect(screen.getByText('Dhaka')).toBeInTheDocument();
      // Use getAllByText to handle multiple instances of the same temperature
      const tempElements = screen.getAllByText('30°C');
      expect(tempElements.length).toBeGreaterThan(0);
      const feelsElements = screen.getAllByText('32°C');
      expect(feelsElements.length).toBeGreaterThan(0);

      // Use getAllByText for description since it appears in multiple places
      const descElements = screen.getAllByText('clear sky');
      expect(descElements.length).toBeGreaterThan(0);

      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('5.2 km/h')).toBeInTheDocument(); // Wind speed with units
    });
  });

  it('renders error state when API calls fail', async () => {
    (getWeatherData as any).mockRejectedValue(new Error('API Error'));
    (getForecastData as any).mockRejectedValue(new Error('API Error'));

    render(<WeatherCard city="InvalidCity" tempScale="metric" />);

    await waitFor(() => {
      expect(screen.getByText('InvalidCity')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('displays temperature in Fahrenheit when tempScale is imperial', async () => {
    const imperialWeatherData = {
      ...mockWeatherData,
      main: {
        ...mockWeatherData.main,
        temp: 86, // 30°C converted to Fahrenheit
        feels_like: 90, // 32°C converted to Fahrenheit
      },
    };

    const imperialForecastData = {
      ...mockForecastData,
      list: mockForecastData.list.map((day: any) => ({
        ...day,
        main: {
          ...day.main,
          temp: Math.round((day.main.temp * 9) / 5 + 32), // Convert Celsius to Fahrenheit
        },
      })),
    };

    (getWeatherData as any).mockResolvedValue(imperialWeatherData);
    (getForecastData as any).mockResolvedValue(imperialForecastData);

    render(<WeatherCard city="Dhaka" tempScale="imperial" />);

    await waitFor(() => {
      // Use getAllByText to handle multiple instances of the same temperature
      const tempElements = screen.getAllByText('86°F');
      expect(tempElements.length).toBeGreaterThan(0);
      const feelsElements = screen.getAllByText('90°F');
      expect(feelsElements.length).toBeGreaterThan(0);
    });
  });

  it('displays temperature in Kelvin scale', async () => {
    const kelvinWeatherData = {
      ...mockWeatherData,
      main: {
        ...mockWeatherData.main,
        temp: 303, // 30°C converted to Kelvin
        feels_like: 305, // 32°C converted to Kelvin
      },
    };

    const kelvinForecastData = {
      ...mockForecastData,
      list: mockForecastData.list.map((day: any) => ({
        ...day,
        main: {
          ...day.main,
          temp: day.main.temp + 273, // Convert Celsius to Kelvin
        },
      })),
    };

    (getWeatherData as any).mockResolvedValue(kelvinWeatherData);
    (getForecastData as any).mockResolvedValue(kelvinForecastData);

    render(<WeatherCard city="Dhaka" tempScale="standard" />);

    await waitFor(() => {
      // Use getAllByText to handle multiple instances of the same temperature
      const tempElements = screen.getAllByText('303°K');
      expect(tempElements.length).toBeGreaterThan(0);
      const feelsElements = screen.getAllByText('305°K');
      expect(feelsElements.length).toBeGreaterThan(0);
    });
  });

  it('renders 5-day forecast data', async () => {
    (getWeatherData as any).mockResolvedValue(mockWeatherData);
    (getForecastData as any).mockResolvedValue(mockForecastData);

    render(<WeatherCard city="Dhaka" tempScale="metric" />);

    await waitFor(() => {
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
      // Use getAllByText for description since it appears in multiple places
      const descElements = screen.getAllByText('clear sky');
      expect(descElements.length).toBeGreaterThan(0);

      // Check forecast temperatures
      const forecastTemps = screen.getAllByText('30°C');
      expect(forecastTemps.length).toBeGreaterThan(0);

      // Check other forecast descriptions
      expect(screen.getByText('cloudy')).toBeInTheDocument();
      expect(screen.getByText('rain')).toBeInTheDocument();
      expect(screen.getByText('snow')).toBeInTheDocument();
      expect(screen.getByText('haze')).toBeInTheDocument();
    });
  });

  it('renders compact layout in overlay mode', async () => {
    (getWeatherData as any).mockResolvedValue(mockWeatherData);
    (getForecastData as any).mockResolvedValue(mockForecastData);

    render(<WeatherCard city="Dhaka" tempScale="metric" overlayMode={true} />);

    await waitFor(() => {
      expect(screen.getByText('Dhaka')).toBeInTheDocument();
      expect(screen.getByText('30°C')).toBeInTheDocument();
      expect(screen.getByText('clear sky')).toBeInTheDocument();
      expect(screen.getByText('32°C')).toBeInTheDocument(); // Feels like
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('5.2 km/h')).toBeInTheDocument(); // Wind speed with units
    });
  });

  it('handles missing weather data gracefully', async () => {
    const weatherDataWithMissingFields = {
      ...mockWeatherData,
      wind: undefined,
      sys: undefined,
    };

    (getWeatherData as any).mockResolvedValue(weatherDataWithMissingFields);
    (getForecastData as any).mockResolvedValue(mockForecastData);

    render(<WeatherCard city="Dhaka" tempScale="metric" />);

    await waitFor(() => {
      expect(screen.getByText('Dhaka')).toBeInTheDocument();
      // Use getAllByText to handle multiple instances of the same temperature
      const tempElements = screen.getAllByText('30°C');
      expect(tempElements.length).toBeGreaterThan(0);
      const feelsElements = screen.getAllByText('32°C');
      expect(feelsElements.length).toBeGreaterThan(0);

      // Use getAllByText for description since it appears in multiple places
      const descElements = screen.getAllByText('clear sky');
      expect(descElements.length).toBeGreaterThan(0);

      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('N/A km/h')).toBeInTheDocument(); // Missing wind data
      expect(screen.getByText('N/A/N/A')).toBeInTheDocument(); // Missing sunrise/sunset
    });
  });

  it('handles empty forecast data', async () => {
    const emptyForecastData = {
      city: { name: 'Dhaka' },
      list: [],
    };

    (getWeatherData as any).mockResolvedValue(mockWeatherData);
    (getForecastData as any).mockResolvedValue(emptyForecastData);

    render(<WeatherCard city="Dhaka" tempScale="metric" />);

    await waitFor(() => {
      expect(screen.getByText('Dhaka')).toBeInTheDocument();
      expect(screen.getByText('30°C')).toBeInTheDocument();
      // Should still show forecast section even with empty data
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
    });
  });

  it('rounds temperature values correctly', async () => {
    const weatherDataWithDecimals = {
      ...mockWeatherData,
      main: {
        ...mockWeatherData.main,
        temp: 30.99,
        feels_like: 32.33,
      },
    };

    (getWeatherData as any).mockResolvedValue(weatherDataWithDecimals);
    (getForecastData as any).mockResolvedValue(mockForecastData);

    render(<WeatherCard city="Dhaka" tempScale="metric" />);

    await waitFor(() => {
      // Use getAllByText to handle multiple instances of the same temperature
      const tempElements = screen.getAllByText('31°C');
      expect(tempElements.length).toBeGreaterThan(0);
      const feelsElements = screen.getAllByText('32°C');
      expect(feelsElements.length).toBeGreaterThan(0);
    });
  });
});
