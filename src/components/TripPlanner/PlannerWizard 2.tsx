import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationSearch } from './LocationSearch';
import { DateRangePicker } from './DateRangePicker';
import { InterestSelector } from './InterestSelector';
import { TravelGroupSelector } from './TravelGroupSelector';
import { TripDetails, ActivityType, TravelGroup } from '../../types/itinerary';
import { X, Plane, Calendar } from 'lucide-react';
import { generateItinerary } from '../../services/itinerary/builder';

interface PlannerWizardProps {
  onClose?: () => void;
  onSubmit: (details: TripDetails) => void;
  isLoading?: boolean;
  onItineraryUpdate?: (itinerary: Partial<Itinerary>, streamingActivity?: boolean) => void;
  error?: string | null;
}

type WizardStep = 'initial' | 'details';

export function PlannerWizard({ 
  onClose, 
  onSubmit, 
  isLoading = false,
  onItineraryUpdate,
  error
}: PlannerWizardProps) {
  const [step, setStep] = useState<WizardStep>('initial');
  const [formData, setFormData] = useState<{
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
    travelGroup?: TravelGroup;
    interests: ActivityType[];
  }>({
    destination: '',
    startDate: null,
    endDate: null,
    interests: []
  });

  // Validate form data
  const isValid = useMemo(() => {
    // Required fields
    const hasDestination = formData.destination.trim().length > 0;
    const hasTravelGroup = !!formData.travelGroup;

    // Optional fields don't affect validity
    return hasDestination && hasTravelGroup;
  }, [formData.destination, formData.travelGroup]);

  const handleSubmit = async () => {
    if (!isValid) return;

    const details = {
      destination: formData.destination,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      travelGroup: formData.travelGroup!,
      preferences: {
        activityTypes: formData.interests
      }
    };

    // Use the original submit just like in the Modal
    onSubmit(details);

    // Also handle the itinerary generation the same way as in ChatPanel
    if (onItineraryUpdate) {
      try {
        // Start with a loading state
        onItineraryUpdate({
          tripDetails: {
            destination: details.destination,
            startDate: details.startDate?.toISOString(),
            endDate: details.endDate?.toISOString(),
            travelGroup: details.travelGroup
          }
        }, false); // Initial state, not streaming yet
    
        // Generate the itinerary with real-time updates
        const itinerary = await generateItinerary(details, (partialItinerary, streamingActivity) => {
          onItineraryUpdate(partialItinerary, streamingActivity);
        });
    
        // Final update with complete itinerary
        onItineraryUpdate(itinerary, false); // Final state, not streaming anymore
      } catch (error) {
        console.error('Error generating itinerary:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Aligned to top */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {step === 'initial' ? 'Welcome to Tripper' : 'Plan Your Trip'}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Content with sliding animation */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} mode="wait">
          {step === 'initial' ? (
            <motion.div 
              key="initial"
              className="absolute inset-0 flex flex-col p-6"
              initial={{ x: step === 'initial' ? '-100%' : '0%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
              <div className="space-y-8 w-full max-w-md mx-auto mt-16">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Let's plan your next adventure
                  </h3>
                  <p className="text-gray-600">
                    Choose how you'd like to get started
                  </p>
                </div>

                <div className="space-y-6">
                  <button
                    onClick={() => setStep('details')}
                    className="w-full flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900">Create a trip</h4>
                      <p className="text-sm text-gray-500">
                        Plan a new itinerary from scratch
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setStep('details')}
                    className="w-full flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900">Help me plan</h4>
                      <p className="text-sm text-gray-500">
                        Get personalized travel suggestions
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="details"
              className="absolute inset-0 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
              <div className="p-6 space-y-8">
                {/* Location Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Where to?
                  </label>
                  <LocationSearch
                    value={formData.destination}
                    onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                  />
                </div>

                {/* Date Range */}
                <DateRangePicker
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  onChange={(start, end) => setFormData(prev => ({ ...prev, startDate: start, endDate: end }))}
                />

                {/* Interests */}
                <InterestSelector
                  selected={formData.interests}
                  onChange={(types) => setFormData(prev => ({ ...prev, interests: types }))}
                />

                {/* Travel Group */}
                <TravelGroupSelector
                  selected={formData.travelGroup}
                  onChange={(group) => setFormData(prev => ({ ...prev, travelGroup: group }))}
                />

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid || isLoading}
                    className={`flex-1 px-5 py-3 text-white rounded-lg transition-colors ${
                      !isValid || isLoading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Itinerary'
                    )}
                  </button>
                  <button
                    onClick={() => setStep('initial')}
                    className="px-5 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}