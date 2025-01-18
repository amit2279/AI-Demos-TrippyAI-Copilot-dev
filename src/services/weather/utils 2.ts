export function mapCondition(weatherId: number): string {
  // Map OpenWeather condition codes to our internal conditions
  // See: https://openweathermap.org/weather-conditions
  
  // Group 2xx: Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return 'thunderstorm';
  }
  
  // Group 3xx: Drizzle
  if (weatherId >= 300 && weatherId < 400) {
    return 'light-rain';
  }
  
  // Group 5xx: Rain
  if (weatherId >= 500 && weatherId < 600) {
    if (weatherId === 500) return 'light-rain';
    if (weatherId === 501) return 'rain';
    return 'heavy-rain';
  }
  
  // Group 6xx: Snow
  if (weatherId >= 600 && weatherId < 700) {
    if (weatherId === 611 || weatherId === 612 || weatherId === 613) {
      return 'sleet';
    }
    return 'snow';
  }
  
  // Group 7xx: Atmosphere
  if (weatherId >= 700 && weatherId < 800) {
    if (weatherId === 741) return 'fog';
    return 'mist';
  }
  
  // Group 800: Clear
  if (weatherId === 800) {
    return 'clear';
  }
  
  // Group 80x: Clouds
  if (weatherId === 801) return 'partly-cloudy';
  if (weatherId === 802) return 'cloudy';
  if (weatherId >= 803) return 'overcast';
  
  return 'clear'; // Default fallback
}

export function formatDate(date: Date, style: 'full' | 'short' = 'full'): string {
  if (style === 'short') {
    return date.toLocaleDateString('en-US', {
      weekday: 'short'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}