import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import calendarAPI from '../../utils/calendarAPI';
import { CalendarEntry } from '../../types/calendar';

interface CalendarIconProps {
  onClick?: () => void;
  className?: string;
}

const CalendarIcon = ({ onClick, className = '' }: CalendarIconProps) => {
  const [hasRemindersToday, setHasRemindersToday] = useState(false);

  useEffect(() => {
    checkTodayReminders();
    // Check every 5 minutes for updates
    const interval = setInterval(checkTodayReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkTodayReminders = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = await calendarAPI.getEntriesForDate(today);
      
      // Check if there are any pending reminders for today
      const pendingToday = todayEntries.some(
        (entry: CalendarEntry) => entry.status === 'pending' || entry.status === 'snoozed'
      );
      
      setHasRemindersToday(pendingToday);
    } catch (error) {
      // Silent error handling
    }
  };

  const iconContent = (
    <>
      <Calendar className="w-5 h-5 text-slate-300" />
      
      {/* Red badge indicator for today's reminders */}
      {hasRemindersToday && (
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
          <span className="sr-only">Reminders due today</span>
        </div>
      )}
    </>
  );

  // If onClick is provided, render as button, otherwise as span
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`relative p-2 rounded-lg transition-all hover:bg-slate-700 hover:text-white hover:scale-105 ${className}`}
      >
        {iconContent}
      </button>
    );
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      {iconContent}
    </span>
  );
};

export default CalendarIcon;
