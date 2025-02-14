import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TripDetails, TravelGroup, ActivityType } from '../../types/itinerary';
import { LocationSearch } from './LocationSearch';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface TripPlannerModalProps {
  onClose: () => void;
  onSubmit: (details: TripDetails) => void;
  isLoading?: boolean;
}

export function TripPlannerModal({ onClose, onSubmit, isLoading = false }: TripPlannerModalProps) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [travelGroup, setTravelGroup] = useState<TravelGroup>('Solo traveler');
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      destination,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      travelGroup,
      preferences: {
        activityTypes: selectedActivities
      }
    });
  };

  

  const activityTypes: ActivityType[] = [
    'Cultural',
    'Foodie', 
    'Adventure',
    'Nightlife',
    'Nature',
    'Shopping',
    'Relaxation'
  ];

  const travelGroups: TravelGroup[] = [
    'Solo traveler',
    'Friends',
    'Family with kids',
    'Couple',
    'Business trip'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Plan Your Trip</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Where to?
            </label>
            <LocationSearch
              value={destination}
              onChange={setDestination}
              placeholder="Enter destination"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                minDate={new Date()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholderText="Select start date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholderText="Select end date"
              />
            </div>
          </div>

          {/* Activity Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What interests you?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activityTypes.map(activity => (
                <label
                  key={activity}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedActivities.includes(activity)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedActivities.includes(activity)}
                    onChange={(e) => {
                      setSelectedActivities(prev =>
                        e.target.checked
                          ? [...prev, activity]
                          : prev.filter(a => a !== activity)
                      );
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {activity}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Travel Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who are you traveling with?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {travelGroups.map(group => (
                <label
                  key={group}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    travelGroup === group
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="travelGroup"
                    value={group}
                    checked={travelGroup === group}
                    onChange={e => setTravelGroup(e.target.value as TravelGroup)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {group}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!destination || isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                !destination || isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Itinerary...</span>
                </div>
              ) : (
                'Create Itinerary'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
