'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Eye, Pencil, Plus, SlidersHorizontal } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type HotelStatus = 'Active' | 'Inactive' | 'Maintenance';

interface HotelRow {
    id: string;
    name: string;
    location: string;
    status: HotelStatus;
    totalRooms: number;
    available: number;
    booked: number;
    rating: number;
    categoryName: string;
}

const STATUS_STYLES: Record<HotelStatus, string> = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-500',
    Maintenance: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<HotelStatus, string> = {
    Active: 'ใช้งาน',
    Inactive: 'ปิดใช้งาน',
    Maintenance: 'ซ่อมบำรุง',
};

export default function HotelManagementPage() {
    const router = useRouter();
    const [hotels, setHotels] = useState<HotelRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res = await fetch(`${API}/properties`, { credentials: 'include' });
                if (!res.ok) return;
                const props = await res.json();
                if (!Array.isArray(props) || props.length === 0) { setLoading(false); return; }

                const rows: HotelRow[] = await Promise.all(
                    props.map(async (p: { id: string; name: string; location?: string; propertyCategory?: { name: string } | null }) => {
                        try {
                            const statsRes = await fetch(`${API}/properties/${p.id}/stats`, { credentials: 'include' });
                            const stats = statsRes.ok ? await statsRes.json() : null;
                            return {
                                id: p.id,
                                name: p.name,
                                location: p.location ?? 'ไม่ระบุ',
                                status: 'Active' as HotelStatus,
                                totalRooms: stats?.rooms?.total ?? 0,
                                available: stats?.rooms?.available ?? 0,
                                booked: stats?.rooms?.occupied ?? 0,
                                rating: 4.8,
                                categoryName: p.propertyCategory?.name ?? '—',
                            };
                        } catch {
                            return { id: p.id, name: p.name, location: 'ไม่ระบุ', status: 'Active' as HotelStatus, totalRooms: 0, available: 0, booked: 0, rating: 0, categoryName: '—' };
                        }
                    })
                );
                setHotels(rows);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    const filtered = hotels.filter(h => {
        const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || h.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hotel Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">จัดการโรงแรมทั้งหมดของคุณ</p>
                </div>
                <button
                    onClick={() => router.push('/hotel-management/add')}
                    className="flex items-center gap-2 bg-primary-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มโรงแรม
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row gap-3 p-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาโรงแรมตามชื่อหรือสถานที่..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal min-w-[140px]"
                    >
                        <option value="all">สถานะทั้งหมด</option>
                        <option value="Active">ใช้งาน</option>
                        <option value="Maintenance">ซ่อมบำรุง</option>
                        <option value="Inactive">ปิดใช้งาน</option>
                    </select>
                    <button className="flex items-center gap-2 h-10 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap">
                        <SlidersHorizontal className="w-4 h-4" />
                        ตัวกรองเพิ่มเติม
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="bg-gray-50 border-y border-gray-100">
                            <tr>
                                {['ชื่อโรงแรม', 'ประเภทที่พัก', 'สถานที่', 'สถานะ', 'ห้องทั้งหมด', 'ว่าง', 'จอง', 'คะแนน', 'จัดการ'].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-16 text-center text-sm text-gray-400">กำลังโหลด...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-16 text-center text-sm text-gray-400">ไม่พบโรงแรม</td>
                                </tr>
                            ) : filtered.map(hotel => (
                                <tr key={hotel.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 font-medium text-gray-900">{hotel.name}</td>
                                    <td className="px-5 py-4 text-gray-500">{hotel.categoryName}</td>
                                    <td className="px-5 py-4 text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {hotel.location}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[hotel.status]}`}>
                                            {STATUS_LABELS[hotel.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-700 font-medium">{hotel.totalRooms}</td>
                                    <td className="px-5 py-4 font-semibold text-green-600">{hotel.available}</td>
                                    <td className="px-5 py-4 font-semibold text-gray-700">{hotel.booked}</td>
                                    <td className="px-5 py-4">
                                        {hotel.rating > 0 ? (
                                            <span className="flex items-center gap-1 text-gray-700 font-medium">
                                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                {hotel.rating.toFixed(1)}
                                            </span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => router.push(`/hotel-management/${hotel.id}`)}
                                                className="p-1.5 text-gray-400 hover:text-primary-teal hover:bg-teal-50 rounded-md transition-colors"
                                                title="ดูรายละเอียด"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/hotel-management/${hotel.id}/edit`)}
                                                className="p-1.5 text-gray-400 hover:text-primary-teal hover:bg-teal-50 rounded-md transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {!loading && filtered.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">แสดง 1 ถึง {filtered.length} จาก {filtered.length} โรงแรม</p>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40" disabled>ก่อนหน้า</button>
                            <button className="px-3 py-1.5 text-sm bg-primary-teal text-white rounded-lg font-medium">1</button>
                            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40" disabled>ถัดไป</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
