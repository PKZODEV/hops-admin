'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ChevronDown } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Property { id: string; name: string }
interface Building { id: string; name: string; floors: Floor[] }
interface Floor { id: string; number: string }
interface Rate { price: number }
interface RoomType { id: string; name: string; rates: Rate[] }
interface AmenityItem { id: string; name: string; icon?: string | null; type: 'HOTEL' | 'ROOM' }

const STATUS_OPTIONS = [
    { value: 'AVAILABLE',   label: 'ว่าง (Available)' },
    { value: 'RESERVED',    label: 'ติดจอง (Reserved)' },
    { value: 'OCCUPIED',    label: 'กำลังเข้าพัก (Occupied)' },
    { value: 'CLEANING',    label: 'ทำความสะอาด (Cleaning)' },
    { value: 'MAINTENANCE', label: 'ซ่อมบำรุง (Maintenance)' },
    { value: 'DISABLED',    label: 'ปิดใช้งาน (Disabled)' },
];

export default function AddRoomPage() {
    const router = useRouter();

    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loadingProperty, setLoadingProperty] = useState(false);

    const [number, setNumber] = useState('');
    const [floorId, setFloorId] = useState('');
    const [roomTypeId, setRoomTypeId] = useState('');
    const [status, setStatus] = useState('AVAILABLE');
    const [images, setImages] = useState<string[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [amenityOptions, setAmenityOptions] = useState<AmenityItem[]>([]);

    useEffect(() => {
        fetch(`${API}/amenities?type=ROOM`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: AmenityItem[]) => Array.isArray(data) && setAmenityOptions(data))
            .catch(() => {});
    }, []);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Load properties
    useEffect(() => {
        fetch(`${API}/properties`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: Property[]) => {
                const list = Array.isArray(data) ? data : [];
                setProperties(list);
                if (list.length > 0) setSelectedPropertyId(list[0].id);
            })
            .catch(() => { });
    }, []);

    // Load buildings + room types when property changes
    useEffect(() => {
        if (!selectedPropertyId) return;
        setLoadingProperty(true);
        setFloorId('');
        setRoomTypeId('');
        Promise.all([
            fetch(`${API}/properties/${selectedPropertyId}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API}/properties/${selectedPropertyId}/rooms`, { credentials: 'include' }).then(r => r.json()),
        ])
            .then(([propData, roomsData]) => {
                setBuildings(propData.buildings ?? []);
                setRoomTypes(Array.isArray(roomsData) ? roomsData : []);
            })
            .catch(() => { })
            .finally(() => setLoadingProperty(false));
    }, [selectedPropertyId]);

    const toggleAmenity = (a: string) =>
        setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!number.trim()) { setError('กรุณากรอกหมายเลขห้อง'); return; }
        if (!floorId) { setError('กรุณาเลือกชั้น'); return; }
        if (!roomTypeId) { setError('กรุณาเลือกประเภทห้อง'); return; }

        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${API}/room-units`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, floorId, roomTypeId, status, images, amenities }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'บันทึกไม่สำเร็จ'));
            }
            const created = await res.json();
            router.push(`/rooms/${created.id}`);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    // Compute all floors from all buildings with label
    const allFloors = buildings.flatMap(b =>
        (b.floors ?? []).map(f => ({ id: f.id, label: `${b.name} — ชั้น ${f.number}`, buildingName: b.name }))
    );

    return (
        <div className="p-6 md:p-8 max-w-[860px] mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">เพิ่มห้องพักใหม่</h1>
                    <p className="text-sm text-gray-500 mt-0.5">สร้างห้องพักและกำหนดรายละเอียด</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Select Hotel */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">เลือกโรงแรม</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {properties.map(p => (
                            <button key={p.id} type="button" onClick={() => setSelectedPropertyId(p.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${p.id === selectedPropertyId ? 'border-primary-teal bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.id === selectedPropertyId ? 'bg-primary-teal text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {p.name.charAt(0)}
                                </div>
                                <span className="truncate">{p.name}</span>
                            </button>
                        ))}
                        {properties.length === 0 && (
                            <p className="text-sm text-gray-400 col-span-2">ยังไม่มีโรงแรมในระบบ กรุณาสร้างโรงแรมก่อน</p>
                        )}
                    </div>
                </div>

                {/* Room Info */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">ข้อมูลห้องพัก</h2>
                    {loadingProperty ? (
                        <div className="text-sm text-gray-400 animate-pulse py-4">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Room number */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">หมายเลขห้อง <span className="text-red-500">*</span></label>
                                <input
                                    value={number}
                                    onChange={e => setNumber(e.target.value)}
                                    placeholder="เช่น 101, 205A"
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">สถานะ</label>
                                <div className="relative">
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition bg-white appearance-none pr-9"
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Floor */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">อาคาร / ชั้น <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        value={floorId}
                                        onChange={e => setFloorId(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition bg-white appearance-none pr-9 disabled:opacity-50"
                                        disabled={allFloors.length === 0}
                                    >
                                        <option value="">— เลือกอาคาร / ชั้น —</option>
                                        {allFloors.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                {allFloors.length === 0 && selectedPropertyId && <p className="text-xs text-orange-500 mt-1">โรงแรมนี้ยังไม่มีอาคาร/ชั้น</p>}
                            </div>

                            {/* Room Type */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">ประเภทห้องพัก <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        value={roomTypeId}
                                        onChange={e => setRoomTypeId(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition bg-white appearance-none pr-9 disabled:opacity-50"
                                        disabled={roomTypes.length === 0}
                                    >
                                        <option value="">— เลือกประเภทห้อง —</option>
                                        {roomTypes.map(rt => (
                                            <option key={rt.id} value={rt.id}>
                                                {rt.name}{rt.rates?.[0] ? ` — ฿${rt.rates[0].price.toLocaleString()}/คืน` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                {roomTypes.length === 0 && selectedPropertyId && <p className="text-xs text-orange-500 mt-1">โรงแรมนี้ยังไม่มีประเภทห้อง</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Images */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">รูปภาพห้องพัก</h2>
                    <ImageUploader value={images} onChange={setImages} maxImages={6} />
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวกในห้อง</h2>
                    {amenityOptions.length === 0 ? (
                        <p className="text-sm text-gray-400">ยังไม่มีรายการ — เพิ่มที่เมนู &quot;กำหนดข้อมูล → สิ่งอำนวยความสะดวก&quot;</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {amenityOptions.map(a => {
                                const selected = amenities.includes(a.name);
                                return (
                                    <button key={a.id} type="button" onClick={() => toggleAmenity(a.name)}
                                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-all ${selected ? 'border-primary-teal bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${selected ? 'bg-primary-teal' : 'bg-gray-300'}`} />
                                        {a.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()}
                        className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        ยกเลิก
                    </button>
                    <button type="submit" disabled={saving || !selectedPropertyId}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-teal text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 shadow-sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'กำลังบันทึก...' : 'บันทึกห้องพัก'}
                    </button>
                </div>
            </form>
        </div>
    );
}
