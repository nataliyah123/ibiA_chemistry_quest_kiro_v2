import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getProfile, initializeAuth } from '../../store/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireVerification = false 
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, user, isLoading, tokens } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize auth state from localStorage
    if (!isAuthenticated && (tokens.accessToken || tokens.refreshToken)) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isAuthenticated, tokens.accessToken, tokens.refreshToken]);

  useEffect(() => {
    // If we have tokens but no user data, fetch profile (only once)
    if (isAuthenticated && !user && !isLoading) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, user, isLoading]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireVerification && user && !user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;