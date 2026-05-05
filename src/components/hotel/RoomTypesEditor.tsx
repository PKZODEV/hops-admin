'use client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { BedDouble, Users, Plus, X, Archive } from 'lucide-react';

export const ROOM_TYPE_PRESETS = ['Standard', 'Superior', 'Deluxe', 'Junior Suite', 'Suite', 'Family Room', 'Twin Room', 'Double Room'];
export const BED_TYPE_PRESETS = ['Single Bed', 'Twin Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Super King Bed', 'Bunk Bed', 'Sofa Bed'];

export interface RoomTypeFormItem {
  id?: string;
  rateId?: string;
  name: string;
  price: string;
  maxGuests: string;
  description: string;
  bedType: string;
  images: string[];
  useCustomName: boolean;
  useCustomBedType: boolean;
  roomCount: string;
  isActive: boolean;
  /** count of existing RoomUnits referencing this type — informational only */
  unitCount?: number;
}

export function emptyRoomType(): RoomTypeFormItem {
  return {
    name: '',
    price: '',
    maxGuests: '2',
    description: '',
    bedType: '',
    images: [],
    useCustomName: false,
    useCustomBedType: false,
    roomCount: '1',
    isActive: true,
  };
}

interface Props {
  value: RoomTypeFormItem[];
  onChange: (next: RoomTypeFormItem[]) => void;
  /** Whether to show "จำนวนห้อง" input. true in create flow, false in edit flow (room units จัดการแยก) */
  showRoomCount?: boolean;
}

const selectCls =
  'w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal focus:bg-white';

