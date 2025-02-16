import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className = '', children }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      />
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

export function ActivityShimmer() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative flex gap-4"
    >
      <Shimmer className="w-5 h-5 rounded-full bg-gray-200 mt-1" />
      <div className="flex-1">
        <div className="p-4 border border-gray-200 rounded-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <ShimmerText className="w-48 h-5" />
              <ShimmerText className="w-32 h-4" />
            </div>
          </div>
          <div className="flex gap-4">
            <ShimmerText className="w-24 h-4" />
            <ShimmerText className="w-24 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DayShimmer() {
  return (
    <div className="space-y-6">
      <ActivityShimmer />
    </div>
  );
}



/* import React from 'react';

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
} */