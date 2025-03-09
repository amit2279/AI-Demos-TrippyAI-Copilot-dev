import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationSearch } from './LocationSearch';
import { DateRangePicker } from './DateRangePicker';
import { InterestSelector } from './InterestSelector';
import { TravelGroupSelector } from './TravelGroupSelector';
import { TripDetails, ActivityType, TravelGroup, Itinerary } from '../../types/itinerary';
import { X, Plane, Calendar } from 'lucide-react';
import { ItineraryPanel } from './ItineraryPanel'; // Import the original ItineraryPanel
import { generateItinerary } from '../../services/itinerary/builder'; // Import the itinerary builder

interface PlannerWizardProps {
  onClose?: () => void;
  onSubmit: (details: TripDetails) => void;
  isLoading?: boolean;
  error?: string | null;
  // Props needed for ItineraryPanel
  itinerary?: Partial<Itinerary>;
  onLocationSelect?: (locationId: string) => void;
  selectedLocationId?: string;
  onLocationsUpdate?: (locations: any[]) => void;
  streamingActivity?: boolean;
  activeDay?: number;
  onItineraryUpdate?: (itinerary: Partial<Itinerary>, streamingActivity?: boolean) => void;
  // New props for better control flow
  isGeneratingItinerary?: boolean;
  shouldShowResults?: boolean;
}

type WizardStep = 'initial' | 'details' | 'results';

