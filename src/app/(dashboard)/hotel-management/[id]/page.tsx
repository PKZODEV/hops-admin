'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Pencil, Building2, BedDouble, Star,
    MapPin, CheckCircle2, Image as ImageIcon, Users,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface RoomUnit { id: string; number: string; status: string; roomType: { name: string } | null }
interface Floor { id: string; number: string; roomUnits: RoomUnit[] }
interface Building { id: string; name: string; floors: Floor[] }
interface Rate { id: string; name: string; price: number }
interface RoomType { id: string; name: string; maxGuests: number; bedType?: string; description?: string; images: string[]; rates: Rate[] }
interface Property {
    id: string; name: string; type: string; description?: string;
    address?: string; city?: string; country?: string;
    amenities: string[]; images: string[]; isActive: boolean;
    buildings: Building[]; roomTypes: RoomType[];
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    AVAILABLE:   { label: 'ว่าง',          cls: 'bg-green-100 text-green-700' },
    RESERVED:    { label: 'ติดจอง',        cls: 'bg-amber-100 text-amber-700' },
    OCCUPIED:    { label: 'กำลังเข้าพัก',  cls: 'bg-blue-100 text-blue-700' },
    CLEANING:    { label: 'ทำความสะอาด',   cls: 'bg-purple-100 text-purple-700' },
    MAINTENANCE: { label: 'ซ่อมบำรุง',     cls: 'bg-orange-100 text-orange-600' },
    DISABLED:    { label: 'ปิดใช้งาน',     cls: 'bg-gray-100 text-gray-500' },
};

