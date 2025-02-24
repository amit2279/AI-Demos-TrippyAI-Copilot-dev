// src/components/Auth/InviteModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useInviteCode } from '../../hooks/useInviteCode';

interface InviteModalProps {
  onSuccess: () => void;
}

export function InviteModal({ onSuccess }: InviteModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { validateInviteCode, isLoading, error: validationError } = useInviteCode();
  const [localError, setLocalError] = useState('');

  const error = localError || validationError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!inviteCode.trim()) {
      setLocalError('Please enter an invite code');
      return;
    }
    if (!agreedToTerms) {
      setLocalError('Please accept the privacy agreement');
      return;
    }

    try {
      const result = await validateInviteCode(inviteCode);
      if (result.success) {
        // Store session token
        if (result.sessionToken) {
          localStorage.setItem('sessionToken', result.sessionToken);
        }
        onSuccess();
      }
    } catch (err) {
      setLocalError('Failed to validate code');
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-xl w-[450px] relative overflow-hidden"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Welcome to Tripper</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please enter your invite code to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Invite Code Input */}
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
            Invite Code
          </label>
          <input
            type="text"
            id="inviteCode"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your invite code"
            disabled={isLoading}
          />
        </div>

        {/* Privacy Agreement */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-700">
            Privacy Agreement
          </label>
          <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-600 leading-relaxed">
            <p>By using Tripper, you agree that:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>We do not store any personal data</li>
              <li>Your session data is temporary and will be lost when you close the app</li>
              <li>We collect anonymous usage data and errors for app improvement</li>
              <li>Screen captures may be taken when errors occur for debugging</li>
            </ul>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600">
              I understand and agree that my session data is temporary and usage analytics will be collected
            </span>
          </label>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-red-600 text-sm"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium
            ${isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 transition-colors'
            }`}
        >
          {isLoading ? 'Validating...' : 'Continue'}
        </button>
      </form>
    </motion.div>
  );
}