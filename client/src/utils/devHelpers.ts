/**
 * Development helpers for testing and demo purposes
 */

export const devHelpers = {
  /**
   * Auto-verify email in development mode
   */
  async autoVerifyEmail(): Promise<boolean> {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Auto-verify is only available in development mode');
      return false;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token found');
        return false;
      }

      // Try to get the verification token from the server logs
      // In development, the server logs the verification token
      console.log('🔧 Development Mode: Check server console for verification token');
      console.log('🔧 You can manually verify by visiting: /verify-email?token=YOUR_TOKEN');
      
      return true;
    } catch (error) {
      console.error('Auto-verify failed:', error);
      return false;
    }
  },

  /**
   * Create a demo user session without actual authentication
   */
  createDemoSession(): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Demo session is only available in development mode');
      return;
    }

    const demoTokens = {
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token'
    };

    localStorage.setItem('accessToken', demoTokens.accessToken);
    localStorage.setItem('refreshToken', demoTokens.refreshToken);
    
    console.log('🔧 Demo session created - you can now access protected features');
  },

  /**
   * Clear demo session
   */
  clearDemoSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('🔧 Demo session cleared');
  },

  /**
   * Check if running in demo mode
   */
  isDemoMode(): boolean {
    const token = localStorage.getItem('accessToken');
    return token === 'demo-access-token';
  }
};

// Make available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).devHelpers = devHelpers;
  console.log('🔧 Development helpers available at window.devHelpers');
  console.log('🔧 Available methods:');
  console.log('  - devHelpers.autoVerifyEmail()');
  console.log('  - devHelpers.createDemoSession()');
  console.log('  - devHelpers.clearDemoSession()');
  console.log('  - devHelpers.isDemoMode()');
}