import React, { useState, useEffect } from 'react';
import './AlchemistsGrimoire.css';

interface Mnemonic {
  id: string;
  title: string;
  concept: string;
  category: string;
  mnemonic: string;
  explanation: string;
  animation?: string;
  isUnlocked: boolean;
  unlockedBy: string;
  difficulty: number;
}

interface AlchemistsGrimoireProps {
  unlockedMnemonics?: string[];
  onClose: () => void;
}

export const AlchemistsGrimoire: React.FC<AlchemistsGrimoireProps> = ({
  unlockedMnemonics = [],
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMnemonic, setSelectedMnemonic] = useState<Mnemonic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);

  // Sample mnemonics database (15+ animated mnemonics)
  const mnemonicsDatabase: Mnemonic[] = [
    {
      id: 'periodic_trends_1',
      title: 'Atomic Radius Trend',
      concept: 'Atomic radius decreases across a period',
      category: 'Periodic Trends',
      mnemonic: 'Atoms get SMALLER as you go RIGHT - like a shrinking family photo!',
      explanation: 'As nuclear charge increases across a period, electrons are pulled closer to the nucleus, making atoms smaller.',
      animation: 'shrinking-atoms',
      isUnlocked: unlockedMnemonics.includes('periodic_trends_1'),
      unlockedBy: 'Complete 5 memory challenges',
      difficulty: 1
    },
    {
      id: 'periodic_trends_2',
      title: 'Ionization Energy Trend',
      concept: 'Ionization energy increases across a period',
      category: 'Periodic Trends',
      mnemonic: 'It gets HARDER to remove electrons as you go RIGHT - like pulling teeth!',
      explanation: 'Increased nuclear charge makes it more difficult to remove electrons from atoms.',
      animation: 'electron-removal',
      isUnlocked: unlockedMnemonics.includes('periodic_trends_2'),
      unlockedBy: 'Complete 8 memory challenges',
      difficulty: 2
    },
    {
      id: 'gas_tests_1',
      title: 'Hydrogen Gas Test',
      concept: 'Hydrogen burns with a pop',
      category: 'Gas Tests',
      mnemonic: 'Hydrogen goes POP like a balloon - it\'s a gas that loves to EXPLODE!',
      explanation: 'Hydrogen gas burns rapidly with oxygen, creating a distinctive popping sound.',
      animation: 'popping-balloon',
      isUnlocked: unlockedMnemonics.includes('gas_tests_1'),
      unlockedBy: 'Complete Flashcard Match',
      difficulty: 1
    },
    {
      id: 'gas_tests_2',
      title: 'Oxygen Gas Test',
      concept: 'Oxygen relights a glowing splint',
      category: 'Gas Tests',
      mnemonic: 'Oxygen is the FIRE SUPPORTER - it brings dead flames back to LIFE!',
      explanation: 'Oxygen supports combustion and will relight a glowing wooden splint.',
      animation: 'relighting-flame',
      isUnlocked: unlockedMnemonics.includes('gas_tests_2'),
      unlockedBy: 'Complete QA Roulette',
      difficulty: 1
    },
    {
      id: 'gas_tests_3',
      title: 'Carbon Dioxide Test',
      concept: 'CO₂ turns limewater milky',
      category: 'Gas Tests',
      mnemonic: 'CO₂ makes limewater MILKY like adding cream to coffee!',
      explanation: 'Carbon dioxide reacts with calcium hydroxide to form insoluble calcium carbonate.',
      animation: 'milky-transformation',
      isUnlocked: unlockedMnemonics.includes('gas_tests_3'),
      unlockedBy: 'Complete Survival Mode',
      difficulty: 1
    },
    {
      id: 'flame_colors_1',
      title: 'Sodium Flame Color',
      concept: 'Sodium burns with golden yellow flame',
      category: 'Flame Colors',
      mnemonic: 'Sodium is like the SUN - bright GOLDEN YELLOW!',
      explanation: 'Sodium compounds produce a characteristic bright golden yellow flame.',
      animation: 'golden-sun',
      isUnlocked: unlockedMnemonics.includes('flame_colors_1'),
      unlockedBy: 'Master flame color matching',
      difficulty: 1
    },
    {
      id: 'flame_colors_2',
      title: 'Copper Flame Color',
      concept: 'Copper burns with blue-green flame',
      category: 'Flame Colors',
      mnemonic: 'Copper is like the OCEAN - beautiful BLUE-GREEN waves!',
      explanation: 'Copper compounds produce a distinctive blue-green colored flame.',
      animation: 'ocean-waves',
      isUnlocked: unlockedMnemonics.includes('flame_colors_2'),
      unlockedBy: 'Complete advanced flame tests',
      difficulty: 2
    },
    {
      id: 'solubility_1',
      title: 'All Nitrates Soluble',
      concept: 'All nitrates are soluble in water',
      category: 'Solubility Rules',
      mnemonic: 'NITRATES are NEVER NAUGHTY - they ALL dissolve nicely!',
      explanation: 'All nitrate compounds are soluble in water with no exceptions.',
      animation: 'dissolving-crystals',
      isUnlocked: unlockedMnemonics.includes('solubility_1'),
      unlockedBy: 'Master solubility basics',
      difficulty: 1
    },
    {
      id: 'solubility_2',
      title: 'Group 1 Always Soluble',
      concept: 'All Group 1 compounds are soluble',
      category: 'Solubility Rules',
      mnemonic: 'Group 1 metals are SOCIAL BUTTERFLIES - they LOVE to dissolve and mingle!',
      explanation: 'Alkali metals form ionic compounds that are always soluble in water.',
      animation: 'social-butterflies',
      isUnlocked: unlockedMnemonics.includes('solubility_2'),
      unlockedBy: 'Complete solubility challenges',
      difficulty: 1
    },
    {
      id: 'acids_bases_1',
      title: 'Strong Acids',
      concept: 'Remember the 6 strong acids',
      category: 'Acids and Bases',
      mnemonic: 'Strong acids: HCl, HBr, HI, HNO₃, H₂SO₄, HClO₄ - "Help! Bring Ice, No Sugar, Heavy Cream!"',
      explanation: 'These six acids completely ionize in water, making them strong acids.',
      animation: 'acid-molecules',
      isUnlocked: unlockedMnemonics.includes('acids_bases_1'),
      unlockedBy: 'Master acid-base concepts',
      difficulty: 3
    },
    {
      id: 'organic_1',
      title: 'Alkane Naming',
      concept: 'Alkane prefixes for carbon chains',
      category: 'Organic Chemistry',
      mnemonic: 'Meth-Eth-Prop-But-Pent-Hex-Hept-Oct: "My Elephant Plays Basketball Pretty Hard, Obviously Tired"',
      explanation: 'These prefixes indicate the number of carbon atoms in alkane chains (1-8).',
      animation: 'carbon-chain',
      isUnlocked: unlockedMnemonics.includes('organic_1'),
      unlockedBy: 'Complete organic naming challenges',
      difficulty: 2
    },
    {
      id: 'redox_1',
      title: 'Oxidation States',
      concept: 'Remember oxidation state rules',
      category: 'Redox Reactions',
      mnemonic: 'OIL RIG: Oxidation Is Loss (of electrons), Reduction Is Gain (of electrons)',
      explanation: 'This helps remember the fundamental definitions of oxidation and reduction.',
      animation: 'electron-transfer',
      isUnlocked: unlockedMnemonics.includes('redox_1'),
      unlockedBy: 'Master redox concepts',
      difficulty: 2
    },
    {
      id: 'equilibrium_1',
      title: 'Le Chatelier\'s Principle',
      concept: 'Equilibrium shifts to oppose changes',
      category: 'Chemical Equilibrium',
      mnemonic: 'Le Chatelier is STUBBORN - he always does the OPPOSITE of what you want!',
      explanation: 'When a system at equilibrium is disturbed, it shifts to counteract the disturbance.',
      animation: 'balance-scale',
      isUnlocked: unlockedMnemonics.includes('equilibrium_1'),
      unlockedBy: 'Master equilibrium concepts',
      difficulty: 3
    },
    {
      id: 'thermodynamics_1',
      title: 'Entropy Changes',
      concept: 'Entropy increases with disorder',
      category: 'Thermodynamics',
      mnemonic: 'Entropy is like a MESSY ROOM - it always wants to get MORE DISORGANIZED!',
      explanation: 'Systems naturally tend toward maximum entropy (disorder).',
      animation: 'messy-room',
      isUnlocked: unlockedMnemonics.includes('thermodynamics_1'),
      unlockedBy: 'Master thermodynamics',
      difficulty: 3
    },
    {
      id: 'kinetics_1',
      title: 'Reaction Rate Factors',
      concept: 'Factors affecting reaction rate',
      category: 'Chemical Kinetics',
      mnemonic: 'Rate factors: Temperature, Concentration, Surface Area, Catalyst - "The Cat Saw Cats"',
      explanation: 'These four factors can increase the rate of chemical reactions.',
      animation: 'speeding-molecules',
      isUnlocked: unlockedMnemonics.includes('kinetics_1'),
      unlockedBy: 'Master kinetics concepts',
      difficulty: 2
    }
  ];

  const categories = ['all', ...new Set(mnemonicsDatabase.map(m => m.category))];

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('grimoire-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const filteredMnemonics = mnemonicsDatabase.filter(mnemonic => {
    const matchesCategory = selectedCategory === 'all' || mnemonic.category === selectedCategory;
    const matchesSearch = mnemonic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mnemonic.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mnemonic.mnemonic.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (mnemonicId: string) => {
    const newFavorites = favorites.includes(mnemonicId)
      ? favorites.filter(id => id !== mnemonicId)
      : [...favorites, mnemonicId];
    
    setFavorites(newFavorites);
    localStorage.setItem('grimoire-favorites', JSON.stringify(newFavorites));
  };

  const playAnimation = (mnemonic: Mnemonic) => {
    if (!mnemonic.isUnlocked) return;
    
    setSelectedMnemonic(mnemonic);
    setShowAnimation(true);
    
    // Auto-hide animation after 5 seconds
    setTimeout(() => {
      setShowAnimation(false);
    }, 5000);
  };

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
  };

  const getUnlockedCount = () => {
    return mnemonicsDatabase.filter(m => m.isUnlocked).length;
  };

  return (
    <div className="alchemists-grimoire">
      <div className="grimoire-container">
        {/* Header */}
        <div className="grimoire-header">
          <div className="header-content">
            <h1>📚 Alchemist's Grimoire</h1>
            <p>Your collection of animated chemistry mnemonics</p>
            <div className="progress-info">
              <span>{getUnlockedCount()}/{mnemonicsDatabase.length} mnemonics unlocked</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(getUnlockedCount() / mnemonicsDatabase.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Controls */}
        <div className="grimoire-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search mnemonics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Mnemonics Grid */}
        <div className="mnemonics-grid">
          {filteredMnemonics.map(mnemonic => (
            <div
              key={mnemonic.id}
              className={`mnemonic-card ${!mnemonic.isUnlocked ? 'locked' : ''}`}
              onClick={() => mnemonic.isUnlocked && playAnimation(mnemonic)}
            >
              <div className="card-header">
                <h3>{mnemonic.title}</h3>
                <div className="card-actions">
                  <button
                    className={`favorite-button ${favorites.includes(mnemonic.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mnemonic.isUnlocked) toggleFavorite(mnemonic.id);
                    }}
                    disabled={!mnemonic.isUnlocked}
                  >
                    {favorites.includes(mnemonic.id) ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
              
              <div className="card-content">
                <div className="concept">{mnemonic.concept}</div>
                <div className="category-tag">{mnemonic.category}</div>
                <div className="difficulty">
                  {getDifficultyStars(mnemonic.difficulty)}
                </div>
                
                {mnemonic.isUnlocked ? (
                  <div className="mnemonic-text">
                    "{mnemonic.mnemonic}"
                  </div>
                ) : (
                  <div className="locked-content">
                    <div className="lock-icon">🔒</div>
                    <div className="unlock-requirement">
                      {mnemonic.unlockedBy}
                    </div>
                  </div>
                )}
              </div>
              
              {mnemonic.isUnlocked && (
                <div className="card-footer">
                  <button className="play-animation-button">
                    🎬 Play Animation
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredMnemonics.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No mnemonics found</h3>
            <p>Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Animation Modal */}
      {showAnimation && selectedMnemonic && (
        <div className="animation-modal">
          <div className="animation-content">
            <div className="animation-header">
              <h2>{selectedMnemonic.title}</h2>
              <button 
                className="close-animation"
                onClick={() => setShowAnimation(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="animation-display">
              <div className={`animation-container ${selectedMnemonic.animation}`}>
                {/* Animation placeholder - in a real implementation, this would contain actual animations */}
                <div className="animation-placeholder">
                  <div className="animation-icon">🎭</div>
                  <p>Animated visualization of:</p>
                  <h3>"{selectedMnemonic.mnemonic}"</h3>
                </div>
              </div>
            </div>
            
            <div className="animation-explanation">
              <h4>Explanation:</h4>
              <p>{selectedMnemonic.explanation}</p>
            </div>
            
            <div className="animation-controls">
              <button 
                className="replay-button"
                onClick={() => {
                  // Restart animation
                  setShowAnimation(false);
                  setTimeout(() => setShowAnimation(true), 100);
                }}
              >
                🔄 Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};