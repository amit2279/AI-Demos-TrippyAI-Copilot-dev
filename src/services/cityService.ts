/* import { Location } from '../types/chat';
import { generateDynamicWelcomeMessage } from './greetings/greetingService';


interface City {
  name: string;
  country: string;
  position: {
    lat: number;
    lng: number;
  };
  description: string;
}

const TOP_CITIES: City[] = [
  // Asia
  {
    name: 'Kyoto',
    country: 'Japan',
    position: { lat: 35.0116, lng: 135.7681 },
    description: 'ancient temples and traditional gardens'
  },
  {
    name: 'Hanoi',
    country: 'Vietnam',
    position: { lat: 21.0285, lng: 105.8542 },
    description: 'ancient charm meets modern energy'
  },
  {
    name: 'Seoul',
    country: 'South Korea',
    position: { lat: 37.5665, lng: 126.9780 },
    description: 'dynamic blend of tradition and technology'
  },
  {
    name: 'Chiang Mai',
    country: 'Thailand',
    position: { lat: 18.7883, lng: 98.9853 },
    description: 'cultural heart of northern Thailand'
  },
  {
    name: 'Udaipur',
    country: 'India',
    position: { lat: 24.5854, lng: 73.7125 },
    description: 'city of lakes and palaces'
  },
  {
    name: 'Taipei',
    country: 'Taiwan',
    position: { lat: 25.0330, lng: 121.5654 },
    description: 'street food paradise and night markets'
  },
  {
    name: 'Luang Prabang',
    country: 'Laos',
    position: { lat: 19.8867, lng: 102.1350 },
    description: 'UNESCO heritage town with Buddhist temples'
  },

  // Europe
  {
    name: 'Porto',
    country: 'Portugal',
    position: { lat: 41.1579, lng: -8.6291 },
    description: 'historic port city known for wine'
  },
  {
    name: 'Edinburgh',
    country: 'Scotland',
    position: { lat: 55.9533, lng: -3.1883 },
    description: 'historic castles and dramatic landscapes'
  },
  {
    name: 'Ljubljana',
    country: 'Slovenia',
    position: { lat: 46.0569, lng: 14.5058 },
    description: 'charming green capital with dragon bridges'
  },
  {
    name: 'Dubrovnik',
    country: 'Croatia',
    position: { lat: 42.6507, lng: 18.0944 },
    description: 'pearl of the Adriatic'
  },
  {
    name: 'Bergen',
    country: 'Norway',
    position: { lat: 60.3913, lng: 5.3221 },
    description: 'gateway to the Norwegian fjords'
  },
  {
    name: 'Salzburg',
    country: 'Austria',
    position: { lat: 47.8095, lng: 13.0550 },
    description: 'birthplace of Mozart and Alpine beauty'
  },
  {
    name: 'Bruges',
    country: 'Belgium',
    position: { lat: 51.2093, lng: 3.2247 },
    description: 'medieval canals and chocolate shops'
  },

  // Africa
  {
    name: 'Cape Town',
    country: 'South Africa',
    position: { lat: -33.9249, lng: 18.4241 },
    description: 'where mountains meet the ocean'
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    position: { lat: 31.6295, lng: -7.9811 },
    description: 'vibrant markets and rich cultural heritage'
  },
  {
    name: 'Stone Town',
    country: 'Zanzibar',
    position: { lat: -6.1622, lng: 39.1875 },
    description: 'historic spice trade port'
  },
  {
    name: 'Luxor',
    country: 'Egypt',
    position: { lat: 25.6872, lng: 32.6396 },
    description: 'world\'s greatest open-air museum'
  },
  {
    name: 'Victoria Falls',
    country: 'Zimbabwe',
    position: { lat: -17.9243, lng: 25.8572 },
    description: 'home to the smoke that thunders'
  },

  // Americas
  {
    name: 'Cusco',
    country: 'Peru',
    position: { lat: -13.5319, lng: -71.9675 },
    description: 'gateway to ancient Incan civilization'
  },
  {
    name: 'Cartagena',
    country: 'Colombia',
    position: { lat: 10.3910, lng: -75.4794 },
    description: 'colorful colonial Caribbean gem'
  },
  {
    name: 'Quebec City',
    country: 'Canada',
    position: { lat: 46.8139, lng: -71.2080 },
    description: 'French charm in North America'
  },
  {
    name: 'San Miguel de Allende',
    country: 'Mexico',
    position: { lat: 20.9144, lng: -100.7452 },
    description: 'colonial art haven'
  },
  {
    name: 'Montevideo',
    country: 'Uruguay',
    position: { lat: -34.9011, lng: -56.1645 },
    description: 'historic port with riverside charm'
  },

  // Middle East
  {
    name: 'Istanbul',
    country: 'Turkey',
    position: { lat: 41.0082, lng: 28.9784 },
    description: 'where East meets West'
  },
  {
    name: 'Petra',
    country: 'Jordan',
    position: { lat: 30.3285, lng: 35.4444 },
    description: 'rose-red city half as old as time'
  },
  {
    name: 'Muscat',
    country: 'Oman',
    position: { lat: 23.5880, lng: 58.3829 },
    description: 'traditional Arabian port city'
  },

  // Oceania
  {
    name: 'Queenstown',
    country: 'New Zealand',
    position: { lat: -45.0312, lng: 168.6626 },
    description: 'adventure capital of the world'
  },
  {
    name: 'Hobart',
    country: 'Australia',
    position: { lat: -42.8821, lng: 147.3272 },
    description: 'historic harbor and mountain views'
  },
  {
    name: 'Apia',
    country: 'Samoa',
    position: { lat: -13.8506, lng: -171.7513 },
    description: 'tropical paradise with Polynesian culture'
  },

  // Additional Cities
  {
    name: 'Reykjavik',
    country: 'Iceland',
    position: { lat: 64.1466, lng: -21.9426 },
    description: 'land of fire and ice'
  },
  {
    name: 'Valparaíso',
    country: 'Chile',
    position: { lat: -33.0472, lng: -71.6127 },
    description: 'colorful port city of poets'
  },
  {
    name: 'Jaipur',
    country: 'India',
    position: { lat: 26.9124, lng: 75.7873 },
    description: 'the pink city of Rajasthan'
  },
  {
    name: 'Hoi An',
    country: 'Vietnam',
    position: { lat: 15.8801, lng: 108.3380 },
    description: 'ancient trading port with lantern-lit streets'
  },
  {
    name: 'Salvador',
    country: 'Brazil',
    position: { lat: -12.9714, lng: -38.5014 },
    description: 'heart of Afro-Brazilian culture'
  },
  {
    name: 'Antigua',
    country: 'Guatemala',
    position: { lat: 14.5586, lng: -90.7295 },
    description: 'colonial gem surrounded by volcanoes'
  },
  {
    name: 'Tallinn',
    country: 'Estonia',
    position: { lat: 59.4370, lng: 24.7536 },
    description: 'medieval Baltic beauty'
  },
  {
    name: 'Mostar',
    country: 'Bosnia and Herzegovina',
    position: { lat: 43.3438, lng: 17.8078 },
    description: 'historic bridge and Ottoman architecture'
  },
  {
    name: 'Tbilisi',
    country: 'Georgia',
    position: { lat: 41.7151, lng: 44.8271 },
    description: 'ancient crossroads with thermal baths'
  },
  {
    name: 'Luang Prabang',
    country: 'Laos',
    position: { lat: 19.8867, lng: 102.1350 },
    description: 'Buddhist temples and French colonial charm'
  },
  {
    name: 'Fez',
    country: 'Morocco',
    position: { lat: 34.0181, lng: -5.0078 },
    description: 'medieval medina and artisan workshops'
  },
  {
    name: 'Arequipa',
    country: 'Peru',
    position: { lat: -16.4090, lng: -71.5375 },
    description: 'white city with volcanic views'
  },
  {
    name: 'Ghent',
    country: 'Belgium',
    position: { lat: 51.0543, lng: 3.7174 },
    description: 'medieval port city with vibrant culture'
  },
  {
    name: 'Plovdiv',
    country: 'Bulgaria',
    position: { lat: 42.1354, lng: 24.7453 },
    description: 'ancient Roman ruins and artistic quarter'
  },
  {
    name: 'Kotor',
    country: 'Montenegro',
    position: { lat: 42.4207, lng: 18.7710 },
    description: 'fjord-like bay and Venetian architecture'
  },
  {
    name: 'Chefchaouen',
    country: 'Morocco',
    position: { lat: 35.1716, lng: -5.2697 },
    description: 'the blue pearl of Morocco'
  },
  {
    name: 'Guanajuato',
    country: 'Mexico',
    position: { lat: 21.0190, lng: -101.2574 },
    description: 'colorful colonial mining town'
  },
  {
    name: 'Český Krumlov',
    country: 'Czech Republic',
    position: { lat: 48.8127, lng: 14.3175 },
    description: 'fairytale town with medieval castle'
  },
  {
    name: 'Yangon',
    country: 'Myanmar',
    position: { lat: 16.8661, lng: 96.1951 },
    description: 'golden temples and colonial architecture'
  },
  {
    name: 'Colonia del Sacramento',
    country: 'Uruguay',
    position: { lat: -34.4626, lng: -57.8400 },
    description: 'historic Portuguese settlement'
  },
  {
    name: 'Sintra',
    country: 'Portugal',
    position: { lat: 38.7980, lng: -9.3878 },
    description: 'romantic palaces and misty forests'
  }
];

export function getRandomCity(): City {
  const randomIndex = Math.floor(Math.random() * TOP_CITIES.length);
  return TOP_CITIES[randomIndex];
}

export function generateWelcomeMessage(city: City): string {
  //return `Hi! I'm your travel assistant, currently looking at ${city.name}, ${city.country}, ${city.description}. Where would you like to explore today?`;
  return generateDynamicWelcomeMessage(city.name, city.country, 20, 'clear');
}

export function getCityAsLocation(city: City): Location {
  return {
    id: city.name.toLowerCase().replace(/\s+/g, '-'),
    name: `${city.name}, ${city.country}`,
    position: city.position,
    rating: 4.8,
    reviews: 50000,
    imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(city.name + ' city')}`
  };
} */


  import { Location } from '../types/chat';

