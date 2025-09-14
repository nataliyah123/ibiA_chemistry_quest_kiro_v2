import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types for CSS loading state
export interface StylesheetInfo {
  href: string;
  loadStatus: 'loading' | 'loaded' | 'error';
  loadTime?: number;
  errorMessage?: string;
  retryCount?: number;
}

export interface CSSLoadingState {
  stylesheets: Record<string, StylesheetInfo>;
  loadErrors: string[];
  totalStylesheets: number;
  loadedStylesheets: number;
  failedStylesheets: number;
  isMonitoring: boolean;
  lastUpdateTime: number;
  retryInProgress: boolean;
  fallbackActive: boolean;
}

// Async thunk for initializing CSS monitoring
export const initializeCSSMonitoring = createAsyncThunk(
  'cssLoading/initialize',
  async (_, { dispatch }) => {
    // Import the CSS monitor dynamically to avoid circular dependencies
    const { getCSSLoadingMonitor } = await import('../utils/cssLoadingMonitor');
    const monitor = getCSSLoadingMonitor();
    
    // Get initial state
    const initialState = monitor.getState();
    
    // Set up listener for state changes
    monitor.addListener((newState) => {
      dispatch(updateCSSLoadingState({
        stylesheets: Object.fromEntries(newState.stylesheets),
        loadErrors: newState.loadErrors,
        totalStylesheets: newState.totalStylesheets,
        loadedStylesheets: newState.loadedStylesheets,
        failedStylesheets: newState.failedStylesheets,
      }));
    });
    
    return {
      stylesheets: Object.fromEntries(initialState.stylesheets),
      loadErrors: initialState.loadErrors,
      totalStylesheets: initialState.totalStylesheets,
      loadedStylesheets: initialState.loadedStylesheets,
      failedStylesheets: initialState.failedStylesheets,
    };
  }
);

// Async thunk for retrying failed CSS loads
export const retryCSSLoading = createAsyncThunk(
  'cssLoading/retry',
  async (stylesheetHref?: string, { getState, dispatch }) => {
    const { getCSSLoadingMonitor } = await import('../utils/cssLoadingMonitor');
    const { cssRetryMechanism } = await import('../utils/cssRetryMechanism');
    
    const state = getState() as { cssLoading: CSSLoadingState };
    const failedStylesheets = Object.values(state.cssLoading.stylesheets)
      .filter(sheet => sheet.loadStatus === 'error');
    
    if (stylesheetHref) {
      // Retry specific stylesheet
      const stylesheet = state.cssLoading.stylesheets[stylesheetHref];
      if (stylesheet && stylesheet.loadStatus === 'error') {
        dispatch(updateStylesheetRetryCount({ href: stylesheetHref, retryCount: (stylesheet.retryCount || 0) + 1 }));
        await cssRetryMechanism.retryStylesheet(stylesheetHref);
      }
    } else {
      // Retry all failed stylesheets
      for (const stylesheet of failedStylesheets) {
        dispatch(updateStylesheetRetryCount({ href: stylesheet.href, retryCount: (stylesheet.retryCount || 0) + 1 }));
        await cssRetryMechanism.retryStylesheet(stylesheet.href);
      }
    }
    
    return { retriedCount: stylesheetHref ? 1 : failedStylesheets.length };
  }
);

// Async thunk for activating fallback CSS
export const activateFallbackCSS = createAsyncThunk(
  'cssLoading/activateFallback',
  async (_, { dispatch }) => {
    const { cssFallbackSystem } = await import('../utils/cssFallbackSystem');
    
    await cssFallbackSystem.activateFallback();
    dispatch(setFallbackActive(true));
    
    return { fallbackActivated: true };
  }
);

// Initial state
const initialState: CSSLoadingState = {
  stylesheets: {},
  loadErrors: [],
  totalStylesheets: 0,
  loadedStylesheets: 0,
  failedStylesheets: 0,
  isMonitoring: false,
  lastUpdateTime: Date.now(),
  retryInProgress: false,
  fallbackActive: false,
};

