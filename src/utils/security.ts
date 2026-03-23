interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();


const RATE_LIMIT_CONFIG = {

  CLAIM_ANALYSIS: { maxRequests: 100, windowMs: 60000 },

  FILE_UPLOAD: { maxRequests: 10, windowMs: 60000 },

  BATCH_PROCESS: { maxRequests: 5, windowMs: 60000 },

  GENERAL: { maxRequests: 200, windowMs: 60000 }
};

type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;


export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'GENERAL'
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMIT_CONFIG[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {

    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }
  
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }
  
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}


export function getClientIdentifier(): string {

  return 'client_' + (typeof window !== 'undefined' ? window.location.hostname : 'unknown');
}

export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  

  let sanitized = input.trim().slice(0, maxLength);
  

  sanitized = sanitized.replace(/\0/g, '');
  

  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&');
}


export function sanitizeNumber(
  input: unknown,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {

  if (typeof input === 'string') {
    const parsed = parseFloat(input.replace(/[^0-9.-]/g, ''));
    if (isNaN(parsed)) return null;
    input = parsed;
  }
  
  if (typeof input !== 'number' || isNaN(input) || !isFinite(input)) {
    return null;
  }
  

  return Math.max(min, Math.min(max, input));
}


export function validateNPI(npi: string): boolean {

  if (!/^\d{10}$/.test(npi)) {
    return false;
  }
  

  const digits = npi.split('').map(Number);
  let sum = 24; 
  
  for (let i = digits.length - 2; i >= 0; i -= 2) {
    let doubled = digits[i] * 2;
    if (doubled > 9) doubled -= 9;
    sum += doubled;
    if (i > 0) sum += digits[i - 1];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
}


export function validateCPTCode(code: string): boolean {
  return /^\d{5}(-\d{2})?$/.test(code);
}


export function validateICD10Code(code: string): boolean {

  return /^[A-Z]\d{2}(\.\d{1,4})?$/i.test(code);
}


export function validatePlaceOfService(code: string): boolean {
  return /^\d{2}$/.test(code);
}


export function sanitizeFileName(fileName: string): string {

  return fileName
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}


export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB max
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();
  
  const typeMap: Record<string, string[]> = {
    'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'xls': ['application/vnd.ms-excel'],
    'csv': ['text/csv', 'application/csv', 'text/plain'],
    'pdf': ['application/pdf']
  };
  
  if (!allowedTypes.includes(extension)) {
    return { valid: false, error: `File type .${extension} not allowed. Allowed: ${allowedTypes.join(', ')}` };
  }
  
  const validMimes = typeMap[extension] || [];
  if (validMimes.length > 0 && !validMimes.includes(mimeType) && mimeType !== '') {
    return { valid: false, error: `Invalid MIME type for .${extension} file` };
  }
  
  return { valid: true };
}


export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}


export function maskPatientId(id: string): string {
  if (id.length <= 4) return '****';
  return id.slice(0, 2) + '*'.repeat(id.length - 4) + id.slice(-2);
}

export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}


export function getEnvVar(key: string, defaultValue: string = ''): string {

  if (key.startsWith('API_KEY') || key.startsWith('SECRET')) {
    console.warn(`SECURITY WARNING: Attempted to access sensitive env var: ${key}`);
    return defaultValue;
  }

  try {
    const envValue = (import.meta as unknown as { env?: Record<string, string> }).env?.[`VITE_${key}`];
    return envValue || defaultValue;
  } catch {
    return defaultValue;
  }
}


export function validateNoSensitiveExposure(data: unknown): boolean {
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /credential/i,
    /private[_-]?key/i
  ];
  
  const jsonStr = JSON.stringify(data);
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(jsonStr)) {
      console.error('SECURITY: Potential sensitive data exposure detected');
      return false;
    }
  }
  
  return true;
}


export function validateObjectKeys<T extends Record<string, unknown>>(
  obj: unknown,
  allowedKeys: (keyof T)[]
): { valid: boolean; sanitized: Partial<T>; unexpectedKeys: string[] } {
  if (typeof obj !== 'object' || obj === null) {
    return { valid: false, sanitized: {}, unexpectedKeys: [] };
  }
  
  const unexpectedKeys: string[] = [];
  const sanitized: Partial<T> = {};
  
  for (const key of Object.keys(obj)) {
    if (allowedKeys.includes(key as keyof T)) {
      sanitized[key as keyof T] = (obj as Record<string, unknown>)[key] as T[keyof T];
    } else {
      unexpectedKeys.push(key);
    }
  }
  
  return {
    valid: unexpectedKeys.length === 0,
    sanitized,
    unexpectedKeys
  };
}
