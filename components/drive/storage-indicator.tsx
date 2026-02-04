'use client';

import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/drive/storage';
import { HardDrive } from 'lucide-react';

interface StorageIndicatorProps {
  used: bigint;
  limit: bigint;
  className?: string;
}

export function StorageIndicator({ used, limit, className = '' }: StorageIndicatorProps) {
  const usedNum = Number(used);
  const limitNum = Number(limit);
  const percentage = limitNum > 0 ? (usedNum / limitNum) * 100 : 0;
  
  const getColor = () => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          <span className="font-medium">Storage</span>
        </div>
        <span className={`font-medium ${getColor()}`}>
          {formatBytes(usedNum)} / {formatBytes(limitNum)}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        indicatorClassName={percentage >= 90 ? 'bg-red-600' : percentage >= 75 ? 'bg-yellow-600' : 'bg-blue-600'}
      />
      <div className="text-xs text-muted-foreground">
        {percentage.toFixed(1)}% used
      </div>
    </div>
  );
}
