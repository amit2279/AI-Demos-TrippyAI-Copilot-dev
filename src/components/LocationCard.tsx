import { Location, Message } from '../types/chat';

function parseCoordinates(coordinates: string | unknown): [number, number] | null {
  // Add debug logging
  console.log('[Image Processing] Parsing coordinates:', coordinates);
  
  try {
    // Handle string coordinates
    if (typeof coordinates === 'string') {
      const cleanCoords = coordinates.replace(/\s+/g, '').replace(/°/g, '');
      console.log('[Image Processing] Cleaned coordinates:', cleanCoords);
      
      const parts = cleanCoords.split(',');
      console.log('[Image Processing] Split parts:', parts);
      
      if (parts.length !== 2) return null;

      const latMatch = parts[0].match(/^([\d.-]+)([NS])$/);
      const lngMatch = parts[1].match(/^([\d.-]+)([EW])$/);
      console.log('[Image Processing] Matches:', { latMatch, lngMatch });

      if (!latMatch || !lngMatch) return null;

      let lat = parseFloat(latMatch[1]);
      let lng = parseFloat(lngMatch[1]);

      if (latMatch[2] === 'S') lat *= -1;
      if (lngMatch[2] === 'W') lng *= -1;

      console.log('[Image Processing] Parsed values:', { lat, lng });
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Image Processing] Error parsing coordinates:', error);
    return null;
  }
}

export async function processLocationImages(images: File[]): Promise<Location[]> {
  console.log(`[Image Processing] Processing ${images.length} images`);
  
  try {
    const locations: Location[] = [];
    
    for (const image of images) {
      try {
        if (image.size > 10 * 1024 * 1024) continue;

        const processedImage = await resizeImage(image);
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
              reject(new Error('Failed to read image'));
              return;
            }
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(processedImage);
        });

        // Update the prompt to request specific coordinate format
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors', // Explicitly set CORS mode
          credentials: 'omit', // Don't send credentials
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Identify this location. Respond with ONLY a JSON object in this format: {"name": "Location Name", "country": "Country","description": "Description", "coordinates": "DD.DDDD°N/S, DDD.DDDD°E/W"} (use exactly 4 decimal places)'
                },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Image.split(',')[1]
                  }
                }
              ]
            }]
          })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        let fullResponse = '';
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body available');

        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) fullResponse += parsed.text;
              } catch (e) {}
            }
          }
        }

        // Log the raw response
        console.log('[Image Processing] Raw response:', fullResponse);

        // Parse the JSON response
        const locationData = JSON.parse(fullResponse);
        console.log('[Image Processing] Parsed location data:', locationData);
        
        if (!locationData.name || !locationData.coordinates || !locationData.country) {
          console.warn('[Image Processing] Missing required fields:', locationData);
          continue;
        }

        const coords = parseCoordinates(locationData.coordinates);
        if (!coords) {
          console.warn('[Image Processing] Failed to parse coordinates:', locationData.coordinates);
          continue;
        }

        const [lat, lng] = coords;
        locations.push({
          id: `loc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: locationData.name,
          country: locationData.country,
          position: { lat, lng }
        });
        //imageUrl: base64Image
        //imageUrl: loc.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(loc.name + ' landmark')}`,
      } catch (error) {
        console.error(`[Image Processing] Error:`, error);
        continue;
      }
    }

    return locations;
  } catch (error) {
    console.error('[Image Processing] Error:', error);
    throw error;
  }
}


/*import React from 'react';
import { MapPin, Star, X } from 'lucide-react';
import { Location } from '../types/chat';

interface LocationCardProps {
  location: Location;
  onClose: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, onClose }) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 max-w-md w-full mx-4">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X size={20} />
      </button>
      
      <div className="flex gap-4">
        <div className="w-32 h-32 relative flex-shrink-0">
          <img
            src={location.imageUrl}
            alt={location.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(location.name + ' landmark')}`;
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{location.name}</h3>
          
          {location.formattedAddress && (
            <p className="text-sm text-gray-600 mb-2">{location.formattedAddress}</p>
          )}
          
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">
              {location.rating} ({location.reviews.toLocaleString()} reviews)
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {location.placeId ? (
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${location.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <MapPin size={16} />
                View on Maps
              </a>
            ) : (
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(location.name)}/@${location.position.lat},${location.position.lng},17z`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <MapPin size={16} />
                View on Maps
              </a>
            )}
            
            {location.placeId && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination_place_id=${location.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <MapPin size={16} />
                Get Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};*/