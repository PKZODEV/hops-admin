'use client';
import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';

interface DocumentUploaderProps {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  required?: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function DocumentUploader({ label, value, onChange, required }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload/registration-document`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'อัปโหลดไม่สำเร็จ');
      }
      const data = (await res.json()) as { url: string };
      const backendBase = API.replace(/\/api\/v1\/?$/, '');
      onChange(`${backendBase}${data.url}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const filename = value ? value.split('/').pop() : null;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="flex-1 truncate underline-offset-2 hover:underline"
            title={filename || ''}
          >
            {filename}
          </a>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-primary-teal hover:bg-teal-50 hover:text-primary-teal transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังอัปโหลด...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> อัปโหลดไฟล์ (JPG, PNG, PDF)
            </>
          )}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
