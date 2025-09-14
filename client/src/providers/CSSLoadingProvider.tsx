import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { initializeCSSMonitoring } from '../store/cssLoadingSlice';

interface CSSLoadingProviderProps {
  children: React.ReactNode;
  autoInitialize?: boolean;
}

/**
 * Provider component that initializes CSS loading monitoring
 */
export const CSSLoadingProvider: React.FC<CSSLoadingProviderProps> = ({
  children,
  autoInitialize = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (autoInitialize) {
      // Initialize CSS monitoring when the provider mounts
      dispatch(initializeCSSMonitoring());
    }
  }, [dispatch, autoInitialize]);

  return <>{children}</>;
};

/**
 * Hook to manually initialize CSS loading monitoring
 */
export const useInitializeCSSLoading = () => {
  const dispatch = useDispatch<AppDispatch>();

  return React.useCallback(() => {
    dispatch(initializeCSSMonitoring());
  }, [dispatch]);
};