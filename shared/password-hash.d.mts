export function validPassword(value: unknown): value is string
export function hashPassword(password: string): Promise<string>
export function verifyPassword(password: string, stored: string): Promise<boolean>
