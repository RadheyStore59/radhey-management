import { useState, useEffect, useCallback } from 'react';
import calendarAPI from '../../utils/calendarAPI';
import { CalendarEntry } from '../../types/calendar';

const useReminderPoller = (interval = 300000) => { // 5 minutes default
  const [dueReminders, setDueReminders] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDueReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const reminders = await calendarAPI.getDueReminders();
      // Ensure reminders is always an array
      const remindersArray = Array.isArray(reminders) ? reminders : [];
      setDueReminders(remindersArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set empty array on error to prevent runtime errors
      setDueReminders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissReminder = useCallback((reminderId: string) => {
    setDueReminders(prev => prev.filter(r => r._id !== reminderId));
  }, []);

  const snoozeReminder = useCallback((reminderId: string) => {
    setDueReminders(prev => prev.filter(r => r._id !== reminderId));
  }, []);

  useEffect(() => {
    // Initial check
    checkDueReminders();

    // Set up polling
    const intervalId = setInterval(checkDueReminders, interval);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [checkDueReminders, interval]);

  return {
    dueReminders,
    isLoading,
    error,
    checkDueReminders,
    dismissReminder,
    snoozeReminder
  };
};

export default useReminderPoller;
