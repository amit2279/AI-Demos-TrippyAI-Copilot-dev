import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import type { CorsOptions, CorsRequest } from 'cors';
import type { Request, Response } from 'express';

// Rate limiting (in-memory - consider using Redis for production)
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export const validateInviteRoute = express.Router();

// Initialize CORS middleware with same options as chat.ts
const corsOptions: CorsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel domains or localhost
    if (
      origin.includes('vercel.app') || 
      origin.includes('localhost') ||
      origin === 'https://ai-demo-trippy.vercel.app'
    ) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Wrapper for using CORS with API routes
function runMiddleware(
  req: Request,
  res: Response,
  fn: (req: CorsRequest, res: Response, callback: (err: any) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req as CorsRequest, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
}

// Handle preflight OPTIONS request
validateInviteRoute.options('/validate-invite', async (req: Request, res: Response) => {
  await runMiddleware(req, res, cors(corsOptions));
  res.status(204).end();
});

validateInviteRoute.post('/validate-invite', async (req: Request, res: Response) => {
  // Apply CORS middleware first
  await runMiddleware(req, res, cors(corsOptions));
  
  const clientIP = req.ip;
  const now = Date.now();
  const rateLimit = rateLimitMap.get(clientIP);

  // Rate limiting check
  if (rateLimit) {
    if (now - rateLimit.timestamp < RATE_LIMIT_WINDOW_MS) {
      if (rateLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again later.'
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
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid invite code format' 
    });
  }

  try {
    // Get valid invite codes from env
    const validCodes = process.env.INVITE_CODES?.split(',').map(c => c.trim()) || [];
    const salt = process.env.INVITE_CODE_SALT;

    if (!validCodes.length || !salt) {
      console.error('Missing INVITE_CODES or INVITE_CODE_SALT in environment');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Hash the received code with salt
    const hashedCode = crypto
      .createHash('sha256')
      .update(code.toLowerCase().trim() + salt)
      .digest('hex');

    console.log('Validation attempt:', {
      code: code.toLowerCase().trim(),
      hashedCode,
      isValid: validCodes.includes(hashedCode)
    });

    if (validCodes.includes(hashedCode)) {
      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      return res.json({ 
        success: true, 
        sessionToken
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Invalid invite code' 
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating code'
    });
  }
});

/* // validate-invite.ts (Express version)
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';

// Rate limiting (in-memory - consider using Redis for production)
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export const validateInviteRoute = express.Router();

// Add CORS middleware specifically for this route
validateInviteRoute.use('/validate-invite', cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel domains or local development
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS request
validateInviteRoute.options('/validate-invite', cors());

validateInviteRoute.post('/validate-invite', (req, res) => {
  const clientIP = req.ip;
  const now = Date.now();
  const rateLimit = rateLimitMap.get(clientIP);

  // Rate limiting check
  if (rateLimit) {
    if (now - rateLimit.timestamp < RATE_LIMIT_WINDOW_MS) {
      if (rateLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again later.'
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
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid invite code format' 
    });
  }

  try {
    // Get valid invite codes from env
    const validCodes = process.env.INVITE_CODES?.split(',').map(code => code.trim()) || [];
    const salt = process.env.INVITE_CODE_SALT;

    if (!validCodes.length || !salt) {
      console.error('Missing INVITE_CODES or INVITE_CODE_SALT in environment');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Hash the received code with salt
    const hashedCode = crypto
      .createHash('sha256')
      .update(code.toLowerCase().trim() + salt)
      .digest('hex');

    console.log('Validation attempt:', {
      code: code.toLowerCase().trim(),
      hashedCode,
      isValid: validCodes.includes(hashedCode)
    });

    if (validCodes.includes(hashedCode)) {
      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      return res.json({ 
        success: true, 
        sessionToken
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Invalid invite code' 
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating code'
    });
  }
});
 */


/* // validate-invite.ts (Express version)
import crypto from 'crypto';
import express from 'express';

// Rate limiting (in-memory - consider using Redis for production)
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export const validateInviteRoute = express.Router();

validateInviteRoute.post('/validate-invite', (req, res) => {
  const clientIP = req.ip;
  const now = Date.now();
  const rateLimit = rateLimitMap.get(clientIP);

  // Rate limiting check
  if (rateLimit) {
    if (now - rateLimit.timestamp < RATE_LIMIT_WINDOW_MS) {
      if (rateLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again later.'
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
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid invite code format' 
    });
  }

  try {
    // Get valid invite codes from env
    const validCodes = process.env.INVITE_CODES?.split(',').map(code => code.trim()) || [];
    const salt = process.env.INVITE_CODE_SALT;

    if (!validCodes.length || !salt) {
      console.error('Missing INVITE_CODES or INVITE_CODE_SALT in environment');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Hash the received code with salt
    const hashedCode = crypto
      .createHash('sha256')
      .update(code.toLowerCase().trim() + salt)
      .digest('hex');

    console.log('Validation attempt:', {
      code: code.toLowerCase().trim(),
      hashedCode,
      isValid: validCodes.includes(hashedCode)
    });

    if (validCodes.includes(hashedCode)) {
      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      return res.json({ 
        success: true, 
        sessionToken
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Invalid invite code' 
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating code'
    });
  }
}); */


/* // src/pages/api/validate-invite.ts
import type { NextApiRequest, NextApiResponse } from 'next/server'
import { InviteCodeManager } from '../src/utils/inviteCodes'
import { env, validateEnv } from '../src/config/environment'
 */
/* // In a real app, these would be in a secure environment variable
const VALID_CODES = new Set([
  // Pre-computed SHA-256 hashes of valid invite codes
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin'
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password'
]) */

/* // Initialize invite code manager
validateEnv()
const inviteManager = new InviteCodeManager()

// Rate limiting (in-memory - consider using Redis for production)
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting
  const clientIP = (req.headers['x-forwarded-for'] || 
                   req.socket.remoteAddress) as string
  const now = Date.now()
  const rateLimit = rateLimitMap.get(clientIP)

  if (rateLimit) {
    if (now - rateLimit.timestamp < env.RATE_LIMIT_WINDOW_MS) {
      if (rateLimit.attempts >= env.RATE_LIMIT_MAX_ATTEMPTS) {
        return res.status(429).json({
          error: 'Too many attempts. Please try again later.'
        })
      }
      rateLimit.attempts++
    } else {
      rateLimit.attempts = 1
      rateLimit.timestamp = now
    }
  } else {
    rateLimitMap.set(clientIP, { attempts: 1, timestamp: now })
  }

  const { code } = req.body

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid invite code format' })
  }

  if (!inviteManager.isValidCode(code)) {
    return res.status(401).json({ error: 'Invalid invite code' })
  }

  // Generate session token
  const sessionToken = createHash('sha256')
    .update(Math.random().toString() + now)
    .digest('hex')

  return res.status(200).json({
    success: true,
    sessionToken
  })
} */