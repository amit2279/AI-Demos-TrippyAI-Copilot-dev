import { WeatherData, ForecastData } from '../../types/weather';
import { fetchWeatherData, fetchForecastData } from './api';
import { mapCondition, formatDate } from './utils';
import { validateApiKey, validateLocation } from './validation';
import { WeatherCache } from './cache';

const cache = WeatherCache.getInstance();

export async function getDefaultWeather(location: string): Promise<WeatherData> {
  try {
    validateApiKey();
    const validLocation = validateLocation(location);
    
    // Check cache first
    const cacheKey = `weather_${validLocation.toLowerCase()}`;
    const cached = cache.get<WeatherData>(cacheKey);
    if (cached) return cached;

    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherData(validLocation),
      fetchForecastData(validLocation)
    ]);

    const forecast: ForecastData[] = forecastData.list
      .filter((_, index) => index % 8 === 0) // Get one forecast per day
      .slice(0, 5)
      .map(item => ({
        time: formatDate(new Date(item.dt * 1000), 'short'),
        temperature: Math.round(item.main.temp),
        condition: mapCondition(item.weather[0].id)
      }));

    const result = {
      location: weatherData.name,
      date: formatDate(new Date()),
      temperature: Math.round(weatherData.main.temp),
      condition: mapCondition(weatherData.weather[0].id),
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed),
      precipitation: weatherData.rain ? Math.round(weatherData.rain['1h'] * 100) : 0,
      forecast
    };

    // Cache the result
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}