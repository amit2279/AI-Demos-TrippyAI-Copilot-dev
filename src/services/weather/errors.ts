export class WeatherApiError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

export class GeocodingError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'GeocodingError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}