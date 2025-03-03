import React from 'react';
import { Activity } from '../../types/itinerary';
import { MapCalendarOptions } from './MapCalendarOptions';

interface ActivityActionsProps {
  activity: Activity;
}

export function ActivityActions({ activity }: ActivityActionsProps) {
  return (
    <div className="flex justify-end mt-2">
      <MapCalendarOptions activity={activity} itinerary={{}} />
    </div>
  );
}