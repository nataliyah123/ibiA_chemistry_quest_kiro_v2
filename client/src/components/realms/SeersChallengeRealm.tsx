import React, { useState, useEffect } from 'react';
import { Challenge, ValidationResult, ChallengeType } from '../../types/game';
import PrecipitatePoker from '../games/PrecipitatePoker';
import ColorClash from '../games/ColorClash';
import MysteryReaction from '../games/MysteryReaction';
import './SeersChallengeRealm.css';

interface SeersChallengeRealmProps {
  onChallengeComplete: (result: ValidationResult) => void;
  onSubmitAnswer: (answer: any) => Promise<ValidationResult>;
  userLevel: number;
}

interface RealmState {
  currentChallenge: Challenge | null;
  availableChallenges: Challenge[];
  completedChallenges: string[];
  realmProgress: {
    precipitatePokerCompleted: number;
    colorClashCompleted: number;
    mysteryReactionCompleted: number;
  };
  showRealmMap: boolean;
  timeRemaining?: number;
}

const SeersChallengeRealm: React.FC<SeersChallengeRealmProps> = ({
  onChallengeComplete,
  onSubmitAnswer,
  userLevel
}) => {
  const [realmState, setRealmState] = useState<RealmState>({
    currentChallenge: null,
    availableChallenges: [],
    completedChallenges: [],
    realmProgress: {
      precipitatePokerCompleted: 0,
      colorClashCompleted: 0,
      mysteryReactionCompleted: 0
    },
    showRealmMap: true
  });

  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load available challenges for the realm
    loadAvailableChallenges();
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [userLevel]);

  const loadAvailableChallenges = async () => {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll create sample challenges
      const sampleChallenges = generateSampleChallenges();
      
      setRealmState(prev => ({
        ...prev,
        availableChallenges: sampleChallenges.filter(c => c.requiredLevel <= userLevel)
      }));
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const generateSampleChallenges = (): Challenge[] => {
    // Sample precipitation poker challenges
    return [
      {
        id: 'pp-001',
        realmId: 'seers-challenge',
        type: ChallengeType.PRECIPITATION_POKER,
        difficulty: 1,
        title: 'Precipitate Poker: Silver Halides',
        description: 'Predict precipitation in silver halide reactions',
        content: {
          question: 'What happens when AgNO₃ solution is mixed with NaCl solution?',
          correctAnswer: 'precipitate',
          explanation: 'Silver chloride (AgCl) is insoluble in water and forms a white precipitate.',
          hints: [
            'Consider the solubility rules for ionic compounds',
            'Most chlorides are soluble, but silver chloride is an exception',
            'Silver halides are generally insoluble in water'
          ]
        },
        timeLimit: 60,
        requiredLevel: 4,
        rewards: [
          { type: 'xp', amount: 50, description: '50 XP for correct prediction' },
          { type: 'gold', amount: 25, description: '25 Gold base reward' }
        ],
        metadata: {
          concepts: ['precipitation', 'solubility rules', 'halide precipitation'],
          curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
          estimatedDuration: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gameSpecific: {
            reaction: {
              reactant1: 'AgNO₃',
              reactant2: 'NaCl',
              products: ['AgCl', 'NaNO₃'],
              willPrecipitate: true,
              precipitate: 'AgCl',
              explanation: 'Silver chloride (AgCl) is insoluble in water and forms a white precipitate.',
              difficulty: 1,
              topic: 'Halide precipitation'
            },
            betOptions: [
              {
                id: 'precipitate_yes_high',
                description: 'Precipitate will form (High confidence)',
                odds: 1.2,
                confidenceLevel: 'high'
              },
              {
                id: 'precipitate_yes_medium',
                description: 'Precipitate will form (Medium confidence)',
                odds: 1.5,
                confidenceLevel: 'medium'
              },
              {
                id: 'precipitate_yes_low',
                description: 'Precipitate will form (Low confidence)',
                odds: 2.0,
                confidenceLevel: 'low'
              },
              {
                id: 'precipitate_no_high',
                description: 'No precipitate will form (High confidence)',
                odds: 0.1,
                confidenceLevel: 'high'
              },
              {
                id: 'precipitate_no_medium',
                description: 'No precipitate will form (Medium confidence)',
                odds: 0.3,
                confidenceLevel: 'medium'
              },
              {
                id: 'precipitate_no_low',
                description: 'No precipitate will form (Low confidence)',
                odds: 0.5,
                confidenceLevel: 'low'
              }
            ],
            currentBankroll: 1000
          }
        }
      },
      {
        id: 'pp-002',
        realmId: 'seers-challenge',
        type: ChallengeType.PRECIPITATION_POKER,
        difficulty: 2,
        title: 'Precipitate Poker: Sulfate Reactions',
        description: 'Predict precipitation in sulfate reactions',
        content: {
          question: 'What happens when BaCl₂ solution is mixed with Na₂SO₄ solution?',
          correctAnswer: 'precipitate',
          explanation: 'Barium sulfate (BaSO₄) is insoluble in water and forms a white precipitate.',
          hints: [
            'Consider the solubility of Group 2 sulfates',
            'Barium compounds often form precipitates',
            'This reaction is used to test for sulfate ions'
          ]
        },
        timeLimit: 60,
        requiredLevel: 4,
        rewards: [
          { type: 'xp', amount: 60, description: '60 XP for correct prediction' },
          { type: 'gold', amount: 30, description: '30 Gold base reward' }
        ],
        metadata: {
          concepts: ['precipitation', 'solubility rules', 'sulfate precipitation'],
          curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
          estimatedDuration: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gameSpecific: {
            reaction: {
              reactant1: 'BaCl₂',
              reactant2: 'Na₂SO₄',
              products: ['BaSO₄', 'NaCl'],
              willPrecipitate: true,
              precipitate: 'BaSO₄',
              explanation: 'Barium sulfate (BaSO₄) is insoluble in water and forms a white precipitate.',
              difficulty: 2,
              topic: 'Sulfate precipitation'
            },
            betOptions: [
              {
                id: 'precipitate_yes_high',
                description: 'Precipitate will form (High confidence)',
                odds: 1.2,
                confidenceLevel: 'high'
              },
              {
                id: 'precipitate_yes_medium',
                description: 'Precipitate will form (Medium confidence)',
                odds: 1.5,
                confidenceLevel: 'medium'
              },
              {
                id: 'precipitate_yes_low',
                description: 'Precipitate will form (Low confidence)',
                odds: 2.0,
                confidenceLevel: 'low'
              },
              {
                id: 'precipitate_no_high',
                description: 'No precipitate will form (High confidence)',
                odds: 0.1,
                confidenceLevel: 'high'
              },
              {
                id: 'precipitate_no_medium',
                description: 'No precipitate will form (Medium confidence)',
                odds: 0.3,
                confidenceLevel: 'medium'
              },
              {
                id: 'precipitate_no_low',
                description: 'No precipitate will form (Low confidence)',
                odds: 0.5,
                confidenceLevel: 'low'
              }
            ],
            currentBankroll: 1000
          }
        }
      },
      {
        id: 'cc-001',
        realmId: 'seers-challenge',
        type: ChallengeType.COLOR_CLASH,
        difficulty: 2,
        title: 'Color Clash: Complex Ion Formation',
        description: 'Describe the color change in complex ion formation reactions',
        content: {
          question: 'A pale blue solution of copper ions becomes intensely blue when ammonia is added dropwise. Describe the color change you would observe:',
          correctAnswer: 'deep blue',
          explanation: 'Copper ions form a deep blue complex with ammonia: [Cu(NH₃)₄]²⁺',
          hints: [
            'Consider the initial and final states of the reaction',
            'Think about what chemical species are responsible for the colors',
            'Look for clues about the type of reaction occurring',
            'This involves Complex ion formation'
          ]
        },
        timeLimit: 130,
        requiredLevel: 4,
        rewards: [
          { type: 'xp', amount: 60, description: '60 XP for correct description' },
          { type: 'gold', amount: 30, description: '30 Gold base reward' }
        ],
        metadata: {
          concepts: ['color changes', 'chemical reactions', 'Complex ion formation'],
          curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
          estimatedDuration: 130,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gameSpecific: {
            reaction: {
              id: 'cc-001',
              reactants: ['Cu²⁺', 'NH₃'],
              products: ['[Cu(NH₃)₄]²⁺'],
              initialColor: 'pale blue',
              finalColor: 'deep blue',
              colorDescription: 'deep blue',
              textClue: 'A pale blue solution of copper ions becomes intensely blue when ammonia is added dropwise.',
              explanation: 'Copper ions form a deep blue complex with ammonia: [Cu(NH₃)₄]²⁺',
              difficulty: 2,
              topic: 'Complex ion formation',
              additionalObservations: ['Solution becomes more viscous', 'No precipitate forms']
            },
            maxScore: 100,
            scoringCriteria: {
              exactMatch: 100,
              partialMatch: 60,
              colorMentioned: 30,
              noMatch: 0
            }
          }
        }
      },
      {
        id: 'mr-001',
        realmId: 'seers-challenge',
        type: ChallengeType.MYSTERY_REACTION,
        difficulty: 2,
        title: 'Mystery Reaction: Gas Evolution',
        description: 'Watch the reaction and identify the gas produced',
        content: {
          question: 'Watch the animated reaction and answer the following:\n\n1. What gas is being produced?\n2. Write the balanced chemical equation for this reaction.\n\nReactants: CaCO₃ + HCl\nVisual effects: vigorous fizzing, bubbles rising through solution, effervescence',
          correctAnswer: JSON.stringify({
            gas: 'CO₂',
            equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂'
          }),
          explanation: 'Calcium carbonate reacts with hydrochloric acid to produce carbon dioxide gas, which causes vigorous effervescence.',
          hints: [
            'Observe the visual effects carefully - they give clues about the gas',
            'Consider the properties of different gases (color, smell, density)',
            'Think about what type of reaction this might be',
            'This involves Acid-carbonate reaction'
          ]
        },
        timeLimit: 150,
        requiredLevel: 4,
        rewards: [
          { type: 'xp', amount: 70, description: '70 XP for correct identification' },
          { type: 'gold', amount: 35, description: '35 Gold base reward' }
        ],
        metadata: {
          concepts: ['gas identification', 'chemical equations', 'Acid-carbonate reaction'],
          curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
          estimatedDuration: 150,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gameSpecific: {
            reaction: {
              id: 'mr-001',
              reactants: ['CaCO₃', 'HCl'],
              products: ['CaCl₂', 'H₂O', 'CO₂'],
              gasProduced: 'CO₂',
              gasProperties: {
                color: 'colorless',
                smell: 'odorless',
                density: 'denser than air',
                solubility: 'slightly soluble in water',
                flammability: 'non-flammable',
                toxicity: 'non-toxic in small amounts'
              },
              visualEffects: ['vigorous fizzing', 'bubbles rising through solution', 'effervescence'],
              equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂',
              explanation: 'Calcium carbonate reacts with hydrochloric acid to produce carbon dioxide gas, which causes vigorous effervescence.',
              difficulty: 2,
              topic: 'Acid-carbonate reaction',
              crystalBallVideo: {
                title: 'The Chemistry of Limestone and Acid Rain',
                description: 'Dr. Sarah Chen explains how acid-carbonate reactions affect limestone buildings and natural formations.',
                expertName: 'Dr. Sarah Chen',
                duration: '3:45'
              }
            },
            gasOptions: ['CO₂', 'H₂', 'O₂', 'NH₃'],
            maxScore: 100,
            scoringCriteria: {
              bothCorrect: 100,
              gasOnly: 60,
              equationOnly: 40,
              neither: 0
            }
          }
        }
      }
    ];
  };

  const startChallenge = (challenge: Challenge) => {
    setRealmState(prev => ({
      ...prev,
      currentChallenge: challenge,
      showRealmMap: false
    }));

    // Start timer if challenge has time limit
    if (challenge.timeLimit) {
      setRealmState(prev => ({ ...prev, timeRemaining: challenge.timeLimit }));
      
      const newTimer = setInterval(() => {
        setRealmState(prev => {
          if (prev.timeRemaining && prev.timeRemaining > 1) {
            return { ...prev, timeRemaining: prev.timeRemaining - 1 };
          } else {
            // Time's up - auto-submit or handle timeout
            handleTimeUp();
            return { ...prev, timeRemaining: 0 };
          }
        });
      }, 1000);
      
      setTimer(newTimer);
    }
  };

  const handleTimeUp = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    // Handle timeout - could auto-submit a default answer or show timeout message
    const timeoutResult: ValidationResult = {
      isCorrect: false,
      score: 0,
      feedback: "Time's up! The challenge has ended.",
      explanation: "You ran out of time to make your prediction."
    };
    
    handleChallengeComplete(timeoutResult);
  };

  const handleChallengeComplete = (result: ValidationResult) => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }

    // Update progress
    if (realmState.currentChallenge) {
      const challengeType = realmState.currentChallenge.type;
      setRealmState(prev => ({
        ...prev,
        completedChallenges: [...prev.completedChallenges, prev.currentChallenge!.id],
        realmProgress: {
          ...prev.realmProgress,
          precipitatePokerCompleted: challengeType === ChallengeType.PRECIPITATION_POKER 
            ? prev.realmProgress.precipitatePokerCompleted + 1 
            : prev.realmProgress.precipitatePokerCompleted,
          colorClashCompleted: challengeType === ChallengeType.COLOR_CLASH 
            ? prev.realmProgress.colorClashCompleted + 1 
            : prev.realmProgress.colorClashCompleted,
          mysteryReactionCompleted: challengeType === ChallengeType.MYSTERY_REACTION 
            ? prev.realmProgress.mysteryReactionCompleted + 1 
            : prev.realmProgress.mysteryReactionCompleted
        }
      }));
    }

    onChallengeComplete(result);
    
    // Return to realm map after a delay
    setTimeout(() => {
      setRealmState(prev => ({
        ...prev,
        currentChallenge: null,
        showRealmMap: true,
        timeRemaining: undefined
      }));
    }, 2000);
  };

  const renderChallengeComponent = () => {
    if (!realmState.currentChallenge) return null;

    switch (realmState.currentChallenge.type) {
      case ChallengeType.PRECIPITATION_POKER:
        return (
          <PrecipitatePoker
            challenge={realmState.currentChallenge}
            onSubmitAnswer={onSubmitAnswer}
            onComplete={handleChallengeComplete}
            timeRemaining={realmState.timeRemaining}
          />
        );
      case ChallengeType.COLOR_CLASH:
        return (
          <ColorClash
            challenge={realmState.currentChallenge}
            onSubmitAnswer={onSubmitAnswer}
            onComplete={handleChallengeComplete}
            timeRemaining={realmState.timeRemaining}
          />
        );
      case ChallengeType.MYSTERY_REACTION:
        return (
          <MysteryReaction
            challenge={realmState.currentChallenge}
            onSubmitAnswer={onSubmitAnswer}
            onComplete={handleChallengeComplete}
            timeRemaining={realmState.timeRemaining}
          />
        );
      default:
        return <div>Challenge type not implemented yet</div>;
    }
  };

  const getGameTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case ChallengeType.PRECIPITATION_POKER:
        return '🎰';
      case ChallengeType.COLOR_CLASH:
        return '🎨';
      case ChallengeType.MYSTERY_REACTION:
        return '🔮';
      default:
        return '⚗️';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return '#27ae60';
      case 2: return '#f39c12';
      case 3: return '#e67e22';
      case 4: return '#e74c3c';
      case 5: return '#8e44ad';
      default: return '#95a5a6';
    }
  };

  if (!realmState.showRealmMap) {
    return (
      <div className="seers-challenge-realm">
        {renderChallengeComponent()}
      </div>
    );
  }

  return (
    <div className="seers-challenge-realm">
      <div className="realm-header">
        <h1>🔮 The Seer's Challenge</h1>
        <p className="realm-description">
          Master observation and interpretation skills through prediction games. 
          Use your knowledge of chemical reactions to predict outcomes and win virtual gold!
        </p>
      </div>

      <div className="realm-progress">
        <h3>Your Progress</h3>
        <div className="progress-stats">
          <div className="progress-item">
            <span className="progress-icon">🎰</span>
            <span className="progress-label">Precipitate Poker</span>
            <span className="progress-count">{realmState.realmProgress.precipitatePokerCompleted}</span>
          </div>
          <div className="progress-item">
            <span className="progress-icon">🎨</span>
            <span className="progress-label">Color Clash</span>
            <span className="progress-count">{realmState.realmProgress.colorClashCompleted}</span>
          </div>
          <div className="progress-item">
            <span className="progress-icon">🔮</span>
            <span className="progress-label">Mystery Reaction</span>
            <span className="progress-count">{realmState.realmProgress.mysteryReactionCompleted}</span>
          </div>
        </div>
      </div>

      <div className="available-challenges">
        <h3>Available Challenges</h3>
        <div className="challenges-grid">
          {realmState.availableChallenges.map(challenge => (
            <div 
              key={challenge.id} 
              className={`challenge-card ${realmState.completedChallenges.includes(challenge.id) ? 'completed' : ''}`}
            >
              <div className="challenge-header">
                <span className="challenge-icon">{getGameTypeIcon(challenge.type)}</span>
                <div className="challenge-info">
                  <h4>{challenge.title}</h4>
                  <p className="challenge-description">{challenge.description}</p>
                </div>
              </div>
              
              <div className="challenge-details">
                <div className="challenge-meta">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
                  >
                    Level {challenge.difficulty}
                  </span>
                  {challenge.timeLimit && (
                    <span className="time-limit">⏱️ {challenge.timeLimit}s</span>
                  )}
                </div>
                
                <div className="challenge-rewards">
                  {challenge.rewards.map((reward, index) => (
                    <span key={index} className="reward-badge">
                      {reward.type === 'xp' && '⭐'} 
                      {reward.type === 'gold' && '🪙'}
                      {reward.amount}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                className="start-challenge-btn"
                onClick={() => startChallenge(challenge)}
                disabled={challenge.requiredLevel > userLevel}
              >
                {realmState.completedChallenges.includes(challenge.id) ? 'Replay' : 'Start Challenge'}
              </button>
              
              {challenge.requiredLevel > userLevel && (
                <div className="level-requirement">
                  Requires Level {challenge.requiredLevel}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="realm-lore">
        <h3>🔮 Realm Lore</h3>
        <div className="lore-content">
          <p>
            Welcome to the mystical Seer's Challenge, where ancient alchemists once tested their 
            powers of observation and prediction. Here, you must peer into the chemical future, 
            predicting the outcomes of reactions before they occur.
          </p>
          <div className="lore-games">
            <div className="lore-game">
              <h4>🎰 Precipitate Poker</h4>
              <p>
                Bet your virtual gold on whether chemical reactions will produce precipitates. 
                The more confident you are, the higher the stakes - but also the greater the rewards!
              </p>
            </div>
            <div className="lore-game">
              <h4>🎨 Color Clash (Coming Soon)</h4>
              <p>
                Describe the vivid color changes in chemical reactions based on textual clues. 
                Your observational skills will be put to the ultimate test.
              </p>
            </div>
            <div className="lore-game">
              <h4>🔮 Mystery Reaction (Coming Soon)</h4>
              <p>
                Watch animated reactions and identify the gases produced. Unlock the Crystal Ball 
                to reveal expert explanations of complex chemical phenomena.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeersChallengeRealm;