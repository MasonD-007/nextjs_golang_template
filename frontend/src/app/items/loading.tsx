'use client';

import ItemSkeleton from '@/components/ItemSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Items</h1>
      <div className="space-y-8">
        {/* Create form skeleton */}
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 animate-pulse">
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2" />
          <div className="flex flex-col gap-2">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        </div>

        {/* Items list skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
