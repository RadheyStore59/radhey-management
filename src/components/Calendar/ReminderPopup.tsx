import React, { useState } from 'react';
import { Bell, CheckCircle, Clock, X } from 'lucide-react';
import calendarAPI from '../../utils/calendarAPI';
import { ReminderPopupProps } from '../../types/calendar';

const ReminderPopup = ({ reminder, onDismiss, onSnooze }: ReminderPopupProps) => {
  const [loading, setLoading] = useState(false);

  const handleMarkDone = async () => {
    setLoading(true);
    try {
      await calendarAPI.updateEntry(reminder._id, { status: 'done' });
      onDismiss();
    } catch (error) {
      // Error handling without console.log
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async () => {
    setLoading(true);
    try {
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 15);
      await calendarAPI.updateEntry(reminder._id, { 
        snoozed_until: snoozeTime.toISOString(),
        status: 'snoozed'
      });
      onSnooze();
    } catch (error) {
      // Error handling without console.log
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return '📋';
      case 'followup': return '📞';
      case 'task': return '✅';
      case 'reminder': return '🔔';
      default: return '📅';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-full duration-300">
      <div className="w-80 sm:w-96 rounded-2xl shadow-2xl border-2 overflow-hidden backdrop-blur-lg relative mr-2 mt-2">
        {/* Header with gradient */}
        <div className={`p-4 bg-gradient-to-r ${
          reminder.priority === 'high' ? 'from-red-500 to-pink-500' :
          reminder.priority === 'medium' ? 'from-yellow-500 to-orange-500' :
          'from-green-500 to-emerald-500'
        } text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl bg-white/20 p-2 rounded-full">
                {getCategoryIcon(reminder.category)}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">
                  {reminder.title}
                </h3>
                <p className="text-sm text-white/90">
                  {formatDateTime(reminder.reminder_time)}
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-white">
          {reminder.description && (
            <p className="text-slate-700 mb-4 leading-relaxed text-sm">
              {reminder.description}
            </p>
          )}

          {/* Category and Priority Badges */}
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-semibold rounded-full">
              {reminder.category.charAt(0).toUpperCase() + reminder.category.slice(1)}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${
              reminder.priority === 'high' ? 'from-red-100 to-red-200 text-red-700' :
              reminder.priority === 'medium' ? 'from-yellow-100 to-yellow-200 text-yellow-700' :
              'from-green-100 to-green-200 text-green-700'
            }`}>
              {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)} Priority
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSnooze}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl transition-all font-medium disabled:opacity-50 shadow-sm"
            >
              <Clock className="w-4 h-4" />
              Snooze 15 min
            </button>
            <button
              onClick={handleMarkDone}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Mark Done
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bell Animation */}
        <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1.5 animate-pulse border-2 border-white shadow-lg z-10">
          <Bell className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
};

export default ReminderPopup;
