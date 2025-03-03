import React from 'react';
import { Calendar, Download, Map } from 'lucide-react';
import { Itinerary, DayPlan, Activity } from '../../types/itinerary';

interface MapCalendarOptionsProps {
  itinerary: Partial<Itinerary>;
  activity?: Activity; // Optional - if provided, exports just one activity
}

export function MapCalendarOptions({ itinerary, activity }: MapCalendarOptionsProps) {
  // Function to open all locations in Google Maps
  const openInGoogleMaps = () => {
    const locations = activity 
      ? [activity.location]
      : itinerary.days?.flatMap(day => 
          day.activities?.map(act => act.location) || []
        ).filter(loc => !!loc) || [];
    
    if (locations.length === 0) return;
    
    // For a single location
    if (locations.length === 1 && locations[0]) {
      const loc = locations[0];
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}`;
      window.open(url, '_blank');
      return;
    }
    
    // For multiple locations, create a custom map with waypoints
    let baseUrl = "https://www.google.com/maps/dir/?api=1";
    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1);
    
    let url = `${baseUrl}&origin=${encodeURIComponent(origin.name)}`;
    url += `&destination=${encodeURIComponent(destination.name)}`;
    
    if (waypoints.length > 0) {
      url += `&waypoints=${waypoints.map(wp => encodeURIComponent(wp.name)).join('|')}`;
    }
    
    window.open(url, '_blank');
  };
  
  // Function to open in Apple Maps
  const openInAppleMaps = () => {
    const locations = activity 
      ? [activity.location]
      : itinerary.days?.flatMap(day => 
          day.activities?.map(act => act.location) || []
        ).filter(loc => !!loc) || [];
    
    if (locations.length === 0) return;
    
    // Apple Maps uses a different format
    if (locations.length === 1 && locations[0]) {
      const loc = locations[0];
      const url = `https://maps.apple.com/?q=${encodeURIComponent(loc.name)}`;
      window.open(url, '_blank');
      return;
    }
    
    // For multiple locations - Apple Maps doesn't support multiple waypoints as easily
    // Just open the first location for now
    const url = `https://maps.apple.com/?q=${encodeURIComponent(locations[0].name)}`;
    window.open(url, '_blank');
  };
  
  // Function to open in Waze
  const openInWaze = () => {
    const locations = activity 
      ? [activity.location]
      : itinerary.days?.flatMap(day => 
          day.activities?.map(act => act.location) || []
        ).filter(loc => !!loc) || [];
    
    if (locations.length === 0) return;
    
    // Waze only supports a single destination
    const loc = locations[0];
    const url = `https://waze.com/ul?q=${encodeURIComponent(loc.name)}`;
    window.open(url, '_blank');
  };
  
/*   // Function to add to Google Calendar
  const addToGoogleCalendar = () => {
    if (activity) {
      // Add single activity
      const startTime = activity.startTime || '';
      const duration = activity.duration || 60; // Default 1 hour
      
      // Calculate end time (start time + duration in minutes)
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      
      const event = {
        title: activity.title,
        details: activity.description,
        location: activity.location?.name,
        start: startDate.toISOString().replace(/-|:|\.\d+/g, ''),
        end: endDate.toISOString().replace(/-|:|\.\d+/g, '')
      };
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.details || '')}&location=${encodeURIComponent(event.location || '')}&dates=${event.start}/${event.end}`;
      window.open(url, '_blank');
    } else {
      // Add entire itinerary as an event
      if (!itinerary.tripDetails?.startDate || !itinerary.tripDetails?.endDate) return;
      
      const start = new Date(itinerary.tripDetails.startDate);
      const end = new Date(itinerary.tripDetails.endDate);
      
      const destination = itinerary.tripDetails.destination || '';
      const details = itinerary.days?.map(day => {
        const dayDate = day.date ? new Date(day.date).toLocaleDateString() : '';
        const activities = day.activities?.map(act => 
          `- ${act.startTime ? new Date(act.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} ${act.title}`
        ).join('\n') || '';
        
        return `${dayDate}\n${activities}`;
      }).join('\n\n') || '';
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Trip to ${destination}`)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(destination)}&dates=${start.toISOString().replace(/-|:|\.\d+/g, '')}/${end.toISOString().replace(/-|:|\.\d+/g, '')}`;
      window.open(url, '_blank');
    }
  };
  
  // Function to add to Apple Calendar (iCal format)
  const addToAppleCalendar = () => {
    if (activity) {
      // Generate an .ics file for a single activity
      const startTime = activity.startTime || '';
      const duration = activity.duration || 60; // Default 1 hour
      
      // Calculate end time
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${activity.title}
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
LOCATION:${activity.location?.name || ''}
DESCRIPTION:${activity.description || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${activity.title}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate an .ics file for the entire trip
      if (!itinerary.tripDetails?.startDate || !itinerary.tripDetails?.endDate) return;
      
      const start = new Date(itinerary.tripDetails.startDate);
      const end = new Date(itinerary.tripDetails.endDate);
      const destination = itinerary.tripDetails.destination || '';
      
      // Create events for each activity
      let events = '';
      itinerary.days?.forEach(day => {
        day.activities?.forEach(act => {
          if (!act.startTime) return;
          
          const startDate = new Date(act.startTime);
          const duration = act.duration || 60;
          const endDate = new Date(startDate.getTime() + duration * 60000);
          
          events += `BEGIN:VEVENT
SUMMARY:${act.title}
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
LOCATION:${act.location?.name || ''}
DESCRIPTION:${act.description || ''}
STATUS:CONFIRMED
END:VEVENT
`;
        });
      });
      
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
${events}END:VCALENDAR`;
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `Trip to ${destination}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }; */

  // Function to add to Google Calendar
