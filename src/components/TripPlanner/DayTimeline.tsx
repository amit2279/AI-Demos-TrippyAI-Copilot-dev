import React from 'react';
import { MapPin, Clock, Bus } from 'lucide-react';
import { DayPlan, Activity } from '../../types/itinerary';
import { findPlace } from '../../services/places';
import { ActivityShimmer } from '../ui/Shimmer';
import { AnimatePresence, motion } from 'framer-motion';

interface DayTimelineProps {
  day: DayPlan;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  isLoading?: boolean;
  previousDayComplete?: boolean;
  dayNumber: number;
  streamingActivity?: boolean;
  activeDay?: number;
}

export function DayTimeline({ 
  day, 
  onLocationSelect,
  selectedLocationId,
  isLoading = false,
  previousDayComplete = true,
  dayNumber,
  streamingActivity = false,
  activeDay
}: DayTimelineProps) {
  // Determine if this day should show shimmer
  // We now always add the shimmer AFTER the activities if needed
  const shouldShowShimmer = React.useMemo(() => {
    // If day has no activities yet, always show shimmer
    if (day.activities.length === 0) {
      return true;
    }
    
    // If streaming and this is the active day, show shimmer after the activities
    if (streamingActivity && activeDay === dayNumber) {
      return true;
    }
    
    // Otherwise don't show shimmer
    return false;
  }, [day.activities.length, streamingActivity, dayNumber, activeDay]);

  // If waiting for previous day but no activities
  if (!previousDayComplete && day.activities.length === 0) {
    return (
      <div className="space-y-6">
        <ActivityShimmer />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="sync">
        {/* Render existing activities */}
        {day.activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            isSelected={selectedLocationId === activity.location.id}
            onSelect={() => onLocationSelect(activity.location.id)}
            onMapsClick={(e) => handleMapsClick(e, activity.location)}
          />
        ))}
        
        {/* Show shimmer after activities when needed */}
        {shouldShowShimmer && (
          <ActivityShimmer key={`shimmer-day-${dayNumber}-${day.activities.length}`} />
        )}
      </AnimatePresence>
    </div>
  );
}

function handleMapsClick(e: React.MouseEvent, location: any) {
  e.stopPropagation();
  try {
    findPlace(location).then(mapsUrl => {
      window.open(mapsUrl, '_blank');
    });
  } catch (error) {
    console.error('Error opening maps:', error);
  }
}

function ActivityCard({ 
  activity, 
  isSelected, 
  onSelect, 
  onMapsClick 
}: { 
  activity: Activity;
  isSelected: boolean;
  onSelect: () => void;
  onMapsClick: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex gap-4"
    >
      <div className="w-[20px] h-[20px] rounded-full bg-blue-500 border-4 border-white shadow-sm z-10 mt-1" />
      <div className="flex-1">
        <div 
          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
            isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
          }`}
          onClick={onSelect}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="text-xl">{activity.icon}</span>
                {activity.name}
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                {activity.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{activity.startTime}</span>
              <span className="text-gray-400 mx-1">•</span>
              <span>{activity.duration}</span>
            </div>

            {activity.transport && (
              <div className="flex items-center gap-1.5">
                <Bus size={14} />
                <span>{activity.transport}</span>
                {activity.travelTime && (
                  <>
                    <span className="text-gray-400 mx-1">•</span>
                    <span>{activity.travelTime}</span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <button 
                onClick={onMapsClick}
                className="text-blue-600 hover:text-blue-800"
              >
                View on map
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}