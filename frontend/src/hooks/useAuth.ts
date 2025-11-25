// frontend/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/api';

interface AuthPayload {
  id: number;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'VIEWER' | 'USER';
  iat: number;
  exp: number;
}

function decodeJwt(token: string): AuthPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthPayload | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const decoded = decodeJwt(token);
      setAuth(decoded);
    }
  }, []);

  return {
    user: auth,
    role: auth?.role,
    isAdmin: auth?.role === 'ADMIN' || auth?.role === 'SUPER_ADMIN',
    isSuperAdmin: auth?.role === 'SUPER_ADMIN',
  };
}
