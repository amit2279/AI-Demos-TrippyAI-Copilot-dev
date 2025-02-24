// AuthOverlay.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InviteModal } from './InviteModal';

interface AuthOverlayProps {
  isAuthenticated: boolean;
  onSuccess: () => void;
}

export function AuthOverlay({ isAuthenticated, onSuccess }: AuthOverlayProps) {
  return (
    <AnimatePresence>
      {!isAuthenticated && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999]"
        >
          {/* Optimized blur overlay */}
          {<div 
            className="absolute inset-0 bg-white/40"
            style={{ 
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              transform: 'translate3d(0,0,0)',
              backfaceVisibility: 'hidden'
            }}
          />}

          {/* Option 1: Lighter blur with opacity */}
           {/*  <div 
                className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"
                style={{ 
                transform: 'translate3d(0,0,0)',
                backfaceVisibility: 'hidden'
                }}
            /> */}

        {/* Option 2: No blur, just gradient overlay 
        <div 
            className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/70"
            style={{ 
            transform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden'
            }}
        />
        */}

        {/* Option 3: Very light blur with frosted glass effect 
        <div 
            className="absolute inset-0"
            style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
            transform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden'
            }}
        />
        */}
          
          {/* Modal container */}
          <div className="relative h-full flex items-center justify-center p-4">
            <InviteModal onSuccess={onSuccess} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}