import React from 'react';
import { Shimmer } from './Shimmer';

export const LocationPreloader: React.FC = () => {
  return (
    <div className="flex bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="w-24 h-24 flex-shrink-0">
        <Shimmer className="w-full h-full" />
      </div>
      <div className="flex-1 p-3 space-y-2">
        <Shimmer className="h-5 w-3/4 rounded" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Shimmer key={i} className="w-4 h-4 rounded-full" />
          ))}
        </div>
        <Shimmer className="h-4 w-24 rounded mt-2" />
      </div>
    </div>
  );
};