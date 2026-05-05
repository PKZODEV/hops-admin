'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Search,
    Filter,
    CalendarDays,
    Loader2,
    AlertCircle,
    Hotel,
    LogIn,
    LogOut,
    Ban,
    DollarSign,
    UserX,
    Undo2,
    User,
    Mail,
    Phone,
    BedDouble,
    Receipt,
    X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type BookingStatus =
    | 'PENDING'
    | 'AWAITING_ROOM_ASSIGNMENT'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'CHECKOUT_PENDING'
    | 'AWAITING_EXTRA_PAYMENT'
    | 'CHECKED_OUT'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'NO_SHOW';

type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

interface BookingProperty {
    id: string;
    name: string;
    images: string[];
    city?: string | null;
    address?: string | null;
    userId?: string;
}

interface BookingRoomType {
    id: string;
    name: string;
    images?: string[];
    bedType?: string | null;
}

interface BookingRoomUnit {
    id: string;
    number: string;
}

interface BookingExtraCharge {
    id: string;
    name: string;
    amount: string | number;
}

interface Booking {
    id: string;
    bookingCode: string;
    propertyId: string;
    property?: BookingProperty;
    roomTypeId: string;
    roomType?: BookingRoomType;
    roomUnitId?: string | null;
    roomUnit?: BookingRoomUnit | null;
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    guestPhone: string;
    guestCount: number;
    specialRequest?: string | null;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    pricePerNight: string | number;
    totalAmount: string | number;
    currency: string;
    provider: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    checkedInAt?: string | null;
    checkedOutAt?: string | null;
    checkoutRequestedAt?: string | null;
    cancelledAt?: string | null;
    cancelReason?: string | null;
    refundedAt?: string | null;
    refundAmount?: string | number | null;
    extraCharges?: BookingExtraCharge[];
    extraChargesTotal?: string | number | null;
    createdAt: string;
}

interface AvailableUnit {
    id: string;
    number: string;
    floor?: { number: string; building?: { name: string } };
}

