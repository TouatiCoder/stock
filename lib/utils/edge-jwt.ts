// Simple JWT implementation for Edge runtime
// This avoids using the 'crypto' module which isn't available in Edge

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// تحديث الواجهة لتشمل الحقول الإضافية
export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  companyId?: string;
  exp?: number;
  iat?: number;
  [key: string]: any; // السماح بحقول إضافية
}

// Simple base64 encoding (Edge compatible)
function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf8');
  }
  return decodeURIComponent(escape(atob(str)));
}

// Simple hash function for demonstration (NOT secure for production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ✅ تم تحديث الدالة لتقبل نصاً (userId) أو كائناً كاملاً
export function generateToken(payload: string | Omit<JwtPayload, 'exp' | 'iat'>): string {
  try {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    let tokenPayload: JwtPayload;

    // دعم التوافقية العكسية (إذا تم تمرير نص فقط)
    if (typeof payload === 'string') {
      tokenPayload = { userId: payload };
    } else {
      // ✅ التعديل هنا: إضافة (as JwtPayload) لحل مشكلة TypeScript
      tokenPayload = { ...payload } as JwtPayload;
    }
    
    // إضافة تواريخ الصلاحية
    tokenPayload.exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
    tokenPayload.iat = Math.floor(Date.now() / 1000);
    
    const headerEncoded = base64Encode(JSON.stringify(header));
    const payloadEncoded = base64Encode(JSON.stringify(tokenPayload));
    const signature = simpleHash(`${headerEncoded}.${payloadEncoded}.${JWT_SECRET}`);
    
    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [headerEncoded, payloadEncoded, signature] = parts;
    
    // Verify signature
    const expectedSignature = simpleHash(`${headerEncoded}.${payloadEncoded}.${JWT_SECRET}`);
    if (signature !== expectedSignature) {
      console.log('❌ Invalid token signature');
      return null;
    }
    
    // Decode payload
    const payloadStr = base64Decode(payloadEncoded);
    const payload: JwtPayload = JSON.parse(payloadStr);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Token expired');
      return null;
    }
    
    return payload;
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    return null;
  }
}