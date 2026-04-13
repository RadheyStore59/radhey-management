import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  variant?: 'card' | 'text' | 'table' | 'avatar' | 'button';
  lines?: number;
}

export default function SkeletonLoader({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full',
  variant = 'text',
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'h-32 w-full rounded-xl';
      case 'table':
        return 'h-12 w-full';
      case 'avatar':
        return 'h-10 w-10 rounded-full';
      case 'button':
        return 'h-10 w-20 rounded-lg';
      case 'text':
      default:
        return `${height} ${width}`;
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              width: index === lines - 1 ? '75%' : '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${getVariantClasses()} ${className}`} />
  );
}

// Specialized skeleton components
export const CardSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 border border-slate-100 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <SkeletonLoader height="h-3 sm:h-4" width="w-20 sm:w-24" className="mb-2 sm:mb-3" />
        <SkeletonLoader height="h-6 sm:h-8" width="w-24 sm:w-32" />
      </div>
      <div className="w-10 h-10 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-3 sm:px-6 py-3 sm:py-4">
                <SkeletonLoader height="h-3 sm:h-4" width="w-12 sm:w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-3 sm:px-6 py-3 sm:py-4">
                  <SkeletonLoader height="h-3 sm:h-4" width={colIndex === 0 ? "w-20 sm:w-32" : "w-12 sm:w-full"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 border border-slate-100">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <SkeletonLoader height="h-3 sm:h-4" width="w-16 sm:w-20" className="mb-2" />
        <SkeletonLoader height="h-6 sm:h-8" width="w-20 sm:w-28" />
      </div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl animate-pulse flex-shrink-0" />
    </div>
  </div>
);
