// src/config/environment.ts
export interface Environment {
    INVITE_CODES: string[]
    INVITE_CODE_SALT: string
    RATE_LIMIT_MAX_ATTEMPTS: number
    RATE_LIMIT_WINDOW_MS: number
  }
  
  export const env: Environment = {
    INVITE_CODES: process.env.INVITE_CODES?.split(',') || [],
    INVITE_CODE_SALT: process.env.INVITE_CODE_SALT || '',
    RATE_LIMIT_MAX_ATTEMPTS: Number(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 5,
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000
  }
  
  // Validate environment variables
  export function validateEnv(): void {
    if (!process.env.INVITE_CODES) {
      throw new Error('INVITE_CODES environment variable is required')
    }
    if (!process.env.INVITE_CODE_SALT) {
      throw new Error('INVITE_CODE_SALT environment variable is required')
    }
    if (process.env.INVITE_CODES.split(',').length === 0) {
      throw new Error('At least one invite code is required')
    }
  }