'use client';

import { useEffect, useState } from 'react';

/**
 * Client-side authentication helpers.
 *
 * The authoritative authentication credential is the `hops_token` HTTP-only
 * cookie issued by the backend; that cookie is the only thing that grants
 * access to protected API routes.
 *
 * The user profile mirrored into `localStorage` here is **non-authoritative**
 * and exists purely to render UI without a network round-trip on every page
 * load. It must never be trusted for authorisation decisions on the server.
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'STAFF'
  | 'HOTEL_OWNER'
  | 'QUEUE_OWNER';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  mustChangePassword?: boolean;
  vehicleOwnerId?: string | null;
}

const STORAGE_KEY = 'hops_user';
const PROPERTY_KEY = 'hops_property_id';

/**
 * Returns the cached user profile, or `null` when none exists or when
 * called during server-side rendering.
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/**
 * Persists the user profile to `localStorage`. No-op during SSR.
 */
export function setStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * Clears the cached user profile and the active property selection.
 *
 * Note: the backend is responsible for invalidating the `hops_token` cookie
 * via the `/auth/logout` endpoint. This function only clears the client-side
 * mirror.
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROPERTY_KEY);
}

/**
 * React hook that hydrates the cached user on mount.
 *
 * `loaded` flips to `true` after the first effect runs so callers can
 * distinguish "not yet hydrated" from "definitely signed out".
 */
export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setUser(getStoredUser());
    setLoaded(true);
  }, []);
  return { user, loaded };
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
}

export function isHotelOwner(user: AuthUser | null): boolean {
  return user?.role === 'HOTEL_OWNER';
}

export function isQueueOwner(user: AuthUser | null): boolean {
  return user?.role === 'QUEUE_OWNER';
}
