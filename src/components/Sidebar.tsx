import React from 'react';
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
  Package
} from 'lucide-react';
import { useAuth } from '../contexts/LocalStorageAuthContext';
import logoPng from '../assets/logo.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'leads', label: 'Leads', icon: Users, path: '/leads' },
    { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/sales' },
    { id: 'investment', label: 'Investment', icon: Target, path: '/inventory' },
    { id: 'gst', label: 'GST Monthly Filing', icon: FileText, path: '/gst' },
    { id: 'courier', label: 'Courier Cost', icon: Package, path: '/courier' },
  ];

  return (
    <div className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Radhey Business Management Branding */}
      <div className={`border-b border-slate-700/80 ${isCollapsed ? 'px-3 py-4' : 'px-4 py-4'}`}>
        {isCollapsed ? (
          // Collapsed state - only logo, centered
          <div className="flex justify-center items-center">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.22)] overflow-hidden p-1 ring-2 ring-white/20">
              <img 
                src={logoPng} 
                alt="Radhey Business Management Logo" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // Fallback to Building icon if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <Building className="w-5 h-5 text-blue-600 hidden" />
            </div>
          </div>
        ) : (
          // Expanded state - logo, name, and toggle button
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.22)] overflow-hidden p-1 ring-2 ring-white/20">
                <img 
                  src={logoPng} 
                  alt="Radhey Business Management Logo" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to Building icon if logo fails to load
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

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 mb-2 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section - User & Actions */}
      <div className="p-4 border-t border-slate-700">
        {isCollapsed ? (
          // Collapsed state - only expand button
          <button
            onClick={onToggle}
            className="w-full flex justify-center items-center py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-700 hover:text-white"
            title="Expand Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          // Expanded state - user info, settings, logout
          <>
            <div className="mb-4 p-3 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
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
              onClick={() => navigate('/settings')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 mb-2 ${
                location.pathname === '/settings'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="ml-3 font-medium">Settings</span>
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
  );
}
