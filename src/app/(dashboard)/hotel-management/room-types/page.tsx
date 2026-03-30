'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Grid, List as ListIcon, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

interface RoomRate { price: string }
interface RoomType {
    id: string;
    name: string;
    maxGuests: number;
    bedType?: string;
    isActive: boolean;
    rates: RoomRate[];
}

export default function RoomTypesPage() {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const propertyId = typeof window !== 'undefined' ? localStorage.getItem('hops_property_id') : null;
        if (!propertyId) { setLoading(false); return; }
        api.get<RoomType[]>(`/properties/${propertyId}/rooms`)
            .then(setRoomTypes)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleActive = async (room: RoomType) => {
        try {
            const updated = await api.patch<RoomType>(`/rooms/${room.id}`, { isActive: !room.isActive });
            setRoomTypes(prev => prev.map(r => r.id === room.id ? updated : r));
        } catch (e) { console.error(e); }
    };

    const filtered = roomTypes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    const getBasePrice = (room: RoomType) => {
        if (!room.rates.length) return '-';
        return `฿${parseFloat(room.rates[0].price).toLocaleString()}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Room Type</h1>
                    <p className="text-gray-500 text-sm mt-1">จัดการประเภทห้องพักของคุณ</p>
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
                                <th className="px-4 py-3 font-medium">ราคา/คืน</th>
                                <th className="px-4 py-3 font-medium">สถานะ</th>
                                <th className="px-4 py-3 font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {loading && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">กำลังโหลด...</td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">ยังไม่มีประเภทห้องพัก — กรุณาทำ Setup Wizard ก่อน</td></tr>
                            )}
                            {filtered.map(room => (
                                <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-4 font-bold text-gray-900">{room.name}</td>
                                    <td className="px-4 py-4 text-gray-600">{room.maxGuests} คน</td>
                                    <td className="px-4 py-4 text-gray-600">{room.bedType ?? '-'}</td>
                                    <td className="px-4 py-4 font-medium text-gray-900">{getBasePrice(room)}</td>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
