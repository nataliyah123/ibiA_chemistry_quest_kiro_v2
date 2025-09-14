import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { initializeAuth, logoutUser } from './store/authSlice';

//ibia changed line 267 from gamerealm to MathmageTrialsRealm
// Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import EmailVerification from './components/auth/EmailVerification';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './components/Dashboard';
import CharacterProfile from './components/CharacterProfile';
import { GameRealm } from './pages/GameRealm'; 
import { EquationDuelsDemoOffline } from './components/demos/EquationDuelsDemoOffline';
import { ContentManagementDemo } from './components/demos/ContentManagementDemo';
import CSSLoadingTestPage from './pages/CSSLoadingTestPage';
import CSSRetryTestPage from './pages/CSSRetryTestPage';
import CSSFallbackTestPage from './pages/CSSFallbackTestPage';
import CSSFallbackDevTestPage from './pages/CSSFallbackDevTestPage';
import RefreshControlExample from './examples/RefreshControlExample';

// Accessibility Components
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AccessibilityToolbar } from './components/accessibility/AccessibilityToolbar';

// Service Worker utilities (not used, but kept for reference)
// import { registerSW } from './utils/serviceWorker';

// CSS Loading Monitor
import { initializeCSSMonitor } from './utils/initializeCSSMonitor';
import { initializeCSSFallback } from './utils/cssLoadingFallback';

// Development helpers
import './utils/devHelpers';

import './App.css';
import './styles/accessibility.css';
import './styles/responsive.css';

// Home component for non-authenticated users
const Home = () => (
  <div className="page">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    
    <div className="hero-section">
      <h1>🧪 ChemQuest: Alchemist Academy</h1>
      <p>Transform your chemistry learning into an epic adventure!</p>
      <div className="hero-actions">
        <Link to="/register" className="btn btn-primary">Start Your Journey</Link>
        <Link to="/login" className="btn btn-secondary">Login</Link>
        <Link to="/demo" className="btn btn-accent">Try Demo</Link>
        <Link to="/content-management" className="btn btn-accent">Content Management</Link>
      </div>
    </div>
    
    <main id="main-content" className="features-section">
      <h2>Explore the Realms</h2>
      <div className="realms-grid" role="grid" aria-label="Chemistry learning realms">
        <div className="realm-card" role="gridcell" tabIndex={0}>
          <div className="realm-icon" aria-hidden="true">🔮</div>
          <h3>Mathmage Trials</h3>
          <p>Master equation balancing and stoichiometry through magical duels</p>
        </div>
        <div className="realm-card" role="gridcell" tabIndex={0}>
          <div className="realm-icon" aria-hidden="true">🧠</div>
          <h3>Memory Labyrinth</h3>
          <p>Test your knowledge of chemical properties and reactions</p>
        </div>
        <div className="realm-card" role="gridcell" tabIndex={0}>
          <div className="realm-icon" aria-hidden="true">⚗️</div>
          <h3>Virtual Apprentice</h3>
          <p>Learn laboratory techniques without physical equipment</p>
        </div>
        <div className="realm-card" role="gridcell" tabIndex={0}>
          <div className="realm-icon" aria-hidden="true">👁️</div>
          <h3>Seer's Challenge</h3>
          <p>Develop observation skills and predict reaction outcomes</p>
        </div>
        <div className="realm-card" role="gridcell" tabIndex={0}>
          <div className="realm-icon" aria-hidden="true">📊</div>
          <h3>Cartographer's Gauntlet</h3>
          <p>Analyze data and interpret chemical graphs</p>
        </div>
        <div className="realm-card" role="gridcell" tabIndex={0}>
          <div className="realm-icon" aria-hidden="true">🌿</div>
          <h3>Forest of Isomers</h3>
          <p>Navigate the complex world of organic chemistry</p>
        </div>
      </div>
    </main>
  </div>
);

