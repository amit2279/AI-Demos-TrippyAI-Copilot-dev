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
  // Single state for shimmer visibility
  const [showShimmer, setShowShimmer] = useState(true);
  
  // Simplified effect to handle shimmer visibility
  useEffect(() => {
    console.log(`[DayTimeline ${dayNumber}] State update:`, {
      hasActivities: day.activities.length > 0,
      streamingActivity,
      previousDayComplete
    });

    // Determine if we should show shimmer
    const shouldShow = 
      // Don't show if previous day isn't complete
      !previousDayComplete ? false :
      // Don't show if we have activities and aren't streaming
      (day.activities.length > 0 && !streamingActivity) ? false :
      // Show if we're streaming or have no activities
      true;

    setShowShimmer(shouldShow);
  }, [day.activities.length, streamingActivity, previousDayComplete, dayNumber]);

  // Handle maps click
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
        
        {/* Show shimmer only when needed */}
        {showShimmer && (
          <ActivityShimmer key="loading-shimmer" />
        )}
      </AnimatePresence>
    </div>
  );
}


// export function DayTimeline({ 
//   day, 
//   onLocationSelect,
//   selectedLocationId,
//   isLoading = false,
//   previousDayComplete = true,
//   dayNumber,
//   streamingActivity = false
// }: DayTimelineProps) {
//   const [lastActivityCount, setLastActivityCount] = useState(0);
//   const [showShimmer, setShowShimmer] = useState(true);
  
//   /* console.log(`[DayTimeline ${dayNumber}] Props:`, {
//     activitiesCount: day.activities.length,
//     isLoading,
//     previousDayComplete,
//     streamingActivity
//   }); */

//   useEffect(() => {
//     console.log(`[DayTimeline ${dayNumber}] Activity update:`, {
//       showShimmer,
//       lastActivityCount,
//       newActivityCount: day.activities.length,
//       isStreaming: streamingActivity
//     });

//     if (day.activities.length > lastActivityCount) {
//       // New activity has been added
//       setLastActivityCount(day.activities.length);
//       setShowShimmer(streamingActivity); // Show shimmer if we're still streaming
//     }
//   }, [day.activities.length, lastActivityCount, streamingActivity, dayNumber, showShimmer]);

//   // Handle final state - Second useEffect
//   useEffect(() => {
//     if (!streamingActivity && day.activities.length > 0) {
//       // If we have activities and streaming is done, hide shimmer
//       setShowShimmer(false);
//     }
//   }, [streamingActivity, day.activities.length]);  

//   const handleMapsClick = async (e: React.MouseEvent, location: any) => {
//     e.stopPropagation();
//     try {
//       const mapsUrl = await findPlace(location);
//       window.open(mapsUrl, '_blank');
//     } catch (error) {
//       console.error('Error opening maps:', error);
//     }
//   };

//   // Show single shimmer for days waiting on previous days
//   if (!previousDayComplete) {
//     console.log(`[DayTimeline ${dayNumber}] Waiting for previous day`);
//     return (
//       <div className="space-y-6">
//         <ActivityShimmer />
//       </div>
//     );
//   }


  
//   // Update the complete state checks
//   const isComplete = !streamingActivity && day.activities.length > 0;
//   const isWaitingForPrevious = !previousDayComplete;
//   const shouldShowShimmer = 
//   // Show when no activities and still loading
//   (showShimmer && day.activities.length === 0) || 
//   // Show when streaming and expecting more activities
//   (streamingActivity && day.activities.length < 5) ||
//   // Don't show after we have activities and streaming is done
//   (!streamingActivity && day.activities.length === 0);


//   isLoading = !isComplete && (isWaitingForPrevious || shouldShowShimmer);

//   console.log(`[DayTimeline ${dayNumber}] State:`, {
//     isComplete,
//     isWaitingForPrevious,
//     isLoading,
//     activitiesCount: day.activities.length,
//     streamingActivity,
//     shouldShowShimmer
//   });

