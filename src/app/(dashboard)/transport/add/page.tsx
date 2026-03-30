'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ChevronDown, Plus, X, Users, User, Building2 } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type OwnerType = 'HOTEL' | 'QUEUE_OWNER' | 'INDEPENDENT';
interface Property { id: string; name: string; city?: string }
interface VehicleOwner { id: string; name: string; phone?: string; _count?: { vehicles: number } }
interface VehicleEntry { id: string; name: string; type: string; licensePlate: string; capacity: string; }

const VEHICLE_TYPES = [
  { value: 'CAR', label: '\u{1F697} รถยนต์ส่วนตัว' },
  { value: 'VAN', label: '\u{1F690} รถตู้' },
  { value: 'MINIBUS', label: '\u{1F68C} สองแถว / มินิบัส' },
  { value: 'BUS', label: '\u{1F68E} รถบัส' },
  { value: 'LOCAL', label: '\u{1F6FA} รถท้องถิ่น (รถแดง ฯลฯ)' },
  { value: 'MOTORCYCLE', label: '\u{1F3CD}️ มอเตอร์ไซค์' },
  { value: 'TUKTUK', label: '\u{1F696} ตุ๊กตุ๊ก / สามล้อ' },
  { value: 'BOAT', label: '⛵ เรือ' },
  { value: 'OTHER', label: '\u{1F69B} อื่นๆ' },
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'ว่าง' },
  { value: 'BUSY', label: 'ไม่ว่าง' },
  { value: 'MAINTENANCE', label: 'ซ่อมบำรุง' },
  { value: 'DISABLED', label: 'ปิดใช้งาน' },
];

const FEATURE_OPTIONS = [
  'แอร์', 'Wi-Fi', 'USB ชาร์จ',
  'ที่นั่งเด็ก',
  'กระเป๋าใบใหญ่',
  'รองรับรถเข็น',
  'บริการน้ำดื่ม',
  'ทีวี',
  'ม่านกั้น',
  'ห้องน้ำในรถ',
  'บริการ 24 ชม.',
  'รับสัตว์เลี้ยง',
];

const mkEntry = (): VehicleEntry => ({
  id: Math.random().toString(36).slice(2),
  name: '', type: 'CAR', licensePlate: '', capacity: '4',
});

function OwnerCard({ icon: Icon, title, subtitle, selected, onClick, color }: {
  icon: React.ElementType; title: string; subtitle: string;
  selected: boolean; onClick: () => void; color: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all w-full ${selected ? `border-current ${color} shadow-md scale-[1.02]` : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selected ? 'bg-white/60' : 'bg-gray-100'}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className={`text-xs mt-0.5 leading-tight ${selected ? 'opacity-75' : 'text-gray-400'}`}>{subtitle}</p>
      </div>
    </button>
  );
}

