import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, ChevronDown, ChevronUp, UserCircle2, Users2, Baby, Heart, Briefcase } from 'lucide-react';
import { Itinerary, DayPlan, TravelGroup } from '../../types/itinerary';
import { DayTimeline } from './DayTimeline';
import { BudgetBreakdown } from './BudgetBreakdown';
import { format } from 'date-fns';

interface ItineraryPanelProps {
  itinerary: Partial<Itinerary>;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  onLocationsUpdate?: (locations: any[]) => void;
  streamingActivity?: boolean;
}

const getTravelGroupIcon = (group: TravelGroup) => {
  switch (group) {
    case 'Solo traveler': return <UserCircle2 size={20} className="text-white/90" />;
    case 'Friends': return <Users2 size={20} className="text-white/90" />;
    case 'Family with kids': return <Baby size={20} className="text-white/90" />;
    case 'Couple': return <Heart size={20} className="text-white/90" />;
    case 'Business trip': return <Briefcase size={20} className="text-white/90" />;
    default: return <Users2 size={20} className="text-white/90" />;
  }
};

export function ItineraryPanel({ 
  itinerary, 
  onLocationSelect,
  selectedLocationId,
  onLocationsUpdate,
  streamingActivity = false
}: ItineraryPanelProps) {
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [showBudget, setShowBudget] = useState(false);
  const [headerImage, setHeaderImage] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Effect to update map when new activities are added
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

  /* // Load header image
  useEffect(() => {
    if (itinerary.tripDetails?.destination) {
      setIsImageLoading(true);
      
      // Create the image URL with proper encoding
      const searchQuery = encodeURIComponent(`${itinerary.tripDetails.destination} landmark scenic`);
      const imageUrl = `https://source.unsplash.com/1600x900/?${searchQuery}`;
      //console.log('Loading header image:', imageUrl);
      // Preload the image
      const img = new Image();
      img.onload = () => {
        setHeaderImage(imageUrl);
        setIsImageLoading(false);
      };
      img.onerror = () => {
        // Fallback to a more generic search if the first one fails
        const fallbackQuery = encodeURIComponent(`${itinerary.tripDetails.destination} city`);
        const fallbackUrl = `https://source.unsplash.com/1600x900/?${fallbackQuery}`;
        img.src = fallbackUrl;
      };
      img.src = imageUrl;
    }
  }, [itinerary.tripDetails?.destination]); */

  const getDayStatus = (day: DayPlan) => {
    if (!day.activities?.length) {
      return {
        status: 'loading',
        text: 'Building your plan...',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-400'
      };
    }
    return {
      status: 'complete',
      text: `${day.activities.length} activities`,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    };
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header with background image */}
      <div className="relative">
        <div 
          className={`h-48 bg-cover bg-center transition-all duration-500 ease-out ${
            isImageLoading ? 'opacity-80' : 'opacity-80'
          }`}
          style={{
            backgroundImage: headerImage ? `url(${headerImage})` : undefined,
            backgroundColor: '#f3f4f6' // Gray background while loading
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {itinerary.tripDetails?.destination ? (
              `Your Trip to ${itinerary.tripDetails.destination}`
            ) : (
              <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
            )}
          </h2>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {itinerary.tripDetails?.startDate && itinerary.tripDetails?.endDate ? (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-white/80" />
                <span>
                  {format(new Date(itinerary.tripDetails.startDate), 'MMM d')} - {' '}
                  {format(new Date(itinerary.tripDetails.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            ) : (
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
            )}
            
            {itinerary.tripDetails?.travelGroup ? (
              <div className="flex items-center gap-2">
                {getTravelGroupIcon(itinerary.tripDetails.travelGroup)}
                <span>{itinerary.tripDetails.travelGroup}</span>
              </div>
            ) : (
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
            )}
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y-0">
          {itinerary.days?.map((day, index) => {
            const dayStatus = getDayStatus(day);
            const previousDayComplete = index === 0 || 
              (itinerary.days?.[index - 1]?.activities?.length ?? 0) > 0;
            
            return (
              <div key={index} className="bg-white">
                <button
                  onClick={() => setExpandedDay(expandedDay === index ? -1 : index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dayStatus.bgColor}`}>
                      <span className={`font-semibold ${dayStatus.textColor}`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        {day.date ? format(new Date(day.date), 'EEEE, MMMM d') : ''}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dayStatus.text}
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
                      day={day}
                      onLocationSelect={onLocationSelect}
                      selectedLocationId={selectedLocationId}
                      isLoading={dayStatus.status === 'loading'}
                      previousDayComplete={previousDayComplete}
                      streamingActivity={streamingActivity}
                      dayNumber={index + 1}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Budget Section */}
        {(itinerary.budgetSummary || showBudget) && (
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
                    {itinerary.budgetSummary?.totalEstimatedBudget || 'Calculating...'}
                  </p>
                </div>
              </div>
              <div>
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
                {itinerary.budgetSummary ? (
                  <BudgetBreakdown summary={itinerary.budgetSummary} />
                ) : (
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-100 animate-pulse rounded" />
                    <div className="h-8 bg-gray-100 animate-pulse rounded" />
                    <div className="h-8 bg-gray-100 animate-pulse rounded" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}