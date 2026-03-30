'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, TrendingUp, Users, CalendarDays, Building2, Settings, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const SETUP_TASKS = [
  { title: 'ข้อมูลโรงแรม', desc: 'ชื่อโรงแรม สิ่งอำนวยความสะดวก และรูปภาพ' },
  { title: 'อาคารและชั้น', desc: 'กำหนดอาคารและชั้นของโรงแรม' },
  { title: 'ประเภทห้องพักและราคา', desc: 'กำหนดประเภทห้องพักและราคาพื้นฐาน' },
  { title: 'ห้องพัก', desc: 'สร้างหมายเลขห้องพักแต่ละห้อง' },
];

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MOCK_REVENUE_MONTHLY = [42000, 38000, 55000, 61000, 57000, 72000, 68000, 74000, 80000, 77000, 85000, 91000];
const MOCK_OCCUPANCY_MONTHLY = [62, 58, 70, 75, 72, 80, 78, 82, 85, 83, 88, 92];

const MOCK_UPCOMING = [
  { id: 'BK-2026-001', guest: 'สมชาย ใจดี', checkIn: '2026-04-01', checkOut: '2026-04-03', room: '101', type: 'Standard', status: 'ยืนยันแล้ว' },
  { id: 'BK-2026-002', guest: 'นภา รักดี', checkIn: '2026-04-02', checkOut: '2026-04-05', room: '205', type: 'Deluxe', status: 'รอยืนยัน' },
  { id: 'BK-2026-003', guest: 'ประยุทธ สุขใส', checkIn: '2026-04-03', checkOut: '2026-04-06', room: '301', type: 'Suite', status: 'ยืนยันแล้ว' },
  { id: 'BK-2026-004', guest: 'มาลี วงศ์ทอง', checkIn: '2026-04-04', checkOut: '2026-04-07', room: '102', type: 'Standard', status: 'ยืนยันแล้ว' },
  { id: 'BK-2026-005', guest: 'วิชัย พรมมา', checkIn: '2026-04-05', checkOut: '2026-04-08', room: '206', type: 'Deluxe', status: 'รอยืนยัน' },
];

interface Stats {
    rooms: { total: number; available: number; occupied: number; maintenance: number; disabled: number };
    occupancyRate: number;
    buildingCount: number;
    roomTypeCount: number;
    adminCount: number;
    property: { id: string; name: string };
}

