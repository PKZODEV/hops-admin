'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';
type Role = 'HOTEL_OWNER' | 'QUEUE_OWNER';

interface RegistrationRequest {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  documents: Record<string, string>;
  status: Status;
  rejectReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

const STATUS_LABELS: Record<Status, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING: { label: 'รออนุมัติ', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  APPROVED: { label: 'อนุมัติแล้ว', cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  REJECTED: { label: 'ปฏิเสธแล้ว', cls: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const DOC_LABELS: Record<string, string> = {
  companyCertificate: 'หนังสือรับรองบริษัท',
  businessLicense: 'ใบอนุญาตประกอบการ',
  exteriorPhoto: 'ภาพถ่ายที่พักภายนอก',
  interiorPhoto: 'ภาพถ่ายที่พักภายใน',
  driverLicense: 'ใบขับขี่',
  publicDriverLicense: 'ใบขับขี่สาธารณะ',
  vehiclePhoto: 'ภาพรถ',
};

export default function RegistrationApprovalsPage() {
  const [items, setItems] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | 'ALL'>('PENDING');
  const [selected, setSelected] = useState<RegistrationRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const url = filter === 'ALL' ? `${API}/registration-requests` : `${API}/registration-requests?status=${filter}`;
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    if (!confirm('ยืนยันการอนุมัติคำขอนี้? ระบบจะส่งอีเมลพร้อมรหัสผ่านให้ผู้ลงทะเบียน')) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await fetch(`${API}/registration-requests/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'อนุมัติไม่สำเร็จ');
      setSelected(null);
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'อนุมัติไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('เหตุผลในการปฏิเสธ (ไม่บังคับ)');
    if (reason === null) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await fetch(`${API}/registration-requests/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'ปฏิเสธไม่สำเร็จ');
      setSelected(null);
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'ปฏิเสธไม่สำเร็จ');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">อนุมัติการลงทะเบียน</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบและอนุมัติคำขอลงทะเบียนของเจ้าของที่พักและจัดการยานพาหนะ</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-teal text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s === 'ALL' ? 'ทั้งหมด' : STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          กำลังโหลด...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          ไม่พบรายการ
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(req => {
            const status = STATUS_LABELS[req.status];
            const StatusIcon = status.icon;
            const RoleIcon = req.role === 'HOTEL_OWNER' ? Building2 : Users;
            return (
              <button
                key={req.id}
                onClick={() => setSelected(req)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:border-primary-teal hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${req.role === 'HOTEL_OWNER' ? 'bg-teal-50 text-teal-700' : 'bg-purple-50 text-purple-700'}`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{req.businessName}</h3>
                      <p className="text-xs text-gray-500">{req.role === 'HOTEL_OWNER' ? 'เจ้าของที่พัก' : 'จัดการยานพาหนะ'}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${status.cls}`}>
                    <StatusIcon className="w-3 h-3" /> {status.label}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {req.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {req.phone}</p>
                  <p className="text-gray-400 mt-2">{new Date(req.createdAt).toLocaleString('th-TH')}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.businessName}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selected.role === 'HOTEL_OWNER' ? 'เจ้าของที่พัก' : 'จัดการยานพาหนะ'} · {new Date(selected.createdAt).toLocaleString('th-TH')}
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${STATUS_LABELS[selected.status].cls}`}>
                  {STATUS_LABELS[selected.status].label}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">ข้อมูลผู้ติดต่อ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <InfoRow icon={Users} label="ผู้ติดต่อ" value={selected.name} />
                  <InfoRow icon={Mail} label="อีเมล" value={selected.email} />
                  <InfoRow icon={Phone} label="โทรศัพท์" value={selected.phone} />
                  <InfoRow icon={MapPin} label="ที่อยู่" value={selected.address || '-'} />
                  {selected.latitude != null && selected.longitude != null && (
                    <InfoRow
                      icon={MapPin}
                      label="พิกัด"
                      value={
                        <a
                          href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-teal hover:underline"
                        >
                          {selected.latitude}, {selected.longitude}
                        </a>
                      }
                    />
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">เอกสารแนบ</h3>
                <div className="space-y-2">
                  {Object.entries(selected.documents || {}).map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-primary-teal hover:bg-teal-50 text-sm text-gray-700"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 truncate">{DOC_LABELS[key] || key}</span>
                      <span className="text-xs text-primary-teal font-medium">เปิด ↗</span>
                    </a>
                  ))}
                </div>
              </section>

              {selected.status === 'REJECTED' && selected.rejectReason && (
                <section>
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">เหตุผลที่ปฏิเสธ</h3>
                  <p className="text-sm text-gray-700">{selected.rejectReason}</p>
                </section>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ปิด
              </button>
              {selected.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => reject(selected.id)}
                    disabled={acting}
                    className="px-4 py-2.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    ปฏิเสธ
                  </button>
                  <button
                    onClick={() => approve(selected.id)}
                    disabled={acting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-teal text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    อนุมัติ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}
