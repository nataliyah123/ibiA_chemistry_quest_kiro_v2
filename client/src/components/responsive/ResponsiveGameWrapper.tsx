import React, { useState, useEffect, useRef } from 'react';
import { useResponsiveDesign, useTouchFriendly, useViewportUnits } from '../../hooks/useResponsiveDesign';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import './ResponsiveGameWrapper.css';

interface ResponsiveGameWrapperProps {
  children: React.ReactNode;
  gameTitle: string;
  instructions?: string;
  keyboardShortcuts?: Array<{ key: string; description: string }>;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  requiresLandscape?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export const ResponsiveGameWrapper: React.FC<ResponsiveGameWrapperProps> = ({
  children,
  gameTitle,
  instructions,
  keyboardShortcuts = [],
  onOrientationChange,
  requiresLandscape = false,
  minWidth = 320,
  minHeight = 480
}) => {
  const deviceInfo = useResponsiveDesign();
  const { getTouchFriendlyProps } = useTouchFriendly();
  const { vh } = useViewportUnits();
  const { settings, announceToScreenReader } = useAccessibility();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [orientationWarning, setOrientationWarning] = useState(false);

  // Keyboard navigation for game wrapper
  useKeyboardNavigation(containerRef, {
    enableArrowKeys: true,
    enableEscapeKey: true,
    onEscape: () => {
      if (isFullscreen) {
        exitFullscreen();
      } else if (showInstructions) {
        setShowInstructions(false);
      }
    }
  });

  // Handle orientation changes
  useEffect(() => {
    if (onOrientationChange) {
      onOrientationChange(deviceInfo.orientation);
    }

    // Show warning if landscape is required but device is in portrait
    if (requiresLandscape && deviceInfo.orientation === 'portrait' && deviceInfo.isMobile) {
      setOrientationWarning(true);
      announceToScreenReader('This game works best in landscape orientation. Please rotate your device.');
    } else {
      setOrientationWarning(false);
    }
  }, [deviceInfo.orientation, onOrientationChange, requiresLandscape, deviceInfo.isMobile, announceToScreenReader]);

  // Handle viewport size warnings
  useEffect(() => {
    if (deviceInfo.width < minWidth || deviceInfo.height < minHeight) {
      announceToScreenReader('Screen size may be too small for optimal gameplay. Consider using a larger screen or rotating your device.');
    }
  }, [deviceInfo.width, deviceInfo.height, minWidth, minHeight, announceToScreenReader]);

  const enterFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        await (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        await (containerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      announceToScreenReader('Entered fullscreen mode');
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      announceToScreenReader('Could not enter fullscreen mode');
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
      announceToScreenReader('Exited fullscreen mode');
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const gameWrapperClass = [
    'responsive-game-wrapper',
    deviceInfo.isMobile ? 'mobile' : '',
    deviceInfo.isTablet ? 'tablet' : '',
    deviceInfo.orientation,
    isFullscreen ? 'fullscreen' : '',
    settings.reducedMotion ? 'reduced-motion' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={containerRef}
      className={gameWrapperClass}
      style={{
        minHeight: deviceInfo.isMobile ? vh(100) : '600px'
      }}
      role="application"
      aria-label={`${gameTitle} game`}
    >
      {/* Game Header */}
      <header className="game-header">
        <h1 className="game-title">{gameTitle}</h1>
        
        <div className="game-controls">
          {instructions && (
            <button
              {...getTouchFriendlyProps()}
              className="control-button"
              onClick={() => setShowInstructions(!showInstructions)}
              aria-label="Toggle game instructions"
              aria-expanded={showInstructions}
            >
              <span aria-hidden="true">❓</span>
              <span className="control-label">Help</span>
            </button>
          )}
          
          {!deviceInfo.isMobile && (
            <button
              {...getTouchFriendlyProps()}
              className="control-button"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <span aria-hidden="true">{isFullscreen ? '🗗' : '⛶'}</span>
              <span className="control-label">
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Orientation Warning */}
      {orientationWarning && (
        <div className="orientation-warning" role="alert">
          <div className="warning-content">
            <span className="warning-icon" aria-hidden="true">📱</span>
            <p>For the best experience, please rotate your device to landscape mode.</p>
            <button
              className="dismiss-warning"
              onClick={() => setOrientationWarning(false)}
              aria-label="Dismiss orientation warning"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Instructions Panel */}
      {showInstructions && instructions && (
        <div className="instructions-panel" role="dialog" aria-labelledby="instructions-title">
          <div className="instructions-content">
            <h2 id="instructions-title">How to Play</h2>
            <div className="instructions-text">
              {instructions}
            </div>
            
            {keyboardShortcuts.length > 0 && (
              <div className="keyboard-shortcuts">
                <h3>Keyboard Shortcuts</h3>
                <ul>
                  {keyboardShortcuts.map((shortcut, index) => (
                    <li key={index}>
                      <kbd>{shortcut.key}</kbd>
                      <span>{shortcut.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              className="close-instructions"
              onClick={() => setShowInstructions(false)}
              aria-label="Close instructions"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Game Content */}
      <main className="game-content">
        {children}
      </main>

      {/* Mobile Game Controls Overlay */}
      {deviceInfo.isMobile && (
        <div className="mobile-controls-overlay">
          <div className="mobile-controls">
            <button
              {...getTouchFriendlyProps()}
              className="mobile-control-button"
              onClick={() => setShowInstructions(true)}
              aria-label="Show instructions"
            >
              Help
            </button>
          </div>
        </div>
      )}

      {/* Screen Reader Live Region for Game Updates */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        id="game-announcements"
      />
    </div>
  );
};