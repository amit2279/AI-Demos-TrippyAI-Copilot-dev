import { TripDetails, TravelGroup } from '../../types/itinerary';

// In personalizedPlannerTypes.ts
export interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  position: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviews: number;
  image: string;
  fallbackImage?: string; // Add this as optional with a question mark
  description: string;
}

// Day container type
export interface DayContainer {
  id: string;
  date: Date;
  dayNumber: number;
  places: Place[];
}

export type PlannerStep = 'details' | 'planning';

/* export interface PersonalizedPlannerPanelProps {
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onLocationSelect?: (locationId: string) => void;
  selectedLocationId?: string;
  tripDetails?: Partial<TripDetails>;
  onTripDetailsUpdate?: (details: Partial<TripDetails>) => void;
  onLocationsUpdate?: (locations: Place[]) => void; // Add this line
} */

export interface PersonalizedPlannerPanelProps {
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onLocationSelect?: (locationId: string) => void;
  selectedLocationId?: string;
  tripDetails?: {
    destination?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    travelGroup?: string;
  };
  onTripDetailsUpdate?: (details: {
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  // Make sure this is properly defined and passed through
  onLocationsUpdate?: (locations: any[]) => void; 
}


/* export interface PersonalizedPlannerPanelProps {
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onLocationSelect?: (locationId: string) => void;
  selectedLocationId?: string;
  tripDetails?: {
    destination: string;
    startDate?: string;
    endDate?: string;
  };
  onTripDetailsUpdate?: (details: TripDetails) => void;
  onLocationsUpdate?: (locations: Place[]) => void;
} */