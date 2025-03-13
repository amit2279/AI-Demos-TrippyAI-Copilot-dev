// components/CarouselControls.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselControlsProps {
  currentIndex: number;
  totalImages: number;
  onPrev: () => void;
  onNext: () => void;
}

export const CarouselControls: React.FC<CarouselControlsProps> = ({
  currentIndex,
  totalImages,
  onPrev,
  onNext
}) => {
  return (
    <>
      {/* Navigation Arrows */}
      {totalImages > 1 && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors z-10"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors z-10"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        </>
      )}
      
      {/* Pagination Dots */}
      {totalImages > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
          {Array.from({ length: totalImages }).map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full transition-opacity ${
                currentIndex === index ? 'bg-white' : 'bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
};