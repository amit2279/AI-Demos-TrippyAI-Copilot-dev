import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { DayPlan, Activity } from '../../types/itinerary';
import { findPlace } from '../../services/places';
import { ActivityShimmer } from '../ui/Shimmer';
import { AnimatePresence, motion } from 'framer-motion';
import { ActivityActions } from './ActivityActions';
import { TransportIcon } from './TransportIcon';

interface DayTimelineProps {
  day: DayPlan;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  isLoading?: boolean;
  previousDayComplete?: boolean;
  dayNumber: number;
  streamingActivity?: boolean;
  activeDay?: number;
  dayColor?: string;
}

export function DayTimeline({ 
  day, 
  onLocationSelect,
  selectedLocationId,
  isLoading = false,
  previousDayComplete = true,
  dayNumber,
  streamingActivity = false,
  activeDay,
  dayColor = '#007AFF'
}: DayTimelineProps) {
  // Determine if this day should show shimmer
  const shouldShowShimmer = React.useMemo(() => {
    if (day.activities.length === 0) {
      return true;
    }
    
    if (streamingActivity && activeDay === dayNumber) {
      return true;
    }
    
    return false;
  }, [day.activities.length, streamingActivity, dayNumber, activeDay]);

  // If waiting for previous day but no activities
  if (!previousDayComplete && day.activities.length === 0) {
    return (
      <div className="space-y-6 relative ml-10">
        {/* Day number circle at top only */}
        <div className="absolute left-[-36px] top-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold z-10 relative">
            {dayNumber}
          </div>
        </div>
        
        {/* Vertical timeline line */}
        <div className="absolute left-[-28px] top-190 bottom-0 w-0.5 border-l-2 border-dashed border-blue-200 h-full"></div>

        <ActivityShimmer />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative ml-10">
      {/* Day number circle at top only */}
     {/*  <div className="absolute left-[-36px] top-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold z-10 relative">
          {dayNumber}
        </div>
      </div> */}
      
      {/* Continuous vertical timeline line */}
      <div className="absolute left-[-28px] top-190 bottom-0 w-0.5 border-l-2 border-dashed border-blue-200 h-full"></div>
      
      <AnimatePresence mode="sync">
        {day.activities.map((activity, index) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            isSelected={selectedLocationId === activity.location.id}
            onSelect={() => onLocationSelect(activity.location.id)}
            onMapsClick={(e) => handleMapsClick(e, activity.location)}
            color={dayColor}
            isFirst={index === 0}
            isLast={index === day.activities.length - 1}
          />
        ))}
        
        {shouldShowShimmer && (
          <ActivityShimmer key={`shimmer-day-${dayNumber}`} />
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
  onMapsClick,
  color,
  isFirst,
  isLast
}: { 
  activity: Activity;
  isSelected: boolean;
  onSelect: () => void;
  onMapsClick: (e: React.MouseEvent) => void;
  color: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex gap-4"
    >
      {/* Activity dot only - no day number */}
      <div className="absolute left-[-33px] top-[24px]">
        <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-blue-300'} z-10 relative`}></div>
      </div>
      
      <div className="flex-1">
        <div 
          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
            isSelected
            ? 'border-2 border-current'
            : 'border border-gray-200 hover:border-current'
          }`}
          onClick={onSelect}
          style={{ 
            borderColor: isSelected ? color : undefined,
            color: color
          }}
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
                <TransportIcon type={activity.transport} className="w-3.5 h-3.5" />
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
          
          {/* Add the new ActivityActions component */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <ActivityActions activity={activity} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}