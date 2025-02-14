import React from 'react';

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className = '', children }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function ShimmerText({ className = '' }: { className?: string }) {
  return (
    <Shimmer>
      <div className={`h-4 bg-gray-200 rounded ${className}`} />
    </Shimmer>
  );
}

export function ShimmerImage({ className = '' }: { className?: string }) {
  return (
    <Shimmer>
      <div className={`bg-gray-200 rounded-lg ${className}`} />
    </Shimmer>
  );
}

export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Shimmer>
        <div className="h-32 bg-gray-200 rounded-lg" />
      </Shimmer>
      <div className="space-y-2">
        <ShimmerText className="w-3/4" />
        <ShimmerText className="w-1/2" />
      </div>
    </div>
  );
}