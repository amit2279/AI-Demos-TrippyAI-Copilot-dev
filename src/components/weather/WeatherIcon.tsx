import React from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  CloudMoon,
  Moon
} from 'lucide-react';

interface WeatherIconProps {
  condition: string;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ 
  condition, 
  size = 'medium',
  animated = false,
  className = ''
}) => {
  const sizeClass = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size];

  const baseClass = `${sizeClass} ${animated ? 'animate-weather' : ''} ${className}`;

  // Get current hour to determine if it's day or night
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 18;

  switch (condition.toLowerCase()) {
    case 'clear':
      return isNight ? 
        <Moon className={`text-gray-600 ${baseClass}`} /> :
        <Sun className={`text-yellow-500 ${baseClass}`} />;
    
    case 'partly-cloudy':
      return isNight ?
        <CloudMoon className={`text-gray-500 ${baseClass}`} /> :
        <CloudSun className={`text-gray-500 ${baseClass}`} />;
    
    case 'cloudy':
      return <Cloud className={`text-gray-400 ${baseClass}`} />;
    
    case 'overcast':
      return <Cloud className={`text-gray-500 ${baseClass}`} fill="currentColor" />;
    
    case 'light-rain':
      return <CloudDrizzle className={`text-blue-400 ${baseClass}`} />;
    
    case 'rain':
      return <CloudRain className={`text-blue-500 ${baseClass}`} />;
    
    case 'heavy-rain':
      return <CloudRain className={`text-blue-600 ${baseClass}`} fill="currentColor" />;
    
    case 'snow':
      return <CloudSnow className={`text-blue-200 ${baseClass}`} />;
    
    case 'sleet':
      return (
        <div className="relative">
          <CloudRain className={`text-blue-400 ${baseClass}`} />
          <CloudSnow className={`text-blue-200 ${baseClass} absolute inset-0 opacity-50`} />
        </div>
      );
    
    case 'thunderstorm':
      return <CloudLightning className={`text-purple-500 ${baseClass}`} />;
    
    case 'fog':
    case 'mist':
      return <CloudFog className={`text-gray-400 ${baseClass}`} />;
    
    default:
      return isNight ? 
        <Moon className={`text-gray-600 ${baseClass}`} /> :
        <Sun className={`text-yellow-500 ${baseClass}`} />;
  }
};