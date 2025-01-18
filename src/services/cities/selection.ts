import { City } from './types';
import { CITIES } from './data';

// Use local storage to avoid showing the same city twice in a row
const LAST_CITY_KEY = 'last_shown_city';

export function getRandomCity(): City {
  const lastCityName = localStorage.getItem(LAST_CITY_KEY);
  const availableCities = lastCityName 
    ? CITIES.filter(city => city.name !== lastCityName)
    : CITIES;
    
  const randomIndex = Math.floor(Math.random() * availableCities.length);
  const selectedCity = availableCities[randomIndex];
  
  localStorage.setItem(LAST_CITY_KEY, selectedCity.name);
  return selectedCity;
}