import React, { useState } from 'react';
import { Calendar, Users, DollarSign } from 'lucide-react';

interface TripPlannerProps {
  onSubmit: (data: TripPlannerData) => void;
  onClose: () => void;
}

export interface TripPlannerData {
  destination: string;
  month: string;
  duration: string;
  activities: string[];
  travelGroup: string;
  budget: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DURATIONS = [
  'Weekend (2-3 days)',
  'Short trip (4-6 days)',
  'Week-long (7 days)',
  'Extended (8-14 days)',
  'Long journey (15+ days)'
];

const ACTIVITIES = [
  { id: 'culture', label: 'Culture' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'food', label: 'Food' },
  { id: 'history', label: 'History' },
  { id: 'beach', label: 'Beach' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'nature', label: 'Nature' },
  { id: 'local', label: 'Local' }
];

const TRAVEL_GROUPS = [
  'Solo traveler',
  'Couple',
  'Family with kids',
  'Group of friends',
  'Business trip'
];

export const TripPlanner: React.FC<TripPlannerProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState<TripPlannerData>({
    destination: '',
    month: '',
    duration: '',
    activities: [],
    travelGroup: '',
    budget: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">Trip Planner</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Where would you like to go?
          </label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
            placeholder="Enter destination or 'open to suggestions'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Month Selection - Changed to dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            When are you planning to travel?
          </label>
          <select
            value={formData.month}
            onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select month</option>
            {MONTHS.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        {/* Duration - Split into 2 rows */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How long would you like to travel?
          </label>
          <div className="grid grid-cols-2 gap-4">
            {DURATIONS.map((duration, index) => (
              <label key={duration} className="flex items-center">
                <input
                  type="radio"
                  name="duration"
                  value={duration}
                  checked={formData.duration === duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{duration}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Activities - Shortened labels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Activities
          </label>
          <div className="grid grid-cols-2 gap-4">
            {ACTIVITIES.map(activity => (
              <label key={activity.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activities.includes(activity.label)}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      activities: e.target.checked
                        ? [...prev.activities, activity.label]
                        : prev.activities.filter(a => a !== activity.label)
                    }));
                  }}
                  className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{activity.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Travel Group - Split into 2 rows */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Who are you traveling with?
          </label>
          <div className="grid grid-cols-2 gap-4">
            {TRAVEL_GROUPS.map(group => (
              <label key={group} className="flex items-center">
                <input
                  type="radio"
                  name="travelGroup"
                  value={group}
                  checked={formData.travelGroup === group}
                  onChange={(e) => setFormData(prev => ({ ...prev, travelGroup: e.target.value }))}
                  className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{group}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What's your budget?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="Enter amount in USD"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Plan My Trip
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};