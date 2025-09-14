import React, { useState, useEffect } from 'react';
import { useResponsiveDesign, useTouchFriendly } from '../../hooks/useResponsiveDesign';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import './MobileGameControls.css';

interface MobileGameControlsProps {
  onAction: (action: string, data?: any) => void;
  actions: Array<{
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    primary?: boolean;
  }>;
  gameState?: {
    score?: number;
    lives?: number;
    time?: number;
    level?: number;
  };
  orientation?: 'portrait' | 'landscape';
}

export const MobileGameControls: React.FC<MobileGameControlsProps> = ({
  onAction,
  actions,
  gameState,
  orientation = 'portrait'
}) => {
  const { isMobile, touchSupported } = useResponsiveDesign();
  const { getTouchFriendlyProps } = useTouchFriendly();
  const { announceToScreenReader } = useAccessibility();
  
  const [isVisible, setIsVisible] = useState(true);
  const [hapticSupported, setHapticSupported] = useState(false);

  // Check for haptic feedback support
  useEffect(() => {
    setHapticSupported('vibrate' in navigator);
  }, []);

  // Auto-hide controls after inactivity (optional)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      setIsVisible(true);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // Hide after 5 seconds of inactivity
    };

    if (isMobile) {
      document.addEventListener('touchstart', resetTimeout);
      document.addEventListener('touchmove', resetTimeout);
      resetTimeout();
    }

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('touchstart', resetTimeout);
      document.removeEventListener('touchmove', resetTimeout);
    };
  }, [isMobile]);

  const handleAction = (actionId: string, actionLabel: string) => {
    // Haptic feedback for touch interactions
    if (hapticSupported) {
      navigator.vibrate(50); // Short vibration
    }

    // Screen reader announcement
    announceToScreenReader(`${actionLabel} activated`);

    // Execute action
    onAction(actionId);
  };

  const handleLongPress = (actionId: string) => {
    // Longer haptic feedback for long press
    if (hapticSupported) {
      navigator.vibrate([100, 50, 100]); // Pattern vibration
    }
    
    onAction(`${actionId}-long`);
  };

  // Don't render on desktop unless touch is supported
  if (!isMobile && !touchSupported) {
    return null;
  }

  const controlsClass = [
    'mobile-game-controls',
    orientation,
    isVisible ? 'visible' : 'hidden',
    actions.length > 4 ? 'many-actions' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={controlsClass}>
      {/* Game State Display */}
      {gameState && (
        <div className="game-state-display">
          {gameState.score !== undefined && (
            <div className="state-item">
              <span className="state-label">Score</span>
              <span className="state-value" aria-live="polite">{gameState.score}</span>
            </div>
          )}
          
          {gameState.lives !== undefined && (
            <div className="state-item">
              <span className="state-label">Lives</span>
              <span className="state-value" aria-live="polite">
                {'❤️'.repeat(gameState.lives)}
              </span>
            </div>
          )}
          
          {gameState.time !== undefined && (
            <div className="state-item">
              <span className="state-label">Time</span>
              <span className="state-value timer" aria-live="polite">
                {Math.floor(gameState.time / 60)}:{(gameState.time % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          
          {gameState.level !== undefined && (
            <div className="state-item">
              <span className="state-label">Level</span>
              <span className="state-value" aria-live="polite">{gameState.level}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        {actions.map((action) => (
          <TouchButton
            key={action.id}
            {...getTouchFriendlyProps()}
            className={`action-button ${action.primary ? 'primary' : 'secondary'}`}
            disabled={action.disabled}
            onPress={() => handleAction(action.id, action.label)}
            onLongPress={() => handleLongPress(action.id)}
            aria-label={action.label}
          >
            {action.icon && (
              <span className="button-icon" aria-hidden="true">
                {action.icon}
              </span>
            )}
            <span className="button-label">{action.label}</span>
          </TouchButton>
        ))}
      </div>

      {/* Show/Hide Toggle */}
      <button
        className="controls-toggle"
        onClick={() => setIsVisible(!isVisible)}
        aria-label={isVisible ? 'Hide controls' : 'Show controls'}
        aria-expanded={isVisible}
      >
        <span aria-hidden="true">{isVisible ? '⬇️' : '⬆️'}</span>
      </button>
    </div>
  );
};

// Custom TouchButton component with long press support
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onPress?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
}

const TouchButton: React.FC<TouchButtonProps> = ({
  onPress,
  onLongPress,
  longPressDelay = 500,
  children,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(true);
    
    if (onLongPress) {
      pressTimer.current = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, longPressDelay);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      
      if (onPress) {
        onPress();
      }
    }
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // Fallback for mouse events
  const handleClick = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <button
      {...props}
      className={`${props.className} ${isPressed ? 'pressed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};