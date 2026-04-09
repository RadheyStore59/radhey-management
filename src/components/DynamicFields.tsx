import React from 'react';
import { DynamicFormField } from '../types/formConfig';
import DatePickerField from './DatePickerField';
import SelectField from './SelectField';

interface DynamicFieldsProps {
  fields: DynamicFormField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export default function DynamicFields({ fields, values, onChange }: DynamicFieldsProps) {
  const enabledFields = (fields || [])
    .filter((f) => f.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (enabledFields.length === 0) return null;

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <h4 className="text-md font-bold text-slate-900 mb-4">Custom Fields</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enabledFields.map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {field.label}{field.required ? ' *' : ''}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                rows={3}
                required={!!field.required}
                value={values[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || ''}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : field.type === 'select' ? (
              <SelectField
                value={values[field.key] ?? ''}
                onChange={(value) => onChange(field.key, value)}
                options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                placeholder={`Select ${field.label}`}
                isClearable={!field.required}
              />
            ) : field.type === 'date' ? (
              <DatePickerField
                value={values[field.key] ?? ''}
                onChange={(value) => onChange(field.key, value)}
                required={!!field.required}
              />
            ) : (
              <input
                type={field.type}
                required={!!field.required}
                inputMode={field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('mobile') ? 'numeric' : undefined}
                pattern={field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('mobile') ? '[0-9]{10}' : undefined}
                minLength={field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('mobile') ? 10 : undefined}
                maxLength={field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('mobile') ? 10 : undefined}
                title={field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('mobile') ? 'Enter exactly 10 digits' : undefined}
                value={values[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || ''}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
