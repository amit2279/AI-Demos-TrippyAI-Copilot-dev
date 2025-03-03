import React from 'react';
import { Itinerary } from '../../types/itinerary';
import { Calendar, Download, Map, Share2, Printer } from 'lucide-react';

interface ItineraryToolbarProps {
  itinerary: Partial<Itinerary>;
}

export function ItineraryToolbar({ itinerary }: ItineraryToolbarProps) {
  // Function to open all locations in Google Maps
  /* const openInGoogleMaps = () => {
    const locations = itinerary.days?.flatMap(day => 
      day.activities?.map(act => act.location) || []
    ).filter(loc => !!loc) || [];
    
    if (locations.length === 0) {
      alert('No locations found in the itinerary');
      return;
    }
    
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
  }; */
const openInGoogleMaps = () => {
    const locations = itinerary.days?.flatMap(day => 
    day.activities?.map(act => act.location) || []
    ).filter(loc => !!loc) || [];
    
    if (locations.length === 0) return;
    
    // For a single location, use search instead of directions
    if (locations.length === 1 && locations[0]) {
    const loc = locations[0];
    // Use more reliable query format without additional text
    let locName = loc.name.replace(/^lastminute\.com\s+/i, ''); // Remove prefixes like lastminute.com
    locName = locName.split(',')[0]; // Take only the main part before any commas
    
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName)}`;
    window.open(url, '_blank');
    return;
    }
    
    // For multiple locations, clean up addresses for better directions
    try {
    // Get first and last locations as origin and destination
    const origin = locations[0];
    const destination = locations[locations.length - 1];
    
    // Clean up location names for better geocoding
    const cleanLocationName = (name) => {
        let cleaned = name.replace(/^lastminute\.com\s+/i, '');
        // Keep address parts with postcodes (typically after the comma)
        return cleaned;
    };
    
    // Build directions URL with cleaned names
    const originName = cleanLocationName(origin.name);
    const destName = cleanLocationName(destination.name);
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destName)}`;
    
    // Add waypoints if needed (limit to 8 as Google only supports 10 waypoints in URL)
    const waypoints = locations.slice(1, -1).slice(0, 8);
    if (waypoints.length > 0) {
        const waypointNames = waypoints.map(wp => cleanLocationName(wp.name));
        url += `&waypoints=${encodeURIComponent(waypointNames.join('|'))}`;
    }
    
    window.open(url, '_blank');
    } catch (error) {
    console.error('Error opening Google Maps:', error);
    
    // Fallback to just showing the first location
    const firstLocation = locations[0];
    const locName = firstLocation.name.split(',')[0]; // Take only the main part
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName)}`;
    window.open(url, '_blank');
    }
};  
  // Function to open in Apple Maps
  const openInAppleMaps = () => {
    const locations = itinerary.days?.flatMap(day => 
      day.activities?.map(act => act.location) || []
    ).filter(loc => !!loc) || [];
    
    if (locations.length === 0) {
      alert('No locations found in the itinerary');
      return;
    }
    
    // Apple Maps uses a different format
    if (locations.length === 1 && locations[0]) {
      const loc = locations[0];
      const url = `https://maps.apple.com/?q=${encodeURIComponent(loc.name)}`;
      window.open(url, '_blank');
      return;
    }
    
    // For multiple locations we'll show all as search results
    // This isn't ideal but Apple Maps doesn't support complex routes in URLs
    const firstLocation = locations[0].name;
    const url = `https://maps.apple.com/?q=${encodeURIComponent(firstLocation)}`;
    window.open(url, '_blank');
  };
  
  // Function to add to Google Calendar
  const addToGoogleCalendar = () => {
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
            `- ${act.startTime || ''} ${act.title || act.name || 'Activity'}`
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
  };
  
  // Function to add to Apple Calendar (iCal format)
  const addToAppleCalendar = () => {
    try {
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
              
              try {
                // Try to parse activity start time
                if (act.startTime) {
                  // Handle various time formats
                  let timeString = act.startTime;
                  if (typeof timeString === 'string' && timeString.match(/^\d{1,2}:\d{2}$/)) {
                    // If it's just a time like "09:00", add the day's date
                    const dayDate = day.date ? new Date(day.date) : new Date();
                    const [hours, minutes] = timeString.split(':').map(n => parseInt(n));
                    dayDate.setHours(hours, minutes);
                    timeString = dayDate.toISOString();
                  }
                  
                  const parsedStartTime = new Date(timeString);
                  if (!isNaN(parsedStartTime.getTime())) {
                    startDate = parsedStartTime;
                    
                    // Calculate end time
                    let durationMinutes = 60; // Default 1 hour
                    
                    if (act.duration) {
                      if (typeof act.duration === 'number') {
                        durationMinutes = act.duration;
                      } else {
                        // Try to extract number from string like "45 minutes"
                        const durationMatch = String(act.duration).match(/(\d+)/);
                        if (durationMatch) {
                          durationMinutes = parseInt(durationMatch[1]);
                        }
                      }
                    }
                    
                    endDate = new Date(startDate.getTime() + durationMinutes * 60000);
                    
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
              } catch (err) {
                console.error('Error processing activity date:', err);
                // Continue to next activity
              }
            });
          }
        });
      }
      
      // If no events were added, create a single event for the whole trip
      if (!events) {
        try {
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
        } catch (err) {
          console.error('Error creating trip event:', err);
          alert('Could not create calendar event. Please check your trip dates.');
          return;
        }
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
    } catch (error) {
      console.error('Error adding to Apple Calendar:', error);
      alert('Could not add to Apple Calendar. Please try again.');
    }
  };
  
  // Function to create and download a PDF
  const downloadItinerary = () => {
    // In a real implementation, you'd use a library like jsPDF or html2pdf
    // This is a simplified version that creates an HTML file instead
    try {
      const destination = itinerary.tripDetails?.destination || 'Your Trip';
      const startDate = itinerary.tripDetails?.startDate 
        ? new Date(itinerary.tripDetails.startDate).toLocaleDateString() 
        : '';
      const endDate = itinerary.tripDetails?.endDate 
        ? new Date(itinerary.tripDetails.endDate).toLocaleDateString()
        : '';
      const travelGroup = itinerary.tripDetails?.travelGroup || '';
      
      let daysHTML = '';
      
      if (itinerary.days) {
        itinerary.days.forEach((day, index) => {
          const dayDate = day.date 
            ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            : `Day ${index + 1}`;
          
          let activitiesHTML = '';
          if (day.activities && day.activities.length > 0) {
            day.activities.forEach(activity => {
              const startTime = activity.startTime || '';
              const duration = activity.duration || '';
              
              activitiesHTML += `
                <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                  <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">${activity.title || activity.name || 'Activity'}</h3>
                  <p style="color: #6b7280; margin-bottom: 1rem;">${activity.description || ''}</p>
                  <div style="display: flex; flex-wrap: wrap; gap: 1rem; color: #6b7280; font-size: 0.875rem;">
                    ${startTime ? `<div>${startTime}</div>` : ''}
                    ${duration ? `<div>• ${duration}</div>` : ''}
                    ${activity.transport ? `<div>• ${activity.transport}</div>` : ''}
                    ${activity.location?.name ? `<div>• ${activity.location.name}</div>` : ''}
                  </div>
                </div>
              `;
            });
          } else {
            activitiesHTML = '<p>No activities planned for this day.</p>';
          }
          
          daysHTML += `
            <div style="margin-bottom: 2rem;">
              <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;">
                ${dayDate}
              </h2>
              ${activitiesHTML}
            </div>
          `;
        });
      }
      
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Itinerary for ${destination}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.5;
              color: #1f2937;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
            }
            h1 {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
            }
            .trip-info {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              margin-bottom: 2rem;
              color: #6b7280;
            }
            .trip-info > div {
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            .days-container {
              margin-top: 2rem;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right; margin-bottom: 1rem;">
            <button onclick="window.print()" style="padding: 0.5rem 1rem; background-color: #f3f4f6; border: none; border-radius: 0.375rem; cursor: pointer;">
              Print
            </button>
          </div>
          
          <h1>Trip to ${destination}</h1>
          <div class="trip-info">
            ${startDate && endDate ? `<div>${startDate} - ${endDate}</div>` : ''}
            ${travelGroup ? `<div>• ${travelGroup}</div>` : ''}
          </div>
          
          <div class="days-container">
            ${daysHTML}
          </div>
          
          <div style="margin-top: 3rem; text-align: center; color: #9ca3af; font-size: 0.875rem;">
            Created with Tripper - Your AI Travel Companion
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Itinerary-${destination.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading itinerary:', error);
      alert('Could not download itinerary. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
    <div className="text-sm font-medium text-gray-500">
      Itinerary Tools
    </div>
    
    <div className="flex items-center gap-3">
      {/* Maps Group */}
        <div className="flex rounded-md overflow-hidden border border-gray-200 shadow-sm">
        <button 
            onClick={openInGoogleMaps}
            title="Open in Google Maps"
            className="p-2.5 flex items-center justify-center bg-white hover:bg-gray-50" // Increased padding
        >
            <img 
            src="/assets/icons/google-maps.svg" 
            alt="Google Maps" 
            className="w-6 h-6" // Increased from w-5 h-5 to w-6 h-6
            onError={(e) => {/* fallback */}}
            />
        </button>
        
        <button 
            onClick={openInAppleMaps}
            title="Open in Apple Maps"
            className="p-2.5 flex items-center justify-center bg-white hover:bg-gray-50 border-l border-gray-200" // Increased padding
        >
            <img 
            src="/assets/icons/apple-maps.svg" 
            alt="Apple Maps" 
            className="w-6 h-6" // Increased from w-5 h-5 to w-6 h-6
            onError={(e) => {/* fallback */}}
            />
        </button>
        </div>
  
      {/* Calendar Group */}
      <div className="flex rounded-md overflow-hidden border border-gray-200 shadow-sm">
        <button 
          onClick={addToGoogleCalendar}
          title="Add to Google Calendar"
          className="p-2 flex items-center justify-center bg-white hover:bg-gray-50"
        >
          <img 
            src="/assets/icons/google-calendar.svg" 
            alt="Google Calendar" 
            className="w-5 h-5"
            onError={(e) => {/* fallback */}}
          />
        </button>
        
        <button 
          onClick={addToAppleCalendar}
          title="Add to Apple Calendar"
          className="p-2 flex items-center justify-center bg-white hover:bg-gray-50 border-l border-gray-200"
        >
          <img 
            src="/assets/icons/apple-calendar.svg" 
            alt="Apple Calendar" 
            className="w-5 h-5"
            onError={(e) => {/* fallback */}}
          />
        </button>
      </div>
  
      {/* Export Button */}
      <button 
        onClick={downloadItinerary}
        title="Download Itinerary"
        className="p-2 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-md shadow-sm">
        <Download size={24} className="text-gray-600" />
    </button>
    </div>
  </div>
  );
}