// CSS Loading slice
const cssLoadingSlice = createSlice({
  name: 'cssLoading',
  initialState,
  reducers: {
    updateCSSLoadingState: (state, action: PayloadAction<{
      stylesheets: Record<string, StylesheetInfo>;
      loadErrors: string[];
      totalStylesheets: number;
      loadedStylesheets: number;
      failedStylesheets: number;
    }>) => {
      state.stylesheets = action.payload.stylesheets;
      state.loadErrors = action.payload.loadErrors;
      state.totalStylesheets = action.payload.totalStylesheets;
      state.loadedStylesheets = action.payload.loadedStylesheets;
      state.failedStylesheets = action.payload.failedStylesheets;
      state.lastUpdateTime = Date.now();
    },
    
    addStylesheet: (state, action: PayloadAction<StylesheetInfo>) => {
      const { href } = action.payload;
      state.stylesheets[href] = action.payload;
      state.totalStylesheets = Object.keys(state.stylesheets).length;
      state.lastUpdateTime = Date.now();
    },
    
    updateStylesheetStatus: (state, action: PayloadAction<{
      href: string;
      loadStatus: 'loading' | 'loaded' | 'error';
      loadTime?: number;
      errorMessage?: string;
    }>) => {
      const { href, loadStatus, loadTime, errorMessage } = action.payload;
      const stylesheet = state.stylesheets[href];
      
      if (stylesheet) {
        stylesheet.loadStatus = loadStatus;
        if (loadTime) stylesheet.loadTime = loadTime;
        if (errorMessage) stylesheet.errorMessage = errorMessage;
        
        // Update counts
        state.loadedStylesheets = Object.values(state.stylesheets)
          .filter(sheet => sheet.loadStatus === 'loaded').length;
        state.failedStylesheets = Object.values(state.stylesheets)
          .filter(sheet => sheet.loadStatus === 'error').length;
        
        // Add to load errors if failed
        if (loadStatus === 'error' && errorMessage) {
          const errorMsg = `${errorMessage}: ${href}`;
          if (!state.loadErrors.includes(errorMsg)) {
            state.loadErrors.push(errorMsg);
          }
        }
        
        state.lastUpdateTime = Date.now();
      }
    },
    
    updateStylesheetRetryCount: (state, action: PayloadAction<{
      href: string;
      retryCount: number;
    }>) => {
      const { href, retryCount } = action.payload;
      const stylesheet = state.stylesheets[href];
      
      if (stylesheet) {
        stylesheet.retryCount = retryCount;
        state.lastUpdateTime = Date.now();
      }
    },
    
    clearLoadErrors: (state) => {
      state.loadErrors = [];
      state.lastUpdateTime = Date.now();
    },
    
    setMonitoring: (state, action: PayloadAction<boolean>) => {
      state.isMonitoring = action.payload;
      state.lastUpdateTime = Date.now();
    },
    
    setRetryInProgress: (state, action: PayloadAction<boolean>) => {
      state.retryInProgress = action.payload;
      state.lastUpdateTime = Date.now();
    },
    
    setFallbackActive: (state, action: PayloadAction<boolean>) => {
      state.fallbackActive = action.payload;
      state.lastUpdateTime = Date.now();
    },
    
    resetCSSLoadingState: (state) => {
      state.stylesheets = {};
      state.loadErrors = [];
      state.totalStylesheets = 0;
      state.loadedStylesheets = 0;
      state.failedStylesheets = 0;
      state.retryInProgress = false;
      state.fallbackActive = false;
      state.lastUpdateTime = Date.now();
    },
  },
  extraReducers: (builder) => {
    // Initialize CSS monitoring
    builder
      .addCase(initializeCSSMonitoring.pending, (state) => {
        state.isMonitoring = true;
        state.lastUpdateTime = Date.now();
      })
      .addCase(initializeCSSMonitoring.fulfilled, (state, action) => {
        state.stylesheets = action.payload.stylesheets;
        state.loadErrors = action.payload.loadErrors;
        state.totalStylesheets = action.payload.totalStylesheets;
        state.loadedStylesheets = action.payload.loadedStylesheets;
        state.failedStylesheets = action.payload.failedStylesheets;
        state.isMonitoring = true;
        state.lastUpdateTime = Date.now();
      })
      .addCase(initializeCSSMonitoring.rejected, (state) => {
        state.isMonitoring = false;
        state.lastUpdateTime = Date.now();
      });

    // Retry CSS loading
    builder
      .addCase(retryCSSLoading.pending, (state) => {
        state.retryInProgress = true;
        state.lastUpdateTime = Date.now();
      })
      .addCase(retryCSSLoading.fulfilled, (state) => {
        state.retryInProgress = false;
        state.lastUpdateTime = Date.now();
      })
      .addCase(retryCSSLoading.rejected, (state) => {
        state.retryInProgress = false;
        state.lastUpdateTime = Date.now();
      });

    // Activate fallback CSS
    builder
      .addCase(activateFallbackCSS.pending, (state) => {
        state.lastUpdateTime = Date.now();
      })
      .addCase(activateFallbackCSS.fulfilled, (state) => {
        state.fallbackActive = true;
        state.lastUpdateTime = Date.now();
      })
      .addCase(activateFallbackCSS.rejected, (state) => {
        state.lastUpdateTime = Date.now();
      });
  },
});

export const {
  updateCSSLoadingState,
  addStylesheet,
  updateStylesheetStatus,
  updateStylesheetRetryCount,
  clearLoadErrors,
  setMonitoring,
  setRetryInProgress,
  setFallbackActive,
  resetCSSLoadingState,
} = cssLoadingSlice.actions;

export default cssLoadingSlice.reducer;