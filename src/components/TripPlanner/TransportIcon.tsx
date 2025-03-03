import React from 'react';
import { 
  Car, 
  Plane, 
  Bus, 
  Train, 
  Ship, 
  Bike, 
  Footprints 
} from 'lucide-react';

interface TransportIconProps {
  type: string;
  className?: string;
}

export function TransportIcon({ type, className }: TransportIconProps) {
  // Check if type is undefined or empty
  if (!type) {
    return <Car className={className} />;
  }
  
  // Normalize the transport type to handle different cases and variations
  const normalizedType = type.toLowerCase().trim();
  
  // Match the icon based on the transport type
  if (normalizedType.includes('car') || normalizedType.includes('taxi') || normalizedType.includes('drive')) {
    return <Car className={className} />;
  }
  
  if (normalizedType.includes('flight') || normalizedType.includes('plane') || normalizedType.includes('air')) {
    return <Plane className={className} />;
  }
  
  if (normalizedType.includes('bus')) {
    return <Bus className={className} />;
  }
  
  if (normalizedType.includes('train') || normalizedType.includes('rail')) {
    return <Train className={className} />;
  }
  
  if (normalizedType.includes('boat') || normalizedType.includes('ship') || normalizedType.includes('ferry')) {
    return <Ship className={className} />;
  }
  
  if (normalizedType.includes('bike') || normalizedType.includes('cycle')) {
    return <Bike className={className} />;
  }
  
  if (normalizedType.includes('walk') || normalizedType.includes('foot')) {
    return <Footprints className={className} />;
  }
  
  // Default to car if no match
  return <Car className={className} />;
}