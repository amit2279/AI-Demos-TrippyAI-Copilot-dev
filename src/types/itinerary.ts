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
  name: string;
  location: Location;
  icon: string;
  startTime: string;
  duration: string;
  transport?: string;
  travelTime?: string;
  cost?: string;
  description?: string;
}

export interface DayPlan {
  date: string;
  activities: Activity[];
}

export interface Itinerary {
  tripDetails: TripDetails;
  days: DayPlan[];
  budgetSummary: BudgetSummary;
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
  useTestData: boolean;
}