interface City {
  name: string;
  country: string;
  position: {
    lat: number;
    lng: number;
  };
  description: string;
}

const TOP_CITIES: City[] = [
  // Asia
  {
    name: 'Kyoto',
    country: 'Japan',
    position: { lat: 35.0116, lng: 135.7681 },
    description: 'ancient temples and traditional gardens'
  },
  {
    name: 'Hanoi',
    country: 'Vietnam',
    position: { lat: 21.0285, lng: 105.8542 },
    description: 'ancient charm meets modern energy'
  },
  {
    name: 'Seoul',
    country: 'South Korea',
    position: { lat: 37.5665, lng: 126.9780 },
    description: 'dynamic blend of tradition and technology'
  },
  {
    name: 'Chiang Mai',
    country: 'Thailand',
    position: { lat: 18.7883, lng: 98.9853 },
    description: 'cultural heart of northern Thailand'
  },
  {
    name: 'Udaipur',
    country: 'India',
    position: { lat: 24.5854, lng: 73.7125 },
    description: 'city of lakes and palaces'
  },
  {
    name: 'Taipei',
    country: 'Taiwan',
    position: { lat: 25.0330, lng: 121.5654 },
    description: 'street food paradise and night markets'
  },
  {
    name: 'Luang Prabang',
    country: 'Laos',
    position: { lat: 19.8867, lng: 102.1350 },
    description: 'UNESCO heritage town with Buddhist temples'
  },

  // Europe
  {
    name: 'Porto',
    country: 'Portugal',
    position: { lat: 41.1579, lng: -8.6291 },
    description: 'historic port city known for wine'
  },
  {
    name: 'Edinburgh',
    country: 'Scotland',
    position: { lat: 55.9533, lng: -3.1883 },
    description: 'historic castles and dramatic landscapes'
  },
  {
    name: 'Ljubljana',
    country: 'Slovenia',
    position: { lat: 46.0569, lng: 14.5058 },
    description: 'charming green capital with dragon bridges'
  },
  {
    name: 'Dubrovnik',
    country: 'Croatia',
    position: { lat: 42.6507, lng: 18.0944 },
    description: 'pearl of the Adriatic'
  },
  {
    name: 'Bergen',
    country: 'Norway',
    position: { lat: 60.3913, lng: 5.3221 },
    description: 'gateway to the Norwegian fjords'
  },
  {
    name: 'Salzburg',
    country: 'Austria',
    position: { lat: 47.8095, lng: 13.0550 },
    description: 'birthplace of Mozart and Alpine beauty'
  },
  {
    name: 'Bruges',
    country: 'Belgium',
    position: { lat: 51.2093, lng: 3.2247 },
    description: 'medieval canals and chocolate shops'
  },

  // Africa
  {
    name: 'Cape Town',
    country: 'South Africa',
    position: { lat: -33.9249, lng: 18.4241 },
    description: 'where mountains meet the ocean'
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    position: { lat: 31.6295, lng: -7.9811 },
    description: 'vibrant markets and rich cultural heritage'
  },
  {
    name: 'Stone Town',
    country: 'Zanzibar',
    position: { lat: -6.1622, lng: 39.1875 },
    description: 'historic spice trade port'
  },
  {
    name: 'Luxor',
    country: 'Egypt',
    position: { lat: 25.6872, lng: 32.6396 },
    description: 'world\'s greatest open-air museum'
  },
  {
    name: 'Victoria Falls',
    country: 'Zimbabwe',
    position: { lat: -17.9243, lng: 25.8572 },
    description: 'home to the smoke that thunders'
  },

  // Americas
  {
    name: 'Cusco',
    country: 'Peru',
    position: { lat: -13.5319, lng: -71.9675 },
    description: 'gateway to ancient Incan civilization'
  },
  {
    name: 'Cartagena',
    country: 'Colombia',
    position: { lat: 10.3910, lng: -75.4794 },
    description: 'colorful colonial Caribbean gem'
  },
  {
    name: 'Quebec City',
    country: 'Canada',
    position: { lat: 46.8139, lng: -71.2080 },
    description: 'French charm in North America'
  },
  {
    name: 'San Miguel de Allende',
    country: 'Mexico',
    position: { lat: 20.9144, lng: -100.7452 },
    description: 'colonial art haven'
  },
  {
    name: 'Montevideo',
    country: 'Uruguay',
    position: { lat: -34.9011, lng: -56.1645 },
    description: 'historic port with riverside charm'
  },

  // Middle East
  {
    name: 'Istanbul',
    country: 'Turkey',
    position: { lat: 41.0082, lng: 28.9784 },
    description: 'where East meets West'
  },
  {
    name: 'Petra',
    country: 'Jordan',
    position: { lat: 30.3285, lng: 35.4444 },
    description: 'rose-red city half as old as time'
  },
  {
    name: 'Muscat',
    country: 'Oman',
    position: { lat: 23.5880, lng: 58.3829 },
    description: 'traditional Arabian port city'
  },

  // Oceania
  {
    name: 'Queenstown',
    country: 'New Zealand',
    position: { lat: -45.0312, lng: 168.6626 },
    description: 'adventure capital of the world'
  },
  {
    name: 'Hobart',
    country: 'Australia',
    position: { lat: -42.8821, lng: 147.3272 },
    description: 'historic harbor and mountain views'
  },
  {
    name: 'Apia',
    country: 'Samoa',
    position: { lat: -13.8506, lng: -171.7513 },
    description: 'tropical paradise with Polynesian culture'
  },

  // Additional Cities
  {
    name: 'Reykjavik',
    country: 'Iceland',
    position: { lat: 64.1466, lng: -21.9426 },
    description: 'land of fire and ice'
  },
  {
    name: 'Valparaíso',
    country: 'Chile',
    position: { lat: -33.0472, lng: -71.6127 },
    description: 'colorful port city of poets'
  },
  {
    name: 'Jaipur',
    country: 'India',
    position: { lat: 26.9124, lng: 75.7873 },
    description: 'the pink city of Rajasthan'
  },
  {
    name: 'Hoi An',
    country: 'Vietnam',
    position: { lat: 15.8801, lng: 108.3380 },
    description: 'ancient trading port with lantern-lit streets'
  },
  {
    name: 'Salvador',
    country: 'Brazil',
    position: { lat: -12.9714, lng: -38.5014 },
    description: 'heart of Afro-Brazilian culture'
  },
  {
    name: 'Antigua',
    country: 'Guatemala',
    position: { lat: 14.5586, lng: -90.7295 },
    description: 'colonial gem surrounded by volcanoes'
  },
  {
    name: 'Tallinn',
    country: 'Estonia',
    position: { lat: 59.4370, lng: 24.7536 },
    description: 'medieval Baltic beauty'
  },
  {
    name: 'Mostar',
    country: 'Bosnia and Herzegovina',
    position: { lat: 43.3438, lng: 17.8078 },
    description: 'historic bridge and Ottoman architecture'
  },
  {
    name: 'Tbilisi',
    country: 'Georgia',
    position: { lat: 41.7151, lng: 44.8271 },
    description: 'ancient crossroads with thermal baths'
  },
  {
    name: 'Luang Prabang',
    country: 'Laos',
    position: { lat: 19.8867, lng: 102.1350 },
    description: 'Buddhist temples and French colonial charm'
  },
  {
    name: 'Fez',
    country: 'Morocco',
    position: { lat: 34.0181, lng: -5.0078 },
    description: 'medieval medina and artisan workshops'
  },
  {
    name: 'Arequipa',
    country: 'Peru',
    position: { lat: -16.4090, lng: -71.5375 },
    description: 'white city with volcanic views'
  },
  {
    name: 'Ghent',
    country: 'Belgium',
    position: { lat: 51.0543, lng: 3.7174 },
    description: 'medieval port city with vibrant culture'
  },
  {
    name: 'Plovdiv',
    country: 'Bulgaria',
    position: { lat: 42.1354, lng: 24.7453 },
    description: 'ancient Roman ruins and artistic quarter'
  },
  {
    name: 'Kotor',
    country: 'Montenegro',
    position: { lat: 42.4207, lng: 18.7710 },
    description: 'fjord-like bay and Venetian architecture'
  },
  {
    name: 'Chefchaouen',
    country: 'Morocco',
    position: { lat: 35.1716, lng: -5.2697 },
    description: 'the blue pearl of Morocco'
  },
  {
    name: 'Guanajuato',
    country: 'Mexico',
    position: { lat: 21.0190, lng: -101.2574 },
    description: 'colorful colonial mining town'
  },
  {
    name: 'Český Krumlov',
    country: 'Czech Republic',
    position: { lat: 48.8127, lng: 14.3175 },
    description: 'fairytale town with medieval castle'
  },
  {
    name: 'Yangon',
    country: 'Myanmar',
    position: { lat: 16.8661, lng: 96.1951 },
    description: 'golden temples and colonial architecture'
  },
  {
    name: 'Colonia del Sacramento',
    country: 'Uruguay',
    position: { lat: -34.4626, lng: -57.8400 },
    description: 'historic Portuguese settlement'
  },
  {
    name: 'Sintra',
    country: 'Portugal',
    position: { lat: 38.7980, lng: -9.3878 },
    description: 'romantic palaces and misty forests'
  }
];

export function getRandomCity(): City {
  const randomIndex = Math.floor(Math.random() * TOP_CITIES.length);
  return TOP_CITIES[randomIndex];
}

export function generateWelcomeMessage(city: City): string {
  return `Hi! I'm your travel assistant, currently looking at ${city.name}, ${city.country}, ${city.description}. Where would you like to explore today?`;
}

export function getCityAsLocation(city: City): Location {
  return {
    id: city.name.toLowerCase().replace(/\s+/g, '-'),
    name: `${city.name}, ${city.country}`,
    position: city.position,
    rating: 4.8,
    reviews: 50000,
    imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(city.name + ' city')}`
  };
}