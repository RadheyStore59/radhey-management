import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onToggleSidebar: () => void;
}

export default function MobileHeader({ onToggleSidebar }: MobileHeaderProps) {
  return (
    <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6 text-slate-700" />
      </button>
      <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Radhey Management System
      </h1>
    </div>
  );
}
