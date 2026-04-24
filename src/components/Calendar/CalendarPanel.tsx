import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, CheckCircle, Clock } from 'lucide-react';
import calendarAPI from '../../utils/calendarAPI';
import AddEntryModal from './AddEntryModal';
import { CalendarPanelProps, CalendarEntry } from '../../types/calendar';

const CalendarPanel = ({ isOpen, onClose }: CalendarPanelProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [entries, setEntries] = useState<Record<string, CalendarEntry[]>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDateEntries, setSelectedDateEntries] = useState<CalendarEntry[]>([]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Auto-select today's date when calendar opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setSelectedDate(today);
      fetchEntriesForDate(today);
    }
  }, [isOpen]);

  // Fetch month entries when month changes
  useEffect(() => {
    if (isOpen) {
      fetchMonthEntries();
    }
  }, [currentDate, isOpen]);

  const fetchMonthEntries = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const monthEntries = await calendarAPI.getAllEntries(startDate, endDate);
      
      // Group entries by date using UTC
      const entriesByDate: Record<string, CalendarEntry[]> = {};
      monthEntries.forEach((entry: CalendarEntry) => {
        const dateKey = new Date(entry.entry_date).toISOString().split('T')[0];
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
      });

      setEntries(entriesByDate);
    } catch (error) {
      // Error fetching month entries
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    fetchEntriesForDate(date);
  };

  const fetchEntriesForDate = async (date: Date) => {
    try {
      // Create date string in local timezone to match what user sees
      const localDateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dateEntries = await calendarAPI.getEntriesForDate(localDateKey);
      const entriesArray = Array.isArray(dateEntries) ? dateEntries : [];
      setSelectedDateEntries(entriesArray);
    } catch (error) {
      setSelectedDateEntries([]);
    }
  };

  const handleMarkDone = async (entryId: string) => {
    try {
      await calendarAPI.updateEntry(entryId, { status: 'done' });
      await fetchMonthEntries(); // Refresh calendar dots
      if (selectedDate) {
        await fetchEntriesForDate(selectedDate);
      }
    } catch (error) {
      // Error handling
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await calendarAPI.deleteEntry(entryId);
      await fetchMonthEntries(); // Refresh calendar dots
      if (selectedDate) {
        await fetchEntriesForDate(selectedDate);
      }
    } catch (error) {
      // Error handling
    }
  };

  const handleResetEmailNotification = async (entryId: string) => {
    try {
      await calendarAPI.resetEmailNotification(entryId);
      await fetchMonthEntries(); // Refresh calendar dots
      if (selectedDate) {
        await fetchEntriesForDate(selectedDate);
      }
    } catch (error) {
      // Error handling
    }
  };

  const getEntriesForDate = (date: Date): CalendarEntry[] => {
    // Use UTC date string to match backend filtering
    const utcDateKey = date.toISOString().split('T')[0];
    return entries[utcDateKey] || [];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-14"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateEntries = getEntriesForDate(date);
      const hasEntries = dateEntries.length > 0;
      const isCurrentDay = isToday(date);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`
            h-12 sm:h-14 border border-slate-200 rounded-lg cursor-pointer
            flex flex-col items-center justify-center relative
            hover:bg-slate-50 transition-colors
            ${isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white'}
            ${hasEntries ? 'ring-2 ring-blue-100' : ''}
          `}
        >
          <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-slate-700'}`}>
            {day}
          </span>
          
          {/* Single dot indicator with count */}
          {hasEntries && (
            <div className="flex items-center gap-1 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  dateEntries.some(e => e.priority === 'high') ? 'bg-red-400' :
                  dateEntries.some(e => e.priority === 'medium') ? 'bg-yellow-400' : 'bg-green-400'
                }`}
              />
              {dateEntries.length > 1 && (
                <span className="text-xs text-slate-500 font-medium">
                  {dateEntries.length}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 z-50 ${isOpen ? 'flex' : 'hidden'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Panel */}
        <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col border-l border-slate-100">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Calendar</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h3 className="text-base font-semibold text-slate-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {loading ? (
                Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-12 sm:h-14 bg-slate-100 rounded-lg animate-pulse"></div>
                ))
              ) : (
                renderCalendarDays()
              )}
            </div>

            {/* Selected Date Entries */}
            {selectedDate && (
              <div className="mt-6 p-4 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </h4>
                    <p className="text-sm text-slate-600">Events & Reminders</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    + Add Event
                  </button>
                </div>
                
                {selectedDateEntries.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEntries.map((entry) => (
                      <div key={entry._id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col space-y-3">
                          {/* Title and badges */}
                          <div className="flex flex-col space-y-2">
                            <h5 className="font-semibold text-slate-900 text-base break-words text-left">{entry.title}</h5>
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.priority === 'high' ? 'bg-red-100 text-red-700' :
                                entry.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {entry.priority}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                {entry.category}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.status === 'done' ? 'bg-green-100 text-green-700' :
                                entry.status === 'snoozed' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {entry.status}
                              </span>
                              {entry.email_sent && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <span>📧 Notified</span>
                                  <button
                                    onClick={() => handleResetEmailNotification(entry._id)}
                                    className="ml-1 text-purple-500 hover:text-purple-700"
                                    title="Click to resend email notification"
                                  >
                                    ✕
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          {entry.description && (
                            <p className="text-sm text-slate-600 leading-relaxed break-words text-left">{entry.description}</p>
                          )}
                          
                          {/* Snooze information */}
                          {entry.status === 'snoozed' && entry.snoozed_until && (
                            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center gap-2 text-xs text-orange-700">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">Snoozed until:</span>
                                <span>{new Date(entry.snoozed_until).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Time info and actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                🕐 {new Date(entry.reminder_time).toLocaleString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                📅 {new Date(entry.entry_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              {entry.status !== 'done' && (
                                <button
                                  onClick={() => handleMarkDone(entry._id)}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Mark as done"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(entry._id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="text-base font-medium mb-2">No events for this date</p>
                    <p className="text-sm">Click "Add Event" to create your first reminder</p>
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Priority Indicators</h4>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-slate-600">High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-slate-600">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-600">Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && selectedDate && (
        <AddEntryModal
          date={selectedDate as Date}
          onClose={() => setShowAddModal(false)}
          onSave={async () => {
            setShowAddModal(false);
            await fetchMonthEntries();
            // Refresh the selected date entries to show the new entry immediately
            if (selectedDate) {
              await fetchEntriesForDate(selectedDate);
            }
          }}
        />
      )}
    </>
  );
};

export default CalendarPanel;
