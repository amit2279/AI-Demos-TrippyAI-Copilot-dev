import React, { useState } from 'react';
import { Calendar, Clock, MapPin, DollarSign, Users, ChevronDown, ChevronUp, UserCircle2, Users2, Baby, Heart, Briefcase } from 'lucide-react';
import { Itinerary, DayPlan, TravelGroup } from '../../types/itinerary';
import { DayTimeline } from './DayTimeline';
import { BudgetBreakdown } from './BudgetBreakdown';

interface ItineraryPanelProps {
  itinerary: Itinerary;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
}

const getTravelGroupIcon = (group: TravelGroup) => {
  switch (group) {
    case 'Solo traveler':
      return <UserCircle2 size={20} className="text-white/90" />;
    case 'Friends':
      return <Users2 size={20} className="text-white/90" />;
    case 'Family with kids':
      return <Baby size={20} className="text-white/90" />;
    case 'Couple':
      return <Heart size={20} className="text-white/90" />;
    case 'Business trip':
      return <Briefcase size={20} className="text-white/90" />;
    default:
      return <Users size={20} className="text-white/90" />;
  }
};

export function ItineraryPanel({ 
  itinerary, 
  onLocationSelect,
  selectedLocationId 
}: ItineraryPanelProps) {
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [showBudget, setShowBudget] = useState(false);

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header with background image */}
      <div className="relative">
        <div 
          className="h-48 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://source.unsplash.com/1600x900/?${encodeURIComponent(itinerary.tripDetails.destination + ' landmark')})`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Your Trip to {itinerary.tripDetails.destination}
          </h2>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {itinerary.tripDetails.startDate && itinerary.tripDetails.endDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-white/80" />
                <span>
                  {new Date(itinerary.tripDetails.startDate).toLocaleDateString()} - {' '}
                  {new Date(itinerary.tripDetails.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {getTravelGroupIcon(itinerary.tripDetails.travelGroup)}
              <span>{itinerary.tripDetails.travelGroup}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y-0">
          {itinerary.days.map((day, index) => (
            <div key={index} className="bg-white">
              <button
                onClick={() => setExpandedDay(expandedDay === index ? -1 : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{day.date}</h3>
                    <p className="text-sm text-gray-500">
                      {day.activities.length} activities
                    </p>
                  </div>
                </div>
                <div className="transform transition-transform duration-200 ease-in-out">
                  {expandedDay === index ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </button>

              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedDay === index ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6">
                  <DayTimeline 
                    day={day} 
                    onLocationSelect={onLocationSelect}
                    selectedLocationId={selectedLocationId}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Budget Section */}
        <div>
          <button
            onClick={() => setShowBudget(!showBudget)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign size={20} className="text-green-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Budget Breakdown</h3>
                <p className="text-sm text-gray-500">
                  {itinerary.budgetSummary.totalEstimatedBudget}
                </p>
              </div>
            </div>
            <div className="transform transition-transform duration-200 ease-in-out">
              {showBudget ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </div>
          </button>

          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showBudget ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-6 pb-6">
              <BudgetBreakdown summary={itinerary.budgetSummary} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}