'use client';

import { useEffect, useState } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'HOTEL_OWNER' | 'QUEUE_OWNER';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  mustChangePassword?: boolean;
  vehicleOwnerId?: string | null;
}

const STORAGE_KEY = 'hops_user';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('hops_property_id');
}

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setUser(getStoredUser());
    setLoaded(true);
  }, []);
  return { user, loaded };
}

export function isSuperAdmin(user: AuthUser | null) {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
}

export function isHotelOwner(user: AuthUser | null) {
  return user?.role === 'HOTEL_OWNER';
}

export function isQueueOwner(user: AuthUser | null) {
  return user?.role === 'QUEUE_OWNER';
}
