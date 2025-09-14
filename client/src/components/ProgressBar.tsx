import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = 'h-2',
  color = 'bg-blue-600',
  backgroundColor = 'bg-gray-200',
  animated = false,
  showLabel = false
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${backgroundColor} rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${color} transition-all duration-300 ease-out ${
          animated ? 'animate-pulse' : ''
        }`}
        style={{ width: `${clampedProgress}%` }}
      >
        {showLabel && (
          <div className="flex items-center justify-center h-full text-xs font-medium text-white">
            {Math.round(clampedProgress)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;