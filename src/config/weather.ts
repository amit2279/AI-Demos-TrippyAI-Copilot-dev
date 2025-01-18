export const WEATHER_CONFIG = {
  API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY,
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  GEO_URL: 'https://api.openweathermap.org/geo/1.0',
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
  DEFAULT_UNITS: 'metric',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Log configuration status (but not the key itself)
if (!WEATHER_CONFIG.API_KEY) {
  console.warn(
    'OpenWeather API key is missing! Add VITE_OPENWEATHER_API_KEY to your .env file.\n' +
    'Get an API key from: https://openweathermap.org/api'
  );
} else {
  console.log('OpenWeather API key is configured');
}