const addToGoogleCalendar = () => {
  if (activity) {
    // Add single activity
    try {
      // Safely parse dates
      let startDate = new Date();
      let endDate = new Date();
      endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration
      
      if (activity.startTime) {
        // Try to parse the startTime from various formats
        const parsedStartTime = new Date(activity.startTime);
        
        if (!isNaN(parsedStartTime.getTime())) {
          startDate = parsedStartTime;
          
          // Calculate end time based on duration if available
          if (activity.duration) {
            // Duration might be a string like "45 minutes" or a number
            const durationMinutes = typeof activity.duration === 'number' 
              ? activity.duration 
              : parseInt(activity.duration.toString());
              
            if (!isNaN(durationMinutes)) {
              endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            } else {
              // Default to 1 hour if parsing fails
              endDate = new Date(startDate.getTime() + 60 * 60000);
            }
          } else {
            // Default to 1 hour if no duration
            endDate = new Date(startDate.getTime() + 60 * 60000);
          }
        }
      }
      
      // Format dates for Google Calendar URL
      const formattedStart = startDate.toISOString().replace(/-|:|\.\d+/g, '');
      const formattedEnd = endDate.toISOString().replace(/-|:|\.\d+/g, '');
      
      const event = {
        title: activity.title || activity.name || 'Activity',
        details: activity.description || '',
        location: activity.location?.name || '',
        start: formattedStart,
        end: formattedEnd
      };
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}&dates=${event.start}/${event.end}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      alert('Could not add to Google Calendar. Please try again.');
    }
  } else {
    // Add entire itinerary as a single event
    try {
      if (!itinerary.tripDetails?.startDate || !itinerary.tripDetails?.endDate) {
        alert('Trip dates are missing. Please set trip dates first.');
        return;
      }
      
      // Safely parse dates
      const start = new Date(itinerary.tripDetails.startDate);
      const end = new Date(itinerary.tripDetails.endDate);
      
      // Check for valid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert('Invalid trip dates. Please check your trip dates.');
        return;
      }
      
      const destination = itinerary.tripDetails.destination || 'Trip';
      
      // Create description with all activities
      let details = '';
      if (itinerary.days && itinerary.days.length > 0) {
        details = itinerary.days.map(day => {
          const dayDate = day.date ? new Date(day.date).toLocaleDateString() : '';
          const activities = day.activities?.map(act => 
            `- ${act.startTime ? new Date(act.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} ${act.title || act.name}`
          ).join('\n') || '';
          
          return `${dayDate}\n${activities}`;
        }).join('\n\n');
      }
      
      // Format dates for Google Calendar URL
      const formattedStart = start.toISOString().replace(/-|:|\.\d+/g, '');
      const formattedEnd = end.toISOString().replace(/-|:|\.\d+/g, '');
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Trip to ${destination}`)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(destination)}&dates=${formattedStart}/${formattedEnd}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      alert('Could not add to Google Calendar. Please try again.');
    }
  }
};

// Function to add to Apple Calendar (iCal format)
const addToAppleCalendar = () => {
  try {
    if (activity) {
      // Generate an .ics file for a single activity
      let startDate = new Date();
      let endDate = new Date();
      endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration
      
      if (activity.startTime) {
        // Try to parse the startTime
        const parsedStartTime = new Date(activity.startTime);
        
        if (!isNaN(parsedStartTime.getTime())) {
          startDate = parsedStartTime;
          
          // Calculate end time based on duration if available
          if (activity.duration) {
            // Duration might be a string like "45 minutes" or a number
            const durationMatch = String(activity.duration).match(/(\d+)/);
            const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
            
            if (!isNaN(durationMinutes)) {
              endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            } else {
              // Default to 1 hour if parsing fails
              endDate = new Date(startDate.getTime() + 60 * 60000);
            }
          } else {
            // Default to 1 hour if no duration
            endDate = new Date(startDate.getTime() + 60 * 60000);
          }
        }
      }
      
      // Format dates for iCal
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${activity.title || activity.name || 'Activity'}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
LOCATION:${activity.location?.name || ''}
DESCRIPTION:${activity.description || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
      
      // Generate download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${activity.title || activity.name || 'Activity'}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate an .ics file for the entire trip with multiple events
      if (!itinerary.tripDetails?.startDate || !itinerary.tripDetails?.endDate) {
        alert('Trip dates are missing. Please set trip dates first.');
        return;
      }
      
      const destination = itinerary.tripDetails.destination || 'Trip';
      
      // Create events for each activity
      let events = '';
      
      if (itinerary.days) {
        itinerary.days.forEach(day => {
          if (day.activities) {
            day.activities.forEach(act => {
              let startDate = new Date();
              let endDate = new Date(startDate.getTime() + 60 * 60000); // Default 1 hour duration
              
              // Try to parse activity start time
              if (act.startTime) {
                const parsedStartTime = new Date(act.startTime);
                if (!isNaN(parsedStartTime.getTime())) {
                  startDate = parsedStartTime;
                  
                  // Calculate end time
                  if (act.duration) {
                    const durationMatch = String(act.duration).match(/(\d+)/);
                    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
                    
                    if (!isNaN(durationMinutes)) {
                      endDate = new Date(startDate.getTime() + durationMinutes * 60000);
                    } else {
                      endDate = new Date(startDate.getTime() + 60 * 60000);
                    }
                  } else {
                    endDate = new Date(startDate.getTime() + 60 * 60000);
                  }
                  
                  // Format dates for iCal
                  const formatDate = (date: Date) => {
                    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                  };
                  
                  // Add event to ics content
                  events += `BEGIN:VEVENT
SUMMARY:${act.title || act.name || 'Activity'}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
LOCATION:${act.location?.name || ''}
DESCRIPTION:${act.description || ''}
STATUS:CONFIRMED
END:VEVENT
`;
                }
              }
            });
          }
        });
      }
      
      // If no events were added, create a single event for the whole trip
      if (!events) {
        const start = new Date(itinerary.tripDetails.startDate);
        const end = new Date(itinerary.tripDetails.endDate);
        
        // Format dates for iCal
        const formatDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        
        events = `BEGIN:VEVENT
SUMMARY:Trip to ${destination}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
LOCATION:${destination}
DESCRIPTION:Trip to ${destination}
STATUS:CONFIRMED
END:VEVENT
`;
      }
      
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
${events}END:VCALENDAR`;
      
      // Generate download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `Trip to ${destination}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error adding to Apple Calendar:', error);
    alert('Could not add to Apple Calendar. Please try again.');
  }
};
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 divide-x">
        {/* Maps Options */}
        <button 
          onClick={openInGoogleMaps}
          title="Open in Google Maps"
          className="p-2 hover:bg-gray-50"
        >
          <img 
            src="/assets/icons/google-maps.svg" 
            alt="Google Maps" 
            className="w-5 h-5"
            onError={(e) => {
              // Fallback if custom icon fails to load
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4cHgiIGhlaWdodD0iNDhweCI+PHBhdGggZmlsbD0iI2ZiYzAyZCIgZD0iTTQzLjYxMSwyMC4wODNIMDMuODAyEM8L3N2Zz4="; 
            }}
          />
        </button>
        <button 
          onClick={openInAppleMaps}
          title="Open in Apple Maps"
          className="p-2 hover:bg-gray-50"
        >
          <img 
            src="/assets/icons/apple-maps.svg" 
            alt="Apple Maps" 
            className="w-5 h-5"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4cHgiIGhlaWdodD0iNDhweCI+PHBhdGggZmlsbD0iI2ZiYzAyZCIgZD0iTTQzLjYxMSwyMC4wODNIMDMuODAyEM8L3N2Zz4="; 
            }}
          />
        </button>
        <button 
          onClick={openInWaze}
          title="Open in Waze"
          className="p-2 hover:bg-gray-50"
        >
          <img 
            src="/assets/icons/waze.svg" 
            alt="Waze" 
            className="w-5 h-5"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.innerHTML = '<Map size={20} />';
            }}
          />
        </button>
      </div>
      
      {/* Calendar Options */}
      <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 divide-x">
        <button 
          onClick={addToGoogleCalendar}
          title="Add to Google Calendar"
          className="p-2 hover:bg-gray-50"
        >
          <img 
            src="/assets/icons/google-calendar.svg" 
            alt="Google Calendar" 
            className="w-5 h-5"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4cHgiIGhlaWdodD0iNDhweCI+PHBhdGggZmlsbD0iI2ZiYzAyZCIgZD0iTTQzLjYxMSwyMC4wODNIMDMuODAyEM8L3N2Zz4="; 
            }}
          />
        </button>
        <button 
          onClick={addToAppleCalendar}
          title="Add to Apple Calendar"
          className="p-2 hover:bg-gray-50"
        >
          <img 
            src="/assets/icons/apple-calendar.svg" 
            alt="Apple Calendar" 
            className="w-5 h-5"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4cHgiIGhlaWdodD0iNDhweCI+PHBhdGggZmlsbD0iI2ZiYzAyZCIgZD0iTTQzLjYxMSwyMC4wODNIMDMuODAyEM8L3N2Zz4="; 
            }}
          />
        </button>
      </div>
    </div>
  );
}