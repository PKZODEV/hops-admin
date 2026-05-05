'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Grid, List as ListIcon, MoreVertical, Calendar, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

interface RoomRate {
    id: string;
    name: string;
    price: string | number;
    startDate?: string | null;
    endDate?: string | null;
    isActive: boolean;
}
interface RoomType {
    id: string;
    name: string;
    maxGuests: number;
    bedType?: string;
    isActive: boolean;
    rates: RoomRate[];
}

interface SpecialRateDraft {
    id?: string;
    name: string;
    price: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

const toDateInput = (d?: string | null) => {
    if (!d) return '';
    return new Date(d).toISOString().slice(0, 10);
};

const isSpecialRate = (r: RoomRate) => !!(r.startDate && r.endDate);

export default function RoomTypesPage() {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [drafts, setDrafts] = useState<Record<string, SpecialRateDraft[]>>({});
    const [savingRoomId, setSavingRoomId] = useState<string | null>(null);

    useEffect(() => {
        const propertyId = typeof window !== 'undefined' ? localStorage.getItem('hops_property_id') : null;
        if (!propertyId) { setLoading(false); return; }
        api.get<RoomType[]>(`/properties/${propertyId}/rooms`)
            .then(rooms => {
                setRoomTypes(rooms);
                const initialDrafts: Record<string, SpecialRateDraft[]> = {};
                rooms.forEach(r => {
                    initialDrafts[r.id] = r.rates.filter(isSpecialRate).map(rate => ({
                        id: rate.id,
                        name: rate.name,
                        price: String(rate.price),
                        startDate: toDateInput(rate.startDate),
                        endDate: toDateInput(rate.endDate),
                        isActive: rate.isActive,
                    }));
                });
                setDrafts(initialDrafts);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleActive = async (room: RoomType) => {
        try {
            const updated = await api.patch<RoomType>(`/rooms/${room.id}`, { isActive: !room.isActive });
            setRoomTypes(prev => prev.map(r => r.id === room.id ? { ...updated, rates: r.rates } : r));
        } catch (e) { console.error(e); }
    };

    const filtered = roomTypes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    const getBasePrice = (room: RoomType) => {
        const base = room.rates.filter(r => !isSpecialRate(r)).sort((a, b) => Number(a.price) - Number(b.price))[0];
        if (!base) return '-';
        return `฿${parseFloat(String(base.price)).toLocaleString()}`;
    };

    const addDraft = (roomId: string) => {
        setDrafts(prev => ({
            ...prev,
            [roomId]: [...(prev[roomId] ?? []), {
                name: 'ราคาวันที่พิเศษ',
                price: '',
                startDate: '',
                endDate: '',
                isActive: true,
            }],
        }));
    };

    const updateDraft = (roomId: string, idx: number, patch: Partial<SpecialRateDraft>) => {
        setDrafts(prev => ({
            ...prev,
            [roomId]: (prev[roomId] ?? []).map((d, i) => i === idx ? { ...d, ...patch } : d),
        }));
    };

    const removeDraft = async (roomId: string, idx: number) => {
        const draft = drafts[roomId]?.[idx];
        if (draft?.id) {
            if (!confirm('ลบราคาช่วงพิเศษนี้?')) return;
            try {
                await api.delete(`/rates/${draft.id}`);
            } catch (e) {
                alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
                return;
            }
        }
        setDrafts(prev => ({
            ...prev,
            [roomId]: (prev[roomId] ?? []).filter((_, i) => i !== idx),
        }));
    };

    const saveSpecials = async (room: RoomType) => {
        const list = drafts[room.id] ?? [];
        for (const d of list) {
            if (!d.name.trim() || !d.price || !d.startDate || !d.endDate) {
                alert('กรุณากรอกชื่อ ราคา และช่วงวันที่ให้ครบ');
                return;
            }
            const price = parseFloat(d.price);
            if (isNaN(price) || price <= 0) {
                alert('ราคาต้องเป็นตัวเลขมากกว่า 0');
                return;
            }
            if (new Date(d.startDate) > new Date(d.endDate)) {
                alert('วันที่เริ่มต้นต้องไม่หลังวันที่สิ้นสุด');
                return;
            }
        }

        setSavingRoomId(room.id);
        try {
            const saved: RoomRate[] = [];
            for (const d of list) {
                const payload = {
                    name: d.name.trim(),
                    price: parseFloat(d.price),
                    startDate: new Date(d.startDate).toISOString(),
                    endDate: new Date(d.endDate).toISOString(),
                    isActive: d.isActive,
                    roomTypeId: room.id,
                };
                if (d.id) {
                    const updated = await api.patch<RoomRate>(`/rates/${d.id}`, payload);
                    saved.push(updated);
                } else {
                    const created = await api.post<RoomRate>(`/rates`, payload);
                    saved.push(created);
                }
            }
            /* Replace the special-rate slice for this room with the just-saved rows. */
            setRoomTypes(prev => prev.map(r => r.id === room.id
                ? { ...r, rates: [...r.rates.filter(rt => !isSpecialRate(rt)), ...saved] }
                : r,
            ));
            setDrafts(prev => ({
                ...prev,
                [room.id]: saved.map(rate => ({
                    id: rate.id,
                    name: rate.name,
                    price: String(rate.price),
                    startDate: toDateInput(rate.startDate),
                    endDate: toDateInput(rate.endDate),
                    isActive: rate.isActive,
                })),
            }));
        } catch (e) {
            alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setSavingRoomId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Room Type</h1>
                    <p className="text-gray-500 text-sm mt-1">จัดการประเภทห้องพักของคุณ และตั้งราคาช่วงวันที่พิเศษ</p>
                </div>
                <Button className="gap-2">
                    <Plus className="w-5 h-5" /> เพิ่มประเภทห้อง
                </Button>
            </div>

            <Card padding="lg" className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="relative w-72">
                        <Input
                            placeholder="ค้นหาประเภทห้อง..."
                            icon={<Search className="w-5 h-5" />}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 border border-border-light rounded-lg p-1 bg-gray-50">
                        <button className="p-1.5 rounded bg-white shadow-sm text-gray-900"><ListIcon className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded text-gray-500 hover:text-gray-900"><Grid className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-y border-border-light">
                            <tr>
                                <th className="px-4 py-3 font-medium">ชื่อประเภทห้อง</th>
                                <th className="px-4 py-3 font-medium">เข้าพักสูงสุด</th>
                                <th className="px-4 py-3 font-medium">ประเภทเตียง</th>
                                <th className="px-4 py-3 font-medium">ราคาพื้นฐาน/คืน</th>
                                <th className="px-4 py-3 font-medium">ราคาช่วงพิเศษ</th>
                                <th className="px-4 py-3 font-medium">สถานะ</th>
                                <th className="px-4 py-3 font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {loading && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">กำลังโหลด...</td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ยังไม่มีประเภทห้องพัก — กรุณาทำ Setup Wizard ก่อน</td></tr>
                            )}
                            {filtered.map(room => {
                                const specialCount = (drafts[room.id] ?? []).length;
                                const isOpen = !!expanded[room.id];
                                return (
                                    <React.Fragment key={room.id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4 font-bold text-gray-900">{room.name}</td>
                                            <td className="px-4 py-4 text-gray-600">{room.maxGuests} คน</td>
                                            <td className="px-4 py-4 text-gray-600">{room.bedType ?? '-'}</td>
                                            <td className="px-4 py-4 font-medium text-gray-900">{getBasePrice(room)}</td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => setExpanded(prev => ({ ...prev, [room.id]: !prev[room.id] }))}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:border-primary-teal hover:text-primary-teal hover:bg-teal-50"
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {specialCount} ช่วง
                                                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={room.isActive} onChange={() => toggleActive(room)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-teal"></div>
                                                </label>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                        {isOpen && (
                                            <tr className="bg-teal-50/30">
                                                <td colSpan={7} className="px-4 py-4">
                                                    <div className="rounded-xl border border-teal-100 bg-white p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">ราคาช่วงวันที่พิเศษ</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    ตั้งราคาเฉพาะช่วงเทศกาล/วันหยุดยาว — ระบบจะใช้ราคานี้แทนราคาพื้นฐานเมื่อวันเข้าพักอยู่ในช่วง
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => addDraft(room.id)}
                                                                className="flex items-center gap-1.5 text-xs font-medium text-primary-teal hover:text-teal-700 px-3 py-1.5 border border-primary-teal rounded-lg hover:bg-teal-50"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> เพิ่มช่วงวันที่
                                                            </button>
                                                        </div>

                                                        {(drafts[room.id]?.length ?? 0) === 0 ? (
                                                            <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีราคาช่วงพิเศษ</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {(drafts[room.id] ?? []).map((d, i) => (
                                                                    <div key={i} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] gap-2 items-center">
                                                                        <input
                                                                            type="text" placeholder="ชื่อ เช่น สงกรานต์"
                                                                            value={d.name}
                                                                            onChange={e => updateDraft(room.id, i, { name: e.target.value })}
                                                                            className="h-9 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                                                        />
                                                                        <input
                                                                            type="date"
                                                                            value={d.startDate}
                                                                            onChange={e => updateDraft(room.id, i, { startDate: e.target.value })}
                                                                            className="h-9 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                                                        />
                                                                        <input
                                                                            type="date"
                                                                            value={d.endDate}
                                                                            onChange={e => updateDraft(room.id, i, { endDate: e.target.value })}
                                                                            className="h-9 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                                                        />
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" min={0} step="0.01" placeholder="ราคา"
                                                                                value={d.price}
                                                                                onChange={e => updateDraft(room.id, i, { price: e.target.value })}
                                                                                className="h-9 w-full pl-6 pr-2 border border-gray-200 rounded-md text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                                                            />
                                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">฿</span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => removeDraft(room.id, i)}
                                                                            className="p-2 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"
                                                                            title="ลบ"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex justify-end mt-4">
                                                            <button
                                                                onClick={() => saveSpecials(room)}
                                                                disabled={savingRoomId === room.id}
                                                                className="flex items-center gap-1.5 bg-primary-teal text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                                {savingRoomId === room.id ? 'กำลังบันทึก...' : 'บันทึกราคาช่วงพิเศษ'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
