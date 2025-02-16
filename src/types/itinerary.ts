// itinerary.ts
import { Location } from './chat';

export interface TripDetails {
  destination: string;
  startDate?: Date;
  endDate?: Date;
  travelGroup: TravelGroup;
  budget?: string;
  preferences?: TripPreferences;
}

export type TravelGroup = 'Solo traveler' | 'Friends' | 'Family with kids' | 'Couple' | 'Business trip';

export interface TripPreferences {
  physicalAbility?: 'Low' | 'Moderate' | 'High';
  activityTypes?: ActivityType[];
}

export type ActivityType = 'Cultural' | 'Foodie' | 'Adventure' | 'Nightlife' | 'Nature' | 'Shopping' | 'Relaxation';

export interface Activity {
  id: string;
  dayNumber: number;  // Changed from dayId to dayNumber to match streaming format
  name: string;
  location: Location;
  startTime: string;
  duration: string;
  transport?: string;
  travelTime?: string;
  cost?: string;
  description?: string;
}

export interface DayPlan {
  date: string;
  dayNumber: number;
  activities: Activity[];
  isLoading?: boolean;  // Added to support loading states
}

export interface Itinerary {
  tripDetails: {
    destination: string;
    startDate?: string;
    endDate?: string;
    travelGroup: string;
  };
  days: DayPlan[];  // Simplified to array of DayPlan
  budgetSummary?: BudgetSummary;
}

export interface BudgetSummary {
  totalEstimatedBudget: string;
  categoryBreakdown: {
    attractions: string;
    foodAndDining: string;
    transportation: string;
    shoppingAndMisc: string;
    buffer: string;
  };
}

export interface ItineraryState {
  isLoading: boolean;
  error: string | null;
  data: Itinerary | null;
}