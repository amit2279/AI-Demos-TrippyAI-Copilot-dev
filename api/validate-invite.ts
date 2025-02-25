import type { Request, Response } from 'express';
import crypto from 'crypto';
import cors from 'cors';
import type { CorsOptions, CorsRequest } from 'cors';
import express from 'express';



const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local development
    'https://ai-demo-trippy.vercel.app', // Main deployment
    /https:\/\/ai-demo-trippy-.*-amits-projects-04ce3c09\.vercel\.app/ // All subdomains
  ],
  methods: ['POST', 'OPTIONS'], // Allow POST and OPTIONS requests
  allowedHeaders: ['Content-Type'], // Allow Content-Type header
  credentials: true // Allow credentials (if needed)
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight request
app.options('/api/validate-invite', cors(corsOptions), (req, res) => {
  res.status(204).end(); // Respond with 204 No Content
});

// Your POST endpoint
app.post('/api/validate-invite', (req, res) => {
  // Your validation logic here
  res.json({ success: true });
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//app.use(cors(corsOptions));

/* app.options('/api/validate-invite', cors(corsOptions), (req, res) => {
  res.status(204).end();
});
 */




/* const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:5173',
    'https://ai-demo-trippy.vercel.app',
    /https:\/\/ai-demo-trippy-.*-amits-projects-04ce3c09\.vercel\.app/
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Use the CORS middleware
app.use(cors(corsOptions)); */

/* const app = express();

// Initialize CORS middleware with logging
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-demo-trippy.vercel.app',
      /https:\/\/ai-demo-trippy-.*-amits-projects-04ce3c09\.vercel\.app/
    ];

    console.log('[CORS] Request origin:', origin);
    console.log('[CORS] Allowed origins:', allowedOrigins);

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      console.log('[CORS] Allowing request with no origin');
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowed => 
      typeof allowed === 'string' 
        ? allowed === origin
        : allowed.test(origin)
    );

    console.log('[CORS] Is origin allowed:', isAllowed);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('[CORS] Blocking request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));

app.options('/api/validate-invite', cors(corsOptions), (req, res) => {
  res.status(204).end();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && Array.isArray(corsOptions.origin) && corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

app.post('/api/validate-invite', (req, res) => {
  // Your validation logic here
  res.json({ success: true });
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); */

// Wrapper for using CORS with API routes
function runMiddleware(
  req: Request,
  res: Response,
  fn: (req: CorsRequest, res: Response, callback: (err: any) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req as CorsRequest, res, (result: any) => {
      if (result instanceof Error) {
        console.error('[Middleware] Error:', result);
        return reject(result);
      }
      return resolve();
    });
  });
}

export default async function handler(
  req: Request,
  res: Response
) {
  console.log('[API] Received request:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  try {
    // Run the CORS middleware
    console.log('[API] Running CORS middleware');
    await runMiddleware(req, res, cors(corsOptions));

    if (req.method !== 'POST') {
      console.log('[API] Method not allowed:', req.method);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { code } = req.body;
    console.log('[API] Received invite code:', code);

    if (!code || typeof code !== 'string') {
      console.log('[API] Invalid code format:', code);
      res.status(400).json({ error: 'Invalid invite code format' });
      return;
    }

    // Get valid invite codes from env
    const validCodes = process.env.INVITE_CODES?.split(',').map(code => code.trim()) || [];
    const salt = process.env.INVITE_CODE_SALT;

    console.log('[API] Environment check:', {
      hasValidCodes: !!validCodes.length,
      hasSalt: !!salt,
      codesCount: validCodes.length
    });

    if (!validCodes.length || !salt) {
      console.error('[API] Missing environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Hash the received code with salt
    const processedCode = code.toLowerCase().trim();
    const hashedCode = crypto
      .createHash('sha256')
      .update(processedCode + salt)
      .digest('hex');

    console.log('[API] Code processing:', {
      original: code,
      processed: processedCode,
      hashed: hashedCode
    });

    const isValid = validCodes.includes(hashedCode);
    console.log('[API] Validation result:', {
      isValid,
      matchedHash: isValid ? hashedCode : 'none'
    });

    if (isValid) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      console.log('[API] Generated session token');
      
      return res.json({ 
        success: true, 
        sessionToken
      });
    }

    console.log('[API] Invalid code, sending 401');
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid invite code' 
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating code'
    });
  }
}

