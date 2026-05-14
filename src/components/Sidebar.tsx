import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Target, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building,
  FileText,
  Package,
  Archive,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import logoPng from '../assets/logo.png';
import CalendarIcon from './Calendar/CalendarIcon';
import CalendarPanel from './Calendar/CalendarPanel';
import ReminderPopup from './Calendar/ReminderPopup';
import useReminderPoller from './Calendar/useReminderPoller';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/** Fixed flyout so labels sit to the right of the rail like the reference (not clipped by scroll/overflow). */
function RailFlyout({ text, x, y }: { text: string; x: number; y: number }) {
  return createPortal(
    <div
      className="pointer-events-none fixed z-[300] w-max max-w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-slate-600/50 bg-slate-950 px-3.5 py-2 text-left text-sm font-semibold leading-snug text-white shadow-2xl ring-1 ring-black/30"
      style={{ left: x, top: y, transform: 'translateY(-50%)' }}
      role="tooltip"
    >
      {text}
    </div>,
    document.body
  );
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showCalendar, setShowCalendar] = useState(false);
  const { dueReminders, dismissReminder, snoozeReminder } = useReminderPoller();
  const [railTip, setRailTip] = useState<{ text: string; x: number; y: number } | null>(null);

  const showRailTip = (e: React.MouseEvent | React.FocusEvent, text: string) => {
    if (!isCollapsed) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    setRailTip({ text, x: r.right + 10, y: r.top + r.height / 2 });
  };
  const hideRailTip = () => setRailTip(null);

  useEffect(() => {
    if (!isCollapsed) setRailTip(null);
  }, [isCollapsed]);

  // Handle navigation and auto-close sidebar on mobile
  const handleNavigation = (path: string) => {
    hideRailTip();
    navigate(path);
    // On mobile (when isCollapsed is false and sidebar is open), close it after navigation
    if (!isCollapsed && window.innerWidth < 1024) {
      onToggle();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'leads', label: 'Leads', icon: Users, path: '/leads' },
    { id: 'pipeline', label: 'Sales Pipeline', icon: BarChart3, path: '/pipeline' },
    { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/sales' },
    { id: 'investment', label: 'Investment', icon: Target, path: '/investments' },
    { id: 'stock', label: 'Stock', icon: Archive, path: '/stock' },
    { id: 'gst', label: 'GST Monthly Filing', icon: FileText, path: '/gst' },
    { id: 'courier', label: 'Courier Cost', icon: Package, path: '/courier' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div
        className={`text-white shadow-2xl transition-all duration-300 shrink-0 flex flex-col min-h-0 min-w-0 fixed top-0 bottom-0 left-0 z-50 lg:relative lg:top-auto lg:bottom-auto lg:left-auto lg:h-full ${
          isCollapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-[4.5rem] bg-gradient-to-b from-[#161b26] via-[#131722] to-[#0d1017] border-r border-slate-800/80'
            : 'translate-x-0 w-64 lg:w-64 bg-gradient-to-b from-slate-900 to-slate-800'
        } lg:translate-x-0`}
      >
      {/* Radhey Business Management Branding */}
      <div className={`shrink-0 ${isCollapsed ? 'px-2 py-3 border-b border-slate-700/50' : 'px-4 py-4 border-b border-slate-700/80'}`}>
        {isCollapsed ? (
          // Collapsed state - logo and expand button at top
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-1 ring-2 ring-white/25">
              <img 
                src={logoPng} 
                alt=""
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <Building className="w-5 h-5 text-blue-600 hidden" />
            </div>
            <button
              onClick={onToggle}
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-100 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Expand sidebar"
              onMouseEnter={(e) => showRailTip(e, 'Expand sidebar')}
              onMouseLeave={hideRailTip}
              onFocus={(e) => showRailTip(e, 'Expand sidebar')}
              onBlur={hideRailTip}
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={2.25} />
            </button>
          </div>
        ) : (
          // Expanded state - logo, name, and close button
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.22)] overflow-hidden p-1 ring-2 ring-white/20">
                <img 
                  src={logoPng} 
                  alt="Radhey Business Management Logo" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <Building className="w-6 h-6 text-blue-600 hidden" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[18px] leading-5 font-black text-white tracking-tight truncate">Radhey Business</h1>
                <p className="text-xs text-slate-300/90 font-medium mt-0.5">Management</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Nav scrolls; footer stays pinned like the reference rail */}
      <div
        className={`flex-1 min-h-0 min-w-0 overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.4)_rgba(15,23,42,0.35)] ${
          isCollapsed ? 'overflow-y-auto overflow-x-hidden py-2' : 'overflow-y-auto overflow-x-hidden'
        }`}
      >
        <nav className={isCollapsed ? 'flex flex-col items-center gap-1 px-1' : 'p-4 pb-2'}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.path)}
                aria-label={isCollapsed ? item.label : undefined}
                onMouseEnter={(e) => showRailTip(e, item.label)}
                onMouseLeave={hideRailTip}
                onFocus={(e) => showRailTip(e, item.label)}
                onBlur={hideRailTip}
                className={
                  isCollapsed
                    ? `relative mx-auto mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/15'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`
                    : `relative mb-2 flex w-full items-center rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`
                }
              >
                <Icon
                  className={isCollapsed ? 'h-[22px] w-[22px] shrink-0' : 'h-5 w-5'}
                  strokeWidth={isCollapsed ? 2.25 : 2}
                  aria-hidden
                />
                {!isCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className={`shrink-0 border-t ${
          isCollapsed
            ? 'border-slate-700/50 bg-[#0d1017]/90 px-1.5 pb-5 pt-3'
            : 'border-slate-700/90 p-4 pt-2 pb-4'
        }`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md ring-1 ring-white/15"
              aria-label={user?.email ? `Signed in as ${user.email}` : 'Account'}
            >
              <span className="text-base font-bold leading-none text-white">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleNavigation('/settings')}
              aria-label="Settings"
              onMouseEnter={(e) => showRailTip(e, 'Settings')}
              onMouseLeave={hideRailTip}
              onFocus={(e) => showRailTip(e, 'Settings')}
              onBlur={hideRailTip}
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 ${
                location.pathname === '/settings'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/15'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              aria-label="Calendar"
              onMouseEnter={(e) => showRailTip(e, 'Calendar')}
              onMouseLeave={hideRailTip}
              onFocus={(e) => showRailTip(e, 'Calendar')}
              onBlur={hideRailTip}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-200 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              <CalendarIcon
                className="!p-0 flex h-11 w-11 items-center justify-center"
                iconClassName="h-[22px] w-[22px] text-slate-100"
              />
            </button>

            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              onMouseEnter={(e) => showRailTip(e, 'Log out')}
              onMouseLeave={hideRailTip}
              onFocus={(e) => showRailTip(e, 'Log out')}
              onBlur={hideRailTip}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-rose-300/95 transition-all duration-200 hover:bg-red-500/15 hover:text-rose-100"
            >
              <LogOut className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        ) : (
          // Expanded state - user info, settings, logout
          <>
            <div className="mb-4 p-3 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {user?.role || 'Staff'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Settings Button */}
            <button
              onClick={() => handleNavigation('/settings')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 mb-2 ${
                location.pathname === '/settings'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="ml-3 font-medium">Settings</span>
            </button>

            {/* Calendar Button */}
            <button
              onClick={() => setShowCalendar(true)}
              className="w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 mb-2 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Calendar className="w-5 h-5" />
              <span className="ml-3 font-medium">Calendar</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 text-red-400 hover:bg-red-600/20 hover:text-red-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3 font-medium">Logout</span>
            </button>
          </>
        )}
      </div>
    </div>

    {railTip && isCollapsed && <RailFlyout text={railTip.text} x={railTip.x} y={railTip.y} />}

    {/* Calendar Panel */}
    <CalendarPanel 
      isOpen={showCalendar} 
      onClose={() => setShowCalendar(false)} 
    />

    {/* Reminder Popups - Show only the first one at a time */}
    {Array.isArray(dueReminders) && dueReminders.length > 0 && (
      <ReminderPopup
        key={dueReminders[0]._id}
        reminder={dueReminders[0]}
        onDismiss={() => dismissReminder(dueReminders[0]._id)}
        onSnooze={() => snoozeReminder(dueReminders[0]._id)}
      />
    )}
    </>
  );
}
