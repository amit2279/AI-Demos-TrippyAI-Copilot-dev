// src/utils/markerUtils.ts
import { icon, divIcon } from 'leaflet';

export const MARKER_COLORS = {
  red: '#FF3B30',
  yellow: '#FFCC00',
  green: '#34C759',
  blue: '#007AFF',
  purple: '#5856D6',
  orange: '#FF9500',
  pink: '#FF2D55'
} as const;

export type MarkerColorKey = keyof typeof MARKER_COLORS;

export const COLOR_SEQUENCE: MarkerColorKey[] = [
  'red', 'yellow', 'green', 'blue', 'purple', 'orange', 'pink'
];

// Keep track of seen markers to know which ones are new
const seenMarkerIds = new Set<string>();

interface CreatePinOptions {
  number?: number;
  color?: MarkerColorKey;
  scale?: number;     // Scale factor for the pin size
  animated?: boolean; // Whether to animate the pin
  id?: string;        // ID of the marker to track if it's new
}

// Reset the seen markers when needed (e.g., when changing locations completely)
export function resetSeenMarkers() {
  seenMarkerIds.clear();
}

// Create an animated pin using divIcon with CSS animation
export function createAnimatedPin({ number, color, scale = 1, id }: CreatePinOptions = {}) {
  const markerColor = color 
    ? MARKER_COLORS[color]
    : number 
      ? MARKER_COLORS[COLOR_SEQUENCE[(number - 1) % COLOR_SEQUENCE.length]]
      : MARKER_COLORS.blue;

  // Base dimensions that will be scaled
  const baseWidth = 40;
  const baseHeight = 56;
  const actualWidth = baseWidth * scale;
  const actualHeight = baseHeight * scale;
  
  const displayNumber = number && number < 10 ? number : number?.toString().padStart(2, '0');
  
  // Check if this marker is new (hasn't been seen before)
  const isNewMarker = id ? !seenMarkerIds.has(id) : false;
  
  // Add to seen markers
  if (id) {
    seenMarkerIds.add(id);
  }
  
  // Only animate if it's a new marker
  const animationClass = isNewMarker ? 'animated' : 'no-animation';
  
  // Create the SVG for the pin
  const svgPin = `
    <svg 
      width="${actualWidth}" 
      height="${actualHeight}" 
      viewBox="0 0 40 56" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      class="pin-svg"
    >
      <!-- Definitions for gradients -->
      <defs>
        <radialGradient id="glossGradient" cx="40%" cy="40%" r="50%" fx="40%" fy="40%">
          <stop offset="0%" style="stop-color:white;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:white;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:white;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:white;stop-opacity:0"/>
        </linearGradient>
      </defs>

      <!-- Shadow (not animated) -->
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      </filter>
      <ellipse 
        cx="20" 
        cy="52" 
        rx="10" 
        ry="4" 
        fill="rgba(0,0,0,0.3)" 
        filter="url(#shadow)" 
        class="pin-shadow ${animationClass}"
      />
      
      <!-- Pin Body with Stroke - This will be animated -->
      <path 
        d="M20 0C11.2 0 4 7.2 4 16C4 28 20 44 20 44C20 44 36 28 36 16C36 7.2 28.8 0 20 0Z" 
        fill="${markerColor}"
        stroke="#FFFFFFFF"
        stroke-width="3"
        stroke-linejoin="round"
        class="pin-body ${animationClass}"
      />

      ${!number ? `
        <!-- Glossy overlay for unnumbered pins -->
        <path 
          d="M20 0C11.2 0 4 7.2 4 16C4 28 20 44 20 44C20 44 36 28 36 16C36 7.2 28.8 0 20 0Z" 
          fill="url(#glossGradient)"
          class="pin-gloss ${animationClass}"
        />
        <path 
          d="M20 0C11.2 0 4 7.2 4 16C4 28 20 44 20 44C20 44 36 28 36 16C36 7.2 28.8 0 20 0Z" 
          fill="url(#shineGradient)" 
          opacity="0.3"
          class="pin-shine ${animationClass}"
        />
      ` : `
        <!-- Text for numbered pins -->
         <text 
          x="50%" 
          y="50%" 
          dy="-8" 
          dx="-0.7"
          font-family="Helvetica, sans-serif" 
          font-size="${number && number > 9 ? '18' : '18'}" 
          font-weight="bold" 
          fill="white" 
          text-anchor="middle" 
          dominant-baseline="middle"
          letter-spacing="-1" 
          class="pin-number ${animationClass}"
        >
          ${displayNumber}
        </text>
      `}
    </svg>
  `;

  // Create a div icon with the animated pin
  return divIcon({
    className: 'animated-marker',
    html: `
      <div class="marker-container">
        <style>
          /* Keyframes for drop and bounce animation */
          @keyframes pinDrop {
            0% {
              transform: translateY(-50px);
              opacity: 0;
            }
            60% {
              transform: translateY(5px);
              opacity: 1;
            }
            75% {
              transform: translateY(-3px);
            }
            90% {
              transform: translateY(2px);
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .animated-marker {
            background: transparent;
            border: none;
          }
          
          .marker-container {
            width: ${actualWidth}px;
            height: ${actualHeight}px;
            position: relative;
          }
          
          .pin-body.animated {
            animation: pinDrop 0.6s ease-out forwards;
            transform-origin: bottom center;
            opacity: 0;
          }
          
          .pin-gloss.animated, .pin-shine.animated, .pin-number.animated {
            animation: pinDrop 0.6s ease-out forwards;
            transform-origin: bottom center;
            opacity: 0;
          }
          
          /* Already seen markers start fully visible */
          .pin-body.no-animation, .pin-gloss.no-animation, .pin-shine.no-animation, .pin-number.no-animation {
            opacity: 1;
          }
          
          /* Shadow opacity control */
          .pin-shadow.animated {
            opacity: 0;
            animation: fadeIn 0.3s ease-out 0.4s forwards;
          }
          
          .pin-shadow.no-animation {
            opacity: 1;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        </style>
        ${svgPin}
      </div>
    `,
    iconSize: [actualWidth, actualHeight],
    iconAnchor: [actualWidth / 2, actualHeight],
    popupAnchor: [0, -actualHeight]
  });
}