/* import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import type { CorsOptions, CorsRequest } from 'cors';
import type { Request, Response } from 'express';

// Rate limiting (in-memory - consider using Redis for production)
const rateLimitMap = new Map<string, { attempts: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export const validateInviteRoute = express.Router();

// Initialize CORS middleware with detailed logging
const corsOptions: CorsOptions = {
  origin: function(origin, callback) {
    console.log('[CORS Debug] Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) {
      console.log('[CORS Debug] Allowing request with no origin');
      return callback(null, true);
    }
    
    // Allow all origins for now to debug the issue
    console.log('[CORS Debug] Allowing all origins during debugging');
    callback(null, true);
    
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware function to add CORS headers manually
function addCorsHeaders(req: Request, res: Response, next: Function) {
  console.log('[CORS Manual] Adding CORS headers for all origins');
  
  // Add CORS headers directly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    console.log('[CORS Manual] Handling OPTIONS preflight request');
    return res.status(204).end();
  }
  
  next();
}

// Wrapper for using CORS with API routes
function runMiddleware(
  req: Request,
  res: Response,
  fn: (req: CorsRequest, res: Response, callback: (err: any) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('[CORS Middleware] Starting CORS middleware');
    fn(req as CorsRequest, res, (result: any) => {
      if (result instanceof Error) {
        console.error('[CORS Middleware] Error:', result);
        return reject(result);
      }
      console.log('[CORS Middleware] CORS middleware successful');
      return resolve();
    });
  });
}

// Use both approaches for maximum compatibility
validateInviteRoute.use('/validate-invite', addCorsHeaders);

// Handle preflight OPTIONS request explicitly
validateInviteRoute.options('/validate-invite', async (req: Request, res: Response) => {
  console.log('[OPTIONS] Received OPTIONS request');
  
  try {
    // Apply CORS middleware
    await runMiddleware(req, res, cors(corsOptions));
    console.log('[OPTIONS] CORS middleware applied successfully');
    
    // Ensure proper headers are set
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(204).end();
    console.log('[OPTIONS] OPTIONS request handled successfully');
  } catch (error) {
    console.error('[OPTIONS] Error handling OPTIONS request:', error);
    res.status(500).end();
  }
});

validateInviteRoute.post('/validate-invite', async (req: Request, res: Response) => {
  console.log('[Invite] Starting validate-invite POST handler');
  console.log('[Invite] Request headers:', req.headers);
  
  try {
    // Apply CORS middleware first
    console.log('[Invite] Applying CORS middleware');
    await runMiddleware(req, res, cors(corsOptions));
    console.log('[Invite] CORS middleware applied');
    
    // Ensure proper headers are set again
    res.header('Access-Control-Allow-Origin', '*');
    
    const clientIP = req.ip;
    console.log('[Invite] Client IP:', clientIP);
    
    const now = Date.now();
    const rateLimit = rateLimitMap.get(clientIP);

    // Rate limiting check
    if (rateLimit) {
      if (now - rateLimit.timestamp < RATE_LIMIT_WINDOW_MS) {
        if (rateLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
          console.log('[Invite] Rate limit exceeded for IP:', clientIP);
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

    console.log('[Invite] Request body:', req.body);
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      console.log('[Invite] Invalid code format');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid invite code format' 
      });
    }

    // Get valid invite codes from env
    const validCodes = process.env.INVITE_CODES?.split(',').map(c => c.trim()) || [];
    const salt = process.env.INVITE_CODE_SALT;

    console.log('[Invite] Environment check:', {
      hasValidCodes: validCodes.length > 0,
      validCodesCount: validCodes.length,
      hasSalt: !!salt
    });

    if (!validCodes.length || !salt) {
      console.error('[Invite] Missing environment variables');
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

    console.log('[Invite] Validation attempt:', {
      code: code.toLowerCase().trim(),
      hashedCode,
      validCodesFirstChars: validCodes.map(c => c.substring(0, 8) + '...'),
      isValid: validCodes.includes(hashedCode)
    });

    if (validCodes.includes(hashedCode)) {
      console.log('[Invite] Valid code, generating token');
      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      return res.json({ 
        success: true, 
        sessionToken
      });
    }

    console.log('[Invite] Invalid code');
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid invite code' 
    });
  } catch (error) {
    console.error('[Invite] Error:', error);
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