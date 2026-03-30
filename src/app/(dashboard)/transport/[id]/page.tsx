'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Pencil, Car, Bus, Bike, Sailboat, Truck,
    MapPin, Users, ChevronDown, CheckCircle2, Phone, User2, Hash,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Vehicle {
    id: string; name: string; type: string; description?: string;
    licensePlate?: string; capacity: number; status: string;
    images: string[]; features: string[];
    pricePerTrip?: number; pricePerHour?: number; pricePerDay?: number;
    route?: string; driverName?: string; driverPhone?: string; isActive: boolean;
    ownerType?: 'HOTEL' | 'QUEUE_OWNER' | 'INDEPENDENT';
    property?: { id: string; name: string; city?: string } | null;
    vehicleOwner?: { id: string; name: string } | null;
    createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
    AVAILABLE: { label: 'ว่าง', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    BUSY: { label: 'ไม่ว่าง', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    MAINTENANCE: { label: 'ซ่อมบำรุง', cls: 'bg-red-100 text-red-500 border-red-200', dot: 'bg-red-500' },
    DISABLED: { label: 'ปิดใช้งาน', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
};

const TYPE_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    CAR: { label: 'รถยนต์ส่วนตัว', icon: Car, color: 'text-blue-500 bg-blue-50' },
    VAN: { label: 'รถตู้', icon: Truck, color: 'text-purple-500 bg-purple-50' },
    MINIBUS: { label: 'สองแถว/มินิบัส', icon: Bus, color: 'text-orange-500 bg-orange-50' },
    BUS: { label: 'รถบัส', icon: Bus, color: 'text-red-500 bg-red-50' },
    LOCAL: { label: 'รถท้องถิ่น', icon: Car, color: 'text-teal-500 bg-teal-50' },
    MOTORCYCLE: { label: 'มอเตอร์ไซค์', icon: Bike, color: 'text-yellow-500 bg-yellow-50' },
    TUKTUK: { label: 'ตุ๊กตุ๊ก/สามล้อ', icon: Car, color: 'text-pink-500 bg-pink-50' },
    BOAT: { label: 'เรือ', icon: Sailboat, color: 'text-cyan-500 bg-cyan-50' },
    OTHER: { label: 'อื่นๆ', icon: Car, color: 'text-gray-500 bg-gray-50' },
};

const ALL_STATUSES = ['AVAILABLE', 'BUSY', 'MAINTENANCE', 'DISABLED'];

export default function VehicleDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetch(`${API}/transport/${id}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => setVehicle(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!vehicle || newStatus === vehicle.status) { setShowStatusDropdown(false); return; }
        setUpdatingStatus(true);
        try {
            const res = await fetch(`${API}/transport/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const updated = await res.json();
                setVehicle(prev => prev ? { ...prev, status: updated.status } : prev);
            }
        } finally {
            setUpdatingStatus(false);
            setShowStatusDropdown(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>;
    if (!vehicle) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-red-400">ไม่พบข้อมูลยานพาหนะ</div>;

    const st = STATUS_MAP[vehicle.status] ?? { label: vehicle.status, cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' };
    const typeInfo = TYPE_MAP[vehicle.type] ?? TYPE_MAP.OTHER;
    const TypeIcon = typeInfo.icon;

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeInfo.color} shrink-0`}>
                        <TypeIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-bold text-gray-900">{vehicle.name}</h1>
                            {!vehicle.isActive && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">ปิดใช้งาน</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <span>{typeInfo.label}</span>
                            {vehicle.property?.city && <><span>·</span><MapPin className="w-3 h-3" />{vehicle.property.city}</>}
                            {vehicle.vehicleOwner?.name && <><span>·</span><span>{vehicle.vehicleOwner.name}</span></>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Status dropdown */}
                    <div className="relative">
                        <button onClick={() => setShowStatusDropdown(v => !v)} disabled={updatingStatus}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${st.cls}`}>
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
                                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 ${vehicle.status === s ? 'font-semibold text-primary-teal' : 'text-gray-700'}`}>
                                            <span className={`w-2 h-2 rounded-full ${info.dot}`} />{info.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {showStatusDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />}
                    </div>
                    <button onClick={() => router.push(`/transport/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-teal text-primary-teal text-sm font-medium hover:bg-teal-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> แก้ไข
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                {/* Left */}
                <div className="space-y-5">
                    {/* Images */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="aspect-[16/9] bg-gradient-to-br from-teal-50 to-gray-100">
                            {vehicle.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={vehicle.images[selectedImage]} alt={vehicle.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                    <TypeIcon className="w-20 h-20 text-teal-200" />
                                    <p className="text-sm text-gray-400">ยังไม่มีรูปภาพ</p>
                                </div>
                            )}
                        </div>
                        {vehicle.images.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {vehicle.images.map((img, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={i} src={img} alt="" onClick={() => setSelectedImage(i)}
                                        className={`w-20 h-14 object-cover rounded-lg cursor-pointer shrink-0 transition-all ${i === selectedImage ? 'ring-2 ring-primary-teal' : 'opacity-70 hover:opacity-100'}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {vehicle.description && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-2">คำอธิบาย</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{vehicle.description}</p>
                        </div>
                    )}

                    {/* Price cards */}
                    {(vehicle.pricePerTrip || vehicle.pricePerHour || vehicle.pricePerDay) && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-4">ราคาบริการ</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {vehicle.pricePerTrip && (
                                    <PriceCard label="ราคา/เที่ยว" value={`฿${Number(vehicle.pricePerTrip).toLocaleString()}`} />
                                )}
                                {vehicle.pricePerHour && (
                                    <PriceCard label="ราคา/ชั่วโมง" value={`฿${Number(vehicle.pricePerHour).toLocaleString()}`} />
                                )}
                                {vehicle.pricePerDay && (
                                    <PriceCard label="ราคา/วัน" value={`฿${Number(vehicle.pricePerDay).toLocaleString()}`} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Features */}
                    {vehicle.features.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {vehicle.features.map(f => (
                                    <div key={f} className="flex items-center gap-2.5 px-3 py-2.5 bg-teal-50 rounded-lg border border-teal-100">
                                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                                        <span className="text-xs font-medium text-teal-700">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right panel */}
                <div className="space-y-4">
                    {/* Info card */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4">ข้อมูลยานพาหนะ</h3>
                        <dl className="space-y-3 text-sm">
                            <InfoRow icon={<span className={`text-xs font-bold ${typeInfo.color.split(' ')[0]}`}>ประเภท</span>} label="ประเภท" value={typeInfo.label} />
                            <InfoRow icon={<Hash className="w-3.5 h-3.5 text-gray-400" />} label="ทะเบียน" value={vehicle.licensePlate || 'ไม่ระบุ'} mono />
                            <InfoRow icon={<Users className="w-3.5 h-3.5 text-gray-400" />} label="ที่นั่ง" value={`${vehicle.capacity} คน`} />
                            {vehicle.route && (
                                <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />} label="เส้นทาง" value={vehicle.route} />
                            )}
                            <div className="pt-2 border-t border-gray-50">
                                {vehicle.ownerType === 'QUEUE_OWNER' && vehicle.vehicleOwner ? (
                                    <>
                                        <p className="text-xs text-gray-400 mb-1">เจ้าของคิวรถ</p>
                                        <p className="font-medium text-gray-800 text-sm">{vehicle.vehicleOwner.name}</p>
                                    </>
                                ) : vehicle.ownerType === 'INDEPENDENT' ? (
                                    <>
                                        <p className="text-xs text-gray-400 mb-1">ประเภทเจ้าของ</p>
                                        <p className="font-medium text-orange-600 text-sm">รถอิสระ</p>
                                    </>
                                ) : vehicle.property ? (
                                    <>
                                        <p className="text-xs text-gray-400 mb-1">โรงแรมที่ดูแล</p>
                                        <p className="font-medium text-gray-800 text-sm">{vehicle.property.name}</p>
                                    </>
                                ) : null}
                            </div>
                        </dl>
                    </div>

                    {/* Driver card */}
                    {(vehicle.driverName || vehicle.driverPhone) && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-4">ข้อมูลคนขับ</h3>
                            <dl className="space-y-3 text-sm">
                                {vehicle.driverName && <InfoRow icon={<User2 className="w-3.5 h-3.5 text-gray-400" />} label="ชื่อ" value={vehicle.driverName} />}
                                {vehicle.driverPhone && <InfoRow icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} label="โทรศัพท์" value={vehicle.driverPhone} mono />}
                            </dl>
                        </div>
                    )}

                    {/* Status card */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-3">สถานะปัจจุบัน</h3>
                        <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border ${st.cls}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${st.dot} shrink-0`} />
                            <span className="font-medium">{st.label}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PriceCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-primary-teal">{value}</p>
        </div>
    );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-gray-500 flex items-center gap-1.5 shrink-0">{icon}{label}</dt>
            <dd className={`font-medium text-gray-800 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
        </div>
    );
}
