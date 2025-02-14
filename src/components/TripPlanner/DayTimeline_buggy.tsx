import React from 'react';
import { MapPin, Clock, Bus } from 'lucide-react';
import { Activity } from '../../types/itinerary';
import { format } from 'date-fns';
import { Shimmer } from '../ui/Shimmer';

interface DayTimelineProps {
  date: string;
  activities: Activity[];
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  isLoading?: boolean;
}

function LoadingActivityCard() {
  return (
    <div className="relative flex gap-4">
      <div className="w-[20px] h-[20px] rounded-full bg-gray-200 animate-pulse mt-1" />
      <div className="flex-1">
        <div className="p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Shimmer className="h-5 w-48" />
              <Shimmer className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-4">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ 
  activity, 
  isSelected, 
  onSelect 
}: { 
  activity: Activity; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <div 
      className={`relative flex gap-4 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]`}
      style={{ animationDelay: `${activity.order * 150}ms` }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${
                      encodeURIComponent(activity.location.name)
                    }@${activity.location.position.lat},${activity.location.position.lng}`,
                    '_blank'
                  );
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                View on map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DayTimeline({ 
  date,
  activities,
  onLocationSelect,
  selectedLocationId,
  isLoading = false
}: DayTimelineProps) {
  const formattedDate = format(new Date(date), 'EEEE, MMMM d');

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <LoadingActivityCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gray-200" />

      {/* Activities */}
      <div className="space-y-6">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            isSelected={selectedLocationId === activity.location.id}
            onSelect={() => onLocationSelect(activity.location.id)}
          />
        ))}
      </div>
    </div>
  );
}