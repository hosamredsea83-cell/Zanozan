import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

export interface ReferenceSelectOption {
  id: string;
  label: string;
  meta?: string;
}

interface ReferenceSelectWithAddProps {
  label: string;
  required?: boolean;
  value: string;
  options: ReferenceSelectOption[];
  placeholder?: string;
  addLabel: string;
  addInputPlaceholder?: string;
  disabled?: boolean;
  disabledHint?: string;
  /** Optional fallback label shown if `value` is a legacy value not present in `options` */
  legacyFallbackLabel?: string;
  onChange: (selectedId: string) => void;
  onAddNew: (newName: string) => void | Promise<void>;
  className?: string;
  selectClassName?: string;
}

const ADD_NEW_SENTINEL = '__ZANOZA_ADD_NEW__';

export const ReferenceSelectWithAdd: React.FC<ReferenceSelectWithAddProps> = ({
  label,
  required = false,
  value,
  options,
  placeholder = '-- اختر من القائمة --',
  addLabel,
  addInputPlaceholder = 'اكتب الاسم الجديد...',
  disabled = false,
  disabledHint,
  legacyFallbackLabel,
  onChange,
  onAddNew,
  className = '',
  selectClassName = ''
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState('');

  const hasSelectedInOptions = !value || options.some((opt) => opt.id === value);

  const commitAdd = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    await onAddNew(trimmed);
    setDraftName('');
    setIsAdding(false);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-300 block">
        {label}
        {required && <span className="text-rose-400 mr-1">*</span>}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          if (val === ADD_NEW_SENTINEL) {
            setIsAdding(true);
            return;
          }
          onChange(val);
        }}
        className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed ${selectClassName}`}
      >
        <option value="">{disabled && disabledHint ? disabledHint : placeholder}</option>
        {!hasSelectedInOptions && value && (
          <option value={value}>{legacyFallbackLabel || value}</option>
        )}
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.meta ? `${opt.label} (${opt.meta})` : opt.label}
          </option>
        ))}
        {!disabled && (
          <option value={ADD_NEW_SENTINEL}>+ {addLabel}...</option>
        )}
      </select>

      {isAdding && !disabled ? (
        <div className="flex items-center gap-1.5 pt-0.5">
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                void commitAdd();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsAdding(false);
                setDraftName('');
              }
            }}
            placeholder={addInputPlaceholder}
            autoFocus
            className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={() => void commitAdd()}
            disabled={!draftName.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setDraftName('');
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
            title="إلغاء"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer pt-0.5"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>{addLabel}</span>
        </button>
      )}
    </div>
  );
};
