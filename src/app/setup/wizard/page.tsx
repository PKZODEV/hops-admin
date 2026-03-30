'use client';
import React, { useState } from 'react';
import { Stepper } from '@/components/onboarding/Stepper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AmenitiesSelector } from '@/components/onboarding/AmenitiesSelector';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { api } from '@/lib/api';
import { Lightbulb, Plus, Save, Building2, BedDouble, Users, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FloorForm { number: string }
interface BuildingForm { name: string; floors: FloorForm[] }
interface RoomTypeForm { name: string; price: string; maxGuests: string; description: string; bedType: string; images: string[]; useCustomName: boolean }
interface RoomUnitForm { number: string; buildingId: string; floorId: string; roomTypeId: string; amenities: string[]; images: string[] }
interface CreatedFloor { id: string; number: string }
interface CreatedBuilding { id: string; name: string; floors: CreatedFloor[] }
interface CreatedRoomType { id: string; name: string }
interface CreatedRoomUnit { id: string; number: string; floorId: string; roomTypeId: string }

const ROOM_TYPE_PRESETS = ['Standard', 'Superior', 'Deluxe', 'Junior Suite', 'Suite', 'Family Room', 'Twin Room', 'Double Room'];

const ROOM_UNIT_AMENITIES = [
  { id: 'bathtub', label: 'อ่างอาบน้ำ' },
  { id: 'wifi', label: 'Wi-Fi ฟรี' },
  { id: 'tv', label: 'ทีวี' },
  { id: 'minibar', label: 'มินิบาร์' },
  { id: 'ac', label: 'เครื่องปรับอากาศ' },
  { id: 'balcony', label: 'ระเบียง' },
];

const STEP_TITLES = [
  'ตั้งค่าข้อมูลโรงแรม',
  'ตั้งค่าอาคารและชั้น',
  'ตั้งค่าประเภทห้องพักและราคา',
  'สร้างห้องพัก',
  'สรุปห้องพักที่สร้าง',
];

const STEP_SUBTITLES = [
  'กรอกข้อมูลพื้นฐานของโรงแรมเพื่อเริ่มต้นใช้งาน',
  'กำหนดจำนวนอาคารและชั้นของโรงแรม',
  'กำหนดประเภทห้องพักและราคาพื้นฐานต่อคืน',
  'ระบุหมายเลขห้องพักแต่ละห้อง',
  'ภาพรวมห้องพักที่สร้างสำเร็จทั้งหมด',
];

export default function WizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hotelName, setHotelName] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [hotelImages, setHotelImages] = useState<string[]>([]);

  const [buildingForms, setBuildingForms] = useState<BuildingForm[]>([
    { name: 'Building A', floors: [{ number: '1' }] },
  ]);

  const [roomTypeForms, setRoomTypeForms] = useState<RoomTypeForm[]>([
    { name: 'Standard', price: '1500', maxGuests: '2', description: '', bedType: '', images: [], useCustomName: false },
  ]);

  const [roomUnitForms, setRoomUnitForms] = useState<RoomUnitForm[]>([
    { number: '', buildingId: '', floorId: '', roomTypeId: '', amenities: [], images: [] },
  ]);

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [createdBuildings, setCreatedBuildings] = useState<CreatedBuilding[]>([]);
  const [createdRoomTypes, setCreatedRoomTypes] = useState<CreatedRoomType[]>([]);
  const [createdRoomUnits, setCreatedRoomUnits] = useState<CreatedRoomUnit[]>([]);

  // On mount: load existing data and resume at first incomplete step
  React.useEffect(() => {
    const init = async () => {
      try {
        const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
        const propRes = await fetch(`${BASE}/properties`, { credentials: 'include' });
        if (!propRes.ok) { setInitializing(false); return; }
        const props = await propRes.json();
        if (!Array.isArray(props) || props.length === 0) { setInitializing(false); return; }

        const prop = props[0];
        setPropertyId(prop.id);
        setHotelName(prop.name ?? '');
        if (typeof window !== 'undefined') localStorage.setItem('hops_property_id', prop.id);

        const [bRes, rRes, ruRes] = await Promise.all([
          fetch(`${BASE}/properties/${prop.id}/buildings`, { credentials: 'include' }),
          fetch(`${BASE}/properties/${prop.id}/rooms`, { credentials: 'include' }),
          fetch(`${BASE}/properties/${prop.id}/room-units`, { credentials: 'include' }),
        ]);
        const [buildings, rooms, roomUnits] = await Promise.all([bRes.json(), rRes.json(), ruRes.json()]);

        const hasBuildings = Array.isArray(buildings) && buildings.length > 0;
        const hasRoomTypes = Array.isArray(rooms) && rooms.length > 0;
        const hasRoomUnits = Array.isArray(roomUnits) && roomUnits.length > 0;

        if (hasBuildings) {
          setCreatedBuildings(buildings.map((b: { id: string; name: string; floors?: { id: string; number: string }[] }) => ({
            id: b.id, name: b.name,
            floors: Array.isArray(b.floors) ? b.floors.map((f) => ({ id: f.id, number: f.number })) : [],
          })));
        }
        if (hasRoomTypes) {
          setCreatedRoomTypes(rooms.map((rt: { id: string; name: string }) => ({ id: rt.id, name: rt.name })));
        }

        // Resume at first incomplete step
        if (!hasBuildings) setCurrentStep(1);
        else if (!hasRoomTypes) setCurrentStep(2);
        else if (!hasRoomUnits) setCurrentStep(3);
        else setCurrentStep(4);
      } catch {
        // Start from step 0 on any error
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const validate = (): string | null => {
    if (currentStep === 0 && !hotelName.trim()) return 'กรุณากรอกชื่อโรงแรม';
    if (currentStep === 1) {
      for (const b of buildingForms) {
        if (!b.name.trim()) return 'กรุณากรอกชื่ออาคารให้ครบ';
        for (const f of b.floors) {
          if (!f.number.trim()) return 'กรุณากรอกหมายเลขชั้นให้ครบ';
        }
      }
    }
    if (currentStep === 2) {
      for (const rt of roomTypeForms) {
        if (!rt.name.trim()) return 'กรุณากรอกชื่อประเภทห้องให้ครบ';
        if (!rt.price || isNaN(parseFloat(rt.price)) || parseFloat(rt.price) <= 0) return 'กรุณากรอกราคาต่อคืนให้ถูกต้อง';
        if (!rt.maxGuests || isNaN(parseInt(rt.maxGuests)) || parseInt(rt.maxGuests) <= 0) return 'กรุณากรอกจำนวนผู้เข้าพักให้ถูกต้อง';
      }
    }
    if (currentStep === 3) {
      for (const ru of roomUnitForms) {
        if (!ru.number.trim()) return 'กรุณากรอกหมายเลขห้องให้ครบ';
        if (!ru.floorId) return 'กรุณาเลือกชั้นสำหรับทุกห้อง';
        if (!ru.roomTypeId) return 'กรุณาเลือกประเภทห้องสำหรับทุกห้อง';
      }
    }
    return null;
  };

  const handleNext = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (currentStep === 4) { 
      if (typeof window !== 'undefined') localStorage.removeItem('hops_setup_skipped');
      router.push('/'); 
      return; 
    }
    setLoading(true);
    try {
      if (currentStep === 0) {
        if (!propertyId) {
          const extra = customAmenity.split(',').map((s: string) => s.trim()).filter(Boolean);
          const property = await api.post<{ id: string }>('/properties', {
            name: hotelName.trim(), type: 'HOTEL', amenities: [...selectedAmenities, ...extra], images: hotelImages,
          });
          setPropertyId(property.id);
          if (typeof window !== 'undefined') localStorage.setItem('hops_property_id', property.id);
        }
      } else if (currentStep === 1) {
        if (createdBuildings.length === 0) {
          const created: CreatedBuilding[] = [];
          for (const bForm of buildingForms) {
            const building = await api.post<{ id: string; name: string }>('/buildings', { name: bForm.name.trim(), propertyId: propertyId! });
            const floors: CreatedFloor[] = [];
            for (const fForm of bForm.floors) {
              const floor = await api.post<{ id: string; number: string }>('/floors', { number: fForm.number.trim(), buildingId: building.id });
              floors.push({ id: floor.id, number: floor.number });
            }
            created.push({ id: building.id, name: building.name, floors });
          }
          setCreatedBuildings(created);
        }
      } else if (currentStep === 2) {
        if (createdRoomTypes.length === 0) {
          const createdTypes: CreatedRoomType[] = [];
          for (const rtForm of roomTypeForms) {
            const roomType = await api.post<{ id: string; name: string }>('/rooms', {
              name: rtForm.name.trim(), maxGuests: parseInt(rtForm.maxGuests),
              ...(rtForm.description ? { description: rtForm.description } : {}),
              ...(rtForm.bedType ? { bedType: rtForm.bedType } : {}),
              images: rtForm.images,
              propertyId: propertyId!,
            });
            await api.post('/rates', { name: 'ราคาพื้นฐาน', price: parseFloat(rtForm.price), roomTypeId: roomType.id });
            createdTypes.push({ id: roomType.id, name: roomType.name });
          }
          setCreatedRoomTypes(createdTypes);
        }
      } else if (currentStep === 3) {
        const createdUnits: CreatedRoomUnit[] = [];
        for (const ruForm of roomUnitForms) {
          const unit = await api.post<{ id: string; number: string; floorId: string; roomTypeId: string }>('/room-units', {
            number: ruForm.number.trim(), floorId: ruForm.floorId, roomTypeId: ruForm.roomTypeId, amenities: ruForm.amenities, images: ruForm.images,
          });
          createdUnits.push({ id: unit.id, number: unit.number, floorId: ruForm.floorId, roomTypeId: ruForm.roomTypeId });
        }
        setCreatedRoomUnits(createdUnits);
      }
      setCurrentStep((prev: number) => prev + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) { setCurrentStep((prev: number) => prev - 1); setError(null); }
  };

  const addBuilding = () => setBuildingForms((prev: BuildingForm[]) => [...prev, { name: `Building ${String.fromCharCode(65 + prev.length)}`, floors: [{ number: '1' }] }]);
  const removeBuilding = (bi: number) => setBuildingForms((prev: BuildingForm[]) => prev.filter((_: BuildingForm, i: number) => i !== bi));
  const updateBuildingName = (bi: number, name: string) => setBuildingForms((prev: BuildingForm[]) => prev.map((b: BuildingForm, i: number) => i === bi ? { ...b, name } : b));
  const addFloor = (bi: number) => setBuildingForms((prev: BuildingForm[]) => prev.map((b: BuildingForm, i: number) => i === bi ? { ...b, floors: [...b.floors, { number: String(b.floors.length + 1) }] } : b));
  const removeFloor = (bi: number, fi: number) => setBuildingForms((prev: BuildingForm[]) => prev.map((b: BuildingForm, i: number) => i === bi ? { ...b, floors: b.floors.filter((_: FloorForm, j: number) => j !== fi) } : b));
  const updateFloorNumber = (bi: number, fi: number, number: string) => setBuildingForms((prev: BuildingForm[]) => prev.map((b: BuildingForm, i: number) => i === bi ? { ...b, floors: b.floors.map((f: FloorForm, j: number) => j === fi ? { number } : f) } : b));

  const addRoomType = () => setRoomTypeForms((prev: RoomTypeForm[]) => [...prev, { name: 'Standard', price: '1500', maxGuests: '2', description: '', bedType: '', images: [], useCustomName: false }]);
  const removeRoomType = (i: number) => setRoomTypeForms((prev: RoomTypeForm[]) => prev.filter((_: RoomTypeForm, idx: number) => idx !== i));
  const updateRoomType = (i: number, field: keyof RoomTypeForm, value: string) => setRoomTypeForms((prev: RoomTypeForm[]) => prev.map((rt: RoomTypeForm, idx: number) => idx === i ? { ...rt, [field]: value } : rt));

  const addRoomUnit = () => setRoomUnitForms((prev: RoomUnitForm[]) => [...prev, { number: '', buildingId: '', floorId: '', roomTypeId: '', amenities: [], images: [] }]);
  const removeRoomUnit = (i: number) => setRoomUnitForms((prev: RoomUnitForm[]) => prev.filter((_: RoomUnitForm, idx: number) => idx !== i));
  const updateRoomUnit = (i: number, field: keyof RoomUnitForm, value: string | string[]) => setRoomUnitForms((prev: RoomUnitForm[]) => prev.map((ru: RoomUnitForm, idx: number) => idx === i ? { ...ru, [field]: value } : ru));
  const selectBuilding = (i: number, buildingId: string) => setRoomUnitForms((prev: RoomUnitForm[]) => prev.map((ru: RoomUnitForm, idx: number) => idx === i ? { ...ru, buildingId, floorId: '' } : ru));
  const toggleRoomUnitAmenity = (i: number, id: string) => {
    const ru = roomUnitForms[i];
    const next = ru.amenities.includes(id) ? ru.amenities.filter((a: string) => a !== id) : [...ru.amenities, id];
    updateRoomUnit(i, 'amenities', next);
  };
  const getFloorsForBuilding = (buildingId: string) => createdBuildings.find((b: CreatedBuilding) => b.id === buildingId)?.floors ?? [];
  const getFloorMeta = (floorId: string) => {
    for (const b of createdBuildings) {
      const f = b.floors.find((fl: CreatedFloor) => fl.id === floorId);
      if (f) return { building: b.name, floor: f.number };
    }
    return { building: '-', floor: '-' };
  };

  const selectCls = 'w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal focus:bg-white';

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-gray-500 text-sm animate-pulse">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f8fafc] min-h-screen relative">
      {/* Desktop sidebar — sticky, always visible while scrolling */}
      <div className="hidden md:block self-start sticky top-0">
        <Stepper currentStep={currentStep} />
      </div>
      <main className="flex-1 max-w-4xl mx-auto p-4 md:p-8 w-full">
        {/* Mobile step indicator */}
        <div className="md:hidden flex items-center gap-3 mb-4 bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary-teal text-white flex items-center justify-center text-sm font-bold shrink-0">
            {currentStep + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500">ขั้นตอน {currentStep + 1} / 5</div>
            <div className="font-bold text-sm text-gray-900 truncate">{STEP_TITLES[currentStep]}</div>
          </div>
          <button onClick={() => router.push('/')} className="text-xs font-medium text-gray-400 hover:text-gray-700 shrink-0">ข้าม</button>
        </div>

        <div className="hidden md:flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{STEP_TITLES[currentStep]}</h1>
          <button onClick={() => router.push('/')} className="text-sm font-medium text-gray-500 hover:text-gray-900">ข้ามไปก่อน</button>
        </div>
        <p className="hidden md:block text-gray-500 mb-8">{STEP_SUBTITLES[currentStep]}</p>
        <h1 className="md:hidden text-xl font-bold text-gray-900 mb-1">{STEP_TITLES[currentStep]}</h1>
        <p className="md:hidden text-sm text-gray-500 mb-4">{STEP_SUBTITLES[currentStep]}</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {currentStep === 0 && (
          <div className="space-y-8 pb-20">
            <Card padding="lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">ชื่อโรงแรม <span className="text-red-500">*</span></h3>
              <Input placeholder="เช่น โรงแรมริเวอร์วิว แกรนด์" className="max-w-xl" value={hotelName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHotelName(e.target.value)} />
              <p className="text-xs text-gray-400 mt-2">ชื่อนี้จะแสดงในเอกสารและหน้าจอทั้งหมด</p>
            </Card>
            <Card padding="lg">
              <h3 className="text-lg font-bold text-gray-900 mb-1">สิ่งอำนวยความสะดวก</h3>
              <p className="text-sm text-gray-500 mb-6">เลือกสิ่งอำนวยความสะดวกที่โรงแรมของคุณมี</p>
              <AmenitiesSelector selected={selectedAmenities} onChange={setSelectedAmenities} />
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-2">เพิ่มสิ่งอำนวยความสะดวกอื่นๆ</h4>
                <Input placeholder="เช่น ร้านอาหาร, ซักรีด, สปา (คั่นด้วยจุลภาค)" className="max-w-xl" value={customAmenity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomAmenity(e.target.value)} />
              </div>
            </Card>
            <Card padding="lg">
              <h3 className="text-lg font-bold text-gray-900 mb-1">รูปภาพโรงแรม</h3>
              <p className="text-sm text-gray-500 mb-4">เพิ่มรูปภาพแสดงบรรยากาศโรงแรม เช่น ล็อบบี้ สระว่ายน้ำ หรือพื้นที่ส่วนกลาง (ไม่บังคับ)</p>
              <ImageUploader value={hotelImages} onChange={setHotelImages} maxImages={5} />
            </Card>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6 pb-20">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
              <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p><span className="font-bold mr-1">เคล็ดลับ:</span>หากโรงแรมของคุณมีเพียง 1 อาคาร คุณสามารถตั้งชื่อว่า &quot;อาคารหลัก&quot;</p>
            </div>
            {buildingForms.map((building: BuildingForm, bi: number) => (
              <Card key={bi} padding="lg" className="flex gap-6">
                <div className="w-12 h-12 bg-[#e0f2fe] text-[#0284c7] rounded-xl flex items-center justify-center shrink-0"><Building2 className="w-6 h-6" /></div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900">อาคาร {bi + 1} <span className="text-red-500">*</span></label>
                    {buildingForms.length > 1 && (
                      <button onClick={() => removeBuilding(bi)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"><X className="w-4 h-4" /> ลบอาคาร</button>
                    )}
                  </div>
                  <Input value={building.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBuildingName(bi, e.target.value)} placeholder="เช่น Building A, อาคารหลัก" />
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">ชั้น <span className="text-red-500">*</span></label>
                    {building.floors.map((floor: FloorForm, fi: number) => (
                      <div key={fi} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-16 shrink-0">ชั้น {fi + 1}</span>
                        <Input value={floor.number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFloorNumber(bi, fi, e.target.value)} className="w-32" placeholder="1, 2, B1" />
                        {building.floors.length > 1 && (
                          <button onClick={() => removeFloor(bi, fi)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="text-gray-600 border border-gray-200 gap-2 h-10 bg-white hover:bg-gray-50" onClick={() => addFloor(bi)}>
                    <Plus className="w-4 h-4" /> เพิ่มชั้น
                  </Button>
                </div>
              </Card>
            ))}
            <button onClick={addBuilding} className="w-full border-2 border-dashed border-primary-teal text-primary-teal rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors bg-transparent font-medium">
              <Plus className="w-5 h-5" /> เพิ่มอาคาร
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 pb-20">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
              <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p><span className="font-bold mr-1">เคล็ดลับ:</span>ราคาที่ตั้งไว้ที่นี้เป็นราคาพื้นฐาน คุณสามารถปรับราคาได้ภายหลัง</p>
            </div>
            {roomTypeForms.map((rt: RoomTypeForm, i: number) => (
              <Card key={i} padding="lg" className="flex gap-6">
                <div className="w-12 h-12 bg-[#e0f2fe] text-[#0284c7] rounded-xl flex items-center justify-center shrink-0"><BedDouble className="w-6 h-6" /></div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900">ประเภทห้องพัก {i + 1}</h3>
                    {roomTypeForms.length > 1 && (
                      <button onClick={() => removeRoomType(i)} className="text-red-500 text-sm font-medium flex items-center gap-1 hover:text-red-700"><X className="w-4 h-4" /> ลบ</button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">ชื่อประเภทห้อง <span className="text-red-500">*</span></label>
                    <select
                      className={selectCls}
                      value={rt.useCustomName ? 'custom' : rt.name}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setRoomTypeForms(prev => prev.map((r, idx) => idx === i ? { ...r, useCustomName: true, name: '' } : r));
                        } else {
                          setRoomTypeForms(prev => prev.map((r, idx) => idx === i ? { ...r, useCustomName: false, name: e.target.value } : r));
                        }
                      }}
                    >
                      <option value="">เลือกประเภทห้อง</option>
                      {ROOM_TYPE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="custom">กำหนดชื่อเอง...</option>
                    </select>
                    {rt.useCustomName && (
                      <Input className="mt-2" value={rt.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoomType(i, 'name', e.target.value)} placeholder="กรอกชื่อประเภทห้องพัก" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">ราคาต่อคืน (บาท) <span className="text-red-500">*</span></label>
                      <Input value={rt.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoomType(i, 'price', e.target.value)} icon={<span className="text-sm font-medium">฿</span>} type="number" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">จำนวนผู้เข้าพักสูงสุด <span className="text-red-500">*</span></label>
                      <Input value={rt.maxGuests} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoomType(i, 'maxGuests', e.target.value)} icon={<Users className="w-4 h-4" />} type="number" min="1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">ประเภทเตียง</label>
                    <Input value={rt.bedType} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoomType(i, 'bedType', e.target.value)} placeholder="เช่น King Bed, Queen Bed, Twin Bed" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">คำอธิบาย (ไม่บังคับ)</label>
                    <textarea value={rt.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateRoomType(i, 'description', e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-teal focus:border-primary-teal focus:bg-white min-h-[80px]" placeholder="เช่น ห้องพักหรูพร้อมวิวทะเล พื้นที่ 45 ตร.ม." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">รูปภาพประเภทห้อง</label>
                    <ImageUploader
                      value={rt.images}
                      onChange={(urls) => setRoomTypeForms(prev => prev.map((r, idx) => idx === i ? { ...r, images: urls } : r))}
                      maxImages={5}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <button onClick={addRoomType} className="w-full border-2 border-dashed border-primary-teal text-primary-teal rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors bg-transparent font-medium">
              <Plus className="w-5 h-5" /> เพิ่มประเภทห้องพัก
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 pb-20">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
              <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p><span className="font-bold mr-1">เคล็ดลับ:</span>เพิ่มห้องพักทีละห้อง กำหนดหมายเลขห้อง เลือกอาคาร ชั้น และประเภทห้อง</p>
            </div>
            {roomUnitForms.map((ru: RoomUnitForm, i: number) => (
              <Card key={i} padding="lg" className="flex gap-6">
                <div className="w-12 h-12 bg-[#e0f2fe] text-[#0284c7] rounded-xl flex items-center justify-center shrink-0"><BedDouble className="w-6 h-6" /></div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900">ห้องพัก {i + 1}</h3>
                    {roomUnitForms.length > 1 && (
                      <button onClick={() => removeRoomUnit(i)} className="text-red-500 text-sm font-medium flex items-center gap-1 hover:text-red-700"><X className="w-4 h-4" /> ลบ</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">อาคาร <span className="text-red-500">*</span></label>
                      <select className={selectCls} value={ru.buildingId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => selectBuilding(i, e.target.value)}>
                        <option value="">เลือกอาคาร</option>
                        {createdBuildings.map((b: CreatedBuilding) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">ชั้น <span className="text-red-500">*</span></label>
                      <select className={selectCls + (!ru.buildingId ? ' opacity-50 cursor-not-allowed' : '')} value={ru.floorId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateRoomUnit(i, 'floorId', e.target.value)} disabled={!ru.buildingId}>
                        <option value="">เลือกชั้น</option>
                        {getFloorsForBuilding(ru.buildingId).map((f: CreatedFloor) => <option key={f.id} value={f.id}>ชั้น {f.number}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">หมายเลขห้อง <span className="text-red-500">*</span></label>
                      <Input placeholder="เช่น 101, 201A" value={ru.number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRoomUnit(i, 'number', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">ประเภทห้อง <span className="text-red-500">*</span></label>
                      <select className={selectCls} value={ru.roomTypeId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateRoomUnit(i, 'roomTypeId', e.target.value)}>
                        <option value="">เลือกประเภทห้อง</option>
                        {createdRoomTypes.map((rt: CreatedRoomType) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">สิ่งอำนวยความสะดวกในห้อง</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ROOM_UNIT_AMENITIES.map((a: { id: string; label: string }) => (
                        <label key={a.id} className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${ru.amenities.includes(a.id) ? 'border-primary-teal bg-teal-50 text-primary-teal' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          <input type="checkbox" checked={ru.amenities.includes(a.id)} onChange={() => toggleRoomUnitAmenity(i, a.id)} className="accent-teal-500" />
                          {a.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">รูปภาพห้องพัก</label>
                    <ImageUploader
                      value={ru.images}
                      onChange={(urls) => setRoomUnitForms(prev => prev.map((r, idx) => idx === i ? { ...r, images: urls } : r))}
                      maxImages={5}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <button onClick={addRoomUnit} className="w-full border-2 border-dashed border-primary-teal text-primary-teal rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors bg-transparent font-medium">
              <Plus className="w-5 h-5" /> เพิ่มห้องพัก
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 pb-20">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 text-sm text-green-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p><span className="font-bold mr-1">สำเร็จ!</span>ระบบได้บันทึกข้อมูลโรงแรมและห้องพักทั้งหมดแล้ว</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Card padding="md"><div className="text-sm text-gray-500 mb-1">ห้องพักทั้งหมด</div><div className="text-xl md:text-2xl font-bold text-gray-900">{createdRoomUnits.length}</div></Card>
              <Card padding="md"><div className="text-sm text-gray-500 mb-1">ประเภทห้อง</div><div className="text-xl md:text-2xl font-bold text-gray-900">{createdRoomTypes.length}</div></Card>
              <Card padding="md"><div className="text-sm text-gray-500 mb-1">อาคาร</div><div className="text-xl md:text-2xl font-bold text-gray-900">{createdBuildings.length}</div></Card>
            </div>
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-bold">หมายเลขห้อง</th>
                    <th className="px-6 py-4 font-bold">อาคาร</th>
                    <th className="px-6 py-4 font-bold">ชั้น</th>
                    <th className="px-6 py-4 font-bold">ประเภทห้อง</th>
                    <th className="px-6 py-4 font-bold">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {createdRoomUnits.map((unit: CreatedRoomUnit) => {
                    const loc = getFloorMeta(unit.floorId);
                    const typeName = createdRoomTypes.find((rt: CreatedRoomType) => rt.id === unit.roomTypeId)?.name ?? '-';
                    return (
                      <tr key={unit.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <span className="flex items-center gap-2"><BedDouble className="w-4 h-4 text-gray-400" />{unit.number}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{loc.building}</td>
                        <td className="px-6 py-4 text-gray-600">{loc.floor}</td>
                        <td className="px-6 py-4 text-gray-600">{typeName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />ว่าง
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-white border-t border-border-light px-4 md:px-8 h-[72px] flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2 md:gap-4">
          <Button variant="outline" className="gap-2 bg-white text-gray-700 px-3 md:px-6 whitespace-nowrap text-sm" onClick={() => router.push('/')} disabled={loading}>
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">บันทึกและออก</span><span className="sm:hidden">บันทึก</span>
          </Button>
          {currentStep > 0 && (
            <Button variant="outline" className="gap-2 bg-white text-gray-700 px-4 md:px-8 whitespace-nowrap text-sm" onClick={handleBack} disabled={loading}>
              ย้อนกลับ
            </Button>
          )}
        </div>
        <Button className="px-4 md:px-8 whitespace-nowrap min-w-[140px] md:min-w-[220px] text-sm" onClick={handleNext} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : currentStep === 4 ? 'เสร็จสิ้นและไปที่ Dashboard' : 'บันทึกและดำเนินการต่อ'}
        </Button>
      </div>
    </div>
  );
}
