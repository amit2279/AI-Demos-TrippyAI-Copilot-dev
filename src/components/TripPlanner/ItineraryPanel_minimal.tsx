import React, { useState, useEffect, useRef } from 'react';
import { Itinerary, TripDetails } from '../../types/itinerary';
import { PlannerWizard } from './PlannerWizard';
import { generateItinerary } from '../../services/itinerary/builder';
import styles from '../../ItineraryPanel.module.css' // Add a CSS module if you have one


interface ItineraryPanelProps {
  itinerary: Partial<Itinerary>;
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
  onLocationsUpdate?: (locations: any[]) => void;
  streamingActivity?: boolean;
  onItineraryUpdate?: (itinerary: Partial<Itinerary>, streamingActivity?: boolean) => void;
}

// Add this at the top of your file or in a CSS module
const panelStyles = {
  container: {
    width: '600px',
    maxWidth: '100%',
    position: 'relative',
    height: '100%'
  }
};

export function ItineraryPanel({ 
  itinerary, 
  onLocationSelect,
  selectedLocationId,
  onLocationsUpdate,
  streamingActivity = false,
  onItineraryUpdate
}: ItineraryPanelProps) {
  console.log("ItineraryPanel rendering with:", { 
    itinerary, 
    hasDestination: !!itinerary.tripDetails?.destination,
    days: itinerary.days?.length
  });
  
  const [tripPlannerError, setTripPlannerError] = useState<string | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<Partial<Itinerary>>(itinerary);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  
  // Update local state when prop changes
  useEffect(() => {
    setCurrentItinerary(itinerary);
  }, [itinerary]);
  
  // Log updates to the itinerary
  useEffect(() => {
    console.log("Itinerary updated:", currentItinerary);
    console.log("Days in itinerary:", currentItinerary.days?.length);
  }, [currentItinerary]);

  // Handle trip planner submission
  const handleTripPlannerSubmit = (details: TripDetails) => {
    console.log("Trip planner submit with details:", details);
    setTripPlannerError(null);
    setIsGeneratingItinerary(true);
    
    // Initialize with trip details
    const initialItinerary = {
      tripDetails: {
        destination: details.destination,
        startDate: details.startDate?.toISOString(),
        endDate: details.endDate?.toISOString(),
        travelGroup: details.travelGroup
      },
      days: [] // Add empty days array to ensure correct structure
    };
    
    // Update local state immediately
    setCurrentItinerary(initialItinerary);
    
    // Send update to parent if callback exists
    if (onItineraryUpdate) {
      console.log("Initializing itinerary with trip details");
      onItineraryUpdate(initialItinerary, false);
    }
    
    // Start generating itinerary
    console.log("Starting itinerary generation with generateItinerary");
/*     generateItinerary(details, (partialItinerary, isStreaming) => {
      console.log("Received partial itinerary update:", partialItinerary);
      console.log("Is streaming:", isStreaming);
      console.log("Days in partial update:", partialItinerary.days?.length);
      
      // Update local state
      setCurrentItinerary(partialItinerary);
      
      // Forward all updates to parent component
      if (onItineraryUpdate) {
        console.log("Forwarding update to parent");
        onItineraryUpdate(partialItinerary, isStreaming);
      }
      
      // Update map locations when activities are available
      if (onLocationsUpdate && partialItinerary.days) {
        const allLocations = partialItinerary.days.flatMap(day => 
          day.activities?.map(activity => activity.location) || []
        );
        if (allLocations.length > 0) {
          console.log("Updating map with locations:", allLocations.length);
          onLocationsUpdate(allLocations);
        }
      }
    }).catch(error => {
      console.error('Error generating itinerary:', error);
      setTripPlannerError('Failed to generate itinerary. Please try again.');
    }).finally(() => {
      setIsGeneratingItinerary(false);
    }); */
    // Inside generateItinerary callback in ItineraryPanel_minimal.tsx
    generateItinerary(details, (partialItinerary, isStreaming) => {
      console.log("[ItineraryPanel][DEBUG] Received partial itinerary update:", {
        hasDestination: !!partialItinerary.tripDetails?.destination,
        daysCount: partialItinerary.days?.length || 0,
        isStreaming
      });
      
      // Update local state
      setCurrentItinerary(partialItinerary);
      
      // Forward all updates to parent component
      if (onItineraryUpdate) {
        console.log("[ItineraryPanel][DEBUG] Forwarding update to parent");
        onItineraryUpdate(partialItinerary, isStreaming);
      }
      
      // Update map locations when activities are available
      if (onLocationsUpdate && partialItinerary.days) {
        const allLocations = partialItinerary.days.flatMap(day => 
          day.activities?.map(activity => activity.location) || []
        );
        
        console.log("[ItineraryPanel][DEBUG] Extracted", allLocations.length, "locations from itinerary");
        
        if (allLocations.length > 0) {
          // Log some details about first location to help diagnose any issues
          console.log("[ItineraryPanel][DEBUG] First location sample:", {
            id: allLocations[0].id,
            name: allLocations[0].name,
            hasPosition: !!allLocations[0].position,
            position: allLocations[0].position
          });
          
          console.log("[ItineraryPanel][DEBUG] Calling onLocationsUpdate with", allLocations.length, "locations");
          onLocationsUpdate(allLocations);
        }
      }
    }).catch(error => {
      console.error('[ItineraryPanel][DEBUG] Error generating itinerary:', error);
      setTripPlannerError('Failed to generate itinerary. Please try again.');
    }).finally(() => {
      setIsGeneratingItinerary(false);
    });
  };

  console.log("Rendering PlannerWizard with itinerary containing days:", currentItinerary.days?.length);
  
  // Always render PlannerWizard
  return (
    <div className={styles.container}>
    <PlannerWizard 
      onSubmit={handleTripPlannerSubmit}
      isLoading={isGeneratingItinerary}
      error={tripPlannerError}
      itinerary={currentItinerary}
      onLocationSelect={onLocationSelect}
      selectedLocationId={selectedLocationId}
      streamingActivity={streamingActivity}
      onItineraryUpdate={onItineraryUpdate}
      // Make sure to pass onLocationsUpdate to PlannerWizard
      onLocationsUpdate={onLocationsUpdate}
      // We explicitly set that we're generating an itinerary to help PlannerWizard know when
      // to transition to results view
      isGeneratingItinerary={isGeneratingItinerary}
      // Pass a flag to indicate if we should auto-transition
      shouldShowResults={!!currentItinerary.tripDetails?.destination}
    />
  </div>
  );
}

/* <div 
     className={styles.container}>
      <PlannerWizard 
        onSubmit={handleTripPlannerSubmit}
        isLoading={isGeneratingItinerary}
        error={tripPlannerError}
        itinerary={currentItinerary}
        onLocationSelect={onLocationSelect}
        selectedLocationId={selectedLocationId}
        streamingActivity={streamingActivity}
        onItineraryUpdate={onItineraryUpdate}
        // We explicitly set that we're generating an itinerary to help PlannerWizard know when
        // to transition to results view
        isGeneratingItinerary={isGeneratingItinerary}
        // Pass a flag to indicate if we should auto-transition
        shouldShowResults={!!currentItinerary.tripDetails?.destination}
      />
    </div> */