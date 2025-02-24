// scripts/generateInviteCode.ts
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const INVITE_CODE_SALT = process.env.INVITE_CODE_SALT;

if (!INVITE_CODE_SALT) {
  console.error('INVITE_CODE_SALT environment variable is required');
  process.exit(1);
}

const code = process.argv[2];
if (!code) {
  console.error('Please provide an invite code as an argument');
  console.error('Usage: npm run generate-code your-invite-code');
  process.exit(1);
}

const hash = createHash('sha256')
  .update(code.toLowerCase().trim() + INVITE_CODE_SALT)
  .digest('hex');

console.log(`
Generated Hash for Invite Code:
------------------------------
Code: ${code}
Hash: ${hash}

Add this hash to your INVITE_CODES environment variable.
`);