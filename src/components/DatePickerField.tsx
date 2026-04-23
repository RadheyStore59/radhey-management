import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const toDate = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toIsoDate = (value: Date | null) => {
  if (!value) return '';
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function DatePickerField({
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  className = '',
}: DatePickerFieldProps) {
  return (
    <ReactDatePicker
      selected={toDate(value)}
      onChange={(date: Date | null) => onChange(toIsoDate(date))}
      dateFormat="dd-MM-yyyy"
      placeholderText={placeholder}
      required={required}
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium ${className}`}
      popperClassName="app-datepicker-popper z-[9999]"
      calendarClassName="app-datepicker"
      showPopperArrow={false}
      popperPlacement="bottom-start"
    />
  );
}

