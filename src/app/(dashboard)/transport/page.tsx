'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, LayoutGrid, List, Eye, Car, ChevronDown,
    SlidersHorizontal, Bus, Bike, Sailboat, Truck,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Property { id: string; name: string }
interface Vehicle {
    id: string; name: string; type: string; description?: string;
    licensePlate?: string; capacity: number; status: string;
    images: string[]; features: string[];
    pricePerTrip?: number; pricePerHour?: number; pricePerDay?: number;
    route?: string; driverName?: string; isActive: boolean;
    property: { id: string; name: string };
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'ว่าง', cls: 'bg-green-100 text-green-700' },
    BUSY: { label: 'ไม่ว่าง', cls: 'bg-blue-100 text-blue-700' },
    MAINTENANCE: { label: 'ซ่อมบำรุง', cls: 'bg-red-100 text-red-500' },
    DISABLED: { label: 'ปิดใช้งาน', cls: 'bg-gray-100 text-gray-500' },
};

const TYPE_MAP: Record<string, { label: string; icon: React.ElementType }> = {
    CAR: { label: 'รถยนต์', icon: Car },
    VAN: { label: 'รถตู้', icon: Truck },
    MINIBUS: { label: 'สองแถว/มินิบัส', icon: Bus },
    BUS: { label: 'รถบัส', icon: Bus },
    LOCAL: { label: 'รถท้องถิ่น', icon: Car },
    MOTORCYCLE: { label: 'มอเตอร์ไซค์', icon: Bike },
    TUKTUK: { label: 'ตุ๊กตุ๊ก/สามล้อ', icon: Car },
    BOAT: { label: 'เรือ', icon: Sailboat },
    OTHER: { label: 'อื่นๆ', icon: Car },
};

