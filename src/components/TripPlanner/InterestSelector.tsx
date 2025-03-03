import React from 'react';
import { ActivityType } from '../../types/itinerary';
import { 
  Landmark, Coffee, Mountain, Music, ShoppingBag, 
  UtensilsCrossed, Moon, Palmtree 
} from 'lucide-react';

interface InterestSelectorProps {
  selected: ActivityType[];
  onChange: (types: ActivityType[]) => void;
}

const INTERESTS: Array<{
  type: ActivityType;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  activeBg: string;
}> = [
  { 
    type: 'Cultural',
    label: 'Cultural',
    icon: <Landmark size={16} />,
    activeColor: 'text-purple-700',
    activeBg: 'bg-purple-100'
  },
  { 
    type: 'Adventure',
    label: 'Adventure',
    icon: <Mountain size={16} />,
    activeColor: 'text-blue-700',
    activeBg: 'bg-blue-100'
  },
  { 
    type: 'Foodie',
    label: 'Food & Dining',
    icon: <UtensilsCrossed size={16} />,
    activeColor: 'text-orange-700',
    activeBg: 'bg-orange-100'
  },
  { 
    type: 'Nightlife',
    label: 'Nightlife',
    icon: <Moon size={16} />,
    activeColor: 'text-indigo-700',
    activeBg: 'bg-indigo-100'
  },
  { 
    type: 'Nature',
    label: 'Nature',
    icon: <Palmtree size={16} />,
    activeColor: 'text-green-700',
    activeBg: 'bg-green-100'
  },
  { 
    type: 'Shopping',
    label: 'Shopping',
    icon: <ShoppingBag size={16} />,
    activeColor: 'text-pink-700',
    activeBg: 'bg-pink-100'
  },
  { 
    type: 'Relaxation',
    label: 'Relaxation',
    icon: <Coffee size={16} />,
    activeColor: 'text-teal-700',
    activeBg: 'bg-teal-100'
  }
];

export function InterestSelector({ selected, onChange }: InterestSelectorProps) {
  const toggleInterest = (type: ActivityType) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        What interests you?
      </label>
      <div className="flex flex-wrap gap-3">
        {INTERESTS.map(({ type, label, icon, activeColor, activeBg }) => {
          const isSelected = selected.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleInterest(type)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                isSelected 
                  ? `${activeBg} ${activeColor}` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className={isSelected ? activeColor : 'text-gray-500'}>
                {icon}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}