import { AuthService } from '../mysql/auth-service';

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

    const payload = AuthService.verifyToken(token);
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
      companyId: user.companyId, // Make sure this matches the User interface
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isPlatformAdmin: user.isPlatformAdmin,
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function checkAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    // Import redirect from next/navigation and use it
    // For now, we'll just return null and let calling functions handle the redirect
    return null;
  }
  
  return user;
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
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
