'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { HopsLogo } from '@/components/ui/Logo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'เกิดข้อผิดพลาด';
        throw new Error(msg);
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-[440px] p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6 text-center">
          <HopsLogo className="w-16 h-16 text-xl mb-5 shadow-sm" />
          <h1 className="text-xl font-bold text-gray-900 mb-1">ลืมรหัสผ่าน</h1>
          <p className="text-sm text-gray-500">
            กรอกอีเมลที่ท่านใช้สมัครไว้กับระบบ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
          </p>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 text-sm text-green-700">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">ส่งอีเมลสำเร็จ</p>
                <p className="text-green-700/90">
                  หากอีเมลนี้มีอยู่ในระบบ ท่านจะได้รับลิงก์สำหรับเปลี่ยนรหัสผ่านภายในไม่กี่นาที กรุณาตรวจสอบกล่องจดหมาย (รวมถึงสแปม)
                </p>
              </div>
            </div>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                <span className="inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> กลับไปหน้าเข้าสู่ระบบ
                </span>
              </Button>
            </Link>
          </div>
        ) : (
          <>
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
                onChange={e => setEmail(e.target.value)}
              />
              <Button size="lg" className="w-full text-base py-3.5 mt-2" type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังส่ง...
                  </span>
                ) : (
                  'ส่งลิงก์เปลี่ยนรหัสผ่าน'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="font-medium text-primary-teal hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
