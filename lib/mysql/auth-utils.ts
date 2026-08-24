import { AuthService } from './auth-service';

async function readAuthTokenCookie(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get("auth-token")?.value || null;
  } catch {
    return null;
  }
}

// Server-side authentication utility
export async function getCurrentUser() {
  try {
    const token = await readAuthTokenCookie();
    
    if (!token) {
      return null;
    }

    const payload = await AuthService.verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = await AuthService.getUserById(payload.userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      profile: user
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.profile.role)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