//   return (
//     <div className="space-y-6">
//       <AnimatePresence mode="sync">
//         {/* Render existing activities */}
//         {day.activities.map((activity) => (
//           <motion.div 
//             key={activity.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3 }}
//             className="relative flex gap-4"
//           >
//             <div className="w-[20px] h-[20px] rounded-full bg-blue-500 border-4 border-white shadow-sm z-10 mt-1" />
//             <div className="flex-1">
//               <div 
//                 className={`p-4 rounded-lg border transition-colors cursor-pointer ${
//                   selectedLocationId === activity.location.id
//                     ? 'border-blue-500 bg-blue-50'
//                     : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
//                 }`}
//                 onClick={() => onLocationSelect(activity.location.id)}
//               >
//                 <div className="flex items-start justify-between mb-2">
//                   <div>
//                     <h4 className="font-medium text-gray-900">
//                       {activity.name}
//                     </h4>
//                     <p className="text-sm text-gray-500 mt-1">
//                       {activity.description}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
//                   <div className="flex items-center gap-1.5">
//                     <Clock size={14} />
//                     <span>{activity.startTime}</span>
//                     <span className="text-gray-400 mx-1">•</span>
//                     <span>{activity.duration}</span>
//                   </div>

//                   {activity.transport && (
//                     <div className="flex items-center gap-1.5">
//                       <Bus size={14} />
//                       <span>{activity.transport}</span>
//                       {activity.travelTime && (
//                         <>
//                           <span className="text-gray-400 mx-1">•</span>
//                           <span>{activity.travelTime}</span>
//                         </>
//                       )}
//                     </div>
//                   )}

//                   <div className="flex items-center gap-1.5">
//                     <MapPin size={14} />
//                     <button 
//                       onClick={(e) => handleMapsClick(e, activity.location)}
//                       className="text-blue-600 hover:text-blue-800"
//                     >
//                       View on map
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
        
//         {/* Show shimmer for next activity */}
//         {shouldShowShimmer && (
//           <ActivityShimmer key="loading-shimmer" />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }



// import React, { useEffect, useState } from 'react';
// import { MapPin, Clock, Bus } from 'lucide-react';
// import { DayPlan, Activity } from '../../types/itinerary';
// import { format } from 'date-fns';
// import { findPlace } from '../../services/places';
// import { ActivityShimmer } from '../ui/Shimmer';
// import { AnimatePresence, motion } from 'framer-motion';

// interface DayTimelineProps {
//   day: DayPlan;
//   onLocationSelect: (locationId: string) => void;
//   selectedLocationId?: string;
//   isLoading?: boolean;
//   previousDayComplete?: boolean;
//   dayNumber: number;
// }

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

// export function DayTimeline({ 
//   day, 
//   onLocationSelect,
//   selectedLocationId,
//   isLoading = false,
//   previousDayComplete = true,
//   dayNumber
// }: DayTimelineProps) {
//   const [lastActivityCount, setLastActivityCount] = useState(0);
//   const [showShimmer, setShowShimmer] = useState(true);
//   const [isFirstLoad, setIsFirstLoad] = useState(true);

//   useEffect(() => {
//     // First time activities load
//     if (isFirstLoad && day.activities.length > 0) {
//       setLastActivityCount(day.activities.length);
//       setIsFirstLoad(false);
//       // Keep shimmer if there might be more activities
//       setShowShimmer(isLoading);
//     }
//     // New activities added
//     else if (!isFirstLoad && day.activities.length > lastActivityCount) {
//       setLastActivityCount(day.activities.length);
//       // Show shimmer for potential next activity only if still loading
//       setShowShimmer(isLoading);
//     }
//   }, [day.activities.length, lastActivityCount, isFirstLoad, isLoading]);

//   const handleMapsClick = async (e: React.MouseEvent, location: any) => {
//     e.stopPropagation();
//     try {
//       const mapsUrl = await findPlace(location);
//       window.open(mapsUrl, '_blank');
//     } catch (error) {
//       console.error('Error opening maps:', error);
//     }
//   };

//   // Show single shimmer for days waiting on previous days
//   if (!previousDayComplete) {
//     return (
//       <div className="space-y-6">
//         <ActivityShimmer />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <AnimatePresence mode="sync">
//         {/* Render existing activities */}
//         {day.activities.map((activity) => (
//           <ActivityCard
//             key={activity.id}
//             activity={activity}
//             isSelected={selectedLocationId === activity.location.id}
//             onSelect={() => onLocationSelect(activity.location.id)}
//             onMapsClick={(e) => handleMapsClick(e, activity.location)}
//           />
//         ))}
        
