import React, { useEffect, useState } from 'react';

interface XPAnimationProps {
  xpGained: number;
  onComplete?: () => void;
  duration?: number;
}

const XPAnimation: React.FC<XPAnimationProps> = ({
  xpGained,
  onComplete,
  duration = 2000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'display' | 'exit'>('enter');

  useEffect(() => {
    const phases = [
      { phase: 'enter', delay: 0 },
      { phase: 'display', delay: 300 },
      { phase: 'exit', delay: duration - 500 }
    ];

    phases.forEach(({ phase, delay }) => {
      setTimeout(() => {
        setAnimationPhase(phase as any);
      }, delay);
    });

    // Hide component and call onComplete
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'enter':
        return 'transform translate-y-0 scale-50 opacity-0';
      case 'display':
        return 'transform -translate-y-8 scale-100 opacity-100';
      case 'exit':
        return 'transform -translate-y-16 scale-75 opacity-0';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div
        className={`
          bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full
          font-bold text-lg shadow-lg border-2 border-white
          transition-all duration-500 ease-out
          ${getAnimationClasses()}
        `}
      >
        <div className="flex items-center space-x-2">
          <span className="text-2xl">✨</span>
          <span>+{xpGained} XP</span>
          <span className="text-2xl">✨</span>
        </div>
      </div>
    </div>
  );
};

export default XPAnimation;