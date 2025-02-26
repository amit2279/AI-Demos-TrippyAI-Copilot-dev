import { useState } from 'react';

//const API_URL = import.meta.env.VITE_API_URL;

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-demo-trippy-ai.vercel.app';

interface ValidationResponse {
  success: boolean;
  sessionToken?: string;
  error?: string;
}

export function useInviteCode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* const validateInviteCode = async (code: string): Promise<ValidationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[InviteCode] Starting validation:', {
        code,
        apiUrl: API_URL
      });

      const response = await fetch(`${API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
        credentials: 'include',
        mode: 'cors'
      });

      console.log('[InviteCode] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('[InviteCode] Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate code');
      }

      if (!data.sessionToken) {
        throw new Error('No session token received');
      }

      console.log('[InviteCode] Validation successful');
      return {
        success: true,
        sessionToken: data.sessionToken
      };
    } catch (err) {
      console.error('[InviteCode] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate code';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }; */
  const validateInviteCode = async (code: string): Promise<ValidationResponse> => {
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await fetch(`${API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
        credentials: 'include', // Include credentials if needed
        mode: 'cors', // Ensure CORS mode is enabled
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate code');
      }
  
      if (!data.sessionToken) {
        throw new Error('No session token received');
      }
  
      return {
        success: true,
        sessionToken: data.sessionToken,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate code';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
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


/* import { useState } from 'react';

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
      console.log('Sending code:', code);
      console.log('To URL:', `${API_URL}/api/validate-invite`);

      const response = await fetch(`${API_URL}/api/validate-invite`, {
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
 */
/* import { useState } from 'react';

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
      console.log('Sending code:', code);
      console.log('To URL:', `${API_URL}/api/validate-invite`);

      const response = await fetch(`${API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await response.json();

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
} */
/* // src/hooks/useInviteCode.ts
import { useState } from 'react';

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
      
      // Use relative URL instead of absolute URL
      const response = await fetch('/api/validate-invite', {
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
 */