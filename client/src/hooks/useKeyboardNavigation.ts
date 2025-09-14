import { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean;
  enableTabTrapping?: boolean;
  enableEscapeKey?: boolean;
  onEscape?: () => void;
  gridNavigation?: boolean;
  gridColumns?: number;
}

export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) => {
  const { settings, announceToScreenReader } = useAccessibility();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const {
    enableArrowKeys = true,
    enableTabTrapping = false,
    enableEscapeKey = true,
    onEscape,
    gridNavigation = false,
    gridColumns = 3
  } = options;

  // Get all focusable elements within the container
  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '.focusable:not([disabled])'
    ].join(', ');

    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    // Filter out hidden elements
    const visibleElements = elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    setFocusableElements(visibleElements);
    return visibleElements;
  }, [containerRef]);

  // Focus element by index
  const focusElementByIndex = useCallback((index: number) => {
    const elements = focusableElements;
    if (elements.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, elements.length - 1));
    const element = elements[clampedIndex];
    
    if (element) {
      element.focus();
      setFocusedIndex(clampedIndex);
      
      // Announce to screen reader
      const label = element.getAttribute('aria-label') || 
                   element.getAttribute('title') || 
                   element.textContent || 
                   'Interactive element';
      announceToScreenReader(`Focused on ${label}`);
    }
  }, [focusableElements, announceToScreenReader]);

  // Navigate in grid layout
  const navigateGrid = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const currentRow = Math.floor(focusedIndex / gridColumns);
    const currentCol = focusedIndex % gridColumns;
    let newIndex = focusedIndex;

    switch (direction) {
      case 'up':
        if (currentRow > 0) {
          newIndex = (currentRow - 1) * gridColumns + currentCol;
        }
        break;
      case 'down':
        if ((currentRow + 1) * gridColumns + currentCol < focusableElements.length) {
          newIndex = (currentRow + 1) * gridColumns + currentCol;
        }
        break;
      case 'left':
        if (currentCol > 0) {
          newIndex = focusedIndex - 1;
        }
        break;
      case 'right':
        if (currentCol < gridColumns - 1 && focusedIndex + 1 < focusableElements.length) {
          newIndex = focusedIndex + 1;
        }
        break;
    }

    focusElementByIndex(newIndex);
  }, [focusedIndex, gridColumns, focusableElements.length, focusElementByIndex]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!settings.keyboardNavigation || focusableElements.length === 0) return;

    switch (event.key) {
      case 'ArrowUp':
        if (enableArrowKeys) {
          event.preventDefault();
          if (gridNavigation) {
            navigateGrid('up');
          } else {
            focusElementByIndex(focusedIndex - 1);
          }
        }
        break;

      case 'ArrowDown':
        if (enableArrowKeys) {
          event.preventDefault();
          if (gridNavigation) {
            navigateGrid('down');
          } else {
            focusElementByIndex(focusedIndex + 1);
          }
        }
        break;

      case 'ArrowLeft':
        if (enableArrowKeys) {
          event.preventDefault();
          if (gridNavigation) {
            navigateGrid('left');
          } else {
            focusElementByIndex(focusedIndex - 1);
          }
        }
        break;

      case 'ArrowRight':
        if (enableArrowKeys) {
          event.preventDefault();
          if (gridNavigation) {
            navigateGrid('right');
          } else {
            focusElementByIndex(focusedIndex + 1);
          }
        }
        break;

      case 'Home':
        if (enableArrowKeys) {
          event.preventDefault();
          focusElementByIndex(0);
        }
        break;

      case 'End':
        if (enableArrowKeys) {
          event.preventDefault();
          focusElementByIndex(focusableElements.length - 1);
        }
        break;

      case 'Tab':
        if (enableTabTrapping) {
          event.preventDefault();
          const direction = event.shiftKey ? -1 : 1;
          const newIndex = (focusedIndex + direction + focusableElements.length) % focusableElements.length;
          focusElementByIndex(newIndex);
        }
        break;

      case 'Escape':
        if (enableEscapeKey && onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;

      case 'Enter':
      case ' ':
        // Let the default behavior handle activation
        break;
    }
  }, [
    settings.keyboardNavigation,
    focusableElements.length,
    enableArrowKeys,
    enableTabTrapping,
    enableEscapeKey,
    gridNavigation,
    focusedIndex,
    navigateGrid,
    focusElementByIndex,
    onEscape
  ]);

  // Track focus changes
  const handleFocusChange = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    const index = focusableElements.indexOf(target);
    if (index !== -1) {
      setFocusedIndex(index);
    }
  }, [focusableElements]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateFocusableElements();

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusin', handleFocusChange);

    // Store the last focused element when component mounts
    lastFocusedElement.current = document.activeElement as HTMLElement;

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusin', handleFocusChange);
    };
  }, [containerRef, handleKeyDown, handleFocusChange, updateFocusableElements]);

  // Update focusable elements when container content changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      updateFocusableElements();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'hidden']
    });

    return () => observer.disconnect();
  }, [containerRef, updateFocusableElements]);

  // Restore focus when component unmounts
  useEffect(() => {
    return () => {
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    };
  }, []);

  return {
    focusedIndex,
    focusableElements,
    focusElementByIndex,
    updateFocusableElements,
    setFocusedIndex
  };
};

// Hook for managing focus trapping in modals
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { focusElementByIndex } = useKeyboardNavigation(containerRef, {
    enableTabTrapping: true,
    enableArrowKeys: false
  });

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Focus the first focusable element when trap becomes active
      focusElementByIndex(0);
    }
  }, [isActive, focusElementByIndex]);

  return containerRef;
};

// Hook for announcing game state changes
export const useGameAnnouncements = () => {
  const { announceToScreenReader, settings } = useAccessibility();

  const announceScore = useCallback((score: number, maxScore?: number) => {
    if (settings.screenReaderMode) {
      const message = maxScore 
        ? `Score: ${score} out of ${maxScore}` 
        : `Score: ${score}`;
      announceToScreenReader(message);
    }
  }, [announceToScreenReader, settings.screenReaderMode]);

  const announceGameState = useCallback((state: string, details?: string) => {
    if (settings.screenReaderMode) {
      const message = details ? `${state}. ${details}` : state;
      announceToScreenReader(message);
    }
  }, [announceToScreenReader, settings.screenReaderMode]);

  const announceCorrectAnswer = useCallback((explanation?: string) => {
    if (settings.screenReaderMode) {
      const message = explanation 
        ? `Correct! ${explanation}` 
        : 'Correct answer!';
      announceToScreenReader(message);
    }
  }, [announceToScreenReader, settings.screenReaderMode]);

  const announceIncorrectAnswer = useCallback((correctAnswer?: string) => {
    if (settings.screenReaderMode) {
      const message = correctAnswer 
        ? `Incorrect. The correct answer is ${correctAnswer}` 
        : 'Incorrect answer. Try again.';
      announceToScreenReader(message);
    }
  }, [announceToScreenReader, settings.screenReaderMode]);

  return {
    announceScore,
    announceGameState,
    announceCorrectAnswer,
    announceIncorrectAnswer
  };
};