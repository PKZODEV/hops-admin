'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const PROPERTY_TYPES = ['HOTEL', 'RESORT', 'GUESTHOUSE', 'VILLA', 'HOSTEL', 'APARTMENT', 'MOTEL', 'OTHER'];
const AMENITY_OPTIONS = [
    'Wi-Fi ฟรี', 'อาหารเช้า', 'ร้านอาหาร', 'ฟิตแนส', 'ที่จอดรถ', 'สระว่ายน้ำ',
    'สปา', 'บริการห้อง', 'ซักรีด', 'บริการต้อนรับ 24 ชม.', 'ห้องประชุม', 'รับส่งสนามบิน',
];

interface BuildingRow { id?: string; name: string; floorCount: number; originalFloorCount: number; }
interface RawBuilding { id: string; name: string; floors: unknown[]; }

export default function HotelEditPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [type, setType] = useState('HOTEL');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);

    const [buildings, setBuildings] = useState<BuildingRow[]>([]);
    const [removedBuildingIds, setRemovedBuildingIds] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [propRes, bRes] = await Promise.all([
                    fetch(`${API}/properties/${id}`, { credentials: 'include' }),
                    fetch(`${API}/properties/${id}/buildings`, { credentials: 'include' }),
                ]);
                if (!propRes.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
                const data = await propRes.json();
                setName(data.name ?? '');
                setType(data.type ?? 'HOTEL');
                setDescription(data.description ?? '');
                setAddress(data.address ?? '');
                setCity(data.city ?? '');
                setCountry(data.country ?? '');
                setIsActive(data.isActive ?? true);
                setImages(data.images ?? []);
                setAmenities(data.amenities ?? []);
                if (bRes.ok) {
                    const bData = await bRes.json();
                    setBuildings(Array.isArray(bData) ? bData.map((b: RawBuilding) => ({
                        id: b.id,
                        name: b.name,
                        floorCount: b.floors.length || 1,
                        originalFloorCount: b.floors.length || 1,
                    })) : []);
                }
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const toggleAmenity = (a: string) =>
        setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

    const addBuilding = () =>
        setBuildings(prev => [...prev, { name: '', floorCount: 1, originalFloorCount: 0 }]);

    const removeBuilding = (i: number) => {
        const b = buildings[i];
        if (b.id) setRemovedBuildingIds(prev => [...prev, b.id!]);
        setBuildings(prev => prev.filter((_, idx) => idx !== i));
    };

    const updateBuilding = (i: number, field: keyof BuildingRow, val: string | number) =>
        setBuildings(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('กรุณากรอกชื่อโรงแรม'); return; }
        setSaving(true);
        setError('');
        try {
            // 1. Save property fields
            const res = await fetch(`${API}/properties/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, description, address, city, country, amenities, images, isActive }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message ?? 'บันทึกไม่สำเร็จ');
            }

            // 2. Delete removed buildings
            for (const bid of removedBuildingIds) {
                await fetch(`${API}/buildings/${bid}`, { method: 'DELETE', credentials: 'include' });
            }

            // 3. Update or create buildings
            for (const b of buildings) {
                if (b.id) {
                    await fetch(`${API}/buildings/${b.id}`, {
                        method: 'PATCH', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: b.name }),
                    });
                    // Add new floors if count increased
                    if (b.floorCount > b.originalFloorCount) {
                        for (let f = b.originalFloorCount + 1; f <= b.floorCount; f++) {
                            await fetch(`${API}/floors`, {
                                method: 'POST', credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ number: String(f), buildingId: b.id }),
                            });
                        }
                    }
                } else {
                    if (!b.name.trim()) continue;
                    const bRes = await fetch(`${API}/buildings`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: b.name.trim(), propertyId: id }),
                    });
                    if (bRes.ok) {
                        const building = await bRes.json() as { id: string };
                        for (let f = 1; f <= b.floorCount; f++) {
                            await fetch(`${API}/floors`, {
                                method: 'POST', credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ number: String(f), buildingId: building.id }),
                            });
                        }
                    }
                }
            }

            router.push(`/hotel-management/${id}`);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-400 animate-pulse">
            กำลังโหลด...
        </div>
    );

    const floorWarning = buildings.some(b => b.id && b.floorCount < b.originalFloorCount);

    return (
        <div className="p-6 md:p-8 max-w-[900px] mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แก้ไขโรงแรม</h1>
                    <p className="text-sm text-gray-500 mt-0.5">อัปเดตข้อมูลโรงแรม</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">ชื่อโรงแรม <span className="text-red-500">*</span></label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
                                placeholder="ชื่อโรงแรม"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">ประเภทที่พัก</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition bg-white"
                            >
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">สถานะ</label>
                            <button type="button" onClick={() => setIsActive(v => !v)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium w-full transition-colors ${isActive ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">เมือง</label>
                            <input
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
                                placeholder="เช่น กรุงเทพมหานคร"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">ประเทศ</label>
                            <input
                                value={country}
                                onChange={e => setCountry(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
                                placeholder="เช่น Thailand"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">ที่อยู่</label>
                            <input
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
                                placeholder="ที่อยู่โรงแรม"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">คำอธิบาย</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition resize-none"
                                placeholder="คำอธิบายโรงแรม"
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-1">รูปภาพโรงแรม</h2>
                    <p className="text-xs text-gray-400 mb-4">PNG, JPG สูงสุด 5MB</p>
                    <ImageUploader value={images} onChange={setImages} maxImages={10} />
                </div>

                {/* Building Structure */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">โครงสร้างอาคาร</h2>
                            <p className="text-xs text-gray-400 mt-0.5">อาคาร / ชั้น ที่ใช้จัดห้องพัก — เก็บในตาราง Building & Floor เดียวกับขั้นตอนตั้งค่า</p>
                        </div>
                        <button type="button" onClick={addBuilding}
                            className="flex items-center gap-1.5 text-xs font-medium text-primary-teal hover:text-teal-700 px-3 py-1.5 border border-primary-teal rounded-lg hover:bg-teal-50 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> เพิ่มอาคาร
                        </button>
                    </div>
                    {buildings.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีอาคาร — กด &quot;เพิ่มอาคาร&quot; เพื่อเริ่มต้น</p>
                    ) : (
                        <div className="space-y-3">
                            {buildings.map((b, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    {b.id && (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md shrink-0 hidden sm:block">มีอยู่แล้ว</span>
                                    )}
                                    <input
                                        className="flex-1 h-10 px-3.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal"
                                        placeholder="ชื่ออาคาร เช่น Main Building, อาคาร A"
                                        value={b.name}
                                        onChange={e => updateBuilding(i, 'name', e.target.value)}
                                    />
                                    <div className="flex items-center gap-2 shrink-0">
                                        <input
                                            type="number" min="1"
                                            className="w-16 h-10 px-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            value={b.floorCount}
                                            onChange={e => updateBuilding(i, 'floorCount', parseInt(e.target.value) || 1)}
                                        />
                                        <span className="text-sm text-gray-500 whitespace-nowrap">ชั้น</span>
                                    </div>
                                    <button type="button" onClick={() => removeBuilding(i)}
                                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {floorWarning && (
                        <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            การลดจำนวนชั้นสำหรับอาคารที่มีอยู่แล้วจะไม่มีผล — ต้องลบชั้นผ่านหน้าจัดการห้องพัก
                        </p>
                    )}
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {AMENITY_OPTIONS.map(a => {
                            const selected = amenities.includes(a);
                            return (
                                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-all ${selected ? 'border-primary-teal bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${selected ? 'bg-primary-teal' : 'bg-gray-300'}`} />
                                    {a}
                                </button>
                            );
                        })}
                    </div>
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
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-teal text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 shadow-sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                </div>
            </form>
        </div>
    );
}
