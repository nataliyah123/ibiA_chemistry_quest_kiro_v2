import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { AccessibilitySettings } from './AccessibilitySettings';
import './AccessibilityToolbar.css';

export const AccessibilityToolbar: React.FC = () => {
  const { settings, updateSettings, announceToScreenReader } = useAccessibility();
  const [showSettings, setShowSettings] = useState(false);

  // Listen for global accessibility settings shortcut
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
      announceToScreenReader('Accessibility settings opened');
    };

    window.addEventListener('openAccessibilitySettings', handleOpenSettings);
    return () => window.removeEventListener('openAccessibilitySettings', handleOpenSettings);
  }, [announceToScreenReader]);

  const toggleHighContrast = () => {
    const newValue = !settings.highContrast;
    updateSettings({ highContrast: newValue });
    announceToScreenReader(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  const increaseFontSize = () => {
    const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
    const newSize = sizes[nextIndex];
    
    if (newSize !== settings.fontSize) {
      updateSettings({ fontSize: newSize });
      announceToScreenReader(`Font size changed to ${newSize}`);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = Math.max(currentIndex - 1, 0);
    const newSize = sizes[nextIndex];
    
    if (newSize !== settings.fontSize) {
      updateSettings({ fontSize: newSize });
      announceToScreenReader(`Font size changed to ${newSize}`);
    }
  };

  const toggleReducedMotion = () => {
    const newValue = !settings.reducedMotion;
    updateSettings({ reducedMotion: newValue });
    announceToScreenReader(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
  };

  return (
    <>
      <div className="accessibility-toolbar" role="toolbar" aria-label="Accessibility controls">
        <button
          className="toolbar-button"
          onClick={() => setShowSettings(true)}
          aria-label="Open accessibility settings"
          title="Accessibility Settings (Alt+A)"
        >
          <span className="toolbar-icon" aria-hidden="true">⚙️</span>
          <span className="toolbar-label">Settings</span>
        </button>

        <button
          className={`toolbar-button ${settings.highContrast ? 'active' : ''}`}
          onClick={toggleHighContrast}
          aria-label={`${settings.highContrast ? 'Disable' : 'Enable'} high contrast mode`}
          aria-pressed={settings.highContrast}
          title="Toggle High Contrast"
        >
          <span className="toolbar-icon" aria-hidden="true">🎨</span>
          <span className="toolbar-label">Contrast</span>
        </button>

        <div className="font-size-controls">
          <button
            className="toolbar-button font-button"
            onClick={decreaseFontSize}
            aria-label="Decrease font size"
            title="Decrease Font Size"
            disabled={settings.fontSize === 'small'}
          >
            <span className="toolbar-icon" aria-hidden="true">A-</span>
          </button>
          
          <span className="font-size-indicator" aria-live="polite">
            {settings.fontSize}
          </span>
          
          <button
            className="toolbar-button font-button"
            onClick={increaseFontSize}
            aria-label="Increase font size"
            title="Increase Font Size"
            disabled={settings.fontSize === 'extra-large'}
          >
            <span className="toolbar-icon" aria-hidden="true">A+</span>
          </button>
        </div>

        <button
          className={`toolbar-button ${settings.reducedMotion ? 'active' : ''}`}
          onClick={toggleReducedMotion}
          aria-label={`${settings.reducedMotion ? 'Disable' : 'Enable'} reduced motion`}
          aria-pressed={settings.reducedMotion}
          title="Toggle Reduced Motion"
        >
          <span className="toolbar-icon" aria-hidden="true">🎭</span>
          <span className="toolbar-label">Motion</span>
        </button>

        <div className="toolbar-divider" aria-hidden="true"></div>

        <button
          className="toolbar-button help-button"
          onClick={() => announceToScreenReader('Use Tab to navigate, Enter to activate buttons, Arrow keys for game controls, Alt+A for accessibility settings')}
          aria-label="Announce keyboard shortcuts"
          title="Keyboard Help"
        >
          <span className="toolbar-icon" aria-hidden="true">❓</span>
          <span className="toolbar-label">Help</span>
        </button>
      </div>

      <AccessibilitySettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};