export function generateImageUrl(locationName: string): string {
  const query = encodeURIComponent(`${locationName} landmark tourism`);
  const cacheBuster = Date.now();
  console.log('[ImageService] Generating image URL for:', locationName);
  return `https://source.unsplash.com/featured/800x600/?${query}&cb=${cacheBuster}`;
}

export function getPlaceholderImage(locationName: string): string {
  const query = encodeURIComponent(`${locationName} place`);
  return `https://source.unsplash.com/800x600/?${query}`;
}