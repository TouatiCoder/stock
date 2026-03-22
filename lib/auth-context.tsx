import { useAuth as useMySQLAuth, AuthProvider as MySQLAuthProvider } from './mysql/auth-context';
import type { UserProfile } from './mysql/auth-context';

export { AuthProvider } from './mysql/auth-context';
export { useAuth } from './mysql/auth-context';
export type User = UserProfile;
