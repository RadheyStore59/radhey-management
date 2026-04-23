import React from 'react';
import Select, { StylesConfig } from 'react-select';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  isClearable?: boolean;
}

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderRadius: 12,
    borderColor: state.isFocused ? 'rgba(59,130,246,0.4)' : 'rgb(226 232 240)',
    boxShadow: state.isFocused ? '0 0 0 4px rgba(59,130,246,0.1)' : 'none',
    backgroundColor: 'rgb(248 250 252)',
    ':hover': { borderColor: 'rgba(59,130,246,0.4)' },
  }),
  valueContainer: (base) => ({ ...base, paddingLeft: 12, paddingRight: 12 }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: (base) => ({ ...base, borderRadius: 12, overflow: 'hidden', zIndex: 9999 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#0f172a',
    fontSize: 14,
  }),
};

export default function SelectField({
  value,
  options,
  onChange,
  placeholder = 'Select',
  isClearable = false,
}: SelectFieldProps) {
  const selected = options.find((o) => o.value === value) || null;

  return (
    <Select<SelectOption, false>
      value={selected}
      options={options}
      onChange={(opt) => onChange(opt?.value || '')}
      placeholder={placeholder}
      isClearable={isClearable}
      styles={selectStyles}
      classNamePrefix="app-select"
      menuPortalTarget={document.body}
      menuPosition="fixed"
    />
  );
}

