export interface WeatherResponse {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  rain?: {
    '1h': number;
  };
}

export interface ForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
    }>;
    wind: {
      speed: number;
    };
  }>;
}

export interface GeocodingResponse {
  lat: number;
  lon: number;
  name: string;
}