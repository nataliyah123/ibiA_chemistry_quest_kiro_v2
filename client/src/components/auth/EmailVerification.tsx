import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateUserVerificationStatus } from '../../store/authSlice';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'resending'>('idle');
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else if (user?.isVerified) {
      setStatus('success');
      setMessage('Your email is already verified!');
    } else {
      setStatus('idle');
      setMessage('Please check your email for the verification link.');
      setCanResend(true);
    }
  }, [token, user?.isVerified]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus('verifying');
    try {
      const response = await fetch(`/api/auth/verify-email/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Update user verification status in Redux
        dispatch(updateUserVerificationStatus(true));
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed');
        setCanResend(true);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify email. Please try again.');
      setCanResend(true);
    }
  };

  const resendVerification = async () => {
    setStatus('resending');
    setCanResend(false);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('idle');
        setMessage('Verification email sent! Please check your inbox and spam folder.');
        
        // Show development info if available
        if (data.verificationToken && process.env.NODE_ENV === 'development') {
          console.log('🔧 Development Mode - Verification Token:', data.verificationToken);
          console.log('🔧 Development Mode - Verification URL:', 
            `${window.location.origin}/verify-email?token=${data.verificationToken}`);
        }
        
        // Allow resend again after 30 seconds
        setTimeout(() => {
          setCanResend(true);
        }, 30000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to resend verification email');
        setCanResend(true);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to resend verification email');
      setCanResend(true);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
      case 'resending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📧';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'verifying':
      case 'resending':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className={`text-6xl mb-6 ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'verifying' && 'Verifying Your Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Issue'}
          {status === 'resending' && 'Sending Email...'}
          {status === 'idle' && 'Email Verification'}
        </h1>
        
        <p className={`mb-6 ${getStatusColor()}`}>
          {message}
        </p>

        {status === 'success' && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to dashboard in 3 seconds...
            </p>
            <Link 
              to="/dashboard" 
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Go to Dashboard Now
            </Link>
          </div>
        )}

        {(status === 'verifying' || status === 'resending') && (
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {canResend && (
          <div className="space-y-4">
            <button
              onClick={resendVerification}
              disabled={status === 'resending'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'resending' ? 'Sending...' : 'Resend Verification Email'}
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-left">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Development Mode Tips:</h3>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Check the server console for email preview URLs</li>
                  <li>• Verification tokens are logged to browser console</li>
                  <li>• Email content is displayed in server logs</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link 
            to="/dashboard" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;