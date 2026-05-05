'use client';
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, CheckCircle2, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HopsLogo } from '@/components/ui/Logo';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const missingToken = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isPasswordValid(newPassword)) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ทั้งสองครั้งไม่ตรงกัน');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
        throw new Error(msg);
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-[440px] p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6 text-center">
          <HopsLogo className="w-16 h-16 text-xl mb-5 shadow-sm" />
          <h1 className="text-xl font-bold text-gray-900 mb-1">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-gray-500">
            กรุณาตั้งรหัสผ่านใหม่ของท่าน
          </p>
        </div>

        {missingToken ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ลิงก์ไม่ถูกต้อง</p>
                <p>ไม่พบ token สำหรับเปลี่ยนรหัสผ่าน กรุณาขอลิงก์ใหม่อีกครั้ง</p>
              </div>
            </div>
            <Link href="/forgot-password" className="block">
              <Button variant="outline" className="w-full">ขอลิงก์ใหม่</Button>
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">เปลี่ยนรหัสผ่านสำเร็จ</p>
                <p>กำลังพาท่านไปยังหน้าเข้าสู่ระบบ...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Input
                  label="รหัสผ่านใหม่"
                  type="password"
                  placeholder="ตั้งรหัสผ่านใหม่ของคุณ"
                  icon={<Lock className="w-5 h-5" />}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <PasswordStrength password={newPassword} />
              </div>
              <Input
                label="ยืนยันรหัสผ่านใหม่"
                type="password"
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                icon={<Lock className="w-5 h-5" />}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                error={
                  confirmPassword && confirmPassword !== newPassword
                    ? 'รหัสผ่านไม่ตรงกัน'
                    : undefined
                }
              />

              <div className="flex items-start gap-2 bg-teal-50/60 border border-teal-100 rounded-lg p-3 text-[11px] text-teal-700 leading-relaxed">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>คำแนะนำ:</strong> ใช้รหัสผ่านที่ไม่ซ้ำกับเว็บไซต์อื่น
                  ผสมตัวพิมพ์ใหญ่/เล็ก ตัวเลข และอักขระพิเศษ
                </span>
              </div>

              <Button size="lg" className="w-full text-base py-3.5 mt-2" type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
                  </span>
                ) : (
                  'บันทึกรหัสผ่านใหม่'
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary-teal" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
