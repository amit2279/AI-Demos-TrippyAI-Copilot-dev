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
    
    const cacheKey = `weather_${validLocation.toLowerCase()}`;
    const cached = cache.get<WeatherData>(cacheKey);
    if (cached) return cached;

    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherData(validLocation),
      fetchForecastData(validLocation)
    ]);

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group forecast data by day to get high/low temps
    const dailyForecasts = new Map<string, {
      temps: number[];
      condition: string;
      date: Date;
    }>();

    // Process all forecast data points
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      date.setHours(0, 0, 0, 0); // Normalize to midnight
      const dateKey = date.toISOString().split('T')[0];
      
      // Skip if it's before today
      if (date < today) return;
      
      if (!dailyForecasts.has(dateKey)) {
        dailyForecasts.set(dateKey, {
          temps: [],
          condition: mapCondition(item.weather[0].id),
          date
        });
      }
      
      const day = dailyForecasts.get(dateKey)!;
      day.temps.push(item.main.temp);
    });

    // Convert to array and ensure we have 7 days
    const forecast: ForecastData[] = [];
    let currentDate = new Date(today);

    // Generate 7 days of forecast
    for (let i = 0; i < 7; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayData = dailyForecasts.get(dateKey);

      if (dayData) {
        forecast.push({
          time: currentDate.toLocaleString('default', { weekday: 'short' }),
          date: currentDate.toISOString(),
          temperature: Math.round(dayData.temps.reduce((a, b) => a + b) / dayData.temps.length),
          high: Math.round(Math.max(...dayData.temps)),
          low: Math.round(Math.min(...dayData.temps)),
          condition: dayData.condition
        });
      } else {
        // If no data for this day, use last known values or defaults
        const lastKnown = forecast[forecast.length - 1];
        forecast.push({
          time: currentDate.toLocaleString('default', { weekday: 'short' }),
          date: currentDate.toISOString(),
          temperature: lastKnown ? lastKnown.temperature : Math.round(weatherData.main.temp),
          high: lastKnown ? lastKnown.high : Math.round(weatherData.main.temp + 2),
          low: lastKnown ? lastKnown.low : Math.round(weatherData.main.temp - 2),
          condition: lastKnown ? lastKnown.condition : mapCondition(weatherData.weather[0].id)
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const result = {
      location: weatherData.name,
      date: new Date().toLocaleString('default', { weekday: 'long', month: 'short', day: 'numeric' }),
      temperature: Math.round(weatherData.main.temp),
      condition: mapCondition(weatherData.weather[0].id),
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed),
      precipitation: weatherData.rain ? Math.round(weatherData.rain['1h'] * 100) : 0,
      forecast
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}