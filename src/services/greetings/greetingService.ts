import { WeatherData } from '../../types/weather';

interface GreetingConfig {
  timeOfDay: string;
  weather: string;
  temperature: number;
}

function getTemperatureContext(temp: number): string {
  if (temp <= -10) return "Brrr! It's freezing cold at";
  if (temp <= 0) return "Bundle up! It's a chilly";
  if (temp <= 10) return "It's quite cool at";
  if (temp <= 20) return "The temperature is mild at";
  if (temp <= 25) return "It's pleasantly warm at";
  if (temp <= 30) return "It's quite warm at";
  return "It's hot at";
}

function getWeatherContext(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'with clear skies';
    case 'partly-cloudy':
      return 'with scattered clouds';
    case 'cloudy':
      return 'under cloudy skies';
    case 'overcast':
      return 'with overcast skies';
    case 'light-rain':
      return 'with light rain';
    case 'rain':
      return 'with rainfall';
    case 'heavy-rain':
      return 'with heavy rain';
    case 'snow':
      return 'with snowfall';
    case 'thunderstorm':
      return 'with thunderstorms';
    case 'fog':
    case 'mist':
      return 'with foggy conditions';
    default:
      return '';
  }
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function generateWelcomeMessage(city: string, country: string, temp: number, condition: string): string {
  const timeOfDay = getTimeOfDay();
  const tempContext = getTemperatureContext(temp);
  const weatherContext = getWeatherContext(condition);
  
  const timeGreeting = {
    morning: 'Good morning!',
    afternoon: 'Good afternoon!',
    evening: 'Good evening!'
  }[timeOfDay];

  return `${timeGreeting} ${tempContext} ${temp}°C in ${city}, ${country} ${weatherContext}. Where would you like to explore?`;
}