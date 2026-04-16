'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';

type Province = { id: number; name: string };
type District = { id: number; name: string; pid: number };
type SubDistrict = { id: number; name: string; did: number; zip: number };

export type ThaiAddressValue = {
  provinceId?: number;
  provinceName?: string;
  districtId?: number;
  districtName?: string;
  subDistrictId?: number;
  subDistrictName?: string;
  zipCode?: string;
};

interface Props {
  value: ThaiAddressValue;
  onChange: (v: ThaiAddressValue) => void;
  required?: boolean;
}

// Cache to avoid re-fetching on remounts
let cache: {
  provinces?: Province[];
  districts?: District[];
  subDistricts?: SubDistrict[];
} = {};

async function loadAddressData() {
  if (cache.provinces && cache.districts && cache.subDistricts) return cache;
  const [p, d, s] = await Promise.all([
    fetch('/data/th-address/provinces.json').then(r => r.json()),
    fetch('/data/th-address/districts.json').then(r => r.json()),
    fetch('/data/th-address/sub-districts.json').then(r => r.json()),
  ]);
  cache = { provinces: p, districts: d, subDistricts: s };
  return cache;
}

export function ThaiAddressPicker({ value, onChange, required }: Props) {
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);

  useEffect(() => {
    let alive = true;
    loadAddressData()
      .then(c => {
        if (!alive) return;
        setProvinces(c.provinces ?? []);
        setDistricts(c.districts ?? []);
        setSubDistricts(c.subDistricts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const districtOptions = useMemo(
    () => (value.provinceId ? districts.filter(d => d.pid === value.provinceId) : []),
    [districts, value.provinceId],
  );
  const subDistrictOptions = useMemo(
    () => (value.districtId ? subDistricts.filter(s => s.did === value.districtId) : []),
    [subDistricts, value.districtId],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <AddressCombobox
        label="จังหวัด"
        required={required}
        placeholder={loading ? 'กำลังโหลด...' : 'เลือกจังหวัด'}
        disabled={loading}
        icon={<MapPin className="w-4 h-4" />}
        selectedLabel={value.provinceName}
        options={provinces.map(p => ({ id: p.id, label: p.name }))}
        onSelect={opt => {
          onChange({
            provinceId: opt.id,
            provinceName: opt.label,
            districtId: undefined,
            districtName: undefined,
            subDistrictId: undefined,
            subDistrictName: undefined,
            zipCode: undefined,
          });
        }}
      />
      <AddressCombobox
        label="อำเภอ / เขต"
        required={required}
        placeholder={!value.provinceId ? 'เลือกจังหวัดก่อน' : 'เลือกอำเภอ'}
        disabled={loading || !value.provinceId}
        selectedLabel={value.districtName}
        options={districtOptions.map(d => ({ id: d.id, label: d.name }))}
        onSelect={opt => {
          onChange({
            ...value,
            districtId: opt.id,
            districtName: opt.label,
            subDistrictId: undefined,
            subDistrictName: undefined,
            zipCode: undefined,
          });
        }}
      />
      <AddressCombobox
        label="ตำบล / แขวง"
        required={required}
        placeholder={!value.districtId ? 'เลือกอำเภอก่อน' : 'เลือกตำบล'}
        disabled={loading || !value.districtId}
        selectedLabel={
          value.subDistrictName
            ? value.zipCode
              ? `${value.subDistrictName} (${value.zipCode})`
              : value.subDistrictName
            : undefined
        }
        options={subDistrictOptions.map(s => ({
          id: s.id,
          label: s.name,
          sublabel: String(s.zip),
        }))}
        onSelect={opt => {
          const s = subDistricts.find(x => x.id === opt.id);
          onChange({
            ...value,
            subDistrictId: opt.id,
            subDistrictName: opt.label,
            zipCode: s ? String(s.zip) : undefined,
          });
        }}
      />
    </div>
  );
}

type Option = { id: number; label: string; sublabel?: string };

function AddressCombobox({
  label,
  required,
  placeholder,
  disabled,
  icon,
  options,
  selectedLabel,
  onSelect,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  options: Option[];
  selectedLabel?: string;
  onSelect: (opt: Option) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter(
      o => o.label.includes(q) || (o.sublabel ?? '').includes(q),
    );
  }, [options, query]);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 border rounded-lg px-3.5 py-2.5 text-sm transition text-left
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:border-primary-teal'}
          ${open ? 'ring-2 ring-primary-teal/30 border-primary-teal' : ''}
        `}
      >
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
        <span className={`flex-1 truncate ${selectedLabel ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ค้นหา..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                ไม่พบข้อมูล
              </div>
            ) : (
              filtered.slice(0, 200).map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-teal-50 hover:text-teal-700 transition-colors"
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-xs text-gray-400 shrink-0">{opt.sublabel}</span>
                  )}
                </button>
              ))
            )}
            {filtered.length > 200 && (
              <div className="px-3 py-2 text-center text-[11px] text-gray-400 border-t border-gray-100">
                แสดง 200 รายการแรก — พิมพ์เพื่อค้นหาเพิ่ม
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

