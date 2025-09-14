import React, { useState } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import './AccessibilitySettings.css';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, announceToScreenReader } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'motor'>('visual');

  if (!isOpen) return null;

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSettings({ [key]: value });
    announceToScreenReader(`${key} setting changed to ${value}`);
  };

  const resetToDefaults = () => {
    updateSettings({
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      audioDescriptions: false,
      focusIndicators: true,
    });
    announceToScreenReader('Accessibility settings reset to defaults');
  };

  return (
    <div className="accessibility-modal-overlay" onClick={onClose}>
      <div 
        className="accessibility-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
      >
        <div className="accessibility-header">
          <h2 id="accessibility-title">Accessibility Settings</h2>
          <p id="accessibility-description">
            Customize your experience to meet your accessibility needs
          </p>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close accessibility settings"
          >
            ×
          </button>
        </div>

        <div className="accessibility-tabs">
          <button
            className={`tab ${activeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual')}
            aria-pressed={activeTab === 'visual'}
          >
            Visual
          </button>
          <button
            className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveTab('audio')}
            aria-pressed={activeTab === 'audio'}
          >
            Audio
          </button>
          <button
            className={`tab ${activeTab === 'motor' ? 'active' : ''}`}
            onClick={() => setActiveTab('motor')}
            aria-pressed={activeTab === 'motor'}
          >
            Motor
          </button>
        </div>

        <div className="accessibility-content">
          {activeTab === 'visual' && (
            <div className="settings-section" role="tabpanel" aria-labelledby="visual-tab">
              <h3>Visual Accessibility</h3>
              
              <div className="setting-item">
                <label htmlFor="high-contrast">
                  <input
                    id="high-contrast"
                    type="checkbox"
                    checked={settings.highContrast}
                    onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                  />
                  High Contrast Mode
                </label>
                <p className="setting-description">
                  Increases contrast between text and background for better visibility
                </p>
              </div>

              <div className="setting-item">
                <label htmlFor="font-size">Font Size</label>
                <select
                  id="font-size"
                  value={settings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
                <p className="setting-description">
                  Adjust text size throughout the application
                </p>
              </div>

              <div className="setting-item">
                <label htmlFor="reduced-motion">
                  <input
                    id="reduced-motion"
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                  />
                  Reduce Motion
                </label>
                <p className="setting-description">
                  Minimizes animations and transitions that may cause discomfort
                </p>
              </div>

              <div className="setting-item">
                <label htmlFor="focus-indicators">
                  <input
                    id="focus-indicators"
                    type="checkbox"
                    checked={settings.focusIndicators}
                    onChange={(e) => handleSettingChange('focusIndicators', e.target.checked)}
                  />
                  Enhanced Focus Indicators
                </label>
                <p className="setting-description">
                  Shows clear visual indicators when navigating with keyboard
                </p>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="settings-section" role="tabpanel" aria-labelledby="audio-tab">
              <h3>Audio Accessibility</h3>
              
              <div className="setting-item">
                <label htmlFor="screen-reader-mode">
                  <input
                    id="screen-reader-mode"
                    type="checkbox"
                    checked={settings.screenReaderMode}
                    onChange={(e) => handleSettingChange('screenReaderMode', e.target.checked)}
                  />
                  Screen Reader Optimization
                </label>
                <p className="setting-description">
                  Optimizes content structure and provides additional context for screen readers
                </p>
              </div>

              <div className="setting-item">
                <label htmlFor="audio-descriptions">
                  <input
                    id="audio-descriptions"
                    type="checkbox"
                    checked={settings.audioDescriptions}
                    onChange={(e) => handleSettingChange('audioDescriptions', e.target.checked)}
                  />
                  Audio Descriptions
                </label>
                <p className="setting-description">
                  Provides spoken descriptions of visual game elements and animations
                </p>
              </div>

              <div className="setting-item">
                <h4>Screen Reader Instructions</h4>
                <div className="instructions">
                  <p><strong>Navigation:</strong> Use Tab to move between elements, Enter to activate</p>
                  <p><strong>Games:</strong> Arrow keys to navigate game boards, Space to select</p>
                  <p><strong>Forms:</strong> Use Tab to move between fields, labels are read automatically</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'motor' && (
            <div className="settings-section" role="tabpanel" aria-labelledby="motor-tab">
              <h3>Motor Accessibility</h3>
              
              <div className="setting-item">
                <label htmlFor="keyboard-navigation">
                  <input
                    id="keyboard-navigation"
                    type="checkbox"
                    checked={settings.keyboardNavigation}
                    onChange={(e) => handleSettingChange('keyboardNavigation', e.target.checked)}
                  />
                  Enhanced Keyboard Navigation
                </label>
                <p className="setting-description">
                  Enables full keyboard control of all game mechanics and interface elements
                </p>
              </div>

              <div className="setting-item">
                <h4>Keyboard Shortcuts</h4>
                <div className="keyboard-shortcuts">
                  <ul>
                    <li><kbd>Tab</kbd> - Navigate forward</li>
                    <li><kbd>Shift + Tab</kbd> - Navigate backward</li>
                    <li><kbd>Enter</kbd> - Activate buttons and links</li>
                    <li><kbd>Space</kbd> - Select items in games</li>
                    <li><kbd>Arrow Keys</kbd> - Navigate game boards</li>
                    <li><kbd>Escape</kbd> - Close modals and menus</li>
                    <li><kbd>Alt + A</kbd> - Open accessibility settings</li>
                  </ul>
                </div>
              </div>

              <div className="setting-item">
                <h4>Alternative Input Methods</h4>
                <p className="setting-description">
                  Voice commands and switch navigation are supported in compatible browsers
                </p>
                <button className="test-voice-button" type="button">
                  Test Voice Input
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="accessibility-footer">
          <button className="btn btn-secondary" onClick={resetToDefaults}>
            Reset to Defaults
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};