import { describe, it, expect, beforeEach } from '@jest/globals';
import { MathmageTrialsRealm } from '../services/realms/mathmageTrialsRealm.js';

describe('Limiting Reagent Hydra Boss Fight', () => {
  let realm: MathmageTrialsRealm;

  beforeEach(() => {
    realm = new MathmageTrialsRealm();
  });

  describe('Boss Challenge Processing', () => {
    it('should process Limiting Reagent Hydra boss challenge successfully', async () => {
      const result = await realm.processBossChallenge('test-user', 'limiting-reagent-hydra');
      
      expect(result.defeated).toBe(true);
      expect(result.score).toBe(500);
      expect(result.specialRewards).toHaveLength(2);
      
      const arcaneFormulae = result.specialRewards.find(r => r.itemId === 'arcane_formulae');
      const hydraBadge = result.specialRewards.find(r => r.itemId === 'hydra_slayer');
      
      expect(arcaneFormulae).toBeDefined();
      expect(arcaneFormulae?.type).toBe('unlock');
      expect(arcaneFormulae?.description).toContain('Arcane Formulae');
      
      expect(hydraBadge).toBeDefined();
      expect(hydraBadge?.type).toBe('badge');
      expect(hydraBadge?.description).toContain('Hydra Slayer');
      
      expect(result.unlockedContent).toContain('arcane_formulae');
      expect(result.unlockedContent).toContain('advanced_stoichiometry');
    });

    it('should throw error for unknown boss', async () => {
      await expect(realm.processBossChallenge('test-user', 'unknown-boss'))
        .rejects.toThrow('Unknown boss: unknown-boss');
    });
  });

  describe('Boss Challenge Integration', () => {
    it('should have special rewards that include boss unlocks', () => {
      const specialRewards = (realm as any).getSpecialRewards();
      
      expect(specialRewards.some((r: any) => r.itemId === 'arcane_formulae')).toBe(true);
      expect(specialRewards.some((r: any) => r.type === 'unlock')).toBe(true);
    });

    it('should have appropriate special mechanics for boss fights', () => {
      const mechanics = realm.getSpecialMechanics();
      
      // Should have mechanics that support boss battles
      expect(mechanics.some(m => m.id === 'mana_system')).toBe(true);
      expect(mechanics.some(m => m.id === 'hp_system')).toBe(true);
      expect(mechanics.some(m => m.id === 'explosion_animation')).toBe(true);
    });
  });

  describe('Limiting Reagent Problem Validation', () => {
    // Test limiting reagent calculation logic
    it('should validate limiting reagent calculations correctly', () => {
      // Test case: 2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu
      // Given: 5.4g Al, 15.0g CuSO₄
      // Expected: CuSO₄ is limiting, 5.97g Cu produced
      
      const alMoles = 5.4 / 26.98; // 0.200 mol
      const cuSO4Moles = 15.0 / 159.61; // 0.094 mol
      
      // Check stoichiometric ratios
      const alNeeded = cuSO4Moles * (2/3); // 0.063 mol
      const cuSO4Needed = alMoles * (3/2); // 0.300 mol
      
      // CuSO₄ is limiting because we have 0.094 mol but need 0.300 mol
      expect(cuSO4Moles).toBeLessThan(cuSO4Needed);
      expect(alMoles).toBeGreaterThan(alNeeded);
      
      // Calculate product yield
      const cuProduced = cuSO4Moles * (3/3); // 0.094 mol
      const cuMass = cuProduced * 63.55; // 5.97 g
      
      expect(cuMass).toBeCloseTo(5.97, 2);
    });

    it('should handle different limiting reagent scenarios', () => {
      // Test case: N₂ + 3H₂ → 2NH₃
      // Given: 2.8g N₂, 1.0g H₂
      // Expected: N₂ is limiting, 3.41g NH₃ produced
      
      const n2Moles = 2.8 / 28.02; // 0.100 mol
      const h2Moles = 1.0 / 2.02; // 0.495 mol
      
      // Check stoichiometric ratios
      const n2Needed = h2Moles * (1/3); // 0.165 mol
      const h2Needed = n2Moles * 3; // 0.300 mol
      
      // N₂ is limiting because we have 0.100 mol but need 0.165 mol
      expect(n2Moles).toBeLessThan(n2Needed);
      expect(h2Moles).toBeGreaterThan(h2Needed);
      
      // Calculate product yield
      const nh3Produced = n2Moles * 2; // 0.200 mol
      const nh3Mass = nh3Produced * 17.04; // 3.41 g
      
      expect(nh3Mass).toBeCloseTo(3.41, 2);
    });

    it('should handle combustion reaction limiting reagents', () => {
      // Test case: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O
      // Given: 4.4g C₃H₈, 12.0g O₂
      // Expected: O₂ is limiting, 9.90g CO₂ produced
      
      const c3h8Moles = 4.4 / 44.11; // 0.100 mol
      const o2Moles = 12.0 / 32.00; // 0.375 mol
      
      // Check stoichiometric ratios
      const c3h8Needed = o2Moles * (1/5); // 0.075 mol
      const o2Needed = c3h8Moles * 5; // 0.500 mol
      
      // O₂ is limiting because we have 0.375 mol but need 0.500 mol
      expect(o2Moles).toBeLessThan(o2Needed);
      expect(c3h8Moles).toBeGreaterThan(c3h8Needed);
      
      // Calculate product yield
      const co2Produced = o2Moles * (3/5); // 0.225 mol
      const co2Mass = co2Produced * 44.01; // 9.90 g
      
      expect(co2Mass).toBeCloseTo(9.90, 2);
    });
  });

  describe('Boss Fight Mechanics', () => {
    it('should support multi-phase boss encounters', () => {
      const mechanics = realm.getSpecialMechanics();
      
      // Should have mechanics that support progressive difficulty
      const manaSystem = mechanics.find(m => m.id === 'mana_system');
      const hpSystem = mechanics.find(m => m.id === 'hp_system');
      
      expect(manaSystem).toBeDefined();
      expect(manaSystem?.parameters.maxMana).toBe(100);
      expect(manaSystem?.parameters.manaPerCorrect).toBe(20);
      
      expect(hpSystem).toBeDefined();
      expect(hpSystem?.parameters.maxHP).toBe(100);
      expect(hpSystem?.parameters.hpLossPerError).toBe(25);
    });

    it('should provide appropriate boss challenge difficulty', async () => {
      // Boss challenges should be high difficulty
      const challenge = await realm.generateChallenge(5);
      
      expect(challenge.difficulty).toBeGreaterThanOrEqual(4);
      expect(challenge.timeLimit).toBeGreaterThan(60); // Boss fights need more time
      expect(challenge.rewards.length).toBeGreaterThan(1); // Boss fights have better rewards
    });
  });

  describe('Arcane Formulae Unlock', () => {
    it('should unlock Arcane Formulae upon boss defeat', async () => {
      const result = await realm.processBossChallenge('test-user', 'limiting-reagent-hydra');
      
      const arcaneFormulae = result.specialRewards.find(r => r.itemId === 'arcane_formulae');
      expect(arcaneFormulae).toBeDefined();
      expect(arcaneFormulae?.type).toBe('unlock');
      
      expect(result.unlockedContent).toContain('arcane_formulae');
    });

    it('should provide special rewards for boss completion', () => {
      const specialRewards = (realm as any).getSpecialRewards();
      
      // Should include the Arcane Formulae unlock
      const arcaneFormulae = specialRewards.find((r: any) => r.itemId === 'arcane_formulae');
      expect(arcaneFormulae).toBeDefined();
      expect(arcaneFormulae.type).toBe('unlock');
      expect(arcaneFormulae.description).toContain('Arcane Formulae');
    });
  });
});