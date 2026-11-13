import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

// OWASP's 16 MiB scrypt configuration. Fixed costs bound malformed stored inputs.
const PREFIX = 'scrypt$16384$8$5$'
const PATTERN = /^scrypt\$16384\$8\$5\$([a-f0-9]{32})\$([a-f0-9]{64})$/

export function validPassword(value) {
 return typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72
}

function derive(password, salt) {
 return new Promise((resolve, reject) => {
  scrypt(password, salt, 32, { N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024 }, (error, key) => {
   if (error) reject(error)
   else resolve(key)
  })
 })
}

export async function hashPassword(password) {
 if (!validPassword(password)) throw new Error('Password must be at least 12 characters and at most 72 UTF-8 bytes')
 const salt = randomBytes(16)
 const key = await derive(password, salt)
 return `${PREFIX}${salt.toString('hex')}$${key.toString('hex')}`
}

export async function verifyPassword(password, stored) {
 if (typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72 || typeof stored !== 'string') return false
 const match = PATTERN.exec(stored)
 if (!match) return false
 const key = await derive(password, Buffer.from(match[1], 'hex'))
 return timingSafeEqual(key, Buffer.from(match[2], 'hex'))
}

