import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { CITIES } from '../../services/cities/data';

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface Prediction {
  city: string;
  country: string;
  description: string;
}

export function LocationSearch({ value, onChange, placeholder = 'Where to?' }: LocationSearchProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep input in sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const getLocationPredictions = (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }

    const searchTerm = input.toLowerCase();
    const matches = CITIES
      .filter(city => 
        city.name.toLowerCase().includes(searchTerm) ||
        city.country.toLowerCase().includes(searchTerm) ||
        city.description.toLowerCase().includes(searchTerm)
      )
      .map(city => ({
        city: city.name,
        country: city.country,
        description: city.description
      }))
      .slice(0, 5); // Limit to 5 results

    setPredictions(matches);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Update parent immediately with raw input
    
    if (newValue.length >= 2) {
      getLocationPredictions(newValue);
      setIsOpen(true);
    } else {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  const handlePredictionSelect = (prediction: Prediction) => {
    const fullLocation = `${prediction.city}, ${prediction.country}`;
    setInputValue(fullLocation);
    onChange(fullLocation); // Update parent with formatted location
    setIsOpen(false);
    setPredictions([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && predictions.length > 0) {
      handlePredictionSelect(predictions[0]);
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

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
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
      {isOpen && predictions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
        >
          <ul className="py-1 divide-y divide-gray-100">
            {predictions.map((prediction, index) => (
              <li
                key={`${prediction.city}-${prediction.country}`}
                onClick={() => handlePredictionSelect(prediction)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-gray-900">
                    {prediction.city}, {prediction.country}
                  </div>
                  <div className="text-sm text-gray-500">
                    {prediction.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}