export default function TransportPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetch(`${API}/properties`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: Property[]) => setProperties(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        const url = selectedPropertyId !== 'all'
            ? `${API}/transport?propertyId=${selectedPropertyId}`
            : `${API}/transport`;
        fetch(url, { credentials: 'include' })
            .then(r => r.json())
            .then((data: Vehicle[]) => setVehicles(Array.isArray(data) ? data : []))
            .catch(() => setVehicles([]))
            .finally(() => setLoading(false));
    }, [selectedPropertyId]);

    const filtered = useMemo(() => {
        let result = vehicles;
        if (filterType !== 'all') result = result.filter(v => v.type === filterType);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.licensePlate?.toLowerCase().includes(q) ||
                v.route?.toLowerCase().includes(q) ||
                TYPE_MAP[v.type]?.label.includes(q)
            );
        }
        return result;
    }, [vehicles, search, filterType]);

    const selectedProperty = properties.find(p => p.id === selectedPropertyId);

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการยานพาหนะ</h1>
                    <p className="text-sm text-gray-500 mt-0.5">จัดการรถและบริการรับส่งทุกประเภท</p>
                </div>
                <button
                    onClick={() => router.push('/transport/add')}
                    className="flex items-center gap-2 bg-primary-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> เพิ่มยานพาหนะ
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ค้นหาจากชื่อ ทะเบียน หรือเส้นทาง..."
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
                            <><div className="w-6 h-6 rounded-full bg-primary-teal text-white text-xs flex items-center justify-center font-bold shrink-0">{selectedProperty.name.charAt(0)}</div>
                                <span className="truncate max-w-[120px]">{selectedProperty.name}</span></>
                        ) : <span className="text-gray-500">ทุกโรงแรม</span>}
                        <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0 text-gray-400" />
                    </button>
                    {showPropertyDropdown && (
                        <div className="absolute top-full mt-1 left-0 z-50 bg-white rounded-xl border border-gray-100 shadow-xl min-w-[220px] py-1">
                            <button onClick={() => { setSelectedPropertyId('all'); setShowPropertyDropdown(false); }}
                                className={`w-full px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 ${selectedPropertyId === 'all' ? 'text-primary-teal font-medium' : 'text-gray-700'}`}>
                                ทุกโรงแรม
                            </button>
                            {properties.map(p => (
                                <button key={p.id} onClick={() => { setSelectedPropertyId(p.id); setShowPropertyDropdown(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 ${p.id === selectedPropertyId ? 'text-primary-teal font-medium' : 'text-gray-700'}`}>
                                    <div className="w-6 h-6 rounded-full bg-primary-teal/10 text-primary-teal text-xs flex items-center justify-center font-bold shrink-0">{p.name.charAt(0)}</div>
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Type filter */}
                <div className="relative">
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-teal/30 bg-white pr-8 appearance-none">
                        <option value="all">ทุกประเภท</option>
                        {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>

                <button className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <SlidersHorizontal className="w-4 h-4" /> ตัวกรองเพิ่มเติม
                </button>

                <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-auto">
                    <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-teal text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-teal text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Type quick-filter chips */}
            <div className="flex flex-wrap gap-2 mb-5">
                {[{ key: 'all', label: 'ทั้งหมด' }, ...Object.entries(TYPE_MAP).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilterType(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterType === key ? 'bg-primary-teal text-white border-primary-teal' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {showPropertyDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowPropertyDropdown(false)} />}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <Car className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium text-gray-400">{vehicles.length === 0 ? 'ยังไม่มียานพาหนะ' : 'ไม่พบยานพาหนะที่ค้นหา'}</p>
                </div>
            ) : viewMode === 'list' ? (
                <VehicleListView vehicles={filtered} onView={id => router.push(`/transport/${id}`)} />
            ) : (
                <VehicleGridView vehicles={filtered} onView={id => router.push(`/transport/${id}`)} />
            )}
        </div>
    );
}

function VehicleListView({ vehicles, onView }: { vehicles: Vehicle[]; onView: (id: string) => void }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                        {['ยานพาหนะ', 'ประเภท', 'ทะเบียน', 'ที่นั่ง', 'เส้นทาง', 'ราคา', 'โรงแรม', 'สถานะ', ''].map(h => (
                            <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {vehicles.map(v => {
                        const st = STATUS_MAP[v.status] ?? { label: v.status, cls: 'bg-gray-100 text-gray-500' };
                        const TypeIcon = TYPE_MAP[v.type]?.icon ?? Car;
                        const priceLabel = v.pricePerTrip ? `฿${Number(v.pricePerTrip).toLocaleString()}/เที่ยว`
                            : v.pricePerHour ? `฿${Number(v.pricePerHour).toLocaleString()}/ชม.`
                            : v.pricePerDay ? `฿${Number(v.pricePerDay).toLocaleString()}/วัน` : '-';
                        return (
                            <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                                            {v.images?.[0]
                                                ? <img src={v.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                                : <TypeIcon className="w-5 h-5 text-teal-500" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{v.name}</p>
                                            {v.driverName && <p className="text-xs text-gray-400">คนขับ: {v.driverName}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">{TYPE_MAP[v.type]?.label ?? v.type}</td>
                                <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{v.licensePlate || '-'}</td>
                                <td className="px-4 py-3.5 text-gray-600">{v.capacity} คน</td>
                                <td className="px-4 py-3.5 text-gray-500 max-w-[140px] truncate">{v.route || '-'}</td>
                                <td className="px-4 py-3.5 font-medium text-primary-teal">{priceLabel}</td>
                                <td className="px-4 py-3.5 text-gray-500 max-w-[120px] truncate">{v.property.name}</td>
                                <td className="px-4 py-3.5">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <button onClick={() => onView(v.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
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

function VehicleGridView({ vehicles, onView }: { vehicles: Vehicle[]; onView: (id: string) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.map(v => {
                const st = STATUS_MAP[v.status] ?? { label: v.status, cls: 'bg-gray-100 text-gray-500' };
                const TypeIcon = TYPE_MAP[v.type]?.icon ?? Car;
                const priceLabel = v.pricePerTrip ? `฿${Number(v.pricePerTrip).toLocaleString()}/เที่ยว`
                    : v.pricePerHour ? `฿${Number(v.pricePerHour).toLocaleString()}/ชม.`
                    : v.pricePerDay ? `฿${Number(v.pricePerDay).toLocaleString()}/วัน` : null;
                return (
                    <button key={v.id} onClick={() => onView(v.id)}
                        className="text-left bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-teal-50 to-gray-100">
                            {v.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <TypeIcon className="w-12 h-12 text-teal-300" />
                                </div>
                            )}
                            <span className={`absolute top-2.5 right-2.5 text-[11px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="p-4">
                            <p className="font-bold text-gray-900 text-sm mb-0.5">{v.name}</p>
                            <p className="text-xs text-gray-500">{TYPE_MAP[v.type]?.label ?? v.type} · {v.capacity} คน</p>
                            {v.route && <p className="text-xs text-gray-400 mt-0.5 truncate">{v.route}</p>}
                            {priceLabel && <p className="text-sm font-bold text-primary-teal mt-2">{priceLabel}</p>}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
