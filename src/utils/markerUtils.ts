// src/utils/markerUtils.ts
import { icon } from 'leaflet';

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

interface CreatePinOptions {
  number?: number;
  color?: MarkerColorKey;
  scale?: number;     // Scale factor for the pin size
}

export function createPin({ number, color, scale = 1 }: CreatePinOptions = {}) {
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
          <!-- White Circle and Number for numbered pins
          <circle cx="20" cy="16" r="12" fill="white"/>  -->
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

// Usage examples:
// Normal size
// createPin({ number: 1 })

// 50% larger
// createPin({ number: 1, scale: 1.5 })

// Half size
// createPin({ number: 1, scale: 0.5 })

// Large plain marker
// createPin({ color: 'blue', scale: 2 })