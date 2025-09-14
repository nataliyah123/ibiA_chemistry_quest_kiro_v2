import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import './AlternativeInputs.css';

interface AlternativeInputsProps {
  onInput: (value: string, method: 'voice' | 'switch' | 'eye-tracking') => void;
  placeholder?: string;
  expectedInputType?: 'text' | 'number' | 'chemical-formula' | 'multiple-choice';
  options?: string[];
}

export const AlternativeInputs: React.FC<AlternativeInputsProps> = ({
  onInput,
  placeholder = 'Enter your answer',
  expectedInputType = 'text',
  options = []
}) => {
  const { settings, announceToScreenReader } = useAccessibility();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'keyboard' | 'voice' | 'switch'>('keyboard');
  const [switchIndex, setSwitchIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const switchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for voice recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        announceToScreenReader('Voice recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleVoiceInput = (transcript: string) => {
    let processedInput = transcript.toLowerCase().trim();

    // Process based on expected input type
    switch (expectedInputType) {
      case 'number':
        // Convert spoken numbers to digits
        processedInput = convertSpokenNumbersToDigits(processedInput);
        break;
      
      case 'chemical-formula':
        // Convert spoken chemical formulas
        processedInput = convertSpokenChemicalFormula(processedInput);
        break;
      
      case 'multiple-choice':
        // Match to available options
        processedInput = matchToMultipleChoice(processedInput, options);
        break;
    }

    onInput(processedInput, 'voice');
    announceToScreenReader(`Voice input received: ${processedInput}`);
  };

  const startVoiceRecording = () => {
    if (!voiceSupported || !recognitionRef.current) {
      announceToScreenReader('Voice recognition is not supported in this browser');
      return;
    }

    setIsRecording(true);
    announceToScreenReader('Voice recording started. Speak your answer now.');
    recognitionRef.current.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Switch navigation for users with motor impairments
  const startSwitchNavigation = () => {
    if (options.length === 0) return;

    setSwitchIndex(0);
    announceToScreenReader(`Switch navigation started. Current option: ${options[0]}`);
    
    switchTimerRef.current = setInterval(() => {
      setSwitchIndex(prev => {
        const next = (prev + 1) % options.length;
        announceToScreenReader(`Option ${next + 1}: ${options[next]}`);
        return next;
      });
    }, 2000); // 2 second intervals
  };

  const selectSwitchOption = () => {
    if (switchTimerRef.current) {
      clearInterval(switchTimerRef.current);
      switchTimerRef.current = null;
    }

    if (options[switchIndex]) {
      onInput(options[switchIndex], 'switch');
      announceToScreenReader(`Selected: ${options[switchIndex]}`);
    }
  };

  const stopSwitchNavigation = () => {
    if (switchTimerRef.current) {
      clearInterval(switchTimerRef.current);
      switchTimerRef.current = null;
    }
    setSwitchIndex(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (switchTimerRef.current) {
        clearInterval(switchTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="alternative-inputs">
      <div className="input-method-selector">
        <h4>Input Method</h4>
        <div className="method-options">
          <label className="method-option">
            <input
              type="radio"
              name="input-method"
              value="keyboard"
              checked={selectedMethod === 'keyboard'}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
            />
            <span>Keyboard</span>
          </label>

          {voiceSupported && (
            <label className="method-option">
              <input
                type="radio"
                name="input-method"
                value="voice"
                checked={selectedMethod === 'voice'}
                onChange={(e) => setSelectedMethod(e.target.value as any)}
              />
              <span>Voice</span>
            </label>
          )}

          {options.length > 0 && (
            <label className="method-option">
              <input
                type="radio"
                name="input-method"
                value="switch"
                checked={selectedMethod === 'switch'}
                onChange={(e) => setSelectedMethod(e.target.value as any)}
              />
              <span>Switch Navigation</span>
            </label>
          )}
        </div>
      </div>

      {selectedMethod === 'voice' && voiceSupported && (
        <div className="voice-input-section">
          <button
            className={`voice-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
          >
            <span className="voice-icon" aria-hidden="true">
              {isRecording ? '⏹️' : '🎤'}
            </span>
            {isRecording ? 'Stop Recording' : 'Start Voice Input'}
          </button>
          
          <div className="voice-instructions">
            <h5>Voice Input Tips:</h5>
            <ul>
              <li>Speak clearly and at normal pace</li>
              <li>For numbers, say "two" instead of "2"</li>
              <li>For chemical formulas, spell out elements: "H two O"</li>
              <li>For multiple choice, say the option text</li>
            </ul>
          </div>
        </div>
      )}

      {selectedMethod === 'switch' && options.length > 0 && (
        <div className="switch-input-section">
          <div className="switch-controls">
            <button
              className="switch-button"
              onClick={switchTimerRef.current ? selectSwitchOption : startSwitchNavigation}
              aria-label={switchTimerRef.current ? 'Select current option' : 'Start switch navigation'}
            >
              {switchTimerRef.current ? 'Select Option' : 'Start Switch Navigation'}
            </button>
            
            {switchTimerRef.current && (
              <button
                className="switch-button secondary"
                onClick={stopSwitchNavigation}
                aria-label="Stop switch navigation"
              >
                Stop
              </button>
            )}
          </div>

          <div className="switch-options">
            {options.map((option, index) => (
              <div
                key={index}
                className={`switch-option ${index === switchIndex ? 'highlighted' : ''}`}
                aria-live={index === switchIndex ? 'polite' : 'off'}
              >
                {option}
              </div>
            ))}
          </div>

          <div className="switch-instructions">
            <p>Switch navigation will cycle through options every 2 seconds.</p>
            <p>Press the select button when your desired option is highlighted.</p>
          </div>
        </div>
      )}

      {!voiceSupported && selectedMethod === 'voice' && (
        <div className="unsupported-message">
          <p>Voice input is not supported in this browser.</p>
          <p>Try using Chrome, Edge, or Safari for voice recognition features.</p>
        </div>
      )}
    </div>
  );
};

// Utility functions for processing voice input
function convertSpokenNumbersToDigits(text: string): string {
  const numberMap: { [key: string]: string } = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
    'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
    'eighteen': '18', 'nineteen': '19', 'twenty': '20'
  };

  let result = text;
  Object.entries(numberMap).forEach(([word, digit]) => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  });

  return result;
}

function convertSpokenChemicalFormula(text: string): string {
  // Convert spoken chemical formulas to proper notation
  let result = text;
  
  // Common element conversions
  const elementMap: { [key: string]: string } = {
    'hydrogen': 'H', 'helium': 'He', 'lithium': 'Li', 'carbon': 'C',
    'nitrogen': 'N', 'oxygen': 'O', 'fluorine': 'F', 'sodium': 'Na',
    'magnesium': 'Mg', 'aluminum': 'Al', 'silicon': 'Si', 'phosphorus': 'P',
    'sulfur': 'S', 'chlorine': 'Cl', 'potassium': 'K', 'calcium': 'Ca'
  };

  Object.entries(elementMap).forEach(([name, symbol]) => {
    result = result.replace(new RegExp(`\\b${name}\\b`, 'gi'), symbol);
  });

  // Convert spoken numbers to subscripts
  result = convertSpokenNumbersToDigits(result);
  
  return result;
}

function matchToMultipleChoice(text: string, options: string[]): string {
  // Find the best match among available options
  const lowerText = text.toLowerCase();
  
  // First, try exact match
  for (const option of options) {
    if (option.toLowerCase() === lowerText) {
      return option;
    }
  }
  
  // Then try partial match
  for (const option of options) {
    if (option.toLowerCase().includes(lowerText) || lowerText.includes(option.toLowerCase())) {
      return option;
    }
  }
  
  // Finally, try fuzzy matching (simple word overlap)
  const textWords = lowerText.split(' ');
  let bestMatch = options[0];
  let bestScore = 0;
  
  for (const option of options) {
    const optionWords = option.toLowerCase().split(' ');
    const commonWords = textWords.filter(word => optionWords.includes(word));
    const score = commonWords.length / Math.max(textWords.length, optionWords.length);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = option;
    }
  }
  
  return bestMatch;
}