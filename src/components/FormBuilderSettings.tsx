import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { formConfigAPI } from '../utils/api';
import { DynamicFormField, FormModule } from '../types/formConfig';
import { showToast } from '../utils/toast';
import SelectField from './SelectField';

const modules: FormModule[] = ['leads', 'sales', 'investments', 'gst', 'courier'];

const emptyField = (): DynamicFormField => ({
  key: '',
  label: '',
  type: 'text',
  required: false,
  enabled: true,
  placeholder: '',
  options: [],
  order: 0,
});

export default function FormBuilderSettings() {
  const [moduleName, setModuleName] = useState<FormModule>('leads');
  const [fields, setFields] = useState<DynamicFormField[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await formConfigAPI.getByModule(moduleName);
      setFields((data?.fields || []).sort((a: DynamicFormField, b: DynamicFormField) => (a.order || 0) - (b.order || 0)));
    } catch {
      setFields([]);
    }
  };

  useEffect(() => {
    load();
  }, [moduleName]);

  const updateField = (idx: number, patch: Partial<DynamicFormField>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await formConfigAPI.saveByModule(moduleName, fields.map((f, i) => ({ ...f, order: i })));
      showToast('Form configuration saved.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save form config', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-900">Dynamic Form Builder</h3>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Module</label>
        <div className="w-full max-w-xs">
          <SelectField
            value={moduleName}
            onChange={(value) => setModuleName(value as FormModule)}
            options={modules.map((m) => ({ value: m, label: m.toUpperCase() }))}
            placeholder="Select module"
          />
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, idx) => (
          <div key={`${field.key}-${idx}`} className="border rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
            <input className="px-3 py-2 border rounded-lg" placeholder="Key (no spaces)" value={field.key} onChange={(e) => updateField(idx, { key: e.target.value.replace(/\s+/g, '_').toLowerCase() })} />
            <input className="px-3 py-2 border rounded-lg" placeholder="Label" value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
            <div>
              <SelectField
                value={field.type}
                onChange={(value) => updateField(idx, { type: value as DynamicFormField['type'] })}
                options={[
                  { value: 'text', label: 'Text' },
                  { value: 'number', label: 'Number' },
                  { value: 'date', label: 'Date' },
                  { value: 'textarea', label: 'Textarea' },
                  { value: 'select', label: 'Select' },
                ]}
                placeholder="Type"
              />
            </div>
            <input className="px-3 py-2 border rounded-lg" placeholder="Placeholder" value={field.placeholder || ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} />
            <input className="px-3 py-2 border rounded-lg" placeholder="Options (comma separated)" value={(field.options || []).join(',')} onChange={(e) => updateField(idx, { options: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
            <div className="flex items-center justify-between">
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!field.required} onChange={(e) => updateField(idx, { required: e.target.checked })} /> Required</label>
              <button onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))} className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setFields((prev) => [...prev, emptyField()])}
        className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Field
      </button>
    </div>
  );
}
