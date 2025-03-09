import React from 'react';
import { MapPin, GripHorizontal } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Place, DayContainer } from './personalizedPlannerTypes';
import { useDroppable } from '@dnd-kit/core';

// Sortable Place Item Component
/* export function SortablePlaceItem({ place, index, containerId }: { place: Place, index: number, containerId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `${containerId}-place-${place.id}`,
    data: {
      place,
      index,
      containerId
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 rounded-lg p-3 flex items-start gap-3 bg-white"
      {...attributes}
      {...listeners}
    >
      <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0">
      </div>
      <div className="flex-1">
        <h5 className="font-medium">{place.name}</h5>
        <p className="text-sm text-gray-500">{place.city}, {place.country}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <span>★ {place.rating}</span>
          <span className="mx-1">•</span>
          <span>{place.reviews} reviews</span>
        </div>
      </div>
      <div className="text-gray-400">
        <GripHorizontal size={16} />
      </div>
    </div>
  );
} */

// In PersonalizedPlannerDndComponents.tsx, update the SortablePlaceItem
// 4. Fix the SortablePlaceItem to handle expanded layout better:

export function SortablePlaceItem({ 
  place, 
  index, 
  containerId,
  uniqueKey = '',
  useExpandedLayout = false
}: { 
  place: Place, 
  index: number, 
  containerId: string,
  uniqueKey?: string,
  useExpandedLayout?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `${containerId}-place-${place.id}${uniqueKey ? `-${uniqueKey}` : ''}`,
    data: {
      place,
      index,
      containerId
    }
  });
  
  // Apply styles for transform
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
    transformOrigin: '0 0'
  };
  
  if (useExpandedLayout) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border border-gray-200 rounded-lg overflow-hidden bg-white cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="h-48 bg-gray-200 relative">
          {place.image ? (
            <img 
              src={place.image} 
              alt={place.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.src = `https://source.unsplash.com/featured/300x200/?${encodeURIComponent(place.name)}`;
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <MapPin size={24} className="text-gray-400" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h5 className="font-medium text-lg">{place.name}</h5>
          <p className="text-gray-500 mb-2">{place.city}, {place.country}</p>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span>★ {place.rating}</span>
            <span className="mx-1">•</span>
            <span>{place.reviews} reviews</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Original compact layout
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 rounded-lg p-3 flex items-start gap-3 bg-white cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
        {place.image ? (
          <img 
            src={place.image} 
            alt={place.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://source.unsplash.com/featured/100x100/?${encodeURIComponent(place.name)}`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <MapPin size={16} className="text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h5 className="font-medium">{place.name}</h5>
        <p className="text-sm text-gray-500">{place.city}, {place.country}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <span>★ {place.rating}</span>
          <span className="mx-1">•</span>
          <span>{place.reviews} reviews</span>
        </div>
      </div>
      <div className="text-gray-400">
        <GripHorizontal size={16} />
      </div>
    </div>
  );
}

// Sortable Day Container Component
/* export function SortableDayContainer({ day, index }: { day: DayContainer, index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: day.id,
    data: {
      type: 'day',
      day,
      index
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0
  }; */
  // In PersonalizedPlannerDndComponents.tsx
  export function SortableDayContainer({ day, index, isHighlighted = false }: { 
    day: DayContainer, 
    index: number,
    isHighlighted?: boolean
  }) {
    const {
      attributes,
      listeners,
      setNodeRef: setSortableRef,
      transform,
      transition,
      isDragging
    } = useSortable({
      id: day.id,
      data: {
        type: 'day',
        day,
        index
      }
    });
    
    // Add this to make the content area droppable
    const { setNodeRef: setDroppableRef } = useDroppable({
      id: day.id
    });
    
    // Combine refs
    const setNodeRef = (node: HTMLElement | null) => {
      setSortableRef(node);
    };
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
      zIndex: isDragging ? 1 : 0,
      borderColor: isHighlighted ? '#60a5fa' : 'transparent', // blue-400 equivalent
      borderWidth: '2px',
      borderStyle: 'solid',
      // The container already has border-radius from its class
    };

  // Create sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 rounded-lg bg-white overflow-hidden mb-6"
    >
      {/* Day Header - Draggable */}
      <div 
        className="bg-gray-100 p-3 flex items-center justify-between"
        {...attributes}
        {...listeners}
      >
        <h4 className="font-medium">
          Day {day.dayNumber}: {day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </h4>
        <GripHorizontal size={16} className="text-gray-400" />
      </div>
      
      {/* Day Content - Droppable for places */}
      <div 
        ref={setDroppableRef}
        className="p-4"
      >
        {day.places.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <MapPin size={24} className="text-gray-400 mb-2" />
            <p className="text-gray-500">Drag and drop places here to add to your day</p>
          </div>
        ) : (
          // Remove the nested DndContext - just use SortableContext directly
          <SortableContext 
            items={day.places.map((place, index) => `${day.id}-place-${place.id}-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {day.places.map((place, index) => (
                <SortablePlaceItem 
                  key={`${day.id}-place-${place.id}-${index}`}
                  place={place}
                  index={index}
                  containerId={day.id}
                  uniqueKey={`${index}`}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

/* // Draggable Place Overlay (visual during drag)
export function PlaceOverlay({ place }: { place: Place }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 flex items-start gap-3 bg-white shadow-md">
      <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0">
      </div>
      <div className="flex-1">
        <h5 className="font-medium">{place.name}</h5>
        <p className="text-sm text-gray-500">{place.city}, {place.country}</p>
      </div>
    </div>
  );
} */

// Draggable Place Overlay (visual during drag)
export function PlaceOverlay({ place }: { place: Place }) {
  return (
    <div className="border-2 border-blue-400 rounded-lg p-3 flex items-start gap-3 bg-white shadow-lg">
      <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
        {place.image ? (
          <img 
            src={place.image} 
            alt={place.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <MapPin size={16} className="text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h5 className="font-medium">{place.name}</h5>
        <p className="text-sm text-gray-500">{place.city}, {place.country}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <span>★ {place.rating}</span>
          <span className="mx-1">•</span>
          <span>{place.reviews} reviews</span>
        </div>
      </div>
    </div>
  );
}

// Draggable Day Overlay (visual during drag)
export function DayOverlay({ day }: { day: DayContainer }) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-md overflow-hidden">
      <div className="bg-gray-100 p-3">
        <h4 className="font-medium">
          Day {day.dayNumber}: {day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </h4>
      </div>
    </div>
  );
}