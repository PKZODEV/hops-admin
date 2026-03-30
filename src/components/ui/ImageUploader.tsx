'use client';
import React, { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function ImageUploader({ value = [], onChange, maxImages = 5, className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? 'Upload failed');
    }
    const data = await res.json() as { url: string };
    // Build absolute URL from the API base (strip /api/v1 suffix)
    const backendBase = API_BASE.replace(/\/api\/v1\/?$/, '');
    return `${backendBase}${data.url}`;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - value.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadError(null);
    try {
      const urls = await Promise.all(toUpload.map(upload));
      onChange?.([...value, ...urls]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    onChange?.(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        {value.map((url, idx) => (
          <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`รูปที่ ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            disabled={uploading}
            className={`w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-xs transition-colors disabled:opacity-50 ${dragOver ? 'border-primary-teal bg-teal-50 text-primary-teal' : 'border-gray-300 text-gray-400 hover:border-primary-teal hover:text-primary-teal hover:bg-teal-50'}`}
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            <span>{uploading ? 'กำลังอัปโหลด' : 'เพิ่มรูป'}</span>
          </button>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
      )}
      {!uploadError && value.length < maxImages && (
        <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP · ไม่เกิน 5 MB · เพิ่มได้อีก {maxImages - value.length} รูป</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
