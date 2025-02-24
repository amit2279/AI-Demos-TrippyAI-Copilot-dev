// scripts/generateSalt.ts
import { randomBytes } from 'crypto';

// Generate a 32-byte random salt and convert to hex
const salt = randomBytes(32).toString('hex');

console.log(`
Generated Salt for Invite Codes:
------------------------------
INVITE_CODE_SALT="${salt}"

Add this to your .env file, but never share it or commit it!
`);

// Run with: npm run generate-salt

/* Key Security Points:
The salt must be:
Long and random
Kept secret
Consistent across your application
Stored securely in environment variables

Never:
Commit the salt to version control
Share the salt
Use a predictable salt
Store the salt in your code

The salt adds an extra layer of security by:
Preventing rainbow table attacks
Making the same invite code produce different hashes in different environments
Ensuring that even if someone gets your hashed codes, they can't reverse engineer the original codes without the salt */