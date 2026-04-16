'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HopsLogo } from '@/components/ui/Logo';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { getStoredUser, setStoredUser } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isPasswordValid(newPassword)) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword === currentPassword) {
      setError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ทั้งสองครั้งไม่ตรงกัน');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
        throw new Error(msg);
      }
      // Clear mustChangePassword flag in localStorage
      const u = getStoredUser();
      if (u) setStoredUser({ ...u, mustChangePassword: false });
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-[440px] p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <HopsLogo className="w-16 h-16 text-xl mb-5 shadow-sm" />
          <h1 className="text-xl font-bold text-gray-900 mb-1">เปลี่ยนรหัสผ่าน</h1>
          <p className="text-sm text-gray-500">
            เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ของท่านเอง
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            เปลี่ยนรหัสผ่านสำเร็จ กำลังเข้าสู่ระบบ...
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="รหัสผ่านปัจจุบัน (ที่ระบบส่งให้)"
              type="password"
              placeholder="กรอกรหัสผ่านที่ได้รับจากอีเมล"
              icon={<Lock className="w-5 h-5" />}
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
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
                ผสมตัวพิมพ์ใหญ่/เล็ก ตัวเลข และอักขระพิเศษ เพื่อความปลอดภัยของบัญชีของคุณ
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
        )}
      </Card>
    </div>
  );
}
