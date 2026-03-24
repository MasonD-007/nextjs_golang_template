'use client';

export default function ItemSkeleton() {
  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-3">
          {/* Title skeleton */}
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          {/* Description skeleton */}
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
        {/* Buttons skeleton */}
        <div className="flex gap-2 ml-4">
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      {/* Date skeleton */}
      <div className="mt-4 h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
    </div>
  );
}
