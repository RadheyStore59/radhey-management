import React, { useState, FormEvent } from 'react';
import { X, Clock, Calendar, Flag, CheckCircle } from 'lucide-react';
import calendarAPI from '../../utils/calendarAPI';
import { AddEntryModalProps, CalendarEntry } from '../../types/calendar';

const AddEntryModal = ({ date, onClose, onSave }: AddEntryModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'reminder',
    reminder_type: 'on_day',
    priority: 'medium',
    reminder_time: '',
    status: 'pending'
  });

  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'meeting', label: 'Meeting', color: 'blue' },
    { value: 'followup', label: 'Follow-up', color: 'purple' },
    { value: 'task', label: 'Task', color: 'green' },
    { value: 'reminder', label: 'Reminder', color: 'orange' }
  ];

  const reminderTypes = [
    { value: 'on_day', label: 'On the day' },
    { value: '1_day_before', label: '1 day before' },
    { value: '1_hour_before', label: '1 hour before' },
    { value: 'custom', label: 'Custom time' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'red' }
  ];

  const calculateReminderTime = (entryDate: Date, reminderType: string): Date => {
    const entryDateTime = new Date(entryDate);
    
    switch (reminderType) {
      case 'on_day':
        // Set to 9:00 AM on the day of event
        entryDateTime.setHours(9, 0, 0, 0);
        break;
      case '1_day_before':
        // Set to 9:00 AM one day before
        entryDateTime.setDate(entryDateTime.getDate() - 1);
        entryDateTime.setHours(9, 0, 0, 0);
        break;
      case '1_hour_before':
        // Set to 1 hour before the event time
        entryDateTime.setHours(entryDateTime.getHours() - 1);
        break;
      case 'custom':
        // Keep the custom time as is
        break;
      default:
        entryDateTime.setHours(9, 0, 0, 0);
    }
    
    return entryDateTime;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let reminderTime;
      
      if (formData.reminder_type === 'custom' && formData.reminder_time) {
        reminderTime = new Date(formData.reminder_time);
      } else {
        reminderTime = calculateReminderTime(date, formData.reminder_type);
      }

      // Create entry date in local timezone to avoid UTC shift
      const entryDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00`;
      
      const entryData = {
        ...formData,
        entry_date: entryDateStr,
        reminder_time: reminderTime.toISOString()
      };

      await calendarAPI.createEntry(entryData);
      onSave();
    } catch (error) {
      alert('Failed to create calendar entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCategoryColor = (category: string): string => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'gray';
  };

  const getPriorityColor = (priority: string): string => {
    const pri = priorities.find(p => p.value === priority);
    return pri ? pri.color : 'gray';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add Calendar Entry</h3>
              <p className="text-sm text-slate-600 mt-1">
                {date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Call with Rahul"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description / Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleInputChange('category', cat.value)}
                  className={`
                    px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${formData.category === cat.value 
                      ? `border-${cat.color}-500 bg-${cat.color}-50 text-${cat.color}-700` 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Reminder Type
            </label>
            <select
              value={formData.reminder_type}
              onChange={(e) => handleInputChange('reminder_type', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {reminderTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Time (only show when custom is selected) */}
          {formData.reminder_type === 'custom' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Custom Reminder Time
              </label>
              <input
                type="datetime-local"
                value={formData.reminder_time}
                onChange={(e) => handleInputChange('reminder_time', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Flag className="w-4 h-4 inline mr-1" />
              Priority
            </label>
            <div className="flex gap-2">
              {priorities.map(pri => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => handleInputChange('priority', pri.value)}
                  className={`
                    flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${formData.priority === pri.value 
                      ? `border-${pri.color}-500 bg-${pri.color}-50 text-${pri.color}-700` 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }
                  `}
                >
                  {pri.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntryModal;
