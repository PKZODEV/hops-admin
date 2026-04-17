'use client';
import React, { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { Plus, Search, Pencil, Trash2, Sparkles, X, LucideIcon } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type AmenityType = 'HOTEL' | 'ROOM';

interface Amenity {
    id: string;
    name: string;
    icon?: string | null;
    type: AmenityType;
    isActive: boolean;
    sortOrder: number;
}

const TYPE_LABEL: Record<AmenityType, string> = {
    HOTEL: 'ที่พัก',
    ROOM: 'ห้องพัก',
};

const ICON_OPTIONS = [
    'Wifi', 'Coffee', 'UtensilsCrossed', 'Dumbbell', 'Car', 'Waves', 'Sparkles',
    'BellRing', 'WashingMachine', 'Users', 'Presentation', 'PlaneTakeoff',
    'Wind', 'Tv', 'Wine', 'Refrigerator', 'Lock', 'Bath', 'ShowerHead',
    'Home', 'Briefcase', 'Snowflake', 'Flame', 'Dog', 'Cigarette',
    'Baby', 'Accessibility', 'Bike', 'Bus', 'Tree', 'Mountain', 'Sun', 'Moon',
    'Music', 'Gamepad2', 'BookOpen', 'Utensils', 'Phone', 'Mail', 'Shield',
];

function renderIcon(name?: string | null, className = 'w-5 h-5') {
    if (!name) return <Sparkles className={className} />;
    const Comp = (Icons as unknown as Record<string, LucideIcon>)[name];
    return Comp ? <Comp className={className} /> : <Sparkles className={className} />;
}

export default function AmenitiesMasterPage() {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | AmenityType>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Amenity | null>(null);

    const loadAll = () => {
        setLoading(true);
        fetch(`${API}/amenities?includeInactive=true`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: Amenity[]) => setAmenities(Array.isArray(data) ? data : []))
            .catch(() => setAmenities([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadAll(); }, []);

    const filtered = useMemo(() => {
        let result = amenities;
        if (filterType !== 'all') result = result.filter(a => a.type === filterType);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(a => a.name.toLowerCase().includes(q));
        }
        return result;
    }, [amenities, search, filterType]);

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (a: Amenity) => { setEditing(a); setModalOpen(true); };

    const handleDelete = async (a: Amenity) => {
        if (!confirm(`ลบ "${a.name}" ใช่หรือไม่?`)) return;
        const res = await fetch(`${API}/amenities/${a.id}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            alert(err?.message || 'ลบไม่สำเร็จ');
            return;
        }
        loadAll();
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">สิ่งอำนวยความสะดวก</h1>
                    <p className="text-sm text-gray-500 mt-0.5">จัดการรายการสิ่งอำนวยความสะดวกของที่พักและห้องพัก</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-primary-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> เพิ่มรายการ
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ค้นหาจากชื่อรายการ..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'HOTEL', 'ROOM'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors ${filterType === t ? 'bg-primary-teal text-white border-primary-teal' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {t === 'all' ? 'ทั้งหมด' : TYPE_LABEL[t]}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <Sparkles className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium text-gray-400">{amenities.length === 0 ? 'ยังไม่มีรายการ' : 'ไม่พบรายการที่ค้นหา'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filtered.map(a => (
                        <div
                            key={a.id}
                            className={`relative bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${a.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
                        >
                            <div className="w-11 h-11 rounded-lg bg-teal-50 text-primary-teal flex items-center justify-center shrink-0">
                                {renderIcon(a.icon, 'w-5 h-5')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{a.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${a.type === 'HOTEL' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {TYPE_LABEL[a.type]}
                                    </span>
                                    {!a.isActive && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">ปิดใช้งาน</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button
                                    onClick={() => openEdit(a)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                    title="แก้ไข"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(a)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                    title="ลบ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <AmenityModal
                    amenity={editing}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => { setModalOpen(false); loadAll(); }}
                />
            )}
        </div>
    );
}

function AmenityModal({
    amenity,
    onClose,
    onSaved,
}: {
    amenity: Amenity | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(amenity?.name ?? '');
    const [icon, setIcon] = useState(amenity?.icon ?? '');
    const [type, setType] = useState<AmenityType>(amenity?.type ?? 'HOTEL');
    const [isActive, setIsActive] = useState(amenity?.isActive ?? true);
    const [sortOrder, setSortOrder] = useState(amenity?.sortOrder ?? 0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [iconSearch, setIconSearch] = useState('');

    const iconOptions = useMemo(() => {
        const q = iconSearch.trim().toLowerCase();
        return q ? ICON_OPTIONS.filter(n => n.toLowerCase().includes(q)) : ICON_OPTIONS;
    }, [iconSearch]);

    const handleSave = async () => {
        if (!name.trim()) { setError('กรอกชื่อรายการ'); return; }
        setSaving(true);
        setError(null);
        const payload = { name: name.trim(), icon: icon || undefined, type, isActive, sortOrder };
        const url = amenity ? `${API}/amenities/${amenity.id}` : `${API}/amenities`;
        const method = amenity ? 'PATCH' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                setError(err?.message || 'บันทึกไม่สำเร็จ');
                setSaving(false);
                return;
            }
            onSaved();
        } catch {
            setError('เกิดข้อผิดพลาด');
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="font-bold text-gray-900 text-lg">
                        {amenity ? 'แก้ไขสิ่งอำนวยความสะดวก' : 'เพิ่มสิ่งอำนวยความสะดวก'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อรายการ</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="เช่น Wi-Fi ฟรี, สระว่ายน้ำ"
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภท</label>
                        <div className="flex gap-2">
                            {(['HOTEL', 'ROOM'] as const).map(t => (
                                <label
                                    key={t}
                                    className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 border rounded-lg cursor-pointer transition-colors ${type === t ? 'border-primary-teal bg-teal-50 text-primary-teal' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={type === t}
                                        onChange={() => setType(t)}
                                        className="accent-primary-teal"
                                    />
                                    <span className="text-sm font-medium">
                                        {t === 'HOTEL' ? 'สิ่งอำนวยความสะดวก (ที่พัก)' : 'สิ่งอำนวยความสะดวกในห้อง'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ไอคอน</label>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-11 h-11 rounded-lg bg-teal-50 text-primary-teal flex items-center justify-center shrink-0">
                                {renderIcon(icon, 'w-5 h-5')}
                            </div>
                            <input
                                value={iconSearch}
                                onChange={e => setIconSearch(e.target.value)}
                                placeholder="ค้นหาไอคอน..."
                                className="flex-1 px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal"
                            />
                            {icon && (
                                <button onClick={() => setIcon('')} className="text-xs text-gray-500 hover:text-gray-700">ล้าง</button>
                            )}
                        </div>
                        <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                            {iconOptions.map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setIcon(n)}
                                    title={n}
                                    className={`aspect-square rounded-md flex items-center justify-center transition-colors ${icon === n ? 'bg-primary-teal text-white' : 'text-gray-600 hover:bg-white'}`}
                                >
                                    {renderIcon(n, 'w-4 h-4')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ลำดับการแสดง</label>
                            <input
                                type="number"
                                value={sortOrder}
                                onChange={e => setSortOrder(Number(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะ</label>
                            <label className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                    className="accent-primary-teal"
                                />
                                <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                            </label>
                        </div>
                    </div>

                    {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-teal text-white hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </div>
    );
}
