import React from 'react';
import { TravelGroup } from '../../types/itinerary';
import { 
  UserCircle2, Users2, Baby, Heart, Briefcase 
} from 'lucide-react';

interface TravelGroupSelectorProps {
  selected?: TravelGroup;
  onChange: (group: TravelGroup) => void;
}

const GROUPS: Array<{
  type: TravelGroup;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = [
  {
    type: 'Solo traveler',
    label: 'Solo traveler',
    icon: <UserCircle2 />,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500'
  },
  {
    type: 'Friends',
    label: 'Friends',
    icon: <Users2 />,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-500'
  },
  {
    type: 'Family with kids',
    label: 'Family with kids',
    icon: <Baby />,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-500'
  },
  {
    type: 'Couple',
    label: 'Couple',
    icon: <Heart />,
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-500'
  },
  {
    type: 'Business trip',
    label: 'Business trip',
    icon: <Briefcase />,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-500'
  }
];

export function TravelGroupSelector({ selected, onChange }: TravelGroupSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Who are you traveling with?
      </label>
      <div className="grid grid-cols-2 gap-4">
        {GROUPS.map(({ type, label, icon, bgColor, textColor, borderColor }) => {
          const isSelected = selected === type;
          
          // Determine icon color
          const iconColorClass = isSelected 
            ? textColor.replace('text-', 'text-') // Keep the same color but more vibrant
            : 'text-gray-400';
            
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                isSelected 
                  ? `${bgColor} ${borderColor} ${textColor} shadow-sm`
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className={iconColorClass}>
                {icon}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}