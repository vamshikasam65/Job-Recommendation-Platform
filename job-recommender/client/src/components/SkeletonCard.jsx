import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 shimmer-bg h-44 w-full">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-800/60 rounded-md w-1/3 mb-2"></div>
          <div className="h-3 bg-indigo-500/20 rounded-md w-1/4"></div>
        </div>
        <div className="w-24 h-6 bg-gray-800/60 rounded-md"></div>
      </div>
      <div className="h-4 bg-gray-800/40 rounded-md w-full"></div>
      <div className="h-4 bg-gray-800/40 rounded-md w-5/6"></div>
      <div className="pt-4 border-t border-gray-800/50 flex gap-2">
        <div className="w-16 h-4 bg-gray-800/50 rounded-md"></div>
        <div className="w-20 h-5 bg-gray-800/50 rounded-md"></div>
        <div className="w-20 h-5 bg-gray-800/50 rounded-md"></div>
      </div>
    </div>
  );
}
