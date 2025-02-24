// src/utils/inviteCodes.ts
import { createHash } from 'crypto'
import { env } from '../config/environment'

export class InviteCodeManager {
  private validHashes: Set<string>

  constructor() {
    this.validHashes = new Set(
      env.INVITE_CODES.map(code => this.hashCode(code))
    )
  }

  private hashCode(code: string): string {
    return createHash('sha256')
      .update(code.toLowerCase().trim() + env.INVITE_CODE_SALT)
      .digest('hex')
  }

  public isValidCode(code: string): boolean {
    const hashedInput = this.hashCode(code)
    return this.validHashes.has(hashedInput)
  }

  public static generateHash(code: string): string {
    return createHash('sha256')
      .update(code.toLowerCase().trim() + env.INVITE_CODE_SALT)
      .digest('hex')
  }
}