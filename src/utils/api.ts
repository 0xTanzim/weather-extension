import { OpenWeatherData, OpenWeatherTempScale } from '../types';

export const getWeatherData = async (
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<OpenWeatherData> => {
  const apiKey = process.env.OPEN_WEATHER_API_KEY;
  console.log('Open Weather API Key:', apiKey);

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${tempScale}&appid=${apiKey}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  return response.json();
};

export const fetchWeatherData = async (
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<OpenWeatherData> => {
  return getWeatherData(city, tempScale);
};


export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
