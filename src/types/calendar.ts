export interface CalendarEntry {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  entry_date: string;
  reminder_time: string;
  reminder_type: 'on_day' | '1_day_before' | '1_hour_before' | 'custom';
  category: 'meeting' | 'followup' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'done' | 'snoozed';
  snoozed_until?: string;
  email_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderPopupProps {
  reminder: CalendarEntry;
  onDismiss: () => void;
  onSnooze: () => void;
}

export interface CalendarPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AddEntryModalProps {
  date: Date;
  onClose: () => void;
  onSave: () => void;
}
