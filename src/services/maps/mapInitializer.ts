import { Location } from '../../types/chat';

export const DEFAULT_CENTER: [number, number] = [20, 0];
export const DEFAULT_ZOOM = 2;

export const DEFAULT_LOCATION: Location = {
  id: 'default',
  name: 'World View',
  position: {
    lat: DEFAULT_CENTER[0],
    lng: DEFAULT_CENTER[1]
  },
  rating: 0,
  reviews: 0,
  imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
  description: 'Explore the world'
};

export const MAP_ANIMATION_CONFIG = {
  duration: 1.5,
  easeLinearity: 0.25,
  padding: [50, 50] as [number, number]
};