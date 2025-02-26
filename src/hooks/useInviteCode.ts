// src/hooks/useInviteCode.ts
import { useState } from 'react';

// Dynamic API URL based on environment
const API_URL = import.meta.env.VITE_API_URL 
  ? '' // Empty string means use relative URL which will work with same-origin deployments
  : 'http://localhost:3002'; // For local development

interface UseInviteCodeReturn {
  validateInviteCode: (code: string) => Promise<{
    success: boolean;
    error?: string;
    sessionToken?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

export function useInviteCode(): UseInviteCodeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateInviteCode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Validating code:', code);
      
      // Use the dedicated validation endpoint with proper URL handling
      const url = `${API_URL}/api/validate-invite`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to validate invite code');
      }

      return {
        success: data.success,
        sessionToken: data.sessionToken
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Validation error:', errorMessage);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validateInviteCode,
    isLoading,
    error,
  };
}


/* // src/hooks/useInviteCode.ts
import { useState } from 'react';

const API_URL = 'http://localhost:3002';

interface UseInviteCodeReturn {
  validateInviteCode: (code: string) => Promise<{
    success: boolean;
    error?: string;
    sessionToken?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

export function useInviteCode(): UseInviteCodeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateInviteCode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Validating code:', code);
      
      // Use the dedicated validation endpoint
      const response = await fetch(`${API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to validate invite code');
      }

      return {
        success: data.success,
        sessionToken: data.sessionToken
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Validation error:', errorMessage);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validateInviteCode,
    isLoading,
    error,
  };
} */

/* import { useState } from 'react';

interface ValidationResponse {
  success: boolean;
  sessionToken?: string;
  error?: string;
}

export function useInviteCode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateInviteCode = async (code: string): Promise<ValidationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate code');
      }

      return {
        success: data.success,
        sessionToken: data.sessionToken
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate code';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validateInviteCode,
    isLoading,
    error
  };
} */