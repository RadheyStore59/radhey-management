import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface MobileHeaderProps {
  onToggleSidebar: () => void;
}

/** Matches sidebar labels so the top bar shows the current section, not only the app title */
const PATH_PAGE_LABEL: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/pipeline': 'Sales Pipeline',
  '/sales': 'Sales',
  '/investments': 'Investment',
  '/stock': 'Stock',
  '/categories': 'Categories',
  '/brands': 'Brands',
  '/dealers': 'Dealers',
  '/inventory': 'Inventory',
  '/gst': 'GST Monthly Filing',
  '/courier': 'Courier Cost',
  '/reports': 'Reports',
  '/import': 'Import Excel',
  '/settings': 'Settings',
};

function pageLabelForPath(pathname: string): string {
  if (PATH_PAGE_LABEL[pathname]) return PATH_PAGE_LABEL[pathname];
  const seg = pathname.replace(/^\//, '').split('/')[0] || '';
  if (!seg) return 'Radhey Management';
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MobileHeader({ onToggleSidebar }: MobileHeaderProps) {
  const location = useLocation();
  const pageLabel = pageLabelForPath(location.pathname);

  return (
    <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-slate-700" />
      </button>
      <div className="min-w-0 flex flex-col">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate leading-tight">
          {pageLabel}
        </h1>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
          Radhey Management
        </p>
      </div>
    </div>
  );
}