export default function HotelDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [property, setProperty] = useState<Property | null>(null);
    const [stats, setStats] = useState<{ rooms: { total: number; available: number; occupied: number; maintenance: number }; occupancyRate: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'rooms'>('overview');

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, sRes] = await Promise.all([
                    fetch(`${API}/properties/${id}`, { credentials: 'include' }),
                    fetch(`${API}/properties/${id}/stats`, { credentials: 'include' }),
                ]);
                if (pRes.ok) setProperty(await pRes.json());
                if (sRes.ok) setStats(await sRes.json());
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        load();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>;
    if (!property) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-red-400">ไม่พบข้อมูล</div>;

    const totalRooms = stats?.rooms.total ?? 0;
    const location = [property.city, property.country].filter(Boolean).join(', ') || property.address || 'ไม่ระบุ';

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${property.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {property.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                            </span>
                        </div>
                        {location !== 'ไม่ระบุ' && (
                            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />{location}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => router.push(`/hotel-management/${id}/edit`)}
                    className="flex items-center gap-2 bg-primary-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm shrink-0"
                >
                    <Pencil className="w-4 h-4" /> แก้ไข
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'ห้องทั้งหมด', value: totalRooms, icon: BedDouble, color: 'text-blue-600 bg-blue-50' },
                    { label: 'อัตราเข้าพัก', value: `${stats?.occupancyRate ?? 0}%`, icon: Users, color: 'text-green-600 bg-green-50' },
                    { label: 'ประเภทห้อง', value: property.roomTypes.length, icon: Star, color: 'text-purple-600 bg-purple-50' },
                    { label: 'อาคาร', value: property.buildings.length, icon: Building2, color: 'text-orange-600 bg-orange-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-xl font-bold text-gray-900">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-6">
                {([['overview', 'ข้อมูลทั่วไป'], ['buildings', 'อาคาร & ชั้น'], ['rooms', 'ประเภทห้อง']] as const).map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary-teal text-primary-teal' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Images */}
                    <div className="lg:col-span-2 space-y-6">
                        {property.images.length > 0 ? (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">รูปภาพโรงแรม</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {property.images.map((url, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img key={i} src={url} alt={`รูปภาพ ${i + 1}`} className="w-full aspect-video object-cover rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">รูปภาพโรงแรม</h3>
                                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                                    <ImageIcon className="w-10 h-10 mb-2" />
                                    <p className="text-sm">ยังไม่มีรูปภาพ</p>
                                </div>
                            </div>
                        )}

                        {property.description && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">คำอธิบาย</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{property.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Amenities + Info */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">ข้อมูลทั่วไป</h3>
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between"><dt className="text-gray-500">ประเภท</dt><dd className="font-medium text-gray-800">{property.type}</dd></div>
                                {property.address && <div className="flex justify-between gap-4"><dt className="text-gray-500 shrink-0">ที่อยู่</dt><dd className="font-medium text-gray-800 text-right">{property.address}</dd></div>}
                                {property.city && <div className="flex justify-between"><dt className="text-gray-500">เมือง</dt><dd className="font-medium text-gray-800">{property.city}</dd></div>}
                                {property.country && <div className="flex justify-between"><dt className="text-gray-500">ประเทศ</dt><dd className="font-medium text-gray-800">{property.country}</dd></div>}
                            </dl>
                        </div>

                        {property.amenities.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">สิ่งอำนวยความสะดวก</h3>
                                <div className="flex flex-wrap gap-2">
                                    {property.amenities.map(a => (
                                        <span key={a} className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-700 px-2.5 py-1.5 rounded-full border border-teal-100">
                                            <CheckCircle2 className="w-3 h-3" />{a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {stats && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">สถานะห้องพัก</h3>
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'ว่าง', val: stats.rooms.available, color: 'bg-green-500' },
                                        { label: 'ไม่ว่าง', val: stats.rooms.occupied, color: 'bg-red-500' },
                                        { label: 'ซ่อมบำรุง', val: stats.rooms.maintenance, color: 'bg-orange-500' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                                                <div className={`${color} h-2 rounded-full`} style={{ width: totalRooms > 0 ? `${Math.round((val / totalRooms) * 100)}%` : '0%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 w-6 text-right">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Buildings Tab */}
            {activeTab === 'buildings' && (
                <div className="space-y-4">
                    {property.buildings.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                            <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">ยังไม่มีอาคาร</p>
                        </div>
                    ) : property.buildings.map(b => (
                        <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-2.5">
                                    <Building2 className="w-4 h-4 text-primary-teal" />
                                    <h3 className="font-bold text-gray-900 text-sm">{b.name}</h3>
                                </div>
                                <span className="text-xs text-gray-400">{b.floors.length} ชั้น · {b.floors.reduce((s, f) => s + f.roomUnits.length, 0)} ห้อง</span>
                            </div>
                            {b.floors.map(f => (
                                <div key={f.id} className="border-b border-gray-50 last:border-0">
                                    <div className="px-5 py-2.5 bg-gray-50/50 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-600">ชั้น {f.number}</span>
                                        <span className="text-xs text-gray-400">{f.roomUnits.length} ห้อง</span>
                                    </div>
                                    {f.roomUnits.length > 0 && (
                                        <div className="px-5 py-3 flex flex-wrap gap-2">
                                            {f.roomUnits.map(u => {
                                                const st = STATUS_MAP[u.status] ?? { label: u.status, cls: 'bg-gray-100 text-gray-500' };
                                                return (
                                                    <div key={u.id} className="flex flex-col items-center gap-1 border border-gray-100 rounded-lg px-3 py-2 min-w-[80px] text-center">
                                                        <BedDouble className="w-4 h-4 text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-800">{u.number}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                                                        {u.roomType && <span className="text-[10px] text-gray-400 truncate max-w-[72px]">{u.roomType.name}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Room Types Tab */}
            {activeTab === 'rooms' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.roomTypes.length === 0 ? (
                        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                            <BedDouble className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">ยังไม่มีประเภทห้อง</p>
                        </div>
                    ) : property.roomTypes.map(rt => (
                        <div key={rt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {rt.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={rt.images[0]} alt={rt.name} className="w-full h-40 object-cover" />
                            ) : (
                                <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-gray-900">{rt.name}</h3>
                                    {rt.rates.length > 0 && (
                                        <span className="text-sm font-bold text-primary-teal">฿{rt.rates[0].price.toLocaleString()}/คืน</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> สูงสุด {rt.maxGuests} คน</span>
                                    {rt.bedType && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {rt.bedType}</span>}
                                </div>
                                {rt.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{rt.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