const STATUS_INFO: Record<BookingStatus, { label: string; cls: string }> = {
    PENDING: { label: 'กำลังจะมาถึง', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    AWAITING_ROOM_ASSIGNMENT: { label: 'รอระบุห้อง', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    CONFIRMED: { label: 'กำลังจะมาถึง', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    CHECKED_IN: { label: 'อยู่ระหว่างเข้าพัก', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    CHECKOUT_PENDING: { label: 'รออนุมัติเช็คเอ้าท์', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    AWAITING_EXTRA_PAYMENT: { label: 'รอชำระค่าใช้จ่ายเพิ่ม', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    CHECKED_OUT: { label: 'สำเร็จ', cls: 'bg-green-50 text-green-700 border-green-200' },
    CANCELLED: { label: 'ยกเลิก', cls: 'bg-red-50 text-red-700 border-red-200' },
    REFUNDED: { label: 'ยกเลิก', cls: 'bg-red-50 text-red-700 border-red-200' },
    NO_SHOW: { label: 'ไม่เข้าพัก', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const PAYMENT_INFO: Record<PaymentStatus, { label: string; cls: string }> = {
    PENDING: { label: 'รอชำระ', cls: 'bg-amber-50 text-amber-700' },
    PAID: { label: 'ชำระแล้ว', cls: 'bg-green-50 text-green-700' },
    REFUNDED: { label: 'คืนเงินแล้ว', cls: 'bg-pink-50 text-pink-700' },
    FAILED: { label: 'ชำระไม่สำเร็จ', cls: 'bg-red-50 text-red-700' },
};

const FILTER_OPTIONS: { value: BookingStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'AWAITING_ROOM_ASSIGNMENT', label: 'รอระบุห้อง' },
    { value: 'CONFIRMED', label: 'กำลังจะมาถึง' },
    { value: 'CHECKED_IN', label: 'อยู่ระหว่างเข้าพัก' },
    { value: 'CHECKOUT_PENDING', label: 'รออนุมัติเช็คเอ้าท์' },
    { value: 'AWAITING_EXTRA_PAYMENT', label: 'รอชำระเพิ่ม' },
    { value: 'CHECKED_OUT', label: 'สำเร็จ' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
    { value: 'REFUNDED', label: 'คืนเงิน' },
    { value: 'NO_SHOW', label: 'ไม่เข้าพัก' },
];

const fmtTHB = (n: number) =>
    new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
    }).format(n);

const fmtDate = (s?: string | null) => {
    if (!s) return '-';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const fmtDateTime = (s?: string | null) => {
    if (!s) return '-';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function BookingManagementPage() {
    const [items, setItems] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Booking | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [acting, setActing] = useState(false);

    const load = useCallback(
        (silent = false) => {
            if (!silent) setLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'ALL') params.set('status', filter);
            const url = `${API}/bookings${params.toString() ? `?${params.toString()}` : ''}`;
            return fetch(url, { credentials: 'include' })
                .then((r) => r.json())
                .then((d) => {
                    const arr = Array.isArray(d) ? d : [];
                    setItems(arr);
                    // sync selected booking with latest data
                    setSelected((prev) => {
                        if (!prev) return prev;
                        const updated = arr.find((b: Booking) => b.id === prev.id);
                        return updated ?? prev;
                    });
                })
                .catch(() => {
                    if (!silent) setItems([]);
                })
                .finally(() => {
                    if (!silent) setLoading(false);
                });
        },
        [filter],
    );

    useEffect(() => {
        load();
    }, [load]);

    // Real-time polling: refresh ทุก 5 วินาที (silent — ไม่กระพริบ loading)
    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') load(true);
        }, 5000);
        return () => clearInterval(id);
    }, [load]);

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const q = search.trim().toLowerCase();
        return items.filter((b) =>
            [
                b.bookingCode,
                b.guestFirstName,
                b.guestLastName,
                b.guestEmail,
                b.guestPhone,
                b.property?.name ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(q)
        );
    }, [items, search]);

    const stats = useMemo(() => {
        const acc: Record<string, number> = {
            CONFIRMED: 0,
            CHECKED_IN: 0,
            CHECKED_OUT: 0,
            CANCELLED: 0,
        };
        items.forEach((b) => {
            if (acc[b.status] !== undefined) acc[b.status]++;
        });
        return acc;
    }, [items]);

    const action = async (
        id: string,
        path: string,
        body?: Record<string, unknown>,
        confirmMsg?: string,
    ) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        setActionError(null);
        setActing(true);
        try {
            const res = await fetch(`${API}/bookings/${id}/${path}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(
                    Array.isArray(j.message) ? j.message.join(', ') : j.message ?? 'ทำรายการไม่สำเร็จ'
                );
            }
            const updated = await res.json();
            setItems((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
            setSelected((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'ทำรายการไม่สำเร็จ';
            setActionError(msg);
        } finally {
            setActing(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">การจองห้องพัก</h1>
                    <p className="text-gray-500 text-sm mt-1">รายการจองทั้งหมด — เช็คอิน, เช็คเอาท์, ยกเลิก, คืนเงิน</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(
                    [
                        ['กำลังจะมาถึง', stats.CONFIRMED, 'bg-amber-50 text-amber-700'],
                        ['อยู่ระหว่างเข้าพัก', stats.CHECKED_IN, 'bg-blue-50 text-blue-700'],
                        ['สำเร็จ', stats.CHECKED_OUT, 'bg-green-50 text-green-700'],
                        ['ยกเลิก', stats.CANCELLED, 'bg-red-50 text-red-700'],
                    ] as const
                ).map(([label, count, cls]) => (
                    <Card key={label} padding="md" className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className={`text-2xl font-bold ${cls.split(' ')[1]}`}>{count}</span>
                    </Card>
                ))}
            </div>

            <Card padding="lg" className="flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                    <div className="flex flex-1 gap-2">
                        <div className="flex-1 max-w-md">
                            <Input
                                placeholder="ค้นหาชื่อผู้จอง, รหัสการจอง, อีเมล..."
                                icon={<Search className="w-5 h-5" />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-500" />
                        {FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                                    filter === opt.value
                                        ? 'bg-primary-teal text-white border-primary-teal'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="py-20 flex items-center justify-center text-gray-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        กำลังโหลด...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <CalendarDays className="w-10 h-10" />
                        <p>ไม่มีรายการจอง</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-200">
                                    <th className="py-3 px-2 font-medium">รหัส</th>
                                    <th className="py-3 px-2 font-medium">ผู้เข้าพัก</th>
                                    <th className="py-3 px-2 font-medium">ที่พัก / ห้อง</th>
                                    <th className="py-3 px-2 font-medium">วันเข้าพัก</th>
                                    <th className="py-3 px-2 font-medium text-right">ยอดรวม</th>
                                    <th className="py-3 px-2 font-medium">สถานะ</th>
                                    <th className="py-3 px-2 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => (
                                    <tr
                                        key={b.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelected(b)}
                                    >
                                        <td className="py-3 px-2 font-mono text-xs text-gray-700">
                                            {b.bookingCode}
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="font-medium text-gray-900">
                                                {b.guestFirstName} {b.guestLastName}
                                            </div>
                                            <div className="text-xs text-gray-500">{b.guestEmail}</div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="font-medium text-gray-900 line-clamp-1">
                                                {b.property?.name ?? '-'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {b.roomType?.name}
                                                {b.roomUnit?.number ? ` · ห้อง ${b.roomUnit.number}` : ''}
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-gray-700">
                                            <div>{fmtDate(b.checkInDate)}</div>
                                            <div className="text-xs text-gray-500">
                                                ถึง {fmtDate(b.checkOutDate)} · {b.nights} คืน
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-right font-semibold text-gray-900">
                                            {fmtTHB(Number(b.totalAmount))}
                                        </td>
                                        <td className="py-3 px-2">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${STATUS_INFO[b.status].cls}`}
                                            >
                                                {STATUS_INFO[b.status].label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelected(b);
                                                }}
                                            >
                                                จัดการ
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {selected && (
                <BookingDetailModal
                    booking={selected}
                    onClose={() => setSelected(null)}
                    acting={acting}
                    actionError={actionError}
                    onCheckIn={() =>
                        action(
                            selected.id,
                            'check-in',
                            {},
                            `ยืนยันการเช็คอินสำหรับ ${selected.guestFirstName} ${selected.guestLastName}?`,
                        )
                    }
                    onCheckOut={() =>
                        action(
                            selected.id,
                            'check-out',
                            undefined,
                            `ยืนยันการเช็คเอาท์สำหรับ ${selected.guestFirstName} ${selected.guestLastName}?`,
                        )
                    }
                    onCancel={(reason) =>
                        action(selected.id, 'cancel', { reason }, 'ยืนยันการยกเลิกการจอง?')
                    }
                    onRefund={(amount, reason) =>
                        action(
                            selected.id,
                            'refund',
                            { amount, reason },
                            'ยืนยันการคืนเงิน?',
                        )
                    }
                    onNoShow={() =>
                        action(
                            selected.id,
                            'no-show',
                            undefined,
                            'ยืนยันการ mark ว่าผู้เข้าพักไม่มาเข้าพัก?',
                        )
                    }
                    onRevertCheckIn={() =>
                        action(
                            selected.id,
                            'revert-check-in',
                            undefined,
                            'ย้อนสถานะกลับเป็น "กำลังจะมาถึง"?',
                        )
                    }
                    onAssignRoom={(roomUnitId) =>
                        action(selected.id, 'assign-room', { roomUnitId })
                    }
                    onApproveCheckout={(extras) =>
                        action(selected.id, 'approve-checkout', { extras })
                    }
                />
            )}
        </div>
    );
}

function BookingDetailModal({
    booking,
    onClose,
    acting,
    actionError,
    onCheckIn,
    onCheckOut,
    onCancel,
    onRefund,
    onNoShow,
    onRevertCheckIn,
    onAssignRoom,
    onApproveCheckout,
}: {
    booking: Booking;
    onClose: () => void;
    acting: boolean;
    actionError: string | null;
    onCheckIn: () => void;
    onCheckOut: () => void;
    onCancel: (reason: string) => void;
    onRefund: (amount: number | undefined, reason: string) => void;
    onNoShow: () => void;
    onRevertCheckIn: () => void;
    onAssignRoom: (roomUnitId: string) => void;
    onApproveCheckout: (extras: { name: string; amount: number }[]) => void;
}) {
    const [showCancel, setShowCancel] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showRefund, setShowRefund] = useState(false);
    const [refundAmount, setRefundAmount] = useState<string>('');
    const [refundReason, setRefundReason] = useState('');
    const [showAssign, setShowAssign] = useState(false);
    const [units, setUnits] = useState<AvailableUnit[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [showApprove, setShowApprove] = useState(false);
    const [extras, setExtras] = useState<{ name: string; amount: string }[]>([
        { name: '', amount: '' },
    ]);

    const status = booking.status;
    const canAssign = status === 'AWAITING_ROOM_ASSIGNMENT';
    const canCheckIn = status === 'CONFIRMED' || status === 'PENDING';
    const canCheckOut = status === 'CHECKED_IN';
    const canApproveCheckout = status === 'CHECKOUT_PENDING';
    const canRevertCheckIn = status === 'CHECKED_IN';
    const canCancel = !['CHECKED_OUT', 'CANCELLED', 'REFUNDED'].includes(status);
    const canRefund = booking.paymentStatus === 'PAID' && status !== 'REFUNDED';
    const canNoShow = status === 'CONFIRMED' || status === 'PENDING';

    useEffect(() => {
        if (!showAssign) return;
        setUnitsLoading(true);
        fetch(`${API}/bookings/${booking.id}/available-units`, {
            credentials: 'include',
        })
            .then((r) => r.json())
            .then((d) => setUnits(Array.isArray(d) ? d : []))
            .catch(() => setUnits([]))
            .finally(() => setUnitsLoading(false));
    }, [showAssign, booking.id]);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div>
                        <div className="text-xs text-gray-500 font-mono">{booking.bookingCode}</div>
                        <h2 className="text-lg font-bold text-gray-900 mt-1">
                            {booking.guestFirstName} {booking.guestLastName}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${STATUS_INFO[booking.status].cls}`}
                            >
                                {STATUS_INFO[booking.status].label}
                            </span>
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${PAYMENT_INFO[booking.paymentStatus].cls}`}
                            >
                                {PAYMENT_INFO[booking.paymentStatus].label}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {actionError && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{actionError}</span>
                        </div>
                    )}

                    {/* Property + Room */}
                    <Section icon={Hotel} title="ที่พัก">
                        <Field label="โรงแรม" value={booking.property?.name ?? '-'} />
                        <Field label="ที่ตั้ง" value={booking.property?.city ?? booking.property?.address ?? '-'} />
                    </Section>

                    <Section icon={BedDouble} title="ห้องพัก">
                        <Field label="ประเภทห้อง" value={booking.roomType?.name ?? '-'} />
                        <Field
                            label="หมายเลขห้อง"
                            value={booking.roomUnit?.number ?? 'ยังไม่ได้กำหนด'}
                        />
                        <Field label="ผู้เข้าพัก" value={`${booking.guestCount} ท่าน`} />
                        {booking.specialRequest && (
                            <Field label="คำขอพิเศษ" value={booking.specialRequest} />
                        )}
                    </Section>

                    <Section icon={CalendarDays} title="วันที่เข้าพัก">
                        <Field label="เช็คอิน" value={fmtDate(booking.checkInDate)} />
                        <Field label="เช็คเอาท์" value={fmtDate(booking.checkOutDate)} />
                        <Field label="จำนวนคืน" value={`${booking.nights} คืน`} />
                        {booking.checkedInAt && (
                            <Field label="เช็คอินแล้วเมื่อ" value={fmtDateTime(booking.checkedInAt)} />
                        )}
                        {booking.checkedOutAt && (
                            <Field
                                label="เช็คเอาท์แล้วเมื่อ"
                                value={fmtDateTime(booking.checkedOutAt)}
                            />
                        )}
                    </Section>

                    <Section icon={User} title="ผู้เข้าพัก">
                        <Field
                            label="ชื่อ-สกุล"
                            value={`${booking.guestFirstName} ${booking.guestLastName}`}
                        />
                        <Field
                            icon={Mail}
                            label="อีเมล"
                            value={booking.guestEmail}
                        />
                        <Field icon={Phone} label="เบอร์โทร" value={booking.guestPhone} />
                    </Section>

                    <Section icon={Receipt} title="ราคา">
                        <Field label="ราคาต่อคืน" value={fmtTHB(Number(booking.pricePerNight))} />
                        <Field label="ผู้ให้บริการ" value={booking.provider} />
                        <Field
                            label="ยอดรวม"
                            value={fmtTHB(Number(booking.totalAmount))}
                            valueClass="text-primary-teal font-bold"
                        />
                        {booking.refundAmount != null && (
                            <Field
                                label="คืนเงิน"
                                value={fmtTHB(Number(booking.refundAmount))}
                            />
                        )}
                        {booking.cancelReason && (
                            <Field label="เหตุผลที่ยกเลิก" value={booking.cancelReason} />
                        )}
                    </Section>

                    {/* Cancel form */}
                    {showCancel && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                            <div className="text-sm font-medium text-amber-900 mb-2">
                                เหตุผลในการยกเลิก
                            </div>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="ระบุเหตุผล (ไม่บังคับ)"
                                className="w-full border border-gray-200 rounded-md p-2 text-sm"
                                rows={3}
                            />
                            <div className="flex gap-2 mt-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowCancel(false)}>
                                    ปิด
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        onCancel(cancelReason);
                                        setShowCancel(false);
                                    }}
                                    disabled={acting}
                                >
                                    ยืนยันยกเลิก
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Extra charges (read-only display when present) */}
                    {(booking.extraCharges?.length ?? 0) > 0 && (
                        <Section icon={Receipt} title="ค่าใช้จ่ายเพิ่มเติม">
                            <div className="col-span-full -ml-6">
                                <ul className="text-sm divide-y divide-gray-100">
                                    {booking.extraCharges!.map((c) => (
                                        <li key={c.id} className="flex justify-between py-2">
                                            <span className="text-gray-700">{c.name}</span>
                                            <span className="font-semibold text-gray-900">
                                                {fmtTHB(Number(c.amount))}
                                            </span>
                                        </li>
                                    ))}
                                    <li className="flex justify-between py-2 mt-1">
                                        <span className="font-semibold text-gray-900">รวมค่าใช้จ่ายเพิ่มเติม</span>
                                        <span className="font-bold text-primary-teal">
                                            {fmtTHB(Number(booking.extraChargesTotal ?? 0))}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </Section>
                    )}

                    {/* Assign room form */}
                    {showAssign && (
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 space-y-3">
                            <div className="text-sm font-medium text-orange-900">
                                เลือกห้องที่จะให้แขก
                            </div>
                            {unitsLoading ? (
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดห้องว่าง...
                                </div>
                            ) : units.length === 0 ? (
                                <div className="text-sm text-red-600">
                                    ไม่มีห้องว่างในประเภทนี้ — โปรดยกเลิก / คืนเงินแทน
                                </div>
                            ) : (
                                <select
                                    value={selectedUnitId}
                                    onChange={(e) => setSelectedUnitId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-md p-2 text-sm bg-white"
                                >
                                    <option value="">-- เลือกห้อง --</option>
                                    {units.map((u) => {
                                        const loc = u.floor
                                            ? ` (${u.floor.building?.name ?? ''} ชั้น ${u.floor.number})`
                                            : '';
                                        return (
                                            <option key={u.id} value={u.id}>
                                                ห้อง {u.number}
                                                {loc}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowAssign(false)}>
                                    ปิด
                                </Button>
                                <Button
                                    disabled={acting || !selectedUnitId}
                                    onClick={() => {
                                        onAssignRoom(selectedUnitId);
                                        setShowAssign(false);
                                    }}
                                >
                                    ยืนยันรับคำขอ + ระบุห้อง
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Approve checkout form */}
                    {showApprove && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                            <div className="text-sm font-medium text-blue-900">
                                ค่าใช้จ่ายเพิ่มเติม (ถ้ามี)
                            </div>
                            <p className="text-xs text-gray-600">
                                ถ้าไม่มีค่าใช้จ่ายเพิ่มเติม กดยืนยันได้เลย — ระบบจะเช็คเอาท์ทันที
                            </p>
                            <div className="space-y-2">
                                {extras.map((e, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2">
                                        <input
                                            type="text"
                                            value={e.name}
                                            onChange={(ev) => {
                                                const arr = [...extras];
                                                arr[idx] = { ...arr[idx], name: ev.target.value };
                                                setExtras(arr);
                                            }}
                                            placeholder="ชื่อรายการ (เช่น มินิบาร์)"
                                            className="col-span-7 border border-gray-200 rounded-md p-2 text-sm bg-white"
                                        />
                                        <input
                                            type="number"
                                            value={e.amount}
                                            onChange={(ev) => {
                                                const arr = [...extras];
                                                arr[idx] = { ...arr[idx], amount: ev.target.value };
                                                setExtras(arr);
                                            }}
                                            placeholder="ราคา"
                                            className="col-span-4 border border-gray-200 rounded-md p-2 text-sm bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const arr = extras.filter((_, i) => i !== idx);
                                                setExtras(arr.length === 0 ? [{ name: '', amount: '' }] : arr);
                                            }}
                                            className="col-span-1 text-gray-400 hover:text-red-500"
                                            title="ลบรายการ"
                                        >
                                            <X className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExtras([...extras, { name: '', amount: '' }])
                                    }
                                    className="text-sm text-primary-teal hover:underline"
                                >
                                    + เพิ่มรายการ
                                </button>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowApprove(false)}>
                                    ปิด
                                </Button>
                                <Button
                                    disabled={acting}
                                    onClick={() => {
                                        const validExtras = extras
                                            .filter(
                                                (e) =>
                                                    e.name.trim().length > 0 &&
                                                    Number(e.amount) > 0,
                                            )
                                            .map((e) => ({
                                                name: e.name.trim(),
                                                amount: Number(e.amount),
                                            }));
                                        onApproveCheckout(validExtras);
                                        setShowApprove(false);
                                    }}
                                >
                                    ยืนยันอนุมัติเช็คเอ้าท์
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Refund form */}
                    {showRefund && (
                        <div className="bg-pink-50 border border-pink-200 rounded-md p-4 space-y-2">
                            <div className="text-sm font-medium text-pink-900">รายละเอียดการคืนเงิน</div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    placeholder={`จำนวนเงิน (ค่าเริ่มต้น: ${fmtTHB(Number(booking.totalAmount))})`}
                                    className="border border-gray-200 rounded-md p-2 text-sm"
                                />
                                <input
                                    type="text"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="เหตุผล"
                                    className="border border-gray-200 rounded-md p-2 text-sm"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowRefund(false)}>
                                    ปิด
                                </Button>
                                <Button
                                    onClick={() => {
                                        const amt = refundAmount.trim()
                                            ? Number(refundAmount)
                                            : undefined;
                                        onRefund(amt, refundReason);
                                        setShowRefund(false);
                                    }}
                                    disabled={acting}
                                >
                                    ยืนยันคืนเงิน
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex flex-wrap gap-2 justify-end p-6 border-t border-gray-200 bg-gray-50">
                    {canAssign && (
                        <Button
                            onClick={() => setShowAssign((v) => !v)}
                            disabled={acting}
                            className="gap-2"
                        >
                            <BedDouble className="w-4 h-4" />
                            รับคำขอ + ระบุห้อง
                        </Button>
                    )}
                    {canApproveCheckout && (
                        <Button
                            onClick={() => setShowApprove((v) => !v)}
                            disabled={acting}
                            className="gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            อนุมัติเช็คเอ้าท์
                        </Button>
                    )}
                    {canCheckIn && (
                        <Button onClick={onCheckIn} disabled={acting} className="gap-2">
                            <LogIn className="w-4 h-4" />
                            เช็คอิน
                        </Button>
                    )}
                    {canCheckOut && (
                        <Button onClick={onCheckOut} disabled={acting} className="gap-2">
                            <LogOut className="w-4 h-4" />
                            เช็คเอาท์
                        </Button>
                    )}
                    {canRevertCheckIn && (
                        <Button
                            variant="ghost"
                            onClick={onRevertCheckIn}
                            disabled={acting}
                            className="gap-2"
                        >
                            <Undo2 className="w-4 h-4" />
                            ย้อนการเช็คอิน
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            variant="outline"
                            onClick={() => setShowCancel((v) => !v)}
                            disabled={acting}
                            className="gap-2"
                        >
                            <Ban className="w-4 h-4" />
                            ยกเลิก
                        </Button>
                    )}
                    {canRefund && (
                        <Button
                            variant="outline"
                            onClick={() => setShowRefund((v) => !v)}
                            disabled={acting}
                            className="gap-2"
                        >
                            <DollarSign className="w-4 h-4" />
                            คืนเงิน
                        </Button>
                    )}
                    {canNoShow && (
                        <Button
                            variant="ghost"
                            onClick={onNoShow}
                            disabled={acting}
                            className="gap-2"
                        >
                            <UserX className="w-4 h-4" />
                            No-show
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function Section({
    icon: Icon,
    title,
    children,
}: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-primary-teal" />
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pl-6">{children}</div>
        </div>
    );
}

function Field({
    label,
    value,
    icon: Icon,
    valueClass = '',
}: {
    label: string;
    value: string | number;
    icon?: React.ElementType;
    valueClass?: string;
}) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-sm text-gray-900 flex items-center gap-1 ${valueClass}`}>
                {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
                {value}
            </span>
        </div>
    );
}
