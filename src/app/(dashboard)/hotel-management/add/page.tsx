'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { AmenitiesSelector } from '@/components/onboarding/AmenitiesSelector';
import { RoomTypesEditor, RoomTypeFormItem, emptyRoomType, validateRoomTypes } from '@/components/hotel/RoomTypesEditor';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface BuildingInput { name: string; floors: string }
interface PropertyCategory { id: string; name: string }

export default function AddHotelPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [buildings, setBuildings] = useState<BuildingInput[]>([{ name: 'Main Building', floors: '1' }]);
    const [roomTypes, setRoomTypes] = useState<RoomTypeFormItem[]>([{ ...emptyRoomType(), name: 'Standard', price: '1500' }]);
    const [propertyCategoryId, setPropertyCategoryId] = useState('');
    const [categories, setCategories] = useState<PropertyCategory[]>([]);

    useEffect(() => {
        fetch(`${API}/property-categories`)
            .then(r => r.json())
            .then((data: PropertyCategory[]) => Array.isArray(data) && setCategories(data))
            .catch(() => {});
    }, []);

    const addBuilding = () => setBuildings(prev => [...prev, { name: '', floors: '1' }]);
    const removeBuilding = (i: number) => setBuildings(prev => prev.filter((_, idx) => idx !== i));
    const updateBuilding = (i: number, field: keyof BuildingInput, val: string) =>
        setBuildings(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

    const handleSubmit = async () => {
        if (!name.trim()) { setError('กรุณากรอกชื่อโรงแรม/พูลวิลล่า/โฮมสเตย์'); return; }
        if (buildings.length === 0 || buildings.every(b => !b.name.trim())) {
            setError('กรุณาระบุอาคาร/หลังอย่างน้อย 1 แห่ง');
            return;
        }
        const rtErr = validateRoomTypes(roomTypes, { requireRoomCount: false });
        if (rtErr) { setError(rtErr); return; }

        setLoading(true);
        setError(null);
        try {
            // 1. Create property
            const propRes = await fetch(`${API}/properties`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(), type: 'HOTEL', amenities: selectedAmenities, images,
                    ...(location ? { location } : {}),
                    ...(address ? { address } : {}),
                    ...(description ? { description } : {}),
                    ...(propertyCategoryId ? { propertyCategoryId } : {}),
                }),
            });
            if (!propRes.ok) {
                const d = await propRes.json().catch(() => ({}));
                throw new Error(d.message ?? 'ไม่สามารถสร้างที่พักได้');
            }
            const prop = await propRes.json() as { id: string };

            // 2. Create buildings + floors
            for (const b of buildings) {
                if (!b.name.trim()) continue;
                const bRes = await fetch(`${API}/buildings`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: b.name.trim(), propertyId: prop.id }),
                });
                if (!bRes.ok) continue;
                const building = await bRes.json() as { id: string };
                const numFloors = Math.max(1, parseInt(b.floors) || 1);
                for (let f = 1; f <= numFloors; f++) {
                    await fetch(`${API}/floors`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ number: String(f), buildingId: building.id }),
                    });
                }
            }

            // 3. Create room types + base rate
            for (const rt of roomTypes) {
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
                        propertyId: prop.id,
                    }),
                });
                if (!rtRes.ok) continue;
                const created = await rtRes.json() as { id: string };
                await fetch(`${API}/rates`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'ราคาพื้นฐาน',
                        price: parseFloat(rt.price),
                        roomTypeId: created.id,
                    }),
                });
            }

            router.push(`/hotel-management/${prop.id}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal';

    return (
        <div className="p-6 md:p-8 max-w-[900px] mx-auto pb-12">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">เพิ่มโรงแรม/พูลวิลล่า/โฮมสเตย์ใหม่</h1>
                    <p className="text-sm text-gray-500 mt-0.5">กรอกรายละเอียดเพื่อเพิ่มโรงแรม/พูลวิลล่า/โฮมสเตย์</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อโรงแรม/พูลวิลล่า/โฮมสเตย์ <span className="text-red-500">*</span></label>
                            <input className={inputCls} placeholder="เช่น โรงแรมศรีพันวา, บ้านสวนรีสอร์ท" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานที่</label>
                            <input className={inputCls} placeholder="เช่น ตัวเมืองเชียงใหม่, ป่าตอง ภูเก็ต" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทที่พัก</label>
                        <select className={inputCls} value={propertyCategoryId} onChange={e => setPropertyCategoryId(e.target.value)}>
                            <option value="">เลือกประเภทที่พัก</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
                        <input className={inputCls} placeholder="เช่น 123/45 ถ.นิมมานเหมินทร์ ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">คำอธิบาย</label>
                        <textarea
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal min-h-[100px] resize-none"
                            placeholder="เช่น โรงแรมบูทีคใจกลางเมือง บรรยากาศล้านนา..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1">รูปภาพที่พัก</h2>
                    <p className="text-sm text-gray-500 mb-4">PNG, JPG สูงสุด 5MB</p>
                    <ImageUploader value={images} onChange={setImages} maxImages={10} />
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-900">โครงสร้างอาคาร/หลัง</h2>
                        <button onClick={addBuilding} className="flex items-center gap-1.5 text-sm text-primary-teal font-medium hover:text-teal-700 transition-colors">
                            <Plus className="w-4 h-4" /> เพิ่มอาคาร/หลัง
                        </button>
                    </div>
                    <div className="space-y-3">
                        {buildings.map((b, i) => (
                            <div key={i} className="flex gap-3 items-center">
                                <input
                                    className={inputCls + ' flex-1'}
                                    placeholder="เช่น Main Building, อาคาร A, หลังสระว่ายน้ำ"
                                    value={b.name}
                                    onChange={e => updateBuilding(i, 'name', e.target.value)}
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                    <input
                                        type="number" min="1"
                                        className="w-16 h-10 px-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                        value={b.floors}
                                        onChange={e => updateBuilding(i, 'floors', e.target.value)}
                                    />
                                    <span className="text-sm text-gray-500 whitespace-nowrap">ชั้น</span>
                                </div>
                                {buildings.length > 1 && (
                                    <button onClick={() => removeBuilding(i)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวกรวม</h2>
                    <AmenitiesSelector selected={selectedAmenities} onChange={setSelectedAmenities} type="HOTEL" />
                </div>

                <div>
                    <div className="mb-3">
                        <h2 className="text-base font-bold text-gray-900">ประเภทห้องพัก</h2>
                        <p className="text-xs text-gray-500 mt-0.5">กำหนดประเภทห้องและราคาพื้นฐาน — ห้องพักจริงสร้างได้ภายหลังที่หน้าจัดการห้อง</p>
                    </div>
                    <RoomTypesEditor value={roomTypes} onChange={setRoomTypes} showRoomCount={false} />
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1 sm:flex-none sm:px-8 h-11 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 sm:flex-none sm:px-12 h-11 bg-primary-teal text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-60 shadow-sm inline-flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'กำลังสร้าง...' : 'สร้างที่พัก'}
                </button>
            </div>
        </div>
    );
}