export default function AddTransportPage() {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [ownerType, setOwnerType] = useState<OwnerType>('HOTEL');
  const [multiVehicle, setMultiVehicle] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicleOwners, setVehicleOwners] = useState<VehicleOwner[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [propertyId, setPropertyId] = useState('');
  const [vehicleOwnerId, setVehicleOwnerId] = useState('');
  const [showNewOwner, setShowNewOwner] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [creatingOwner, setCreatingOwner] = useState(false);

  const [type, setType] = useState('CAR');
  const [description, setDescription] = useState('');
  const [route, setRoute] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [pricePerTrip, setPricePerTrip] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [status, setStatus] = useState('AVAILABLE');
  const [isActive, setIsActive] = useState(true);
  const [singleName, setSingleName] = useState('');
  const [singlePlate, setSinglePlate] = useState('');
  const [singleCapacity, setSingleCapacity] = useState('4');
  const [entries, setEntries] = useState<VehicleEntry[]>([mkEntry(), mkEntry()]);

  const loadData = useCallback(() => {
    fetch(`${API}/properties`, { credentials: 'include' })
      .then(r => r.json()).then((d: Property[]) => {
        const list = Array.isArray(d) ? d : [];
        setProperties(list);
        if (list.length > 0) setPropertyId(list[0].id);
      }).catch(() => {});
    fetch(`${API}/vehicle-owners`, { credentials: 'include' })
      .then(r => r.json()).then((d: VehicleOwner[]) => {
        setVehicleOwners(Array.isArray(d) ? d : []);
      }).catch(() => {});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFeature = (f: string) =>
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const updateEntry = (id: string, field: keyof VehicleEntry, value: string) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const removeEntry = (id: string) =>
    setEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);

  const handleCreateOwner = async () => {
    if (!newOwnerName.trim()) return;
    setCreatingOwner(true);
    try {
      const res = await fetch(`${API}/vehicle-owners`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOwnerName, phone: newOwnerPhone || undefined }),
      });
      if (!res.ok) throw new Error('ไม่สามารถสร้างเจ้าของคิวได้');
      const created: VehicleOwner = await res.json();
      setVehicleOwners(prev => [...prev, created]);
      setVehicleOwnerId(created.id);
      setShowNewOwner(false);
      setNewOwnerName(''); setNewOwnerPhone('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally { setCreatingOwner(false); }
  };

  const buildPayload = (name: string, plate: string, cap: string, entryType?: string) => {
    const p: Record<string, unknown> = {
      name, type: entryType ?? type, ownerType,
      description: description || undefined,
      licensePlate: plate || undefined,
      capacity: parseInt(cap) || 4,
      status, images, features,
      route: route || undefined,
      driverName: driverName || undefined,
      driverPhone: driverPhone || undefined,
      isActive,
    };
    if (pricePerTrip) p.pricePerTrip = parseFloat(pricePerTrip);
    if (pricePerHour) p.pricePerHour = parseFloat(pricePerHour);
    if (pricePerDay) p.pricePerDay = parseFloat(pricePerDay);
    if (ownerType === 'HOTEL' && propertyId) p.propertyId = propertyId;
    if (ownerType === 'QUEUE_OWNER' && vehicleOwnerId) p.vehicleOwnerId = vehicleOwnerId;
    return p;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerType === 'HOTEL' && !propertyId) { setError('กรุณาเลือกที่พัก'); return; }
    if (ownerType === 'QUEUE_OWNER' && !vehicleOwnerId) { setError('กรุณาเลือกหรือสร้างเจ้าของคิวรถ'); return; }
    if (multiVehicle) {
      if (entries.some(e => !e.name.trim())) { setError('กรุณากรอกชื่อยานพาหนะทุกคัน'); return; }
    } else {
      if (!singleName.trim()) { setError('กรุณากรอกชื่อยานพาหนะ'); return; }
    }
    setSaving(true); setError('');
    try {
      const payloads = multiVehicle
        ? entries.map(e => buildPayload(e.name, e.licensePlate, e.capacity, e.type))
        : [buildPayload(singleName, singlePlate, singleCapacity)];
      const results = await Promise.all(payloads.map(payload =>
        fetch(`${API}/transport`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.ok ? r.json() : r.json().then((d: { message?: string | string[] }) => {
          throw new Error(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'บันทึกไม่สำเร็จ'));
        }))
      ));
      router.push(`/transport/${results[0].id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50/60">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-8">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <h1 className="text-xl font-bold text-gray-900 mb-1">เพิ่มยานพาหนะใหม่</h1>
          <p className="text-sm text-gray-500 mb-7">เลือกประเภทเจ้าของ / ผู้ดูแลยานพาหนะนี้</p>
          <div className="grid grid-cols-3 gap-3 mb-7">
            <OwnerCard icon={Building2}
              title="ที่พัก"
              subtitle="โรงแรม รีสอร์ท ที่พักในระบบ"
              selected={ownerType === 'HOTEL'} onClick={() => setOwnerType('HOTEL')}
              color="text-teal-700 bg-teal-50 border-primary-teal" />
            <OwnerCard icon={Users}
              title="เจ้าของคิวรถ"
              subtitle="คิวรถแดง รถตู้ สหกรณ์ ฯลฯ"
              selected={ownerType === 'QUEUE_OWNER'} onClick={() => setOwnerType('QUEUE_OWNER')}
              color="text-purple-700 bg-purple-50 border-purple-400" />
            <OwnerCard icon={User}
              title="รถอิสระ"
              subtitle="แท็กซี่ รถรับจ้าง ขับเดี่ยวๆ"
              selected={ownerType === 'INDEPENDENT'} onClick={() => setOwnerType('INDEPENDENT')}
              color="text-orange-700 bg-orange-50 border-orange-400" />
          </div>
          <button type="button" onClick={() => setMultiVehicle(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all mb-6 ${multiVehicle ? 'border-primary-teal bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${multiVehicle ? 'border-primary-teal bg-primary-teal' : 'border-gray-300'}`}>
              {multiVehicle && <span className="text-white text-xs font-bold">&#10003;</span>}
            </span>
            <div className="text-left">
              <span>เพิ่มหลายคันพร้อมกัน</span>
              <span className="text-xs font-normal opacity-60 ml-2">เช่น คิวรถที่มีหลายทะเบียน</span>
            </div>
          </button>
          <button onClick={() => setStep('form')}
            className="w-full py-3 rounded-xl bg-primary-teal text-white font-semibold text-sm hover:bg-teal-600 transition-colors shadow-sm">
            ถัดไป &#8594;
          </button>
        </div>
      </div>
    );
  }

  const ownerLabel = ownerType === 'HOTEL' ? 'ที่พัก' : ownerType === 'QUEUE_OWNER' ? 'เจ้าของคิวรถ' : 'รถอิสระ';
  const ownerBadge = ownerType === 'HOTEL' ? 'bg-teal-100 text-teal-700' : ownerType === 'QUEUE_OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700';

  return (
    <div className="p-6 md:p-8 max-w-[900px] mx-auto pb-24">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setStep('choose')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">เพิ่มยานพาหนะใหม่</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ownerBadge}`}>{ownerLabel}</span>
            {multiVehicle && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">หลายคัน</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">กรอกรายละเอียดยานพาหนะ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {ownerType === 'HOTEL' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">ที่พักที่ดูแล <span className="text-red-500">*</span></h2>
            {properties.length === 0 ? (
              <p className="text-sm text-gray-400">ไม่พบที่พักในระบบ</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {properties.map(p => (
                  <button key={p.id} type="button" onClick={() => setPropertyId(p.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${p.id === propertyId ? 'border-primary-teal bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.id === propertyId ? 'bg-primary-teal text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.city && <p className="text-xs text-gray-400">{p.city}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {ownerType === 'QUEUE_OWNER' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">เจ้าของคิวรถ <span className="text-red-500">*</span></h2>
            {vehicleOwners.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {vehicleOwners.map(o => (
                  <button key={o.id} type="button" onClick={() => { setVehicleOwnerId(o.id); setShowNewOwner(false); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${o.id === vehicleOwnerId ? 'border-purple-400 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${o.id === vehicleOwnerId ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {o.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{o.name}</p>
                      <p className="text-xs text-gray-400">{o._count?.vehicles ?? 0} คัน{o.phone ? ` · ${o.phone}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!showNewOwner ? (
              <button type="button" onClick={() => { setShowNewOwner(true); setVehicleOwnerId(''); }}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium px-3 py-2.5 rounded-xl border border-dashed border-purple-300 hover:bg-purple-50 transition-colors w-full justify-center">
                <Plus className="w-4 h-4" /> สร้างเจ้าของคิวใหม่
              </button>
            ) : (
              <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/40 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-purple-700">สร้างเจ้าของคิวใหม่</p>
                  <button type="button" onClick={() => setShowNewOwner(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อคิวรถ <span className="text-red-500">*</span></label>
                    <input value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)}
                      placeholder="เช่น เจ๊อี๊ดคิวรถแดง, คิวรถตู้เชียงใหม่"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">เบอร์โทร</label>
                    <input value={newOwnerPhone} onChange={e => setNewOwnerPhone(e.target.value)}
                      placeholder="0XX-XXX-XXXX" type="tel"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400" />
                  </div>
                </div>
                <button type="button" onClick={handleCreateOwner} disabled={creatingOwner || !newOwnerName.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                  {creatingOwner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  บันทึกเจ้าของคิว
                </button>
              </div>
            )}
          </div>
        )}

        {ownerType === 'INDEPENDENT' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
            <strong>รถอิสระ</strong> — ไม่ผูกกับที่พักหรือคิวรถ รับงานเดี่ยวๆ หรือเชื่อมต่อในภายหลังได้
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">ประเภทยานพาหนะ</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {VEHICLE_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm text-left transition-all ${type === t.value ? 'border-primary-teal bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {multiVehicle && <p className="text-xs text-gray-400 mt-2">ประเภทนี้เป็น default แต่เปลี่ยนได้แต่ละคันด้านล่าง</p>}
        </div>

        {multiVehicle ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">รายการยานพาหนะ</h2>
              <button type="button" onClick={() => setEntries(prev => [...prev, mkEntry()])}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-teal hover:text-teal-700 px-3 py-1.5 border border-primary-teal rounded-lg hover:bg-teal-50 transition-colors">
                <Plus className="w-3.5 h-3.5" /> เพิ่มคัน
              </button>
            </div>
            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 w-5 text-center shrink-0">{idx + 1}</span>
                  <input value={entry.name} onChange={e => updateEntry(entry.id, 'name', e.target.value)}
                    placeholder="ชื่อ / รุ่นรถ *"
                    className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal/40 focus:border-primary-teal" />
                  <input value={entry.licensePlate} onChange={e => updateEntry(entry.id, 'licensePlate', e.target.value)}
                    placeholder="ทะเบียน"
                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal/40 focus:border-primary-teal" />
                  <div className="relative w-24">
                    <select value={entry.type} onChange={e => updateEntry(entry.id, 'type', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white appearance-none pr-6 focus:outline-none focus:ring-1 focus:ring-primary-teal/40 focus:border-primary-teal">
                      {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label.split(' ').slice(1).join(' ')}</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  <input type="number" min="1" max="100" value={entry.capacity}
                    onChange={e => updateEntry(entry.id, 'capacity', e.target.value)}
                    placeholder="ที่นั่ง"
                    className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal/40 focus:border-primary-teal" />
                  <button type="button" onClick={() => removeEntry(entry.id)} disabled={entries.length <= 1}
                    className="p-1.5 text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">ทะเบียน / ประเภท / ที่นั่ง ไม่บังคับ</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">ข้อมูลยานพาหนะ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">ชื่อ / รุ่น <span className="text-red-500">*</span></label>
                <input value={singleName} onChange={e => setSingleName(e.target.value)}
                  placeholder="เช่น รถแดงเชียงใหม่, Toyota Commuter, เรือหางยาวพะยาม"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">ทะเบียนรถ</label>
                <input value={singlePlate} onChange={e => setSinglePlate(e.target.value)}
                  placeholder="เช่น กข-1234"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">จำนวนที่นั่ง</label>
                <input type="number" min="1" max="100" value={singleCapacity} onChange={e => setSingleCapacity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">รายละเอียดเพิ่มเติม</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">เส้นทาง / จุดบริการ</label>
              <input value={route} onChange={e => setRoute(e.target.value)}
                placeholder="เช่น เชียงใหม่ - ดอยสุเทพ, สนามบิน - ตัวเมือง"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">สถานะ</label>
              <div className="relative">
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm appearance-none pr-9 bg-white focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition">
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">เปิดใช้งาน</label>
              <button type="button" onClick={() => setIsActive(v => !v)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium w-full transition-colors ${isActive ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                {isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </button>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">คำอธิบาย</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="รายละเอียดเพิ่มเติม"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition resize-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-1.5">ราคาบริการ</h2>
          <p className="text-xs text-gray-400 mb-4">ไม่จำเป็นต้องกรอกครบทุกประเภท</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PriceField label="ราคาต่อเที่ยว (฿)" value={pricePerTrip} onChange={setPricePerTrip} placeholder="เช่น 800" />
            <PriceField label="ราคาต่อชั่วโมง (฿)" value={pricePerHour} onChange={setPricePerHour} placeholder="เช่น 300" />
            <PriceField label="ราคาต่อวัน (฿)" value={pricePerDay} onChange={setPricePerDay} placeholder="เช่น 2500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">ข้อมูลคนขับ (ถ้ามี)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">ชื่อคนขับ</label>
              <input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="ชื่อ - นามสกุล"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
              <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="0XX-XXX-XXXX" type="tel"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">
            รูปภาพ
            {multiVehicle && <span className="text-xs font-normal text-gray-400 ml-2">(ใช้สำหรับทุกคันที่เพิ่ม)</span>}
          </h2>
          <ImageUploader value={images} onChange={setImages} maxImages={6} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {FEATURE_OPTIONS.map(f => {
              const sel = features.includes(f);
              return (
                <button key={f} type="button" onClick={() => toggleFeature(f)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-all ${sel ? 'border-primary-teal bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sel ? 'bg-primary-teal' : 'bg-gray-300'}`} />
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setStep('choose')}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            ย้อนกลับ
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-teal text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'กำลังบันทึก...' : (multiVehicle ? `บันทึก ${entries.length} คัน` : 'บันทึกยานพาหนะ')}
          </button>
        </div>

      </form>
    </div>
  );
}

function PriceField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition" />
    </div>
  );
}
