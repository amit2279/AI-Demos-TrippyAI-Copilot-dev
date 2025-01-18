export function validateCoordinates(lat: number | undefined, lng: number | undefined): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    
    // Check coordinate ranges
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    
    return true;
  }
  
  export function formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  
  export function calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    return Math.sqrt(
      Math.pow(lat1 - lat2, 2) + 
      Math.pow(lng1 - lng2, 2)
    );
  }
  
  export function getBoundsZoomLevel(
    bounds: L.LatLngBounds,
    mapSize: { x: number; y: number }
  ): number {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 18;
  
    function latRad(lat: number) {
      const sin = Math.sin(lat * Math.PI / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }
  
    function zoom(mapPx: number, worldPx: number, fraction: number) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }
  
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
  
    const latFraction = (latRad(ne.lat) - latRad(sw.lat)) / Math.PI;
    const lngDiff = ne.lng - sw.lng;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;
  
    const latZoom = zoom(mapSize.y, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(mapSize.x, WORLD_DIM.width, lngFraction);
  
    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  }