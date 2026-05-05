'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, X, AlertCircle } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { AmenitiesSelector } from '@/components/onboarding/AmenitiesSelector';
import {
    RoomTypesEditor,
    RoomTypeFormItem,
    validateRoomTypes,
    ROOM_TYPE_PRESETS,
    BED_TYPE_PRESETS,
} from '@/components/hotel/RoomTypesEditor';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface BuildingRow { id?: string; name: string; floorCount: number; originalFloorCount: number; }
interface RawBuilding { id: string; name: string; floors: unknown[]; }
interface PropertyCategory { id: string; name: string }

interface RawRate { id: string; price: number | string; isActive: boolean }
interface RawRoomType {
    id: string; name: string; description?: string | null; bedType?: string | null;
    maxGuests: number; images?: string[]; isActive: boolean;
    rates?: RawRate[];
    _count?: { roomUnits: number };
}

export default function HotelEditPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [propertyCategoryId, setPropertyCategoryId] = useState('');
    const [originalCategoryId, setOriginalCategoryId] = useState('');
    const [categories, setCategories] = useState<PropertyCategory[]>([]);

    const [buildings, setBuildings] = useState<BuildingRow[]>([]);
    const [removedBuildingIds, setRemovedBuildingIds] = useState<string[]>([]);

    const [roomTypes, setRoomTypes] = useState<RoomTypeFormItem[]>([]);
    const [originalRoomTypes, setOriginalRoomTypes] = useState<Record<string, RoomTypeFormItem>>({});

    useEffect(() => {
        fetch(`${API}/property-categories`)
            .then(r => r.json())
            .then((data: PropertyCategory[]) => Array.isArray(data) && setCategories(data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [propRes, bRes, rtRes] = await Promise.all([
                    fetch(`${API}/properties/${id}`, { credentials: 'include' }),
                    fetch(`${API}/properties/${id}/buildings`, { credentials: 'include' }),
                    fetch(`${API}/properties/${id}/rooms`, { credentials: 'include' }),
                ]);
                if (!propRes.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
                const data = await propRes.json();
                setName(data.name ?? '');
                setDescription(data.description ?? '');
                setAddress(data.address ?? '');
                setLocation(data.location ?? '');
                setCity(data.city ?? '');
                setCountry(data.country ?? '');
                setIsActive(data.isActive ?? true);
                setImages(data.images ?? []);
                setAmenities(data.amenities ?? []);
                setPropertyCategoryId(data.propertyCategoryId ?? '');
                setOriginalCategoryId(data.propertyCategoryId ?? '');

                if (bRes.ok) {
                    const bData = await bRes.json();
                    setBuildings(Array.isArray(bData) ? bData.map((b: RawBuilding) => ({
                        id: b.id,
                        name: b.name,
                        floorCount: b.floors.length || 1,
                        originalFloorCount: b.floors.length || 1,
                    })) : []);
                }

                if (rtRes.ok) {
                    const rtData = await rtRes.json() as RawRoomType[];
                    const mapped: RoomTypeFormItem[] = rtData.map(rt => {
                        const activeRate = rt.rates?.find(r => r.isActive) ?? rt.rates?.[0];
                        return {
                            id: rt.id,
                            rateId: activeRate?.id,
                            name: rt.name,
                            price: activeRate ? String(activeRate.price) : '',
                            maxGuests: String(rt.maxGuests),
                            description: rt.description ?? '',
                            bedType: rt.bedType ?? '',
                            images: rt.images ?? [],
                            useCustomName: !ROOM_TYPE_PRESETS.includes(rt.name),
                            useCustomBedType: !!rt.bedType && !BED_TYPE_PRESETS.includes(rt.bedType),
                            roomCount: '1',
                            isActive: rt.isActive,
                            unitCount: rt._count?.roomUnits,
                        };
                    });
                    setRoomTypes(mapped);
                    const snapshot: Record<string, RoomTypeFormItem> = {};
                    mapped.forEach(r => { if (r.id) snapshot[r.id] = { ...r }; });
                    setOriginalRoomTypes(snapshot);
                }
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

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

        const rtErr = validateRoomTypes(roomTypes, { requireRoomCount: false });
        if (rtErr) { setError(rtErr); return; }

        setSaving(true);
        setError('');
        try {
            // 1. Save property fields (omit propertyCategoryId when empty to avoid null)
            const propBody: Record<string, unknown> = {
                name, description, address, location, city, country,
                amenities, images, isActive,
            };
            if (propertyCategoryId) {
                propBody.propertyCategoryId = propertyCategoryId;
            }
            const res = await fetch(`${API}/properties/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(propBody),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'บันทึกไม่สำเร็จ');
            }

            // Warn user (non-blocking) if they attempted to clear category (we skipped it)
            if (originalCategoryId && !propertyCategoryId) {
                // no-op — backend doesn't accept null yet. Silently keep existing category.
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

            // 4. Sync room types + rates
            for (const rt of roomTypes) {
                if (rt.id) {
                    const orig = originalRoomTypes[rt.id];
                    const patchBody: Record<string, unknown> = {};

                    if (rt.name !== orig?.name) patchBody.name = rt.name;
                    if (rt.description !== (orig?.description ?? '')) patchBody.description = rt.description;
                    if (rt.bedType !== (orig?.bedType ?? '')) patchBody.bedType = rt.bedType;
                    const maxG = parseInt(rt.maxGuests) || 1;
                    if (maxG !== parseInt(orig?.maxGuests ?? '0')) patchBody.maxGuests = maxG;
                    if (JSON.stringify(rt.images) !== JSON.stringify(orig?.images ?? [])) patchBody.images = rt.images;
                    if (rt.isActive !== (orig?.isActive ?? true)) patchBody.isActive = rt.isActive;

                    if (Object.keys(patchBody).length > 0) {
                        await fetch(`${API}/rooms/${rt.id}`, {
                            method: 'PATCH', credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(patchBody),
                        });
                    }

                    // Rate: if price changed and still active, create new rate
                    const newPrice = parseFloat(rt.price);
                    const oldPrice = parseFloat(orig?.price ?? '0');
                    if (rt.isActive && !isNaN(newPrice) && newPrice > 0 && newPrice !== oldPrice) {
                        // Deactivate old rate if any
                        if (orig?.rateId) {
                            await fetch(`${API}/rates/${orig.rateId}`, {
                                method: 'PATCH', credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isActive: false }),
                            });
                        }
                        await fetch(`${API}/rates`, {
                            method: 'POST', credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: 'ราคาพื้นฐาน',
                                price: newPrice,
                                roomTypeId: rt.id,
                            }),
                        });
                    }
                } else {
                    // New room type
                    if (!rt.name.trim()) continue;
                    const rtRes = await fetch(`${API}/rooms`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: rt.name.trim(),
                            maxGuests: parseInt(rt.maxGuests) || 2,
                            ...(rt.description ? { description: rt.description } : {}),
                            ...(rt.bedType ? { bedType: rt.bedType } : {}),
                            images: rt.images,
                            propertyId: id,
                        }),
                    });
                    if (rtRes.ok) {
                        const created = await rtRes.json() as { id: string };
                        const price = parseFloat(rt.price);
                        if (!isNaN(price) && price > 0) {
                            await fetch(`${API}/rates`, {
                                method: 'POST', credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: 'ราคาพื้นฐาน',
                                    price,
                                    roomTypeId: created.id,
                                }),
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
    const categoryClearAttempt = !!originalCategoryId && !propertyCategoryId;

    return (
        <div className="p-6 md:p-8 max-w-[900px] mx-auto pb-24">
            <div className="flex items-center gap-3 mb-8">
                <button type="button" onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แก้ไขโรงแรม/พูลวิลล่า/โฮมสเตย์</h1>
                    <p className="text-sm text-gray-500 mt-0.5">อัปเดตข้อมูลที่พัก อาคาร และประเภทห้อง</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">ชื่อที่พัก <span className="text-red-500">*</span></label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
                                placeholder="เช่น โรงแรมศรีพันวา"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">ประเภทที่พัก</label>
                            <select
                                value={propertyCategoryId}
                                onChange={e => setPropertyCategoryId(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition bg-white"
                            >
                                <option value="">เลือกประเภทที่พัก</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {categoryClearAttempt && (
                                <p className="text-[11px] text-amber-600 mt-1">
                                    หมายเหตุ: ระบบยังไม่รองรับการล้างประเภทที่พัก — จะคงค่าเดิมไว้
                                </p>
                            )}
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
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">สถานที่</label>
                            <input
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition"
                                placeholder="เช่น ป่าตอง ภูเก็ต"
                            />
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
                                placeholder="เช่น 123/45 ถ.นิมมานเหมินทร์ ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">คำอธิบาย</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal transition resize-none"
                                placeholder="เช่น โรงแรมบูทีคใจกลางเมือง..."
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-1">รูปภาพที่พัก</h2>
                    <p className="text-xs text-gray-400 mb-4">PNG, JPG สูงสุด 5MB</p>
                    <ImageUploader value={images} onChange={setImages} maxImages={10} />
                </div>

                {/* Building Structure */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">โครงสร้างอาคาร/หลัง</h2>
                            <p className="text-xs text-gray-400 mt-0.5">อาคาร/หลัง / ชั้น ที่ใช้จัดห้องพัก</p>
                        </div>
                        <button type="button" onClick={addBuilding}
                            className="flex items-center gap-1.5 text-xs font-medium text-primary-teal hover:text-teal-700 px-3 py-1.5 border border-primary-teal rounded-lg hover:bg-teal-50 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> เพิ่มอาคาร/หลัง
                        </button>
                    </div>
                    {buildings.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีอาคาร/หลัง</p>
                    ) : (
                        <div className="space-y-3">
                            {buildings.map((b, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    {b.id && (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md shrink-0 hidden sm:block">มีอยู่แล้ว</span>
                                    )}
                                    <input
                                        className="flex-1 h-10 px-3.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal"
                                        placeholder="ชื่ออาคาร/หลัง"
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
                    <h2 className="text-sm font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวกที่พัก</h2>
                    <AmenitiesSelector selected={amenities} onChange={setAmenities} type="HOTEL" />
                </div>

                {/* Room Types */}
                <div>
                    <div className="mb-3">
                        <h2 className="text-base font-bold text-gray-900">ประเภทห้องพัก</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            แก้ไขราคาจะสร้างเรทใหม่อัตโนมัติ — การเก็บเข้าคลังจะซ่อนประเภทห้องจากการจองใหม่ (ห้องเดิมยังคงอยู่)
                        </p>
                    </div>
                    <RoomTypesEditor value={roomTypes} onChange={setRoomTypes} showRoomCount={false} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
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
