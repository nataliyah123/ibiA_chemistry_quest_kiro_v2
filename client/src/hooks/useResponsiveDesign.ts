import { useState, useEffect } from 'react';

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  touchSupported: boolean;
  pixelRatio: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  largeDesktop: 1920
};

export const useResponsiveDesign = (breakpoints: BreakpointConfig = defaultBreakpoints) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        width: 1024,
        height: 768,
        orientation: 'landscape',
        touchSupported: false,
        pixelRatio: 1
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
      isDesktop: width >= breakpoints.tablet && width < breakpoints.largeDesktop,
      isLargeDesktop: width >= breakpoints.largeDesktop,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDeviceInfo({
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
        isDesktop: width >= breakpoints.tablet && width < breakpoints.largeDesktop,
        isLargeDesktop: width >= breakpoints.largeDesktop,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait',
        touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pixelRatio: window.devicePixelRatio || 1
      });
    };

    // Debounce resize events
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDeviceInfo, 150);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, [breakpoints]);

  return deviceInfo;
};

// Hook for managing touch-friendly interactions
export const useTouchFriendly = () => {
  const { isMobile, touchSupported } = useResponsiveDesign();
  
  const getTouchFriendlyProps = (baseProps: any = {}) => {
    if (!touchSupported && !isMobile) return baseProps;

    return {
      ...baseProps,
      style: {
        minHeight: '44px',
        minWidth: '44px',
        padding: isMobile ? '12px 16px' : baseProps.style?.padding,
        fontSize: isMobile ? '1.1rem' : baseProps.style?.fontSize,
        ...baseProps.style
      },
      // Add touch event handlers for better responsiveness
      onTouchStart: (e: TouchEvent) => {
        // Add visual feedback for touch
        const target = e.currentTarget as HTMLElement;
        target.style.transform = 'scale(0.98)';
        target.style.opacity = '0.8';
        
        if (baseProps.onTouchStart) {
          baseProps.onTouchStart(e);
        }
      },
      onTouchEnd: (e: TouchEvent) => {
        // Remove visual feedback
        const target = e.currentTarget as HTMLElement;
        target.style.transform = '';
        target.style.opacity = '';
        
        if (baseProps.onTouchEnd) {
          baseProps.onTouchEnd(e);
        }
      }
    };
  };

  return { getTouchFriendlyProps, isMobile, touchSupported };
};

// Hook for responsive grid layouts
export const useResponsiveGrid = (
  columns: { mobile: number; tablet: number; desktop: number }
) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveDesign();
  
  const getGridColumns = () => {
    if (isMobile) return columns.mobile;
    if (isTablet) return columns.tablet;
    return columns.desktop;
  };

  const getGridStyles = () => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
    gap: isMobile ? '12px' : isTablet ? '16px' : '20px'
  });

  return { getGridColumns, getGridStyles };
};

// Hook for managing viewport units safely
export const useViewportUnits = () => {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 768;
  });

  useEffect(() => {
    const updateViewportHeight = () => {
      // Use visual viewport API if available for better mobile support
      if ('visualViewport' in window) {
        setViewportHeight(window.visualViewport!.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();

    if ('visualViewport' in window) {
      window.visualViewport!.addEventListener('resize', updateViewportHeight);
      return () => {
        window.visualViewport!.removeEventListener('resize', updateViewportHeight);
      };
    } else {
      window.addEventListener('resize', updateViewportHeight);
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
      };
    }
  }, []);

  // Safe viewport height that accounts for mobile browser UI
  const safeViewportHeight = viewportHeight * 0.01;

  return {
    viewportHeight,
    safeViewportHeight,
    vh: (value: number) => `${value * safeViewportHeight}px`
  };
};

// Hook for performance optimization on mobile
export const useMobilePerformance = () => {
  const { isMobile, pixelRatio } = useResponsiveDesign();
  
  const shouldReduceQuality = isMobile && pixelRatio > 2;
  const shouldLazyLoad = isMobile;
  const shouldPreloadCritical = !isMobile;

  const getImageProps = (src: string, alt: string, critical = false) => ({
    src,
    alt,
    loading: (critical || shouldPreloadCritical) ? 'eager' : 'lazy' as const,
    decoding: 'async' as const,
    style: {
      imageRendering: shouldReduceQuality ? 'optimizeSpeed' : 'auto'
    }
  });

  const getAnimationProps = () => ({
    style: {
      willChange: isMobile ? 'auto' : 'transform',
      backfaceVisibility: 'hidden' as const,
      perspective: isMobile ? 'none' : '1000px'
    }
  });

  return {
    shouldReduceQuality,
    shouldLazyLoad,
    shouldPreloadCritical,
    getImageProps,
    getAnimationProps,
    isMobile
  };
};