export default function DashboardPage() {
    const router = useRouter();
    const [completedSteps, setCompletedSteps] = useState(0);
    const [taskDone, setTaskDone] = useState<boolean[]>([false, false, false, false]);
    const [showBanner, setShowBanner] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [propertyName, setPropertyName] = useState('');
    const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const propsRes = await fetch(`${API}/properties`, { credentials: 'include' });
                if (!propsRes.ok) { setShowBanner(false); return; }
                const props = await propsRes.json();
                const hasProperty = Array.isArray(props) && props.length > 0;
                if (!hasProperty) {
                    const skipped = typeof window !== 'undefined' && localStorage.getItem('hops_setup_skipped') === '1';
                    if (!skipped) { router.replace('/setup/welcome'); return; }
                    setTaskDone([false, false, false, false]);
                    setCompletedSteps(0);
                    setShowBanner(true);
                    return;
                }
                const propertyId = props[0].id;
                setPropertyName(props[0].name);
                const [bRes, rRes, ruRes, statsRes] = await Promise.all([
                    fetch(`${API}/properties/${propertyId}/buildings`, { credentials: 'include' }),
                    fetch(`${API}/properties/${propertyId}/rooms`, { credentials: 'include' }),
                    fetch(`${API}/properties/${propertyId}/room-units`, { credentials: 'include' }),
                    fetch(`${API}/properties/${propertyId}/stats`, { credentials: 'include' }),
                ]);
                const [buildings, rooms, roomUnits, statsData] = await Promise.all([
                    bRes.json(), rRes.json(), ruRes.json(), statsRes.json(),
                ]);
                const done = [
                    hasProperty,
                    Array.isArray(buildings) && buildings.length > 0,
                    Array.isArray(rooms) && rooms.length > 0,
                    Array.isArray(roomUnits) && roomUnits.length > 0,
                ];
                const completed = done.filter(Boolean).length;
                setTaskDone(done);
                setCompletedSteps(completed);
                setShowBanner(completed < 4);
                if (statsRes.ok) setStats(statsData);
            } catch {
                setShowBanner(false);
            }
        };
        fetchData();
    }, []);

    const progressPct = Math.round((completedSteps / 4) * 100);
    const totalRooms = stats?.rooms.total ?? 0;
    const setupDone = completedSteps >= 4;

    // Build chart data based on period
    const revenueData = MONTHS.map((m, i) => ({ name: m, value: MOCK_REVENUE_MONTHLY[i] }));
    const occupancyData = MONTHS.map((m, i) => ({ name: m, value: MOCK_OCCUPANCY_MONTHLY[i] }));

    return (
        <div className="p-4 md:p-8 pb-8 max-w-[1400px] mx-auto">
            {/* Top Warning Banner */}
            {showBanner && (
            <div className="bg-[#FFF4ED] border border-orange-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-orange-800 font-bold text-sm">การตั้งค่าโรงแรมของคุณยังไม่สมบูรณ์</h3>
                        <p className="text-orange-700 text-sm mt-0.5">ฟีเจอร์บางอย่างอาจใช้งานไม่ได้จนกว่าจะตั้งค่าเสร็จสิ้น ({progressPct}% เสร็จสิ้น)</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 shrink-0">
                    <Button onClick={() => router.push('/setup/wizard')} className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm border-0 focus:ring-orange-500 w-full sm:w-auto">
                        ดำเนินการตั้งค่าต่อ
                    </Button>
                    <button onClick={() => setShowBanner(false)} className="text-orange-400 hover:text-orange-600 transition-colors p-1">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                </div>
            </div>
            )}

            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">ภาพรวม Dashboard</h1>
                    <p className="text-sm text-gray-500">{propertyName ? `${propertyName} · ` : ''}ยินดีต้อนรับกลับ!</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()} className="text-gray-700 bg-white text-sm self-start sm:self-auto">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </Button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-gray-500">การจองทั้งหมด</p>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><CalendarDays className="w-5 h-5" /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">0</h3>
                    <p className="text-xs text-gray-400">ยังไม่มีระบบการจอง</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-gray-500">อัตราการเข้าพัก</p>
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><Building2 className="w-5 h-5" /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats ? `${stats.occupancyRate}%` : '—'}</h3>
                    <p className="text-xs text-gray-400">{stats ? `${stats.rooms.occupied} / ${stats.rooms.available + stats.rooms.occupied} ห้อง` : 'ยังไม่มีข้อมูล'}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-gray-500">รายได้เดือนนี้</p>
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><span className="text-lg font-bold">฿</span></div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">฿0</h3>
                    <p className="text-xs text-gray-400">ยังไม่มีระบบการจอง</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-gray-500">Admin ที่ใช้งาน</p>
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><Users className="w-5 h-5" /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats ? stats.adminCount : '—'}</h3>
                    <p className="text-xs text-gray-400">{stats ? `${stats.roomTypeCount} ประเภทห้อง · ${stats.buildingCount} อาคาร` : 'ยังไม่มีข้อมูล'}</p>
                </div>
            </div>

            {/* Middle Row: setup (if not done) + bookings + room status */}
            <div className={`grid grid-cols-1 ${setupDone ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6 mb-8`}>

                {/* Setup Progress — only shown when incomplete */}
                {!setupDone && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-primary-teal shrink-0">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">ตั้งค่าโรงแรมให้สมบูรณ์</h3>
                            <p className="text-sm text-gray-500">{completedSteps} จาก 4 ขั้นตอนเสร็จสิ้น</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                        <div className="bg-teal-500 h-3 rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
                    </div>
                    <div className="text-right text-xs text-gray-500 font-bold mb-6">{progressPct}%</div>
                    <div className="text-sm font-bold text-gray-900 mb-4">ขั้นตอนที่เหลือ:</div>
                    <div className="space-y-3 flex-1">
                        {SETUP_TASKS.map((task, i) => (
                            <div key={i} onClick={() => router.push('/setup/wizard')}
                                className={`border rounded-lg p-4 flex gap-3 transition-colors cursor-pointer group ${taskDone[i] ? 'border-teal-200 bg-teal-50/40' : 'border-gray-200 hover:border-teal-200'}`}>
                                {taskDone[i]
                                    ? <CheckCircle2 className="mt-0.5 w-4 h-4 text-teal-500 shrink-0" />
                                    : <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-primary-teal shrink-0"></div>
                                }
                                <div>
                                    <h4 className={`text-sm font-bold group-hover:text-primary-teal ${taskDone[i] ? 'text-teal-700 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{task.desc}</p>
                                    {!taskDone[i] && <span className="inline-block mt-2 text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">จำเป็น</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-gray-900">การจองล่าสุด</h3>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">เร็วๆ นี้</span>
                    </div>
                    <div className="flex flex-col flex-1 items-center justify-center text-center py-8">
                        <CalendarDays className="w-10 h-10 text-gray-200 mb-3" />
                        <p className="text-sm font-medium text-gray-400">ยังไม่มีข้อมูลการจอง</p>
                        <p className="text-xs text-gray-300 mt-1">ระบบการจองจะพร้อมใช้งานเร็วๆ นี้</p>
                    </div>
                </div>

                {/* Room Status */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-base font-bold text-gray-900">สถานะห้องพัก</h3>
                        <a href="#" className="text-sm font-medium text-primary-teal hover:text-teal-700 flex items-center gap-1">จัดการห้อง <ArrowRight className="w-4 h-4" /></a>
                    </div>
                    {stats && totalRooms > 0 ? (
                        <div className="space-y-6 flex-1">
                            {[
                                { label: 'ห้องว่าง', count: stats.rooms.available, color: 'bg-green-500', text: 'text-green-600' },
                                { label: 'ห้องไม่ว่าง', count: stats.rooms.occupied, color: 'bg-red-500', text: 'text-red-600' },
                                { label: 'กำลังซ่อมบำรุง', count: stats.rooms.maintenance, color: 'bg-orange-500', text: 'text-orange-500' },
                            ].map(({ label, count, color, text }) => (
                                <div key={label}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 font-medium">{label}</span>
                                        <span className={`text-xl font-bold ${text}`}>{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.round((count / totalRooms) * 100)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 items-center justify-center text-center py-8">
                            <Building2 className="w-10 h-10 text-gray-200 mb-3" />
                            <p className="text-sm font-medium text-gray-400">ยังไม่มีห้องพักในระบบ</p>
                            <p className="text-xs text-gray-300 mt-1">เพิ่มห้องพักผ่านการตั้งค่าโรงแรม</p>
                        </div>
                    )}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                        <h4 className="text-base font-bold text-gray-900">ห้องทั้งหมด</h4>
                        <span className="text-2xl font-bold text-gray-900">{totalRooms}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">แนวโน้มรายได้</h3>
                            <p className="text-xs text-gray-400 mt-0.5">ภาพรวมรายได้รายเดือน</p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {(['daily', 'monthly', 'yearly'] as const).map(p => (
                                <button key={p} onClick={() => setChartPeriod(p)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {p === 'daily' ? 'รายวัน' : p === 'monthly' ? 'รายเดือน' : 'รายปี'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-56 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2FA6A8" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#2FA6A8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, 'รายได้']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="value" stroke="#2FA6A8" strokeWidth={2} fill="url(#revGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy Trend */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">แนวโน้มอัตราเข้าพัก</h3>
                            <p className="text-xs text-gray-400 mt-0.5">อัตราการเข้าพักรายเดือน</p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {(['daily', 'monthly', 'yearly'] as const).map(p => (
                                <button key={p} onClick={() => setChartPeriod(p)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {p === 'daily' ? 'รายวัน' : p === 'monthly' ? 'รายเดือน' : 'รายปี'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-56 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={occupancyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={(v: number) => [`${v}%`, 'อัตราเข้าพัก']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                                <Bar dataKey="value" fill="#2FA6A8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Upcoming Reservations Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">การจองที่กำลังจะมาถึง</h3>
                        <p className="text-xs text-gray-400 mt-0.5">การเช็กอินและเช็กเอาต์ถัดไป</p>
                    </div>
                    <button className="text-sm font-medium text-primary-teal hover:text-teal-700 flex items-center gap-1">
                        ดูทั้งหมด <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                {['รหัสการจอง', 'ชื่อแขก', 'เช็กอิน', 'เช็กเอาต์', 'ห้อง', 'ประเภท', 'สถานะ'].map(h => (
                                    <th key={h} className="px-6 py-3 text-xs font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_UPCOMING.map((row, i) => (
                                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-700">{row.id}</td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">{row.guest}</td>
                                    <td className="px-6 py-4 text-gray-600">{row.checkIn}</td>
                                    <td className="px-6 py-4 text-gray-600">{row.checkOut}</td>
                                    <td className="px-6 py-4 text-gray-600">{row.room}</td>
                                    <td className="px-6 py-4 text-gray-600">{row.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${row.status === 'ยืนยันแล้ว' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'ยืนยันแล้ว' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
