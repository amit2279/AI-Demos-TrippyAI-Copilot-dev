import React, { useMemo } from 'react';
import {
  CloudSun, Calendar, Map, Plane, Utensils, Camera, Bus, 
  ShoppingBag, Ticket, Mountain, DollarSign, Hotel, Clock, 
  Compass, History, Building, Coffee, Landmark, MapPin, Star,
  Palmtree, Music, Users, Wine, Book, Sun, Shield, Heart,
  Umbrella, Info
} from 'lucide-react';
import { cityContext } from '../services/cityContext';
import { CITIES } from '../services/cities/data';

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'prompt' | 'widget' | 'locations';
  action: string;
  priority?: number;
  conditions?: {
    hasBeach?: boolean;
    hasNature?: boolean;
    hasNightlife?: boolean;
    hasSnow?: boolean;
    isCoastal?: boolean;
    isUrban?: boolean;
    hasHistory?: boolean;
  };
}

interface NextBestActionsProps {
  messageType: string;
  onActionClick: (action: string) => void;
  hasLocations?: boolean;
  onShowLocations?: () => void;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Get location characteristics based on city data
const getLocationCharacteristics = (cityName: string) => {
  const city = CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (!city) return null;

  // Determine characteristics based on location and description
  const characteristics = {
    hasBeach: city.description.toLowerCase().includes('beach') || 
              city.description.toLowerCase().includes('coast') ||
              Math.abs(city.position.lat) < 45 && // Within tropical/temperate zones
              // Check if near a coast (rough approximation)
              CITIES.some(c => 
                Math.abs(c.position.lat - city.position.lat) < 1 &&
                Math.abs(c.position.lng - city.position.lng) < 1 &&
                c.description.toLowerCase().includes('coast')
              ),
    hasNature: city.description.toLowerCase().includes('nature') ||
               city.description.toLowerCase().includes('mountain') ||
               city.description.toLowerCase().includes('forest') ||
               city.description.toLowerCase().includes('garden'),
    hasNightlife: city.description.toLowerCase().includes('nightlife') ||
                  city.description.toLowerCase().includes('bar') ||
                  city.description.toLowerCase().includes('modern'),
    hasSnow: Math.abs(city.position.lat) > 45 || // High latitude
             city.description.toLowerCase().includes('mountain'),
    isCoastal: city.description.toLowerCase().includes('port') ||
               city.description.toLowerCase().includes('harbor') ||
               city.description.toLowerCase().includes('sea'),
    isUrban: city.description.toLowerCase().includes('capital') ||
             city.description.toLowerCase().includes('modern') ||
             city.description.toLowerCase().includes('metropolis'),
    hasHistory: city.description.toLowerCase().includes('historic') ||
                city.description.toLowerCase().includes('ancient') ||
                city.description.toLowerCase().includes('traditional') ||
                city.description.toLowerCase().includes('temple')
  };

  return characteristics;
};

const getContextualActions = (messageType: string, hasLocations: boolean): Action[] => {
  const currentCity = cityContext.getCurrentCity();
  const locationContext = currentCity ? ` in ${currentCity}` : '';
  const characteristics = currentCity ? getLocationCharacteristics(currentCity) : null;
  
  // Location action is always included if available
  const locationAction = hasLocations ? [{
    id: 'show-locations',
    label: 'Show locations',
    icon: <MapPin size={16} />,
    type: 'locations',
    action: 'show-locations',
    priority: 0
  }] : [];

  // Define all possible actions with their conditions
  const ALL_ACTIONS: Action[] = [
    // Location-based actions
    { id: 'hotels', label: 'Find hotels', icon: <Hotel size={16} />, type: 'prompt', action: `What are the best areas to stay${locationContext}?` },
    { id: 'transport', label: 'Getting around', icon: <Bus size={16} />, type: 'prompt', action: `How to get around${locationContext}?` },
    { id: 'highlights', label: 'Must-see places', icon: <Star size={16} />, type: 'prompt', action: `What are the must-see places${locationContext}?` },
    { id: 'photos', label: 'Photo spots', icon: <Camera size={16} />, type: 'prompt', action: `Best photography locations${locationContext}?` },
    { id: 'walking', label: 'Walking tours', icon: <Compass size={16} />, type: 'prompt', action: `Suggested walking tours${locationContext}?`, conditions: { isUrban: true } },
    { id: 'hidden', label: 'Hidden gems', icon: <Landmark size={16} />, type: 'prompt', action: `What are some hidden gems${locationContext}?` },
    
    // Nature-based actions
    { id: 'nature', label: 'Nature spots', icon: <Mountain size={16} />, type: 'prompt', action: `Best nature spots${locationContext}?`, conditions: { hasNature: true } },
    { id: 'beaches', label: 'Best beaches', icon: <Palmtree size={16} />, type: 'prompt', action: `Best beaches${locationContext}?`, conditions: { hasBeach: true } },
    { id: 'hiking', label: 'Hiking trails', icon: <Mountain size={16} />, type: 'prompt', action: `Best hiking trails${locationContext}?`, conditions: { hasNature: true } },
    
    // Urban activities
    { id: 'shopping', label: 'Shopping areas', icon: <ShoppingBag size={16} />, type: 'prompt', action: `Best shopping areas${locationContext}?`, conditions: { isUrban: true } },
    { id: 'nightlife', label: 'Nightlife spots', icon: <Wine size={16} />, type: 'prompt', action: `Best nightlife${locationContext}?`, conditions: { hasNightlife: true } },
    { id: 'markets', label: 'Local markets', icon: <ShoppingBag size={16} />, type: 'prompt', action: `Best markets${locationContext}?` },
    
    // Cultural activities
    { id: 'museums', label: 'Museums', icon: <Building size={16} />, type: 'prompt', action: `Best museums${locationContext}?`, conditions: { isUrban: true } },
    { id: 'temples', label: 'Temples', icon: <Landmark size={16} />, type: 'prompt', action: `Most important temples${locationContext}?`, conditions: { hasHistory: true } },
    { id: 'architecture', label: 'Architecture', icon: <Building size={16} />, type: 'prompt', action: `Notable architecture${locationContext}?`, conditions: { hasHistory: true } },
    
    // Food and drink
    { id: 'restaurants', label: 'Top restaurants', icon: <Utensils size={16} />, type: 'prompt', action: `Best restaurants${locationContext}?` },
    { id: 'street-food', label: 'Street food', icon: <Utensils size={16} />, type: 'prompt', action: `Best street food${locationContext}?` },
    { id: 'cafes', label: 'Cafes', icon: <Coffee size={16} />, type: 'prompt', action: `Best cafes${locationContext}?` },
    { id: 'bars', label: 'Bars', icon: <Wine size={16} />, type: 'prompt', action: `Best bars${locationContext}?`, conditions: { hasNightlife: true } },
    
    // Seasonal activities
    { id: 'winter-sports', label: 'Winter sports', icon: <Mountain size={16} />, type: 'prompt', action: `Winter sports${locationContext}?`, conditions: { hasSnow: true } },
    { id: 'water-sports', label: 'Water sports', icon: <Palmtree size={16} />, type: 'prompt', action: `Water sports${locationContext}?`, conditions: { hasBeach: true, isCoastal: true } },
    
    // Common actions (always available)
    { id: 'weather', label: 'Check weather', icon: <CloudSun size={16} />, type: 'widget', action: 'weather' },
    { id: 'tips', label: 'Local tips', icon: <Info size={16} />, type: 'prompt', action: `What are some local tips for visiting${locationContext}?` },
    { id: 'safety', label: 'Safety tips', icon: <Shield size={16} />, type: 'prompt', action: `Safety tips for${locationContext}?` },
    { id: 'costs', label: 'Daily costs', icon: <DollarSign size={16} />, type: 'prompt', action: `What are the typical daily costs${locationContext}?` }
  ];

  // Filter actions based on location characteristics
  const filteredActions = ALL_ACTIONS.filter(action => {
    if (!action.conditions) return true;
    if (!characteristics) return true;
    
    return Object.entries(action.conditions).every(([condition, required]) => {
      if (!required) return true;
      return characteristics[condition as keyof typeof characteristics];
    });
  });

  // Get context-specific actions
  let availableActions = filteredActions;
  
  // Shuffle the available actions
  const shuffledActions = shuffleArray(availableActions);
  
  // Always include location action if available, then add random actions
  const selectedActions = [
    ...(hasLocations ? locationAction : []),
    ...shuffledActions.slice(0, hasLocations ? 2 : 3)
  ];

  return selectedActions;
};

export const NextBestActions: React.FC<NextBestActionsProps> = ({ 
  messageType, 
  onActionClick, 
  hasLocations = false,
  onShowLocations 
}) => {
  // Use useMemo to prevent re-shuffling on every render
  const actions = useMemo(() => 
    getContextualActions(messageType, hasLocations),
    [messageType, hasLocations]
  );

  const handleActionClick = (action: Action) => {
    if (action.type === 'locations' && onShowLocations) {
      onShowLocations();
    } else {
      onActionClick(action.action);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 
                     rounded-full hover:bg-gray-200 transition-colors"
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
};