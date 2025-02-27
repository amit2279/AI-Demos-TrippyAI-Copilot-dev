import type { Request, Response } from 'express';

// Simple debug endpoint to check environment variables
export default function handler(req: Request, res: Response) {
  try {
    // Enable CORS for debugging
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Return environment info
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      hasInviteCodes: typeof process.env.INVITE_CODES === 'string',
      inviteCodesLength: process.env.INVITE_CODES?.length || 0,
      hasSalt: typeof process.env.INVITE_CODE_SALT === 'string',
      saltLength: process.env.INVITE_CODE_SALT?.length || 0,
      firstFiveCharsOfSalt: process.env.INVITE_CODE_SALT?.substring(0, 5) || 'none'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ error: 'Debug endpoint error' });
  }
}