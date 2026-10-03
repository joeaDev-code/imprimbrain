import crypto from 'node:crypto';
export function hashPassword(password:string){const salt=crypto.randomBytes(16);const hash=crypto.scryptSync(password,salt,64);return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`}
export function verifyPassword(password:string,encoded:string){const [,saltS,hashS]=encoded.split('$');if(!saltS||!hashS)return false;const salt=Buffer.from(saltS,'base64url');const expected=Buffer.from(hashS,'base64url');const actual=crypto.scryptSync(password,salt,expected.length);return crypto.timingSafeEqual(actual,expected)}
