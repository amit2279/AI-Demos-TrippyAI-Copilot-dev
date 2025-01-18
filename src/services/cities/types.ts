export interface City {
  name: string;
  country: string;
  position: {
    lat: number;
    lng: number;
  };
  description: string;
}