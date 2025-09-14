import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CharacterAPI, AwardXPRequest } from '../services/characterApi';
import { 
  CharacterStats, 
  InventoryItem, 
  LevelUpResult, 
  CharacterUpdateData 
} from '../types/character';

interface CharacterState {
  stats: CharacterStats | null;
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  lastLevelUp: LevelUpResult | null;
  showLevelUpModal: boolean;
}

const initialState: CharacterState = {
  stats: null,
  inventory: [],
  isLoading: false,
  error: null,
  lastLevelUp: null,
  showLevelUpModal: false
};

// Async thunks
export const fetchCharacterProfile = createAsyncThunk(
  'character/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await CharacterAPI.getCharacterProfile();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch character profile');
    }
  }
);

export const fetchInventory = createAsyncThunk(
  'character/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      return await CharacterAPI.getInventory();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inventory');
    }
  }
);

export const awardExperience = createAsyncThunk(
  'character/awardExperience',
  async (request: AwardXPRequest, { rejectWithValue }) => {
    try {
      return await CharacterAPI.awardExperience(request);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to award experience');
    }
  }
);

export const updateCurrentRealm = createAsyncThunk(
  'character/updateCurrentRealm',
  async (realmName: string, { rejectWithValue }) => {
    try {
      await CharacterAPI.updateCurrentRealm(realmName);
      return realmName;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update current realm');
    }
  }
);

export const updateCharacterProfile = createAsyncThunk(
  'character/updateProfile',
  async (updateData: CharacterUpdateData, { rejectWithValue }) => {
    try {
      return await CharacterAPI.updateCharacterProfile(updateData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update character profile');
    }
  }
);

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    showLevelUpModal: (state, action: PayloadAction<LevelUpResult>) => {
      state.lastLevelUp = action.payload;
      state.showLevelUpModal = true;
    },
    hideLevelUpModal: (state) => {
      state.showLevelUpModal = false;
      state.lastLevelUp = null;
    },
    updateExperienceOptimistic: (state, action: PayloadAction<number>) => {
      if (state.stats) {
        state.stats.character.experiencePoints += action.payload;
        // Recalculate progress to next level
        const currentLevelXP = calculateXPForLevel(state.stats.character.level);
        const nextLevelXP = calculateXPForLevel(state.stats.character.level + 1);
        if (nextLevelXP > 0) {
          state.stats.progressToNextLevel = Math.max(0, Math.min(100, 
            ((state.stats.character.experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
          ));
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch character profile
    builder
      .addCase(fetchCharacterProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCharacterProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCharacterProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch inventory
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inventory = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Award experience
    builder
      .addCase(awardExperience.pending, (state) => {
        state.error = null;
      })
      .addCase(awardExperience.fulfilled, (state, action) => {
        const { xpAwarded, levelUp } = action.payload;
        
        if (state.stats) {
          state.stats.character.experiencePoints += xpAwarded;
          
          if (levelUp) {
            state.stats.character.level = levelUp.newLevel;
            state.stats.character.totalGold += levelUp.goldBonus;
            state.lastLevelUp = levelUp;
            state.showLevelUpModal = true;
            
            // Add new badges to inventory
            levelUp.badgesEarned.forEach(badge => {
              state.inventory.unshift({
                id: badge.id,
                type: 'badge',
                name: badge.name,
                description: badge.description,
                iconUrl: badge.iconUrl,
                rarity: badge.rarity,
                earnedAt: badge.earnedAt
              });
            });
          }
          
          // Recalculate progress
          const currentLevelXP = calculateXPForLevel(state.stats.character.level);
          const nextLevelXP = calculateXPForLevel(state.stats.character.level + 1);
          if (nextLevelXP > 0) {
            state.stats.progressToNextLevel = Math.max(0, Math.min(100, 
              ((state.stats.character.experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
            ));
          }
        }
      })
      .addCase(awardExperience.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update current realm
    builder
      .addCase(updateCurrentRealm.fulfilled, (state, action) => {
        if (state.stats) {
          state.stats.character.currentRealm = action.payload;
        }
      })
      .addCase(updateCurrentRealm.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update character profile
    builder
      .addCase(updateCharacterProfile.fulfilled, (state, action) => {
        if (state.stats) {
          state.stats.character = { ...state.stats.character, ...action.payload };
        }
      })
      .addCase(updateCharacterProfile.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

// Helper function to calculate XP for level (matches server logic)
function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  const BASE_XP_PER_LEVEL = 100;
  const XP_MULTIPLIER = 1.5;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, i - 2));
  }
  return totalXP;
}

export const { 
  clearError, 
  showLevelUpModal, 
  hideLevelUpModal, 
  updateExperienceOptimistic 
} = characterSlice.actions;

export default characterSlice.reducer;