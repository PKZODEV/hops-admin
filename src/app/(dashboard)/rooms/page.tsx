'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, LayoutGrid, List, Eye, BedDouble, SlidersHorizontal, ChevronDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Property { id: string; name: string; images: string[] }
interface RoomType { id: string; name: string; images?: string[]; rates: { price: number }[] }
interface Floor { id: string; number: string; building: { id: string; name: string } }
interface RoomUnit {
    id: string; number: string; status: string; amenities: string[]; images: string[];
    roomType: RoomType;
    floor: Floor;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    AVAILABLE:   { label: 'ว่าง',          cls: 'bg-green-100 text-green-700' },
    RESERVED:    { label: 'ติดจอง',        cls: 'bg-amber-100 text-amber-700' },
    OCCUPIED:    { label: 'กำลังเข้าพัก',  cls: 'bg-blue-100 text-blue-700' },
    CLEANING:    { label: 'ทำความสะอาด',   cls: 'bg-purple-100 text-purple-700' },
    MAINTENANCE: { label: 'ซ่อมบำรุง',     cls: 'bg-orange-100 text-orange-700' },
    DISABLED:    { label: 'ปิดใช้งาน',     cls: 'bg-gray-100 text-gray-500' },
};

export default function RoomsPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [rooms, setRooms] = useState<RoomUnit[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

    // Load all properties
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

    // Load rooms when property changes
    useEffect(() => {
        if (!selectedPropertyId) return;
        setLoading(true);
        fetch(`${API}/properties/${selectedPropertyId}/room-units`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: RoomUnit[]) => setRooms(Array.isArray(data) ? data : []))
            .catch(() => setRooms([]))
            .finally(() => setLoading(false));
    }, [selectedPropertyId]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return rooms;
        return rooms.filter(r =>
            r.number.toLowerCase().includes(q) ||
            r.roomType?.name.toLowerCase().includes(q) ||
            r.floor?.building?.name.toLowerCase().includes(q)
        );
    }, [rooms, search]);

    const selectedProperty = properties.find(p => p.id === selectedPropertyId);

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการห้องพัก</h1>
                    <p className="text-sm text-gray-500 mt-0.5">จัดการห้องพักทั้งหมดในโรงแรมของคุณ</p>
                </div>
                <button
                    onClick={() => router.push('/rooms/add')}
                    className="flex items-center gap-2 bg-primary-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> เพิ่มห้องพัก
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Search */}
                <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ค้นหาห้องพักจากหมายเลขหรือประเภท..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal"
                    />
                </div>

                {/* Property selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowPropertyDropdown(v => !v)}
                        className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors min-w-[160px]"
                    >
                        {selectedProperty ? (
                            <>
                                <div className="w-6 h-6 rounded-full bg-primary-teal text-white text-xs flex items-center justify-center font-bold shrink-0">
                                    {selectedProperty.name.charAt(0)}
                                </div>
                                <span className="truncate max-w-[130px]">{selectedProperty.name}</span>
                            </>
                        ) : <span className="text-gray-400">เลือกโรงแรม</span>}
                        <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0 text-gray-400" />
                    </button>
                    {showPropertyDropdown && (
                        <div className="absolute top-full mt-1 left-0 z-50 bg-white rounded-xl border border-gray-100 shadow-xl min-w-[220px] py-1">
                            {properties.map(p => (
                                <button key={p.id} onClick={() => { setSelectedPropertyId(p.id); setShowPropertyDropdown(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 ${p.id === selectedPropertyId ? 'text-primary-teal font-medium' : 'text-gray-700'}`}>
                                    <div className="w-6 h-6 rounded-full bg-primary-teal/10 text-primary-teal text-xs flex items-center justify-center font-bold shrink-0">
                                        {p.name.charAt(0)}
                                    </div>
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* More Filters */}
                <button className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <SlidersHorizontal className="w-4 h-4" /> ตัวกรองเพิ่มเติม
                </button>

                {/* View toggle */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-auto">
                    <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-teal text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-teal text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {showPropertyDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowPropertyDropdown(false)} />}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <BedDouble className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium text-gray-400">{rooms.length === 0 ? 'ยังไม่มีห้องพัก' : 'ไม่พบห้องที่ค้นหา'}</p>
                </div>
            ) : viewMode === 'list' ? (
                <ListView rooms={filtered} onView={id => router.push(`/rooms/${id}`)} />
            ) : (
                <GridView rooms={filtered} onView={id => router.push(`/rooms/${id}`)} />
            )}
        </div>
    );
}

/* ── List View ── */
function ListView({ rooms, onView }: { rooms: RoomUnit[]; onView: (id: string) => void }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                        {['หมายเลขห้อง', 'ประเภท', 'ชั้น', 'อาคาร/โซน', 'ราคา/คืน', 'สถานะ', 'จัดการ'].map(h => (
                            <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rooms.map(r => {
                        const st = STATUS_MAP[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-500' };
                        const price = r.roomType?.rates?.[0]?.price;
                        return (
                            <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-4 font-semibold text-gray-900">{r.number}</td>
                                <td className="px-5 py-4 text-gray-700">{r.roomType?.name ?? '-'}</td>
                                <td className="px-5 py-4 text-gray-600">ชั้น {r.floor?.number ?? '-'}</td>
                                <td className="px-5 py-4 text-gray-600">{r.floor?.building?.name ?? '-'}</td>
                                <td className="px-5 py-4 text-gray-700 font-medium">{price != null ? price.toLocaleString() : '-'}</td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <button onClick={() => onView(r.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── Grid View ── */
function GridView({ rooms, onView }: { rooms: RoomUnit[]; onView: (id: string) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map(r => {
                const st = STATUS_MAP[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-500' };
                const price = r.roomType?.rates?.[0]?.price;
                const img = r.images?.[0] ?? r.roomType?.images?.[0];
                return (
                    <button key={r.id} onClick={() => onView(r.id)} className="text-left bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="relative aspect-[4/3] bg-gray-100">
                            {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt={`Room ${r.number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BedDouble className="w-10 h-10 text-gray-200" />
                                </div>
                            )}
                        </div>
                        <div className="p-3.5">
                            <div className="flex items-start justify-between mb-1">
                                <span className="font-bold text-gray-900 text-sm">ห้อง {r.number}</span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${st.cls}`}>{st.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-0.5">{r.roomType?.name ?? '-'}</p>
                            <p className="text-xs text-gray-400">ชั้น {r.floor?.number ?? '-'}</p>
                            <p className="text-sm font-bold text-primary-teal mt-2">
                                {price != null ? `฿${price.toLocaleString()}/คืน` : '-'}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
