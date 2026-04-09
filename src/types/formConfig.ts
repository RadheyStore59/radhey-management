export type FormModule = 'leads' | 'sales' | 'investments' | 'gst' | 'courier';

export type FormFieldType = 'text' | 'number' | 'date' | 'textarea' | 'select';

export interface DynamicFormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  enabled?: boolean;
  placeholder?: string;
  options?: string[];
  order?: number;
}
