export const MAP_ZOOM_LEVELS = {
  WORLD: 2,
  CONTINENT: 4,
  COUNTRY: 6,
  REGION: 4,
  CITY: 12,
  DETAIL: 17
} as const;

export const MAP_ANIMATION_TIMINGS = {
  PRE_ANIMATION_DELAY: 500,
  ZOOM_DURATION: 2000,
  REGION_ZOOM_DURATION: 2000,
  DETAIL_ZOOM_DURATION: 2000
} as const;

export const DEFAULT_CENTER = {
  lat: 20,
  lng: 0
} as const;

// Distance thresholds in degrees (rough approximation)
export const DISTANCE_THRESHOLDS = {
  DIFFERENT_CONTINENT: 50,
  DIFFERENT_COUNTRY: 20,
  DIFFERENT_REGION: 5
} as const;

export const BOUNDS_PADDING = {
  SINGLE: 0.1,    // 10% padding for single location
  MULTIPLE: 0.15,  // 20% padding for multiple locations
  REGION: 0.18     // 30% padding for region view
} as const;

export const MAP_ANIMATION_DURATION = {
  ZOOM_OUT: 750,
  ZOOM_IN: 1500,
  TRANSITION_DELAY: 800
} as const;