export function RoomTypesEditor({ value, onChange, showRoomCount = true }: Props) {
  const update = (i: number, patch: Partial<RoomTypeFormItem>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const remove = (i: number) => {
    const item = value[i];
    if (item.id) {
      /* Persisted rows are soft-deleted by flagging them inactive; the
         entry stays in the list so the save pipeline can PATCH it. */
      update(i, { isActive: false });
    } else {
      onChange(value.filter((_, idx) => idx !== i));
    }
  };

  const restore = (i: number) => update(i, { isActive: true });

  const add = () => onChange([...value, emptyRoomType()]);

  return (
    <div className="space-y-4">
      {value.map((rt, i) => {
        const disabled = rt.id && !rt.isActive;
        return (
          <Card key={rt.id ?? `new-${i}`} padding="lg" className={`flex gap-5 ${disabled ? 'opacity-60' : ''}`}>
            <div className="w-11 h-11 bg-[#e0f2fe] text-[#0284c7] rounded-xl flex items-center justify-center shrink-0">
              <BedDouble className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {rt.name || `ประเภทห้องพัก ${i + 1}`}
                  </h3>
                  {rt.id && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">มีอยู่แล้ว</span>
                  )}
                  {disabled && (
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full shrink-0">ถูกเก็บเข้าคลัง</span>
                  )}
                </div>
                {disabled ? (
                  <button type="button" onClick={() => restore(i)} className="text-xs font-medium text-primary-teal hover:text-teal-700 shrink-0">
                    นำกลับมาใช้
                  </button>
                ) : (
                  <button type="button" onClick={() => remove(i)} className="text-red-500 text-xs font-medium flex items-center gap-1 hover:text-red-700 shrink-0">
                    {rt.id ? <><Archive className="w-3.5 h-3.5" /> เก็บเข้าคลัง</> : <><X className="w-3.5 h-3.5" /> ลบ</>}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">ชื่อประเภทห้อง <span className="text-red-500">*</span></label>
                <select
                  className={selectCls}
                  disabled={!!disabled}
                  value={rt.useCustomName ? 'custom' : rt.name}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      update(i, { useCustomName: true, name: '' });
                    } else {
                      update(i, { useCustomName: false, name: e.target.value });
                    }
                  }}
                >
                  <option value="">เลือกประเภทห้อง</option>
                  {ROOM_TYPE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="custom">กำหนดชื่อเอง...</option>
                </select>
                {rt.useCustomName && (
                  <Input
                    className="mt-2"
                    disabled={!!disabled}
                    value={rt.name}
                    onChange={e => update(i, { name: e.target.value })}
                    placeholder="เช่น Honeymoon Suite, Garden View"
                  />
                )}
              </div>

              <div className={`grid grid-cols-1 ${showRoomCount ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">ราคาต่อคืน (บาท) <span className="text-red-500">*</span></label>
                  <Input
                    type="number" min="0"
                    disabled={!!disabled}
                    value={rt.price}
                    onChange={e => update(i, { price: e.target.value })}
                    icon={<span className="text-sm font-medium">฿</span>}
                  />
                  {rt.id && (
                    <p className="text-[10px] text-gray-400 mt-1">อัปเดตราคาจะสร้างเรทใหม่เป็นเรทปัจจุบัน</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">ผู้เข้าพักสูงสุด <span className="text-red-500">*</span></label>
                  <Input
                    type="number" min="1"
                    disabled={!!disabled}
                    value={rt.maxGuests}
                    onChange={e => update(i, { maxGuests: e.target.value })}
                    icon={<Users className="w-4 h-4" />}
                  />
                </div>
                {showRoomCount && (
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1">จำนวนห้อง <span className="text-red-500">*</span></label>
                    <Input
                      type="number" min="1"
                      disabled={!!disabled}
                      value={rt.roomCount}
                      onChange={e => update(i, { roomCount: e.target.value })}
                      icon={<BedDouble className="w-4 h-4" />}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">ระบบจะสร้างห้องหมายเลข {rt.name || 'xxx'}1, {rt.name || 'xxx'}2…</p>
                  </div>
                )}
                {!showRoomCount && rt.id && typeof rt.unitCount === 'number' && (
                  <div className="flex items-end">
                    <div className="bg-teal-50 border border-teal-100 text-teal-700 rounded-lg px-3 py-2.5 text-xs w-full">
                      มีห้อง {rt.unitCount} ห้องที่ใช้ประเภทนี้อยู่
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">ประเภทเตียง</label>
                <select
                  className={selectCls}
                  disabled={!!disabled}
                  value={rt.useCustomBedType ? 'custom' : rt.bedType}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      update(i, { useCustomBedType: true, bedType: '' });
                    } else {
                      update(i, { useCustomBedType: false, bedType: e.target.value });
                    }
                  }}
                >
                  <option value="">เลือกประเภทเตียง</option>
                  {BED_TYPE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="custom">กำหนดชื่อเอง...</option>
                </select>
                {rt.useCustomBedType && (
                  <Input
                    className="mt-2"
                    disabled={!!disabled}
                    value={rt.bedType}
                    onChange={e => update(i, { bedType: e.target.value })}
                    placeholder="เช่น เตียงน้ำ, Day Bed"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">คำอธิบาย (ไม่บังคับ)</label>
                <textarea
                  disabled={!!disabled}
                  value={rt.description}
                  onChange={e => update(i, { description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal focus:bg-white min-h-[70px]"
                  placeholder="เช่น ห้องพักหรูพร้อมวิวทะเล พื้นที่ 45 ตร.ม."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">รูปภาพประเภทห้อง</label>
                <ImageUploader
                  value={rt.images}
                  onChange={urls => update(i, { images: urls })}
                  maxImages={5}
                />
              </div>
            </div>
          </Card>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-primary-teal text-primary-teal rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors bg-transparent font-medium"
      >
        <Plus className="w-5 h-5" /> เพิ่มประเภทห้องพัก
      </button>
    </div>
  );
}

export function validateRoomTypes(rts: RoomTypeFormItem[], { requireRoomCount = true } = {}): string | null {
  for (const rt of rts) {
    if (rt.id && !rt.isActive) continue;
    if (!rt.name.trim()) return 'กรุณากรอกชื่อประเภทห้องให้ครบ';
    if (!rt.price || isNaN(parseFloat(rt.price)) || parseFloat(rt.price) <= 0) return 'กรุณากรอกราคาต่อคืนให้ถูกต้อง';
    if (!rt.maxGuests || isNaN(parseInt(rt.maxGuests)) || parseInt(rt.maxGuests) <= 0) return 'กรุณากรอกจำนวนผู้เข้าพักให้ถูกต้อง';
    if (requireRoomCount) {
      if (!rt.roomCount || isNaN(parseInt(rt.roomCount)) || parseInt(rt.roomCount) <= 0) return 'กรุณากรอกจำนวนห้องให้ถูกต้อง';
    }
  }
  return null;
}
