// src/hooks/useInviteCode.ts
import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

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
      console.log('Sending code:', code); // Debug log
      console.log('To URL:', `${API_URL}/api/validate-invite`); // Debug log

      /* const response = await fetch(`${API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }) // Trim whitespace
      }); */
      const response = await fetch(`${API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() })
    });

      const data = await response.json();
      console.log('Response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate code');
      }

      if (!data.sessionToken) {
        throw new Error('No session token received');
      }

      return {
        success: true,
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
}