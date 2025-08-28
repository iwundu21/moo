
'use client';

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-8 animate-pulse">
      <header className="flex items-center space-x-4 pt-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
        </div>
      </header>

      <div className="text-center space-y-2">
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-10 w-64 mx-auto" />
      </div>

      <div className="space-y-4 rounded-lg p-6">
          <div className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-24" />
          </div>
          <div>
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-full mt-2" />
          </div>
      </div>
      
      <div className="space-y-4">
          <div className="rounded-lg p-6 space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-12 w-full" />
          </div>
      </div>
      
       <div className="space-y-4 rounded-lg p-6">
            <div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full mt-2" />
            </div>
            <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-28" />
                </div>
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-28" />
                </div>
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>
      </div>
    </div>
  );
}

    