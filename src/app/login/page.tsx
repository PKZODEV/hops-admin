'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { HopsLogo } from '@/components/ui/Logo';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body: Record<string, string> = { email, password };
      if (isRegister && name) body.name = name;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}${endpoint}`,
        { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'เกิดข้อผิดพลาด');
        throw new Error(msg);
      }

      // HttpOnly cookie is set by backend — only store non-sensitive user info
      localStorage.setItem('hops_user', JSON.stringify(data.user));

      // Check if they have a property set up already
      const propRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/properties`,
        { credentials: 'include' }
      );
      const props = await propRes.json();
      if (Array.isArray(props) && props.length > 0) {
        localStorage.setItem('hops_property_id', props[0].id);
        router.push('/');
      } else {
        router.push('/setup/welcome');
      }
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
          <p className="text-gray-500 font-medium">
            {isRegister ? 'สร้างบัญชีผู้ดูแลระบบ' : 'เข้าสู่ระบบเพื่อจัดการโรงแรมของคุณ'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <Input
              label="ชื่อ (ไม่บังคับ)"
              type="text"
              placeholder="เช่น สมร ไพโรจน์"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          )}
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
            {loading ? 'กำลังเข้าระบบ...' : isRegister ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {isRegister ? (
            <>
              <span className="text-gray-500">มีบัญชีอยู่แล้ว? </span>
              <button type="button" onClick={() => { setIsRegister(false); setError(null); }} className="font-bold text-primary-teal hover:underline">
                เข้าสู่ระบบ
              </button>
            </>
          ) : (
            <>
              <span className="text-gray-500">ยังไม่มีบัญชี? </span>
              <button type="button" onClick={() => { setIsRegister(true); setError(null); }} className="font-bold text-primary-teal hover:underline">
                ลงทะเบียน
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
