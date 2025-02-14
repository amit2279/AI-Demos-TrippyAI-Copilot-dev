import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, Users, ChevronDown, ChevronUp, UserCircle2, Users2, Baby, Heart, Briefcase } from 'lucide-react';
import { Itinerary, DayPlan, TravelGroup } from '../../types/itinerary';
import { DayTimeline } from './DayTimeline';
import { BudgetBreakdown } from './BudgetBreakdown';
import { format } from 'date-fns';

interface ItineraryPanelProps {
  itinerary: Partial<Itinerary>;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  onLocationsUpdate?: (locations: any[]) => void;
}

const getTravelGroupIcon = (group: TravelGroup) => {
  switch (group) {
    case 'Solo traveler': return <UserCircle2 size={20} className="text-white/90" />;
    case 'Friends': return <Users2 size={20} className="text-white/90" />;
    case 'Family with kids': return <Baby size={20} className="text-white/90" />;
    case 'Couple': return <Heart size={20} className="text-white/90" />;
    case 'Business trip': return <Briefcase size={20} className="text-white/90" />;
    default: return <Users size={20} className="text-white/90" />;
  }
};

export function ItineraryPanel({ 
  itinerary, 
  onLocationSelect,
  selectedLocationId,
  onLocationsUpdate
}: ItineraryPanelProps) {
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [showBudget, setShowBudget] = useState(false);
  const [validDays, setValidDays] = useState<Set<number>>(new Set());

  // Effect to update map when days become valid
  useEffect(() => {
    if (itinerary.days?.length && onLocationsUpdate) {
      const allLocations = itinerary.days.flatMap(day => 
        day.activities?.map(activity => activity.location) || []
      );
      if (allLocations.length > 0) {
        onLocationsUpdate(allLocations);
      }
    }
  }, [itinerary.days, onLocationsUpdate]);

  // Effect to track valid days
  useEffect(() => {
    if (itinerary.days) {
      const newValidDays = new Set<number>();
      itinerary.days.forEach((day, index) => {
        if (day.activities?.length > 0) {
          newValidDays.add(index);
        }
      });
      setValidDays(newValidDays);
    }
  }, [itinerary.days]);

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header with background image */}
      <div className="relative">
        <div 
          className="h-48 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://source.unsplash.com/1600x900/?${
              encodeURIComponent(itinerary.tripDetails?.destination + ' landmark')
            })`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Your Trip to {itinerary.tripDetails?.destination}
          </h2>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {itinerary.tripDetails?.startDate && itinerary.tripDetails?.endDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-white/80" />
                <span>
                  {format(new Date(itinerary.tripDetails.startDate), 'MMM d')} - {' '}
                  {format(new Date(itinerary.tripDetails.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            
            {itinerary.tripDetails?.travelGroup && (
              <div className="flex items-center gap-2">
                {getTravelGroupIcon(itinerary.tripDetails.travelGroup)}
                <span>{itinerary.tripDetails.travelGroup}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y-0">
          {itinerary.days?.map((day, index) => (
            <div key={index} className="bg-white">
              <button
                onClick={() => setExpandedDay(expandedDay === index ? -1 : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${ validDays.has(index) ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <span className={`font-semibold ${
                      validDays.has(index) ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      {day.date ? format(new Date(day.date), 'EEEE, MMMM d') : ''}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {validDays.has(index) 
                        ? `${day.activities?.length || 0} activities`
                        : 'Building your plan...'}
                    </p>
                  </div>
                </div>
                <div className="transform transition-transform duration-200">
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
                    day={day as DayPlan}
                    onLocationSelect={onLocationSelect}
                    selectedLocationId={selectedLocationId}
                    isLoading={!validDays.has(index)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Budget Section */}
        {itinerary.budgetSummary && (
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
              <div className="transform transition-transform duration-200">
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
        )}
      </div>
    </div>
  );
}