export function PlannerWizard({ 
  onClose, 
  onSubmit, 
  isLoading = false,
  error,
  // ItineraryPanel props
  itinerary = {},
  onLocationSelect,
  selectedLocationId,
  onLocationsUpdate,
  streamingActivity = false,
  activeDay,
  className,
  onItineraryUpdate,
  // New control props
  isGeneratingItinerary = false,
  shouldShowResults = false
}: PlannerWizardProps & { className?: string }) {
  console.log('[PlannerWizard] Rendering with props', {
    hasItineraryData: !!itinerary?.tripDetails?.destination,
    daysCount: itinerary?.days?.length || 0,
    isGeneratingItinerary,
    shouldShowResults
  });
  
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
  
  // Flag to control when to show the itinerary content
  const [showItineraryContent, setShowItineraryContent] = useState(false);
  // Flag to track if form was submitted
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Effect to auto-transition to results view when:
  // 1. Either the form was submitted OR shouldShowResults is true
  // 2. AND we have actual itinerary data
  useEffect(() => {
    const hasItineraryData = !!itinerary?.tripDetails?.destination;
    const shouldTransition = (formSubmitted || shouldShowResults) && hasItineraryData;
    
    console.log('[PlannerWizard] Checking for auto-transition:', {
      formSubmitted,
      shouldShowResults,
      hasItineraryData,
      shouldTransition,
      currentStep: step
    });
    
    if (shouldTransition && step !== 'results') {
      console.log('[PlannerWizard] Auto-transitioning to results step');
      setStep('results');
      
      // Show itinerary content after a short delay for smooth transition
      setTimeout(() => {
        setShowItineraryContent(true);
      }, 300);
    }
  }, [formSubmitted, shouldShowResults, itinerary?.tripDetails?.destination, step]);

  // Validate form data
  const isValid = useMemo(() => {
    const hasDestination = formData.destination.trim().length > 0;
    const hasTravelGroup = !!formData.travelGroup;
    const hasValidDates = formData.startDate && formData.endDate;
    
    return hasDestination && hasTravelGroup && hasValidDates;
  }, [formData.destination, formData.travelGroup, formData.startDate, formData.endDate]);

  const handleSubmit = async () => {
    if (!isValid) return;
    
    console.log('[PlannerWizard] Submitting form data:', formData);
    
    const details: TripDetails = {
      destination: formData.destination,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      travelGroup: formData.travelGroup!,
      preferences: {
        activityTypes: formData.interests
      }
    };
    
    console.log('[PlannerWizard] Prepared trip details:', details);
    
    // Set form submitted flag to true - this will trigger the transition effect
    setFormSubmitted(true);
    
    // Call the parent's onSubmit - let the ItineraryPanel_minimal handle the actual generation
    onSubmit(details);
  };
  
  // Go back from results to details step
  const handleBackToDetails = () => {
    console.log('[PlannerWizard] Going back to details step');
    setShowItineraryContent(false); // Hide itinerary content first
    setStep('details');
  };

  // Get the header title based on current step
  const getHeaderTitle = () => {
    switch (step) {
      case 'initial': return "Let's plan your trip";
      case 'details': return "Let's plan your trip";
      case 'results': return "Your Itinerary"
      /* itinerary?.tripDetails?.destination 
        ? `Your Trip to ${itinerary.tripDetails.destination}`
        : 'Your Itinerary'; */
      default: return 'Plan Your Trip';
    }
  };

  return (
    <div     
    className={`h-full flex flex-col overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 py-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {getHeaderTitle()}
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
          {/* Initial Step */}
          {step === 'initial' && (
            <motion.div 
              key="initial"
              className="absolute inset-0 flex flex-col p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
              <div className="space-y-6 w-full max-w-md mx-auto">
                <div className="text-center">
                 {/*  <p className="text-sm text-gray-600">
                    Choose how you'd like to get started
                  </p> */}
                </div>

                <div className="space-y-4 mt-3">
                  <button
                    onClick={() => {
                      console.log('[PlannerWizard] Moving to details step');
                      setStep('details');
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900">Create my plan</h4>
                      <p className="text-sm text-gray-500">
                        Plan a trip from scratch
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      console.log('[PlannerWizard] Moving to details step');
                      setStep('details');
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900">Help me plan</h4>
                      <p className="text-sm text-gray-500">
                        Get an AI Powered travel plan
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Details Step */}
          {step === 'details' && (
            <motion.div 
              key="details"
              className="absolute inset-0 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
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
                    onChange={(value) => {
                      console.log('[PlannerWizard] Destination updated:', value);
                      setFormData(prev => ({ ...prev, destination: value }));
                    }}
                  />
                </div>

                {/* Date Range */}
                <DateRangePicker
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  onChange={(start, end) => {
                    setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
                  }}
                />

                {/* Interests */}
                <InterestSelector
                  selected={formData.interests}
                  onChange={(types) => {
                    setFormData(prev => ({ ...prev, interests: types }));
                  }}
                />

                {/* Travel Group */}
                <TravelGroupSelector
                  selected={formData.travelGroup}
                  onChange={(group) => {
                    setFormData(prev => ({ ...prev, travelGroup: group }));
                  }}
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
                    disabled={!isValid || isLoading || isGeneratingItinerary}
                    className={`flex-1 px-5 py-3 text-white rounded-lg transition-colors ${
                      !isValid || isLoading || isGeneratingItinerary
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {(isLoading || isGeneratingItinerary) ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Itinerary'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      console.log('[PlannerWizard] Moving back to initial step');
                      setStep('initial');
                    }}
                    className="px-5 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Results Step - Using the ItineraryPanel */}
          {step === 'results' && (
            <motion.div 
              key="results"
              className="absolute inset-0"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
              <div className="h-full relative">
                {/* Show loading state or the actual itinerary content */}
                {!showItineraryContent ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium text-gray-900">Building your itinerary...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                    </div>
                  </div>
                ) : (
                  // Render the original ItineraryPanel but without its toggle button
                  <div className="h-full" data-testid="itinerary-display">
                    <ItineraryPanel
                      itinerary={itinerary}
                      onLocationSelect={onLocationSelect || (() => {})}
                      selectedLocationId={selectedLocationId}
                      onLocationsUpdate={onLocationsUpdate}
                      streamingActivity={streamingActivity}
                      activeDay={activeDay}
                      // Hide the toggle visibility button since we're embedding it
                      isVisible={true}
                      onToggleVisibility={undefined}
                    />
                  </div>
                )}
                
                {/* Back to Plan Settings Button */}
                {/* <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t z-10">
                  <button
                    onClick={handleBackToDetails}
                    className="w-full px-5 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back to Plan Settings
                  </button>
                </div> */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
