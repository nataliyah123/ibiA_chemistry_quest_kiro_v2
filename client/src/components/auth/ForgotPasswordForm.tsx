import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { requestPasswordReset, clearError } from '../../store/authSlice';

const ForgotPasswordForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    try {
      await dispatch(requestPasswordReset(email)).unwrap();
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled by Redux state
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (validationError) {
      setValidationError('');
    }
    if (error) {
      dispatch(clearError());
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>📧 Check Your Email</h2>
            <p>We've sent password reset instructions to your email address.</p>
          </div>

          <div className="success-message">
            <p>
              If an account with the email <strong>{email}</strong> exists, 
              you will receive a password reset link shortly.
            </p>
            <p>
              Please check your email and follow the instructions to reset your password.
            </p>
          </div>

          <div className="auth-links">
            <Link to="/login" className="auth-button primary">
              Back to Login
            </Link>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="auth-button secondary"
            >
              Try Different Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔐 Reset Your Password</h2>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              className={validationError ? 'error' : ''}
              placeholder="Enter your email address"
              disabled={isLoading}
              required
            />
            {validationError && (
              <span className="error-message">{validationError}</span>
            )}
          </div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="link">
            ← Back to Login
          </Link>
          <div className="auth-divider">
            <span>Don't have an account?</span>
          </div>
          <Link to="/register" className="auth-button secondary">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;