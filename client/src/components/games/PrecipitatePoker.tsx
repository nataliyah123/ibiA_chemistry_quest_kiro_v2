import React, { useState, useEffect } from 'react';
import { Challenge, Answer, ValidationResult } from '../../types/game';
import './PrecipitatePoker.css';

interface BetOption {
  id: string;
  description: string;
  odds: number;
  confidenceLevel: 'low' | 'medium' | 'high';
}

interface PrecipitatePokerProps {
  challenge: Challenge;
  onSubmitAnswer: (answer: Answer) => Promise<ValidationResult>;
  onComplete: (result: ValidationResult) => void;
  timeRemaining?: number;
}

interface GameState {
  selectedBet: string | null;
  betAmount: number;
  bankroll: number;
  showResult: boolean;
  result: ValidationResult | null;
  gameHistory: Array<{
    bet: string;
    amount: number;
    won: boolean;
    winnings: number;
  }>;
}

const PrecipitatePoker: React.FC<PrecipitatePokerProps> = ({
  challenge,
  onSubmitAnswer,
  onComplete,
  timeRemaining
}) => {
  const [gameState, setGameState] = useState<GameState>({
    selectedBet: null,
    betAmount: 50,
    bankroll: 1000,
    showResult: false,
    result: null,
    gameHistory: []
  });

  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [startTime] = useState(Date.now());

  // Extract game data from challenge metadata
  const gameData = challenge.metadata?.gameSpecific;
  const reaction = gameData?.reaction;
  const betOptions: BetOption[] = gameData?.betOptions || [];

  // Group bet options by prediction type
  const precipitateBets = betOptions.filter(bet => bet.id.includes('yes'));
  const noPrecipitateBets = betOptions.filter(bet => bet.id.includes('no'));

  const handleBetSelection = (betId: string) => {
    if (!gameState.showResult) {
      setGameState(prev => ({ ...prev, selectedBet: betId }));
    }
  };

  const handleBetAmountChange = (amount: number) => {
    const clampedAmount = Math.max(10, Math.min(amount, gameState.bankroll));
    setGameState(prev => ({ ...prev, betAmount: clampedAmount }));
  };

  const handleSubmit = async () => {
    if (!gameState.selectedBet || gameState.betAmount <= 0) {
      return;
    }

    const selectedBetOption = betOptions.find(bet => bet.id === gameState.selectedBet);
    if (!selectedBetOption) return;

    const timeElapsed = (Date.now() - startTime) / 1000;
    
    const answer: Answer = {
      challengeId: challenge.id,
      response: {
        prediction: gameState.selectedBet,
        betAmount: gameState.betAmount,
        confidenceLevel: selectedBetOption.confidenceLevel
      },
      timeElapsed,
      hintsUsed
    };

    try {
      const result = await onSubmitAnswer(answer);
      
      // Update game state with result
      const winnings = result.metadata?.winnings || 0;
      const newBankroll = result.metadata?.newBankroll || gameState.bankroll;
      
      setGameState(prev => ({
        ...prev,
        showResult: true,
        result,
        bankroll: newBankroll,
        gameHistory: [
          ...prev.gameHistory,
          {
            bet: gameState.selectedBet!,
            amount: gameState.betAmount,
            won: result.isCorrect,
            winnings
          }
        ]
      }));

      // Auto-complete after showing result
      setTimeout(() => {
        onComplete(result);
      }, 3000);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleHint = () => {
    setHintsUsed(prev => prev + 1);
    setShowHints(true);
  };

  const getBetButtonClass = (betId: string) => {
    const baseClass = 'bet-option';
    if (gameState.selectedBet === betId) {
      return `${baseClass} selected`;
    }
    if (gameState.showResult) {
      const selectedBet = betOptions.find(bet => bet.id === gameState.selectedBet);
      const thisBet = betOptions.find(bet => bet.id === betId);
      
      if (gameState.result?.isCorrect && thisBet?.id === gameState.selectedBet) {
        return `${baseClass} correct`;
      } else if (!gameState.result?.isCorrect && thisBet?.id === gameState.selectedBet) {
        return `${baseClass} incorrect`;
      }
    }
    return baseClass;
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="precipitate-poker">
      <div className="game-header">
        <h2>{challenge.title}</h2>
        <div className="game-stats">
          <div className="bankroll">
            <span className="gold-icon">🪙</span>
            <span>{gameState.bankroll} Gold</span>
          </div>
          {timeRemaining && (
            <div className="timer">
              <span className="timer-icon">⏱️</span>
              <span>{Math.ceil(timeRemaining)}s</span>
            </div>
          )}
        </div>
      </div>

      <div className="reaction-display">
        <h3>Chemical Reaction</h3>
        <div className="reaction-equation">
          {reaction?.reactant1} + {reaction?.reactant2} → ?
        </div>
        <p className="reaction-description">
          {challenge.content.question}
        </p>
      </div>

      <div className="betting-interface">
        <div className="bet-categories">
          <div className="bet-category">
            <h4>Precipitate Will Form</h4>
            <div className="bet-options">
              {precipitateBets.map(bet => (
                <button
                  key={bet.id}
                  className={getBetButtonClass(bet.id)}
                  onClick={() => handleBetSelection(bet.id)}
                  disabled={gameState.showResult}
                  style={{ borderColor: getConfidenceColor(bet.confidenceLevel) }}
                >
                  <div className="bet-description">{bet.description}</div>
                  <div className="bet-odds">Odds: {bet.odds.toFixed(1)}x</div>
                  <div className="confidence-level" style={{ color: getConfidenceColor(bet.confidenceLevel) }}>
                    {bet.confidenceLevel.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bet-category">
            <h4>No Precipitate Will Form</h4>
            <div className="bet-options">
              {noPrecipitateBets.map(bet => (
                <button
                  key={bet.id}
                  className={getBetButtonClass(bet.id)}
                  onClick={() => handleBetSelection(bet.id)}
                  disabled={gameState.showResult}
                  style={{ borderColor: getConfidenceColor(bet.confidenceLevel) }}
                >
                  <div className="bet-description">{bet.description}</div>
                  <div className="bet-odds">Odds: {bet.odds.toFixed(1)}x</div>
                  <div className="confidence-level" style={{ color: getConfidenceColor(bet.confidenceLevel) }}>
                    {bet.confidenceLevel.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bet-amount-section">
          <h4>Bet Amount</h4>
          <div className="bet-amount-controls">
            <button 
              onClick={() => handleBetAmountChange(gameState.betAmount - 10)}
              disabled={gameState.showResult || gameState.betAmount <= 10}
            >
              -10
            </button>
            <input
              type="number"
              value={gameState.betAmount}
              onChange={(e) => handleBetAmountChange(parseInt(e.target.value) || 0)}
              min="10"
              max={gameState.bankroll}
              disabled={gameState.showResult}
            />
            <button 
              onClick={() => handleBetAmountChange(gameState.betAmount + 10)}
              disabled={gameState.showResult || gameState.betAmount >= gameState.bankroll}
            >
              +10
            </button>
          </div>
          <div className="quick-bet-buttons">
            <button onClick={() => handleBetAmountChange(Math.floor(gameState.bankroll * 0.1))} disabled={gameState.showResult}>
              10%
            </button>
            <button onClick={() => handleBetAmountChange(Math.floor(gameState.bankroll * 0.25))} disabled={gameState.showResult}>
              25%
            </button>
            <button onClick={() => handleBetAmountChange(Math.floor(gameState.bankroll * 0.5))} disabled={gameState.showResult}>
              50%
            </button>
            <button onClick={() => handleBetAmountChange(gameState.bankroll)} disabled={gameState.showResult}>
              All In
            </button>
          </div>
        </div>
      </div>

      <div className="game-controls">
        <button 
          className="hint-button"
          onClick={handleHint}
          disabled={gameState.showResult}
        >
          💡 Hint ({hintsUsed} used)
        </button>
        
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!gameState.selectedBet || gameState.betAmount <= 0 || gameState.showResult}
        >
          Place Bet
        </button>
      </div>

      {showHints && (
        <div className="hints-section">
          <h4>Hints:</h4>
          <ul>
            {challenge.content.hints.slice(0, hintsUsed).map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {gameState.showResult && gameState.result && (
        <div className={`result-section ${gameState.result.isCorrect ? 'correct' : 'incorrect'}`}>
          <h3>{gameState.result.isCorrect ? '🎉 Correct Prediction!' : '❌ Incorrect Prediction'}</h3>
          <p className="result-feedback">{gameState.result.feedback}</p>
          <div className="result-details">
            <p><strong>Explanation:</strong> {gameState.result.explanation}</p>
            <p><strong>Score:</strong> {gameState.result.score} points</p>
            {gameState.result.metadata?.winnings && (
              <p><strong>Winnings:</strong> {gameState.result.metadata.winnings > 0 ? '+' : ''}{gameState.result.metadata.winnings} gold</p>
            )}
          </div>
        </div>
      )}

      {gameState.gameHistory.length > 0 && (
        <div className="game-history">
          <h4>Betting History</h4>
          <div className="history-list">
            {gameState.gameHistory.slice(-3).map((entry, index) => (
              <div key={index} className={`history-entry ${entry.won ? 'won' : 'lost'}`}>
                <span>{entry.bet.includes('yes') ? '✓' : '✗'} Precipitate</span>
                <span>{entry.amount} gold</span>
                <span className={entry.won ? 'win' : 'loss'}>
                  {entry.won ? '+' : ''}{entry.winnings}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrecipitatePoker;