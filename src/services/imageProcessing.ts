import { Location, Message } from '../types/chat';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max after processing
const MAX_DIMENSION = 800; // Maximum dimension
const JPEG_QUALITY = 0.7; // JPEG quality

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const VISION_API_URL = process.env.NODE_ENV === 'production'
  ? '/api/claude/vision'
  : 'http://localhost:3000/api/claude/vision';

export async function processLocationImages(images: File[]): Promise<Location[]> {
  try {
    const locations: Location[] = [];
    
    for (const image of images) {
      try {
        console.log('Processing image:', image.name);
        
        // Check initial file size
        if (image.size > 10 * 1024 * 1024) {
          console.warn(`Image ${image.name} is too large, skipping`);
          continue;
        }

        // Resize image
        const processedImage = await resizeImage(image);
        console.log('Image resized successfully');
        
        // Convert to base64
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

        console.log('Sending request to vision API...');
        
        const response = await fetch(VISION_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: base64Image.split(',')[1],
            prompt: 'What famous landmark or location is shown in this image? Please provide the exact name, coordinates, and a brief description. Format your response as JSON like this: {"name": "Location Name", "coordinates": [lat, lng], "description": "Brief description"}'
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Vision API response received');
        
        try {
          const locationData = JSON.parse(data.response);
          locations.push({
            id: `loc-${Date.now()}-${Math.random()}`,
            name: locationData.name,
            position: {
              lat: locationData.coordinates[0],
              lng: locationData.coordinates[1]
            },
            rating: 4.5,
            reviews: 10000,
            imageUrl: base64Image,
            description: locationData.description
          });
        } catch (parseError) {
          console.error('Error parsing location data:', parseError);
          continue;
        }

        // Add delay between images
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing image ${image.name}:`, error);
        continue;
      }
    }

    return locations;
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
}

export async function createImageMessage(file: File): Promise<Message> {
  try {
    const processedImage = await resizeImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Failed to read image'));
          return;
        }
        
        resolve({
          id: Date.now().toString(),
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('Error creating image message:', error);
    throw error;
  }
}
/* import { Location, Message } from '../types/chat';
import { CLAUDE_API_KEY } from '../config';

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB max after processing
const MAX_DIMENSION = 800; // Reduced maximum dimension
const JPEG_QUALITY = 0.6; // Reduced JPEG quality

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          // Check if size is still too large
          if (blob.size > MAX_IMAGE_SIZE) {
            // Try again with lower quality
            canvas.toBlob(
              (reducedBlob) => {
                if (!reducedBlob) {
                  reject(new Error('Failed to create reduced blob'));
                  return;
                }
                resolve(reducedBlob);
              },
              'image/jpeg',
              0.4 // Even lower quality as fallback
            );
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
} */

/* export async function processLocationImages(images: File[]): Promise<Location[]> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key is not configured');
  }

  try {
    // Process one image at a time
    const locations: Location[] = [];
    
    for (const image of images) {
      try {
        // Check initial file size
        if (image.size > 10 * 1024 * 1024) { // 10MB initial limit
          throw new Error(`Image ${image.name} is too large. Maximum size is 10MB`);
        }

        // Resize image
        const processedImage = await resizeImage(image);
        
        // Convert to base64
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
        
        // Process with Claude Vision
        const response = await fetch('/api/claude/vision', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              image: base64Image.split(',')[1],
              prompt:`Analyze this image of a location or landmark:
                        1. Identify the exact name and location
                        2. If it's a well-known place, provide specific coordinates
                        3. If not immediately recognizable:
                        - Describe architectural style or notable features
                        - Estimate the region/country based on visual clues
                        - Suggest similar known landmarks

                        Return ONLY this JSON structure:
                        {
                        "name": "Full location name",
                        "coordinates": [latitude, longitude],
                        "description": "2-3 sentence description focusing on unique features",
                        "confidence": "high|medium|low",
                        "alternativeSuggestions": ["Similar location 1", "Similar location 2"]
                        }`
            })
          });
//              prompt: 'What famous landmark or location is shown in this image? Please provide the exact name, coordinates, and a brief description. Format your response as JSON like this: {"name": "Location Name", "coordinates": [lat, lng], "description": "Brief description"}'

        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            `Failed to process image: ${response.status} ${response.statusText}\n${
            errorData.error || ''
            }`
        );
        }

        const data = await response.json();
        const jsonMatch = data.response.match(/\{.*\}/s);
        
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }

        const locationData = JSON.parse(jsonMatch[0]);
        locations.push({
          id: `loc-${Date.now()}-${Math.random()}`,
          name: locationData.name,
          position: {
            lat: locationData.coordinates[0],
            lng: locationData.coordinates[1]
          },
          rating: 4.5,
          reviews: 10000,
          imageUrl: base64Image,
          description: locationData.description
        });

        // Add delay between images
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing image ${image.name}:`, error);
        // Continue with next image instead of failing completely
        continue;
      }
    }

    return locations;
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
} */

/* export async function processLocationImages(
    images: File[], 
    onProgress?: (progress: number) => void
  ): Promise<Location[]> {
    const locations: Location[] = [];
    let processed = 0;
  
    for (const image of images) {
      try {
        await validateImage(image);
        const processedImage = await resizeImage(image);
        const base64Image = await convertToBase64(processedImage);
  
        const response = await fetch('/api/claude/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image.split(',')[1],
            prompt: VISION_PROMPT
          })
        });
  
        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }
  
        const data = await response.json();
        const location = parseLocationData(data);
        
        if (location.confidence === 'low') {
          console.warn(`Low confidence for image: ${image.name}`);
        }
  
        locations.push(location);
        processed++;
        onProgress?.(Math.round((processed / images.length) * 100));
        
      } catch (error) {
        console.error(`Failed to process ${image.name}:`, error);
        // Optionally notify user about specific failures
        continue;
      }
    }
  
    return locations;
  }  


export async function createImageMessage(file: File): Promise<Message> {
  try {
    const processedImage = await resizeImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Failed to read image'));
          return;
        }
        
        resolve({
          id: Date.now().toString(),
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('Error creating image message:', error);
    throw error;
  }
} */

/* import { Location, Message } from '../types/chat';
import { CLAUDE_API_KEY } from '../config';

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB max after processing
const MAX_DIMENSION = 800; // Reduced maximum dimension
const JPEG_QUALITY = 0.6; // Reduced JPEG quality

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          width = MAX_DIMENSION;
          height = Math.round(width / aspectRatio);
        }
      } else {
        if (height > MAX_DIMENSION) {
          height = MAX_DIMENSION;
          width = Math.round(height * aspectRatio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          // Check if size is still too large
          if (blob.size > MAX_IMAGE_SIZE) {
            // Try again with lower quality
            canvas.toBlob(
              (reducedBlob) => {
                if (!reducedBlob) {
                  reject(new Error('Failed to create reduced blob'));
                  return;
                }
                resolve(reducedBlob);
              },
              'image/jpeg',
              0.4 // Even lower quality as fallback
            );
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
} */

// Update the API endpoint to use Anthropic's Claude Vision API
/* const CLAUDE_VISION_API = 'https://api.anthropic.com/v1/messages';

export async function processLocationImages(images: File[]): Promise<Location[]> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key is not configured');
  }

  try {
    const locations: Location[] = [];
    
    for (const image of images) {
      try {
        // Check initial file size
        if (image.size > 10 * 1024 * 1024) {
          throw new Error(`Image ${image.name} is too large. Maximum size is 10MB`);
        }

        // Resize image
        const processedImage = await resizeImage(image);
        
        // Convert to base64
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

        // Process with Claude Vision API directly
        const response = await fetch(CLAUDE_VISION_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'What famous landmark or location is shown in this image? Please provide the exact name, coordinates, and a brief description. Format your response as JSON like this: {"name": "Location Name", "coordinates": [lat, lng], "description": "Brief description"}'
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

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const jsonMatch = data.content[0].text.match(/\{.*\}/s);
        
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }

        const locationData = JSON.parse(jsonMatch[0]);
        locations.push({
          id: `loc-${Date.now()}-${Math.random()}`,
          name: locationData.name,
          position: {
            lat: locationData.coordinates[0],
            lng: locationData.coordinates[1]
          },
          rating: 4.5,
          reviews: 10000,
          imageUrl: base64Image,
          description: locationData.description
        });

        // Add delay between images
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing image ${image.name}:`, error);
        continue;
      }
    }

    return locations;
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
} */

  // In src/services/imageProcessing.ts

// Update the API endpoint to use our proxy
/* const VISION_API_URL = process.env.NODE_ENV === 'production'
? '/api/claude/vision'
: 'http://localhost:3000/api/claude/vision';

export async function processLocationImages(images: File[]): Promise<Location[]> {
try {
  const locations: Location[] = [];
  
  for (const image of images) {
    try {
      // Check initial file size
      if (image.size > 10 * 1024 * 1024) {
        throw new Error(`Image ${image.name} is too large. Maximum size is 10MB`);
      }

      // Resize image
      const processedImage = await resizeImage(image);
      
      // Convert to base64
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

      // Process with our proxy endpoint
      const response = await fetch(VISION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image.split(',')[1],
          prompt: 'What famous landmark or location is shown in this image? Please provide the exact name, coordinates, and a brief description. Format your response as JSON like this: {"name": "Location Name", "coordinates": [lat, lng], "description": "Brief description"}'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API error: ${error.error || response.statusText}`);
      }

      const data = await response.json();
      const jsonMatch = data.response.match(/\{.*\}/s);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const locationData = JSON.parse(jsonMatch[0]);
      locations.push({
        id: `loc-${Date.now()}-${Math.random()}`,
        name: locationData.name,
        position: {
          lat: locationData.coordinates[0],
          lng: locationData.coordinates[1]
        },
        rating: 4.5,
        reviews: 10000,
        imageUrl: base64Image,
        description: locationData.description
      });

      // Add delay between images
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing image ${image.name}:`, error);
      continue;
    }
  }

  return locations;
} catch (error) {
  console.error('Error processing images:', error);
  throw error;
}
}



export async function createImageMessage(file: File): Promise<Message> {
  try {
    const processedImage = await resizeImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Failed to read image'));
          return;
        }
        
        resolve({
          id: Date.now().toString(),
          content: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          imageUrl: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(processedImage);
    });
  } catch (error) {
    console.error('Error creating image message:', error);
    throw error;
  }
} */