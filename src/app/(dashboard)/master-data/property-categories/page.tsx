'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Hotel, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface PropertyCategory {
    id: string;
    name: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export default function PropertyCategoriesMasterPage() {
    const [categories, setCategories] = useState<PropertyCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<PropertyCategory | null>(null);

    const loadAll = () => {
        setLoading(true);
        fetch(`${API}/property-categories?includeInactive=true`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: PropertyCategory[]) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => setCategories([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadAll(); }, []);

    const filtered = useMemo(() => {
        if (!search) return categories;
        const q = search.toLowerCase();
        return categories.filter(c => c.name.toLowerCase().includes(q));
    }, [categories, search]);

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (c: PropertyCategory) => { setEditing(c); setModalOpen(true); };

    const handleDelete = async (c: PropertyCategory) => {
        if (!confirm(`ลบ "${c.name}" ใช่หรือไม่?`)) return;
        const res = await fetch(`${API}/property-categories/${c.id}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            alert(err?.message || 'ลบไม่สำเร็จ');
            return;
        }
        loadAll();
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ประเภทที่พัก</h1>
                    <p className="text-sm text-gray-500 mt-0.5">จัดการรายการประเภทที่พัก เช่น โรงแรม พูลวิลล่า โฮมสเตย์</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-primary-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> เพิ่มประเภท
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ค้นหาจากชื่อประเภท..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <Hotel className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium text-gray-400">{categories.length === 0 ? 'ยังไม่มีรายการ' : 'ไม่พบรายการที่ค้นหา'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ชื่อประเภท</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">สถานะ</th>
                                <th className="px-4 py-3.5 w-24"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-teal-50 text-primary-teal flex items-center justify-center shrink-0">
                                                <Hotel className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-gray-900">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {c.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(c)}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <CategoryModal
                    category={editing}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => { setModalOpen(false); loadAll(); }}
                />
            )}
        </div>
    );
}

function CategoryModal({
    category,
    onClose,
    onSaved,
}: {
    category: PropertyCategory | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(category?.name ?? '');
    const [isActive, setIsActive] = useState(category?.isActive ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!name.trim()) { setError('กรอกชื่อประเภทที่พัก'); return; }
        setSaving(true);
        setError(null);
        const payload = { name: name.trim(), isActive };
        const url = category ? `${API}/property-categories/${category.id}` : `${API}/property-categories`;
        const method = category ? 'PATCH' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                setError(err?.message || 'บันทึกไม่สำเร็จ');
                setSaving(false);
                return;
            }
            onSaved();
        } catch {
            setError('เกิดข้อผิดพลาด');
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-lg">
                        {category ? 'แก้ไขประเภทที่พัก' : 'เพิ่มประเภทที่พัก'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อประเภท</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="เช่น โรงแรม, พูลวิลล่า, โฮมสเตย์"
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                                className="accent-primary-teal"
                            />
                            <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                        </label>
                    </div>

                    {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-teal text-white hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </div>
    );
}
