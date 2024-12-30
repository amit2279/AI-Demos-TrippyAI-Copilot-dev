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
