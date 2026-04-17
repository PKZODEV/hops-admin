'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Calendar, ChevronDown, CheckCircle2, BedDouble, Users, Maximize2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Rate { id: string; name: string; price: number }
interface RoomType { id: string; name: string; maxGuests: number; bedType?: string; description?: string; amenities: string[]; images: string[]; rates: Rate[] }
interface Building { id: string; name: string }
interface Floor { id: string; number: string; building: Building }
interface RoomUnit {
    id: string; number: string; status: string; amenities: string[]; images: string[];
    roomType: RoomType;
    floor: Floor;
}

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
    AVAILABLE:   { label: 'ว่าง',            cls: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
    RESERVED:    { label: 'ติดจอง',          cls: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
    OCCUPIED:    { label: 'กำลังเข้าพัก',    cls: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500' },
    CLEANING:    { label: 'ทำความสะอาด',     cls: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    MAINTENANCE: { label: 'ซ่อมบำรุง',       cls: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
    DISABLED:    { label: 'ปิดใช้งาน',       cls: 'bg-gray-100 text-gray-500 border-gray-200',      dot: 'bg-gray-400' },
};

const ALL_STATUSES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'DISABLED'];

// Generate next 7 days for the availability calendar
function getNext7Days() {
    const days: { date: string; dateObj: Date }[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({ date: d.toISOString().split('T')[0], dateObj: d });
    }
    return days;
}

export default function RoomDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [room, setRoom] = useState<RoomUnit | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const days = getNext7Days();

    useEffect(() => {
        fetch(`${API}/room-units/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => { setRoom(data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!room || newStatus === room.status) { setShowStatusDropdown(false); return; }
        setUpdatingStatus(true);
        try {
            const res = await fetch(`${API}/room-units/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const updated = await res.json();
                setRoom(prev => prev ? { ...prev, status: updated.status } : prev);
            }
        } finally {
            setUpdatingStatus(false);
            setShowStatusDropdown(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>;
    if (!room) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-red-400">ไม่พบข้อมูลห้อง</div>;

    const st = STATUS_MAP[room.status] ?? { label: room.status, cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' };
    const allImages = [...(room.images ?? []), ...(room.roomType?.images ?? [])];
    const price = room.roomType?.rates?.[0]?.price;

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            ห้อง {room.number}{room.roomType?.name ? ` - ${room.roomType.name}` : ''}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {[room.floor?.building?.name, `ชั้น ${room.floor?.number}`].filter(Boolean).join(' • ')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Status dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStatusDropdown(v => !v)}
                            disabled={updatingStatus}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${st.cls}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                            {st.label}
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {showStatusDropdown && (
                            <div className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl border border-gray-100 shadow-xl min-w-[160px] py-1">
                                {ALL_STATUSES.map(s => {
                                    const info = STATUS_MAP[s];
                                    return (
                                        <button key={s} onClick={() => handleStatusChange(s)}
                                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 ${room.status === s ? 'font-semibold text-primary-teal' : 'text-gray-700'}`}>
                                            <span className={`w-2 h-2 rounded-full ${info.dot}`} />{info.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {showStatusDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />}
                    </div>

                    <button onClick={() => router.push(`/rooms/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-teal text-primary-teal text-sm font-medium hover:bg-teal-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> แก้ไขห้อง
                    </button>
                    <button className="flex items-center gap-2 bg-primary-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm">
                        <Calendar className="w-3.5 h-3.5" /> ดูการจอง
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                {/* Left: Images + Description + Amenities */}
                <div className="space-y-5">
                    {/* Images */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="aspect-[16/9] bg-gray-100">
                            {allImages.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={allImages[selectedImage]} alt="Room" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BedDouble className="w-16 h-16 text-gray-200" />
                                </div>
                            )}
                        </div>
                        {allImages.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {allImages.map((img, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={i} src={img} alt="" onClick={() => setSelectedImage(i)}
                                        className={`w-20 h-14 object-cover rounded-lg cursor-pointer shrink-0 transition-all ${i === selectedImage ? 'ring-2 ring-primary-teal' : 'opacity-70 hover:opacity-100'}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-3">รายละเอียด</h3>
                        {room.roomType?.description ? (
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">{room.roomType.description}</p>
                        ) : (
                            <p className="text-sm text-gray-400 mb-4 italic">ยังไม่มีคำอธิบาย</p>
                        )}
                        <div className="grid grid-cols-3 gap-3">
                            <StatBox icon={<Maximize2 className="w-4 h-4 text-primary-teal" />} label="ขนาดห้อง" value="—" />
                            <StatBox
                                icon={<Users className="w-4 h-4 text-primary-teal" />}
                                label="ความจุสูงสุด"
                                value={room.roomType?.maxGuests ? `${room.roomType.maxGuests} คน` : '—'}
                            />
                            <StatBox
                                icon={<span className="text-primary-teal font-bold text-xs">฿</span>}
                                label="ราคา/คืน"
                                value={price != null ? price.toLocaleString() : '—'}
                            />
                        </div>
                    </div>

                    {/* Amenities */}
                    {(room.amenities?.length > 0 || room.roomType?.amenities?.length > 0) && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวกในห้อง</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[...(room.roomType?.amenities ?? []), ...(room.amenities ?? [])].map(a => (
                                    <div key={a} className="flex items-center gap-2.5 px-3 py-2.5 bg-teal-50 rounded-lg border border-teal-100">
                                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                                        <span className="text-xs font-medium text-teal-700">{a}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right panel */}
                <div className="space-y-4">
                    {/* Current Status */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4">สถานะปัจจุบัน</h3>
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <dt className="text-gray-500">สถานะ</dt>
                                <dd><span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${st.cls}`}>{st.label}</span></dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-gray-500">ชั้น</dt>
                                <dd className="font-bold text-gray-800">{room.floor?.number ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-gray-500">อาคาร</dt>
                                <dd className="font-bold text-gray-800 text-right max-w-[140px]">{room.floor?.building?.name ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-gray-500">ประเภทห้อง</dt>
                                <dd className="font-bold text-gray-800">{room.roomType?.name ?? '—'}</dd>
                            </div>
                            {room.roomType?.bedType && (
                                <div className="flex justify-between items-center">
                                    <dt className="text-gray-500">ประเภทเตียง</dt>
                                    <dd className="font-bold text-gray-800">{room.roomType.bedType}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Availability Calendar */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4">ปฏิทินความสะดวกในการจอง</h3>
                        <div className="space-y-2">
                            {days.map(({ date }) => {
                                // For now, reflect current room status on today; others show available
                                const isToday = date === days[0].date;
                                const dayStatus = isToday && room.status === 'OCCUPIED' ? 'OCCUPIED' : 'AVAILABLE';
                                const info = STATUS_MAP[dayStatus];
                                return (
                                    <div key={date} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {date}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.cls}`}>{info.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex flex-col items-start gap-1 border border-gray-100 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-primary-teal text-sm font-bold">
                {icon}
                <span>{value}</span>
            </div>
            <span className="text-xs text-gray-400">{label}</span>
        </div>
    );
}
