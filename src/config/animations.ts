export const ANIMATIONS = {
    // Card animations
    CARD_FADE_DURATION: 150,
    CARD_DELAY_BETWEEN: 50,
    
    // Map animations
    PIN_DROP_DURATION: 500,
    MAP_FLIGHT_DURATION: 1500,
    PIN_HOVER_SCALE: 1,
    
    // Loading animations
    LOADING_GRADIENT_DURATION: 2000,
    
    // State transitions
    PROCESSING_DURATION: 1000,
    FLYING_DURATION: 1500,
    DISCOVERING_DURATION: 1000
  } as const;
  
  export const ANIMATION_CLASSES = {
    GRADIENT_LOADER: 'animate-gradient-loading',
    CARD_FADE: 'animate-card-fade',
    PIN_DROP: 'animate-pin-drop'
  } as const;