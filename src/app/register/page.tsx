'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  CarFront,
  Store,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DocumentUploader } from '@/components/ui/DocumentUploader';
import { ThaiAddressPicker, ThaiAddressValue } from '@/components/ui/ThaiAddressPicker';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type Role = 'HOTEL_OWNER' | 'QUEUE_OWNER' | 'CAR_RENTAL' | 'SHOP';
const COMING_SOON_ROLES: Role[] = ['CAR_RENTAL', 'SHOP'];

type DocSpec = { key: string; label: string; required?: boolean };

const HOTEL_DOCS: DocSpec[] = [
  { key: 'exteriorPhoto', label: 'ภาพถ่ายที่พักภายนอก', required: true },
  { key: 'companyCertificate', label: 'หนังสือรับรองบริษัท (ถ้ามี)' },
  { key: 'businessLicense', label: 'ใบอนุญาตประกอบการ (ถ้ามี)' },
];

const QUEUE_DOCS: DocSpec[] = [
  { key: 'driverLicense', label: 'ใบขับขี่', required: true },
  { key: 'publicDriverLicense', label: 'ใบขับขี่สาธารณะ', required: true },
  { key: 'vehiclePhoto', label: 'ภาพรถ', required: true },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'form' | 'success'>('choose');
  const [role, setRole] = useState<Role>('HOTEL_OWNER');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [thaiAddress, setThaiAddress] = useState<ThaiAddressValue>({});
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [docs, setDocs] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docList = role === 'HOTEL_OWNER' ? HOTEL_DOCS : role === 'QUEUE_OWNER' ? QUEUE_DOCS : [];
  const requiredDocs = docList.filter(d => d.required);

  const setDoc = (key: string, url: string | undefined) => {
    setDocs(prev => {
      const next = { ...prev };
      if (url) next[key] = url;
      else delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim() || !businessName.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (!thaiAddress.provinceId || !thaiAddress.districtId || !thaiAddress.subDistrictId) {
      setError('กรุณาเลือกจังหวัด อำเภอ และตำบลให้ครบถ้วน');
      return;
    }
    const missing = requiredDocs.find(d => !docs[d.key]);
    if (missing) {
      setError(`กรุณาแนบ "${missing.label}"`);
      return;
    }
    const composedAddress = [
      addressDetail.trim(),
      thaiAddress.subDistrictName && `ต.${thaiAddress.subDistrictName}`,
      thaiAddress.districtName && `อ.${thaiAddress.districtName}`,
      thaiAddress.provinceName && `จ.${thaiAddress.provinceName}`,
      thaiAddress.zipCode,
    ]
      .filter(Boolean)
      .join(' ');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name,
          email,
          phone,
          businessName,
          address: composedAddress || undefined,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
          documents: docs,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'ลงทะเบียนไม่สำเร็จ';
        throw new Error(msg);
      }
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลงทะเบียนไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px] p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ส่งคำขอลงทะเบียนสำเร็จ</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            ทีมงานจะตรวจสอบเอกสารของท่านและส่งรหัสผ่านสำหรับเข้าสู่ระบบไปยังอีเมล{' '}
            <strong className="text-gray-700">{email}</strong> เมื่อคำขอได้รับการอนุมัติ
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-teal text-white text-sm font-medium hover:bg-teal-600"
          >
            กลับไปยังหน้าเข้าสู่ระบบ
          </button>
        </Card>
      </div>
    );
  }

  if (step === 'choose') {
    const isComingSoon = COMING_SOON_ROLES.includes(role);
    const handleNext = () => {
      if (isComingSoon) return;
      setStep('form');
    };
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
        <Card className="w-full max-w-[560px] p-8">
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6">
            <ArrowLeft className="w-4 h-4" /> กลับไปเข้าสู่ระบบ
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ลงทะเบียน</h1>
          <p className="text-gray-500 mb-6 text-sm">เลือกประเภทการลงทะเบียนของท่าน</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <RoleCard
              active={role === 'HOTEL_OWNER'}
              onClick={() => setRole('HOTEL_OWNER')}
              icon={Building2}
              title="เจ้าของที่พัก"
              subtitle="โรงแรม รีสอร์ท พูลวิลล่า/วิลล่า โฮมสเตย์"
              accent="teal"
            />
            <RoleCard
              active={role === 'QUEUE_OWNER'}
              onClick={() => setRole('QUEUE_OWNER')}
              icon={Users}
              title="จัดการยานพาหนะ"
              subtitle="คิวรถ รถตู้ รถสาธารณะ"
              accent="purple"
            />
            <RoleCard
              active={role === 'CAR_RENTAL'}
              onClick={() => setRole('CAR_RENTAL')}
              icon={CarFront}
              title="รถเช่า"
              subtitle="บริการให้เช่ารถ"
              accent="orange"
              comingSoon
            />
            <RoleCard
              active={role === 'SHOP'}
              onClick={() => setRole('SHOP')}
              icon={Store}
              title="ร้านค้า / ร้านอาหาร"
              subtitle="ร้านค้า คาเฟ่ ภัตตาคาร"
              accent="rose"
              comingSoon
            />
          </div>

          {isComingSoon && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-700">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>เร็วๆ นี้</strong> — ประเภทนี้ยังไม่เปิดให้ลงทะเบียน
                กรุณาติดตามการอัปเดตจากทีมงาน
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isComingSoon}
            className="w-full py-3 rounded-xl bg-primary-teal text-white font-semibold text-sm hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-teal"
          >
            ถัดไป →
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-8 px-4">
      <div className="max-w-[680px] mx-auto">
        <button
          type="button"
          onClick={() => setStep('choose')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>
        <Card className="p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            ลงทะเบียน {role === 'HOTEL_OWNER' ? 'เจ้าของที่พัก' : 'จัดการยานพาหนะ'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            กรอกข้อมูลและแนบเอกสารเพื่อรอการอนุมัติจากทีมงาน
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="ชื่อผู้ติดต่อ" required value={name} onChange={setName} placeholder="ชื่อ - นามสกุล" />
              <Field label="อีเมล" required type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
              <Field label="เบอร์โทร" required type="tel" value={phone} onChange={setPhone} placeholder="0XX-XXX-XXXX" />
              <Field
                label={role === 'HOTEL_OWNER' ? 'ชื่อที่พัก' : 'ชื่อกิจการ'}
                required
                value={businessName}
                onChange={setBusinessName}
                placeholder={role === 'HOTEL_OWNER' ? 'เช่น โรงแรมศรีพันวา' : 'เช่น บริษัทรับจัดการยานพาหนะ'}
              />
              <Field label="พิกัด — ละติจูด" value={latitude} onChange={setLatitude} placeholder="18.7883" />
              <Field label="พิกัด — ลองจิจูด" value={longitude} onChange={setLongitude} placeholder="98.9853" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-3">ที่อยู่</h2>
              <div className="space-y-3">
                <ThaiAddressPicker
                  required
                  value={thaiAddress}
                  onChange={setThaiAddress}
                />
                <Field
                  label="บ้านเลขที่ / หมู่ / ซอย / ถนน"
                  value={addressDetail}
                  onChange={setAddressDetail}
                  placeholder="เช่น 123/45 หมู่ 5 ซอยสุขุมวิท 21 ถ.สุขุมวิท"
                />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-3">เอกสารแนบ</h2>
              <div className="space-y-3">
                {docList.map(d => (
                  <DocumentUploader
                    key={d.key}
                    label={d.label}
                    required={d.required}
                    value={docs[d.key]}
                    onChange={url => setDoc(d.key, url)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-teal text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                ส่งคำขอลงทะเบียน
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

const ACCENTS: Record<string, { active: string; iconBg: string }> = {
  teal: {
    active: 'border-primary-teal bg-teal-50 text-teal-700 shadow-md',
    iconBg: 'bg-white/60',
  },
  purple: {
    active: 'border-purple-400 bg-purple-50 text-purple-700 shadow-md',
    iconBg: 'bg-white/60',
  },
  orange: {
    active: 'border-orange-400 bg-orange-50 text-orange-700 shadow-md',
    iconBg: 'bg-white/60',
  },
  rose: {
    active: 'border-rose-400 bg-rose-50 text-rose-700 shadow-md',
    iconBg: 'bg-white/60',
  },
};

function RoleCard({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
  accent,
  comingSoon,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accent: 'teal' | 'purple' | 'orange' | 'rose';
  comingSoon?: boolean;
}) {
  const a = ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all ${active ? a.active : 'border-gray-200 hover:border-gray-300'}`}
    >
      {comingSoon && (
        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          เร็วๆ นี้
        </span>
      )}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${active ? a.iconBg : 'bg-gray-100'}`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs mt-0.5 opacity-75">{subtitle}</p>
      </div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
      />
    </div>
  );
}