// Original function enhanced with animation and tracking
export function createPin({ number, color, scale = 1, animated = false, id }: CreatePinOptions = {}) {
  // If animation is requested and it's a blue marker, use the animated version
  if (animated && (color === 'blue' || (color === undefined && number === undefined))) {
    return createAnimatedPin({ number, color, scale, id });
  }

  const markerColor = color 
    ? MARKER_COLORS[color]
    : number 
      ? MARKER_COLORS[COLOR_SEQUENCE[(number - 1) % COLOR_SEQUENCE.length]]
      : MARKER_COLORS.blue;

  // Base dimensions that will be scaled
  const baseWidth = 40;
  const baseHeight = 56;
  const actualWidth = baseWidth * scale;
  const actualHeight = baseHeight * scale;
  
  const displayNumber = number && number < 10 ? number : number?.toString().padStart(2, '0');
  
  // If this marker has an ID, add it to the seen set
  if (id) {
    seenMarkerIds.add(id);
  }
  
  return icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg 
        width="${actualWidth}" 
        height="${actualHeight}" 
        viewBox="0 0 40 56" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Definitions for gradients -->
        <defs>
          <radialGradient id="glossGradient" cx="40%" cy="40%" r="50%" fx="40%" fy="40%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0.2"/>
            <stop offset="100%" style="stop-color:white;stop-opacity:0"/>
          </radialGradient>
          <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0.2"/>
            <stop offset="100%" style="stop-color:white;stop-opacity:0"/>
          </linearGradient>
        </defs>

        <!-- Shadow -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        </filter>
        <ellipse 
          cx="20" 
          cy="52" 
          rx="10" 
          ry="4" 
          fill="rgba(0,0,0,0.3)" 
          filter="url(#shadow)" 
        />
        
        <!-- Pin Body with Stroke -->
        <path 
          d="M20 0C11.2 0 4 7.2 4 16C4 28 20 44 20 44C20 44 36 28 36 16C36 7.2 28.8 0 20 0Z" 
          fill="${markerColor}"
          stroke="#FFFFFFFF"
          stroke-width="3"
          stroke-linejoin="round"
        />

        ${!number ? `
          <!-- Glossy overlay for unnumbered pins -->
          <path 
            d="M20 0C11.2 0 4 7.2 4 16C4 28 20 44 20 44C20 44 36 28 36 16C36 7.2 28.8 0 20 0Z" 
            fill="url(#glossGradient)"
          />
          <path 
            d="M20 0C11.2 0 4 7.2 4 16C4 28 20 44 20 44C20 44 36 28 36 16C36 7.2 28.8 0 20 0Z" 
            fill="url(#shineGradient)" 
            opacity="0.3"
          />
        ` : `
          <!-- Text for numbered pins -->
           <text 
            x="50%" 
            y="50%" 
            dy="-8" 
            dx="-0.7"
            font-family="Helvetica, sans-serif" 
            font-size="${number && number > 9 ? '18' : '18'}" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="middle"
            letter-spacing="-1" 
          >
            ${displayNumber}
          </text>
        `}
      </svg>
    `)}`,
    iconSize: [actualWidth, actualHeight],
    iconAnchor: [actualWidth / 2, actualHeight],
    popupAnchor: [0, -actualHeight]
  });
}