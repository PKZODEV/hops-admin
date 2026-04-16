'use client';
import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
  /** If true, failing this rule blocks submission. Otherwise it's a soft hint. */
  required?: boolean;
}

export const DEFAULT_RULES: PasswordRule[] = [
  { label: 'อย่างน้อย 6 ตัวอักษร', test: pw => pw.length >= 6, required: true },
  { label: 'ยาว 8 ตัวอักษรขึ้นไป (แนะนำ)', test: pw => pw.length >= 8 },
  { label: 'มีทั้งตัวพิมพ์ใหญ่และเล็ก (A-Z, a-z)', test: pw => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: 'มีตัวเลข (0-9)', test: pw => /\d/.test(pw) },
  { label: 'มีอักขระพิเศษ เช่น !@#$%', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

/**
 * Returns a score 0..4 based on how many non-length criteria pass, plus length bonus.
 * 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong
 */
export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LEVELS = [
  { label: 'อ่อนมาก', color: 'bg-gray-200', text: 'text-gray-400' },
  { label: 'อ่อน', color: 'bg-red-400', text: 'text-red-500' },
  { label: 'พอใช้', color: 'bg-orange-400', text: 'text-orange-500' },
  { label: 'ดี', color: 'bg-yellow-400', text: 'text-yellow-600' },
  { label: 'ปลอดภัย', color: 'bg-green-500', text: 'text-green-600' },
];

export function PasswordStrength({
  password,
  rules = DEFAULT_RULES,
}: {
  password: string;
  rules?: PasswordRule[];
}) {
  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                password && i < score ? level.color : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-gray-400">ความปลอดภัย</span>
          <span className={`text-[11px] font-semibold ${password ? level.text : 'text-gray-400'}`}>
            {password ? level.label : '—'}
          </span>
        </div>
      </div>

      {/* Rules checklist */}
      <ul className="grid grid-cols-1 gap-1 text-[11px]">
        {rules.map((r, i) => {
          const ok = r.test(password);
          return (
            <li
              key={i}
              className={`flex items-center gap-1.5 transition-colors ${
                ok ? 'text-green-600' : r.required ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {ok ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <X className="w-3 h-3 shrink-0 opacity-60" />
              )}
              <span>{r.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function isPasswordValid(pw: string, rules: PasswordRule[] = DEFAULT_RULES): boolean {
  return rules.filter(r => r.required).every(r => r.test(pw));
}
