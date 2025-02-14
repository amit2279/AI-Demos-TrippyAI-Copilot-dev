import React from 'react';
import { MapPin, Clock, Bus } from 'lucide-react';
import { DayPlan } from '../../types/itinerary';
import { format } from 'date-fns';
import { findPlace } from '../../services/places';
import { Shimmer, ShimmerText } from '../ui/Shimmer';

interface DayTimelineProps {
  day: DayPlan;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  isLoading?: boolean;
}

function LoadingActivity() {
  return (
    <div className="relative flex gap-4">
      <Shimmer className="w-5 h-5 rounded-full bg-gray-200 mt-1" />
      <div className="flex-1">
        <div className="p-4 border border-gray-200 rounded-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <ShimmerText className="w-48 h-5" />
              <ShimmerText className="w-32 h-4" />
            </div>
          </div>
          <div className="flex gap-4">
            <ShimmerText className="w-24 h-4" />
            <ShimmerText className="w-24 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DayTimeline({ 
  day, 
  onLocationSelect,
  selectedLocationId,
  isLoading = false
}: DayTimelineProps) {
  const formattedDate = day.date ? format(new Date(day.date), 'EEEE, MMMM d') : '';

  const handleMapsClick = async (e: React.MouseEvent, location: any) => {
    e.stopPropagation();
    try {
      const mapsUrl = await findPlace(location);
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <LoadingActivity key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      {/* <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gray-200" /> */}

      {/* Activities */}
      <div className="space-y-6">
        {day.activities.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className="w-[20px] h-[20px] rounded-full bg-blue-500 border-4 border-white shadow-sm z-10 mt-1" />

            {/* Activity card */}
            <div className="flex-1">
              <div 
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedLocationId === activity.location.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                }`}
                onClick={() => onLocationSelect(activity.location.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <span className="text-xl">{activity.icon}</span>
                      {activity.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.location.description}
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
                      onClick={(e) => handleMapsClick(e, activity.location)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View on map
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



/* import React from 'react';
import { MapPin, Clock, Bus } from 'lucide-react';
import { DayPlan } from '../../types/itinerary';

interface DayTimelineProps {
  day: DayPlan;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
}

export function DayTimeline({ 
  day, 
  onLocationSelect,
  selectedLocationId 
}: DayTimelineProps) {
  return (
    <div className="relative">
      {}
      <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gray-200" />

      {}
      <div className="space-y-6">
        {day.activities.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-4">
            {}
            <div className="w-[20px] h-[20px] rounded-full bg-blue-500 border-4 border-white shadow-sm z-10 mt-1" />

            {}
            <div className="flex-1">
              <div 
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedLocationId === activity.location.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                }`}
                onClick={() => onLocationSelect(activity.location.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <span className="text-xl">{activity.icon}</span>
                      {activity.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.location.description}
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
        ))}
      </div>
    </div>
  );
} */