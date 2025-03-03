import React from 'react';
import { Itinerary } from '../../types/itinerary';
import { MapCalendarOptions } from './MapCalendarOptions';
import { ExportItinerary } from './ExportItinerary';

interface ItineraryHeaderActionsProps {
  itinerary: Partial<Itinerary>;
}

export function ItineraryHeaderActions({ itinerary }: ItineraryHeaderActionsProps) {
  return (
    <div className="absolute bottom-20 right-6 flex items-center gap-2 z-10">
      <MapCalendarOptions itinerary={itinerary} />
      <ExportItinerary itinerary={itinerary} />
    </div>
  );
}