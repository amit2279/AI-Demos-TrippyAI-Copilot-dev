import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';
//import { Loader } from '@googlemaps/js-api-loader';


// Define types for Google Places predictions
interface GooglePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LocationSearch({ value, onChange, placeholder = 'Where to?' }: LocationSearchProps) {
  const [predictions, setPredictions] = useState<GooglePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  //const loader = new Loader(GOOGLE_MAPS_CONFIG);


  // Initialize Google Places API
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    } else {

    // Add this check before loading the script
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
      };
      document.head.appendChild(script);
    }
      // Load Google Maps API if not already loaded
      //const script = document.createElement('script');
      //const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
      //script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      //const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
      //script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      //script.async = true;
      //script.defer = true;
      
    }

    return () => {
      // Cleanup if needed
      sessionToken.current = null;
    };
  }, []);

  // Keep input in sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const getPlacePredictions = (input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    const request = {
      input,
      sessionToken: sessionToken.current,
      //types: ['(cities)', '(regions)', 'country', 'locality', 'natural_feature', 'point_of_interest'],
      types: ['(regions)'], // restrict to cities
      language: 'en', // language setting
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (results, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setIsOpen(true);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    );
  };

  // Debounce function to limit API calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Create debounced version of getPlacePredictions
  const debouncedGetPredictions = useRef(
    debounce((input: string) => getPlacePredictions(input), 300)
  ).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.length >= 2) {
      debouncedGetPredictions(newValue);
    } else {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  const handlePredictionSelect = (prediction: GooglePrediction) => {
    setInputValue(prediction.description);
    onChange(prediction.description);
    setIsOpen(false);
    setPredictions([]);
    
    // Create a new session token after a selection is made
    if (window.google && window.google.maps && window.google.maps.places) {
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && predictions.length > 0) {
      e.preventDefault();
      handlePredictionSelect(predictions[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        dropdownRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(inputValue);
  }

  return (
    <form onSubmit={handleFormSubmit} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && debouncedGetPredictions(inputValue)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="off"
        />
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>

      {/* Predictions dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="inline-block h-4 w-4 border-2 border-t-transparent border-gray-300 rounded-full animate-spin mr-2"></div>
              Loading suggestions...
            </div>
          ) : predictions.length > 0 ? (
            <ul className="py-1 divide-y divide-gray-100">
              {predictions.map((prediction) => (
                <li
                  key={prediction.place_id}
                  onClick={() => handlePredictionSelect(prediction)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-gray-900">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-500">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : inputValue.length >= 2 ? (
            <div className="px-4 py-3 text-center text-gray-500">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </form>
  );
}

/* 

const request = {
  input,
  sessionToken: sessionToken.current,
  types: ['(cities)', '(regions)', 'country', 'locality', 'natural_feature', 'point_of_interest'],
  , // restrict to cities
  language: 'en', // language setting
};

accounting
airport
amusement_park
aquarium
art_gallery
atm
bakery
bank
bar
beauty_salon
bicycle_store
book_store
bowling_alley
bus_station
cafe
campground
car_dealer
car_rental
car_repair
car_wash
casino
cemetery
church
city_hall
clothing_store
convenience_store
courthouse
dentist
department_store
doctor
drugstore
electrician
electronics_store
embassy
fire_station
florist
funeral_home
furniture_store
gas_station
gym
hair_care
hardware_store
hindu_temple
home_goods_store
hospital
insurance_agency
jewelry_store
laundry
lawyer
library
light_rail_station
liquor_store
local_government_office
locksmith
lodging
meal_delivery
meal_takeaway
mosque
movie_rental
movie_theater
moving_company
museum
night_club
painter
park
parking
pet_store
pharmacy
physiotherapist
plumber
police
post_office
primary_school
real_estate_agency
restaurant
roofing_contractor
rv_park
school
secondary_school
shoe_store
shopping_mall
spa
stadium
storage
store
subway_station
supermarket
synagogue
taxi_stand
tourist_attraction
train_station
transit_station
travel_agency
university
veterinary_care
zoo */