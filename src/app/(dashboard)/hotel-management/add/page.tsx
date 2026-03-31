'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const AMENITY_OPTIONS = [
    'Wi-Fi ฟรี', 'อาหารเช้า', 'ร้านอาหาร',
    'ฟิตแนส', 'ที่จอดรถ', 'สระว่ายน้ำ',
    'สปา', 'บริการห้อง', 'ซักรีด',
    'บริการต้อนรับ 24 ชม.', 'ห้องประชุม', 'รับส่งสนามบิน',
];

interface BuildingInput { name: string; floors: string }
interface PropertyCategory { id: string; name: string }

export default function AddHotelPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [buildings, setBuildings] = useState<BuildingInput[]>([{ name: 'Main Building', floors: '1' }]);
    const [roomTypes, setRoomTypes] = useState<string[]>([]);
    const [newRoomType, setNewRoomType] = useState('');
    const [propertyCategoryId, setPropertyCategoryId] = useState('');
    const [categories, setCategories] = useState<PropertyCategory[]>([]);

    useEffect(() => {
        fetch(`${API}/property-categories`)
            .then(r => r.json())
            .then((data: PropertyCategory[]) => Array.isArray(data) && setCategories(data))
            .catch(() => {});
    }, []);

    const toggleAmenity = (a: string) =>
        setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

    const addBuilding = () => setBuildings(prev => [...prev, { name: '', floors: '1' }]);
    const removeBuilding = (i: number) => setBuildings(prev => prev.filter((_, idx) => idx !== i));
    const updateBuilding = (i: number, field: keyof BuildingInput, val: string) =>
        setBuildings(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

    const addRoomType = () => {
        if (newRoomType.trim()) { setRoomTypes(prev => [...prev, newRoomType.trim()]); setNewRoomType(''); }
    };

    const handleSubmit = async () => {
        if (!name.trim()) { setError('กรุณากรอกชื่อโรงแรม/พูลวิลล่า/โฮมสเตย์'); return; }
        setLoading(true);
        setError(null);
        try {
            // Create property
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
            if (!propRes.ok) { const d = await propRes.json(); throw new Error(d.message ?? 'ไม่สามารถสร้างที่พักได้'); }
            const prop = await propRes.json() as { id: string };

            // Create buildings
            for (const b of buildings) {
                if (!b.name.trim()) continue;
                const bRes = await fetch(`${API}/buildings`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: b.name.trim(), propertyId: prop.id }),
                });
                if (bRes.ok) {
                    const building = await bRes.json() as { id: string };
                    const numFloors = parseInt(b.floors) || 1;
                    for (let f = 1; f <= numFloors; f++) {
                        await fetch(`${API}/floors`, {
                            method: 'POST', credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ number: String(f), buildingId: building.id }),
                        });
                    }
                }
            }

            router.push('/hotel-management');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal';
    
    return (
        <div className="p-6 md:p-8 max-w-[900px] mx-auto pb-12">
            {/* Header */}
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
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อโรงแรม/พูลวิลล่า/โฮมสเตย์ <span className="text-red-500">*</span></label>
                            <input className={inputCls} placeholder="กรอกชื่อโรงแรม/พูลวิลล่า/โฮมสเตย์" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานที่</label>
                            <input className={inputCls} placeholder="เมือง, จังหวัด" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทที่พัก</label>
                        <select
                            className={inputCls}
                            value={propertyCategoryId}
                            onChange={e => setPropertyCategoryId(e.target.value)}
                        >
                            <option value="">เลือกประเภทที่พัก</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
                        <input className={inputCls} placeholder="ที่อยู่เต็ม" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">คำอธิบาย</label>
                        <textarea
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal min-h-[100px] resize-none"
                            placeholder="อธิบายเกี่ยวกับที่พัก"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                {/* Hotel Images */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1">รูปภาพที่พัก</h2>
                    <p className="text-sm text-gray-500 mb-4">PNG, JPG สูงสุด 5MB (รับหลายไฟล์)</p>
                    <ImageUploader value={images} onChange={setImages} maxImages={10} />
                </div>

                {/* Building Structure */}
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
                                    placeholder="ชื่ออาคาร/หลัง"
                                    value={b.name}
                                    onChange={e => updateBuilding(i, 'name', e.target.value)}
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                    <input
                                        type="number"
                                        min="1"
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

                {/* Amenities */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AMENITY_OPTIONS.map(a => (
                            <label key={a} className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer text-sm transition-colors ${selectedAmenities.includes(a) ? 'border-primary-teal bg-teal-50 text-primary-teal' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${selectedAmenities.includes(a) ? 'border-primary-teal bg-primary-teal' : 'border-gray-300'}`}>
                                    {selectedAmenities.includes(a) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <input type="checkbox" checked={selectedAmenities.includes(a)} onChange={() => toggleAmenity(a)} className="hidden" />
                                {a}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Custom Room Types */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">ประเภทห้องพักพิเศษ</h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {roomTypes.map((rt, i) => (
                            <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                                {rt}
                                <button onClick={() => setRoomTypes(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            className={inputCls + ' flex-1'}
                            placeholder="เช่น Deluxe Suite, Superior Room, Garden View"
                            value={newRoomType}
                            onChange={e => setNewRoomType(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addRoomType()}
                        />
                        <button
                            onClick={addRoomType}
                            className="flex items-center gap-1.5 px-4 h-10 border border-gray-200 rounded-lg text-sm text-primary-teal font-medium hover:bg-teal-50 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> เพิ่ม
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
                <button
                    onClick={() => router.back()}
                    className="flex-1 sm:flex-none sm:px-8 h-11 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 sm:flex-none sm:px-12 h-11 bg-primary-teal text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-60 shadow-sm"
                >
                    {loading ? 'กำลังสร้าง...' : 'สร้างที่พัก'}
                </button>
            </div>
        </div>
    );
}

