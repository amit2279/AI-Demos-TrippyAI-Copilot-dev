export interface WeatherData {
  location: string;
  date: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  forecast: ForecastData[];
}

export interface ForecastData {
  time: string;
  temperature: number;
  condition: string;
}


export interface WeatherForecast {
  day: string;
  temperature: number;
  condition: 'rain' | 'cloudy' | 'sunny' | 'partly-cloudy';
}

export interface WeatherInfo {
  currentTemperature: number;
  currentCondition: string;
  location: string;
  forecast: WeatherForecast[];
}

