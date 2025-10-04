import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10 animate-pulse">
    <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-slate-700 rounded w-full"></div>
  </div>
);

export const SkeletonUserRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-slate-700 mr-3"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
          <div className="h-3 bg-slate-700 rounded w-24"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-3 bg-slate-700 rounded w-40"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-3 bg-slate-700 rounded w-32"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-slate-700 rounded w-24"></div>
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-2">
        <div className="h-6 bg-slate-700 rounded w-16"></div>
        <div className="h-6 bg-slate-700 rounded w-16"></div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-3 bg-slate-700 rounded w-20"></div>
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-2">
        <div className="h-8 bg-slate-700 rounded w-16"></div>
      </div>
    </td>
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-700/50">
          <tr>
            <th className="px-4 py-3 text-left">
              <div className="h-3 bg-slate-600 rounded w-16 animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-left">
              <div className="h-3 bg-slate-600 rounded w-16 animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-left">
              <div className="h-3 bg-slate-600 rounded w-20 animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-left">
              <div className="h-3 bg-slate-600 rounded w-12 animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-left">
              <div className="h-3 bg-slate-600 rounded w-16 animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-left">
              <div className="h-3 bg-slate-600 rounded w-16 animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-left">
              <div className="h-3 bg-slate-600 rounded w-16 animate-pulse"></div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonUserRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="h-3 bg-slate-700 rounded w-20 mb-2"></div>
        <div className="h-8 bg-slate-700 rounded w-16"></div>
      </div>
    ))}
  </div>
);

// Generic LoadingSkeleton component
interface LoadingSkeletonProps {
  height?: number;
  width?: string;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  height = 20, 
  width = '100%', 
  className = '' 
}) => (
  <div 
    className={`bg-slate-700/50 rounded animate-pulse ${className}`}
    style={{ height, width }}
  />
);

export default LoadingSkeleton;

