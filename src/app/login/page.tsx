'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { HopsLogo } from '@/components/ui/Logo';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { setStoredUser } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'เกิดข้อผิดพลาด');
        throw new Error(msg);
      }

      setStoredUser(data.user);

      // Force password change on first login
      if (data.user.mustChangePassword) {
        router.push('/setup/change-password');
        return;
      }

      // SUPER_ADMIN goes straight to dashboard
      if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN') {
        router.push('/');
        return;
      }

      // Other roles — pick first property if any, else dashboard
      try {
        const propRes = await fetch(`${API}/properties`, { credentials: 'include' });
        const props = await propRes.json();
        if (Array.isArray(props) && props.length > 0) {
          localStorage.setItem('hops_property_id', props[0].id);
        }
      } catch {}
      router.push('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-[420px] p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8 text-center">
          <HopsLogo className="w-16 h-16 text-xl mb-6 shadow-sm" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hotel Management System</h1>
          <p className="text-gray-500 font-medium">เข้าสู่ระบบเพื่อจัดการธุรกิจของคุณ</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="อีเมล"
            type="email"
            placeholder="example@hotel.com"
            icon={<Mail className="w-5 h-5" />}
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
          <Input
            label="รหัสผ่าน"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            required
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          />
          <Button size="lg" className="w-full text-base py-3.5 mt-2" type="submit" disabled={loading}>
            {loading ? 'กำลังเข้าระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">ยังไม่มีบัญชี? </span>
          <Link href="/register" className="font-bold text-primary-teal hover:underline">
            ลงทะเบียน
          </Link>
        </div>
      </Card>
    </div>
  );
}
