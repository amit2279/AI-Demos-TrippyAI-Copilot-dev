import React, { useEffect, useState } from 'react';
import { MapPin, Clock, Bus } from 'lucide-react';
import { DayPlan, Activity } from '../../types/itinerary';
import { format } from 'date-fns';
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
}


export function DayTimeline({ 
  day, 
  onLocationSelect,
  selectedLocationId,
  isLoading = false,
  previousDayComplete = true,
  dayNumber,
  streamingActivity = false
}: DayTimelineProps) {
  // Track both current activities and shimmer state
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [showNextShimmer, setShowNextShimmer] = useState(true);
  
  // Add near the top of the DayTimeline function
  useEffect(() => {
    console.log(`[DayTimeline ${dayNumber}] Shimmer Debug:`, {
      dayNumber,
      activitiesCount: day.activities.length,
      streamingActivity,
      showNextShimmer,
      previousDayComplete,
      shouldShowShimmer: day.activities.length === 0 || (showNextShimmer && streamingActivity)
    });
  }, [day.activities.length, streamingActivity, showNextShimmer, previousDayComplete, dayNumber]);


  // Track new activities and update states
  useEffect(() => {
    console.log(`[DayTimeline ${dayNumber}] Activity Update:`, {
      dayNumber,
      currentActivities: day.activities.length,
      completedCount: completedActivities.size,
      streaming: streamingActivity,
      previousComplete: previousDayComplete,
      newActivitiesCount: day.activities.filter(activity => 
        !completedActivities.has(activity.id)
      ).length
    });

    // Get any new activities
    const newActivities = day.activities.filter(activity => 
      !completedActivities.has(activity.id)
    );

    if (newActivities.length > 0) {
      // Update completed activities
      setCompletedActivities(prev => {
        const updated = new Set(prev);
        newActivities.forEach(activity => updated.add(activity.id));
        return updated;
      });

      // Show shimmer for next potential activity if we're still streaming
      setShowNextShimmer(streamingActivity);
    }
  }, [day.activities, streamingActivity, dayNumber, previousDayComplete]);

  // Handle streaming state changes
  useEffect(() => {
    /* console.log(`[DayTimeline ${dayNumber}] Streaming Update:`, {
      streaming: streamingActivity
    });
 */
    if (streamingActivity) {
      // Show shimmer when streaming starts
      setShowNextShimmer(true);
    }else if (!streamingActivity) {
      // Hide shimmer when streaming stops
      setShowNextShimmer(false);
    }
  }, [streamingActivity, dayNumber]);

  const handleMapsClick = async (e: React.MouseEvent, location: any) => {
    e.stopPropagation();
    try {
      const mapsUrl = await findPlace(location);
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  // If waiting for previous day
  if (!previousDayComplete) {
    //console.log(`[DayTimeline ${dayNumber}] Waiting for previous day`);
    return (
      <div className="space-y-6">
        <ActivityShimmer />
      </div>
    );
  }

  const shouldShowShimmer = 
    // Always show shimmer if no activities yet
    day.activities.length === 0 ||
    // Show shimmer for next activity if streaming
    (showNextShimmer && streamingActivity);

  console.log(`[DayTimeline ${dayNumber}] Render State:`, {
    activityCount: day.activities.length,
    shouldShowShimmer,
    showNextShimmer,
    streaming: streamingActivity
  });

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
        
        {/* Show shimmer when needed */}
        {shouldShowShimmer && (
          <ActivityShimmer key="loading-shimmer" />
        )}
      </AnimatePresence>
    </div>
  );
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