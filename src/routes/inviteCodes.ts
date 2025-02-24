// src/hooks/useInviteCode.ts
import { useState } from 'react';

// Use VITE_API_URL from env
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
      const response = await fetch(`${API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate code');
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

/* // src/routes/inviteCode.ts
import { Router } from 'express';
import { createHash } from 'crypto';
import { InviteCodeManager } from '../utils/inviteCodes';

const router = Router();
const inviteManager = new InviteCodeManager();

// In-memory rate limiting
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

router.post('/validate-invite', (req, res) => {
  const clientIP = req.ip;
  const now = Date.now();
  const rateLimit = rateLimitMap.get(clientIP);

  // Rate limiting logic
  if (rateLimit) {
    if (now - rateLimit.timestamp < RATE_LIMIT_WINDOW) {
      if (rateLimit.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({
          error: 'Too many attempts. Please try again later.'
        });
      }
      rateLimit.attempts++;
    } else {
      rateLimit.attempts = 1;
      rateLimit.timestamp = now;
    }
  } else {
    rateLimitMap.set(clientIP, { attempts: 1, timestamp: now });
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid invite code format' });
  }

  if (!inviteManager.isValidCode(code)) {
    return res.status(401).json({ error: 'Invalid invite code' });
  }

  // Generate session token
  const sessionToken = createHash('sha256')
    .update(Math.random().toString() + now)
    .digest('hex');

  return res.status(200).json({
    success: true,
    sessionToken
  });
});

export default router; */