// Navigation component
const Navigation: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav-brand" aria-label="ChemQuest home">
        🧪 ChemQuest
      </Link>
      
      <div className="nav-links" role="menubar">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link" role="menuitem">Dashboard</Link>
            <Link to="/profile" className="nav-link" role="menuitem">Profile</Link>
            <span className="nav-user" aria-live="polite">Welcome, {user?.username}!</span>
            <button 
              onClick={handleLogout} 
              className="nav-button"
              role="menuitem"
              aria-label="Logout from your account"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/demo" className="nav-link" role="menuitem">Demo</Link>
            <Link to="/content-management" className="nav-link" role="menuitem">Content Mgmt</Link>
            <Link to="/css-test" className="nav-link" role="menuitem">CSS Test</Link>
            <Link to="/css-retry-test" className="nav-link" role="menuitem">CSS Retry</Link>
            <Link to="/css-fallback-test" className="nav-link" role="menuitem">CSS Fallback</Link>
            <Link to="/css-dev-test" className="nav-link" role="menuitem">CSS Dev Test</Link>
            <Link to="/refresh-control" className="nav-link" role="menuitem">Refresh Control</Link>
            <Link to="/login" className="nav-link" role="menuitem">Login</Link>
            <Link to="/register" className="nav-link" role="menuitem">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

// Main App component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize authentication state from localStorage
    dispatch(initializeAuth());
    
    // Initialize CSS fallback system for development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        initializeCSSFallback({
          retryAttempts: 3,
          retryDelay: 1000
        });
        console.log('CSS fallback system initialized for development mode');
      } catch (error) {
        console.warn('CSS fallback initialization failed:', error);
      }
    }
    
    // CSS monitoring disabled in development to prevent false positives and refresh loops
    if (process.env.NODE_ENV === 'production') {
      try {
        initializeCSSMonitor();
      } catch (error) {
        console.warn('CSS monitor initialization failed:', error);
      }
    } else {
      console.log('CSS monitoring disabled in development mode');
    }
  }, [dispatch]);

  return (
    <Router>
      <div className="App">
        <Navigation />
        
        <main className="main-content" role="main">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />} 
            />
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterForm />} 
            />
            <Route 
              path="/forgot-password" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordForm />} 
            />
            <Route 
              path="/reset-password" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordForm />} 
            />
            <Route 
              path="/demo" 
              element={<EquationDuelsDemoOffline />} 
            />
            <Route 
              path="/content-management" 
              element={<ContentManagementDemo />} 
            />
            <Route 
              path="/css-test" 
              element={<CSSLoadingTestPage />} 
            />
            <Route 
              path="/css-retry-test" 
              element={<CSSRetryTestPage />} 
            />
            <Route 
              path="/css-fallback-test" 
              element={<CSSFallbackTestPage />} 
            />
            <Route 
              path="/css-dev-test" 
              element={<CSSFallbackDevTestPage />} 
            />
            <Route 
              path="/refresh-control" 
              element={<RefreshControlExample />} 
            />

            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <CharacterProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verify-email" 
              element={
                <ProtectedRoute>
                  <EmailVerification />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/realm/:realmId" 
              element={
                <ProtectedRoute>
                  <GameRealm />                  
                </ProtectedRoute>
              } 
            />            

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

// App wrapper with Redux Provider
function App() {
  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt + A opens accessibility settings
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        // This will be handled by the AccessibilityToolbar component
        const event = new CustomEvent('openAccessibilitySettings');
        window.dispatchEvent(event);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Completely disable service worker and unregister any existing ones
  useEffect(() => {
    // Only run cleanup once per session to avoid loops
    const hasRunCleanup = sessionStorage.getItem('sw-cleanup-done');
    
    if (!hasRunCleanup && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        if (registrations.length > 0) {
          console.log(`Found ${registrations.length} service workers to unregister`);
          
          for(let registration of registrations) {
            registration.unregister().then(() => {
              console.log('Unregistered service worker to prevent refresh loops');
            });
          }
          
          // Clear all caches
          if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
              return Promise.all(
                cacheNames.map(function(cacheName) {
                  console.log('Clearing cache:', cacheName);
                  return caches.delete(cacheName);
                })
              );
            });
          }
          
          // Mark cleanup as done for this session
          sessionStorage.setItem('sw-cleanup-done', 'true');
        }
      });
    }
  }, []);

  return (
    <Provider store={store}>
      <AccessibilityProvider>
        <AppContent />
        <AccessibilityToolbar />
      </AccessibilityProvider>
    </Provider>
  );
}

export default App;