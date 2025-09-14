import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Challenge, 
  Realm, 
  Result, 
  ChallengeAttempt, 
  GameSession,
  ChallengeType 
} from '../types/game';
import GameApi from '../services/gameApi';

interface GameState {
  currentRealm: Realm | null;
  activeChallenge: ChallengeAttempt | null;
  recentResults: Result[];
  sessionStats: {
    challengesCompleted: number;
    totalXPGained: number;
    totalGoldEarned: number;
    averageScore: number;
  };
  loading: {
    realm: boolean;
    challenge: boolean;
    submission: boolean;
  };
  error: string | null;
}

const initialState: GameState = {
  currentRealm: null,
  activeChallenge: null,
  recentResults: [],
  sessionStats: {
    challengesCompleted: 0,
    totalXPGained: 0,
    totalGoldEarned: 0,
    averageScore: 0
  },
  loading: {
    realm: false,
    challenge: false,
    submission: false
  },
  error: null
};

// Async thunks
export const fetchCurrentRealm = createAsyncThunk(
  'game/fetchCurrentRealm',
  async (_, { rejectWithValue }) => {
    try {
      return await GameApi.getCurrentRealm();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch realm');
    }
  }
);

export const loadChallenge = createAsyncThunk(
  'game/loadChallenge',
  async (challengeId: string, { rejectWithValue }) => {
    try {
      return await GameApi.loadChallenge(challengeId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load challenge');
    }
  }
);

export const generateRandomChallenge = createAsyncThunk(
  'game/generateRandomChallenge',
  async (params: { type?: ChallengeType; difficulty?: number }, { rejectWithValue }) => {
    try {
      return await GameApi.generateRandomChallenge(params.type, params.difficulty);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate challenge');
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'game/submitAnswer',
  async (
    params: { challengeId: string; response: string | string[]; hintsUsed: number },
    { rejectWithValue }
  ) => {
    try {
      return await GameApi.submitAnswer(params.challengeId, params.response, params.hintsUsed);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit answer');
    }
  }
);

export const getHint = createAsyncThunk(
  'game/getHint',
  async (params: { challengeId: string; hintIndex: number }, { rejectWithValue }) => {
    try {
      return await GameApi.getHint(params.challengeId, params.hintIndex);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get hint');
    }
  }
);

export const startChallenge = createAsyncThunk(
  'game/startChallenge',
  async (
    params: { userId: string; realmId: string; challengeType: ChallengeType; difficulty: number },
    { rejectWithValue }
  ) => {
    try {
      return await GameApi.startChallenge(params.realmId, params.challengeType, params.difficulty);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start challenge');
    }
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startChallenge: (state, action: PayloadAction<Challenge>) => {
      state.activeChallenge = {
        challenge: action.payload,
        startTime: new Date(),
        hintsUsed: 0,
        currentResponse: '',
        timeRemaining: action.payload.timeLimit
      };
      state.error = null;
    },

    updateResponse: (state, action: PayloadAction<string | string[]>) => {
      if (state.activeChallenge) {
        state.activeChallenge.currentResponse = action.payload;
      }
    },

    useHint: (state, action: PayloadAction<string>) => {
      if (state.activeChallenge) {
        state.activeChallenge.hintsUsed += 1;
      }
    },

    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      if (state.activeChallenge) {
        state.activeChallenge.timeRemaining = action.payload;
      }
    },

    abandonChallenge: (state) => {
      state.activeChallenge = null;
      state.error = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    resetSession: (state) => {
      state.recentResults = [];
      state.sessionStats = {
        challengesCompleted: 0,
        totalXPGained: 0,
        totalGoldEarned: 0,
        averageScore: 0
      };
    }
  },
  extraReducers: (builder) => {
    // Fetch current realm
    builder
      .addCase(fetchCurrentRealm.pending, (state) => {
        state.loading.realm = true;
        state.error = null;
      })
      .addCase(fetchCurrentRealm.fulfilled, (state, action) => {
        state.loading.realm = false;
        state.currentRealm = action.payload;
      })
      .addCase(fetchCurrentRealm.rejected, (state, action) => {
        state.loading.realm = false;
        state.error = action.payload as string;
      });

    // Load challenge
    builder
      .addCase(loadChallenge.pending, (state) => {
        state.loading.challenge = true;
        state.error = null;
      })
      .addCase(loadChallenge.fulfilled, (state, action) => {
        state.loading.challenge = false;
        state.activeChallenge = {
          challenge: action.payload,
          startTime: new Date(),
          hintsUsed: 0,
          currentResponse: '',
          timeRemaining: action.payload.timeLimit
        };
      })
      .addCase(loadChallenge.rejected, (state, action) => {
        state.loading.challenge = false;
        state.error = action.payload as string;
      });

    // Generate random challenge
    builder
      .addCase(generateRandomChallenge.pending, (state) => {
        state.loading.challenge = true;
        state.error = null;
      })
      .addCase(generateRandomChallenge.fulfilled, (state, action) => {
        state.loading.challenge = false;
        state.activeChallenge = {
          challenge: action.payload,
          startTime: new Date(),
          hintsUsed: 0,
          currentResponse: '',
          timeRemaining: action.payload.timeLimit
        };
      })
      .addCase(generateRandomChallenge.rejected, (state, action) => {
        state.loading.challenge = false;
        state.error = action.payload as string;
      });

    // Submit answer
    builder
      .addCase(submitAnswer.pending, (state) => {
        state.loading.submission = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading.submission = false;
        const result = action.payload;
        
        // Add to recent results
        state.recentResults.unshift(result);
        if (state.recentResults.length > 10) {
          state.recentResults.pop();
        }

        // Update session stats
        state.sessionStats.challengesCompleted += 1;
        state.sessionStats.totalXPGained += result.experienceGained;
        state.sessionStats.totalGoldEarned += result.goldEarned;
        
        const totalScore = state.recentResults.reduce((sum, r) => sum + r.validation.score, 0);
        state.sessionStats.averageScore = totalScore / state.recentResults.length;

        // Clear active challenge
        state.activeChallenge = null;
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading.submission = false;
        state.error = action.payload as string;
      });

    // Get hint
    builder
      .addCase(getHint.fulfilled, (state, action) => {
        if (state.activeChallenge) {
          state.activeChallenge.hintsUsed += 1;
        }
      });
  }
});

export const {
  
  updateResponse,
  useHint,
  updateTimeRemaining,
  abandonChallenge,
  clearError,
  resetSession
} = gameSlice.actions;

export default gameSlice.reducer;