//         {/* Show shimmer for next potential activity */}
//         {showShimmer && (
//           <ActivityShimmer key="loading-shimmer" />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }





// import React from 'react';
// import { MapPin, Clock, Bus } from 'lucide-react';
// import { DayPlan } from '../../types/itinerary';
// import { format } from 'date-fns';
// import { findPlace } from '../../services/places';
// import { Shimmer, ShimmerText } from '../ui/Shimmer';

// interface DayTimelineProps {
//   day: DayPlan;
//   onLocationSelect: (locationId: string) => void;
//   selectedLocationId?: string;
//   isLoading?: boolean;
// }

// function LoadingActivity() {
//   return (
//     <div className="relative flex gap-4">
//       <Shimmer className="w-5 h-5 rounded-full bg-gray-200 mt-1" />
//       <div className="flex-1">
//         <div className="p-4 border border-gray-200 rounded-lg space-y-4">
//           <div className="flex items-start justify-between">
//             <div className="space-y-2">
//               <ShimmerText className="w-48 h-5" />
//               <ShimmerText className="w-32 h-4" />
//             </div>
//           </div>
//           <div className="flex gap-4">
//             <ShimmerText className="w-24 h-4" />
//             <ShimmerText className="w-24 h-4" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export function DayTimeline({ 
//   day, 
//   onLocationSelect,
//   selectedLocationId,
//   isLoading = false
// }: DayTimelineProps) {
//   const formattedDate = day.date ? format(new Date(day.date), 'EEEE, MMMM d') : '';

//   const handleMapsClick = async (e: React.MouseEvent, location: any) => {
//     e.stopPropagation();
//     try {
//       const mapsUrl = await findPlace(location);
//       window.open(mapsUrl, '_blank');
//     } catch (error) {
//       console.error('Error opening maps:', error);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         {[...Array(3)].map((_, i) => (
//           <LoadingActivity key={i} />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="relative">
//       {/* Timeline line */}
//       {/* <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gray-200" /> */}

//       {/* Activities */}
//       <div className="space-y-6">
//         {day.activities.map((activity, index) => (
//           <div key={activity.id} className="relative flex gap-4">
//             {/* Timeline dot */}
//             <div className="w-[20px] h-[20px] rounded-full bg-blue-500 border-4 border-white shadow-sm z-10 mt-1" />

//             {/* Activity card */}
//             <div className="flex-1">
//               <div 
//                 className={`p-4 rounded-lg border transition-colors cursor-pointer ${
//                   selectedLocationId === activity.location.id
//                     ? 'border-blue-500 bg-blue-50'
//                     : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
//                 }`}
//                 onClick={() => onLocationSelect(activity.location.id)}
//               >
//                 <div className="flex items-start justify-between mb-2">
//                   <div>
//                     <h4 className="font-medium text-gray-900 flex items-center gap-2">
//                       <span className="text-xl">{activity.icon}</span>
//                       {activity.name}
//                     </h4>
//                     <p className="text-sm text-gray-500 mt-1">
//                       {activity.location.description}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
//                   <div className="flex items-center gap-1.5">
//                     <Clock size={14} />
//                     <span>{activity.startTime}</span>
//                     <span className="text-gray-400 mx-1">•</span>
//                     <span>{activity.duration}</span>
//                   </div>

//                   {activity.transport && (
//                     <div className="flex items-center gap-1.5">
//                       <Bus size={14} />
//                       <span>{activity.transport}</span>
//                       {activity.travelTime && (
//                         <>
//                           <span className="text-gray-400 mx-1">•</span>
//                           <span>{activity.travelTime}</span>
//                         </>
//                       )}
//                     </div>
//                   )}

//                   <div className="flex items-center gap-1.5">
//                     <MapPin size={14} />
//                     <button 
//                       onClick={(e) => handleMapsClick(e, activity.location)}
//                       className="text-blue-600 hover:text-blue-800"
//                     >
//                       View on map
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



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