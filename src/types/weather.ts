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
  date: string; // Added date field
  temperature: number;
  condition: string;
  high?: number; // Added high temperature
  low?: number;  // Added low temperature
}