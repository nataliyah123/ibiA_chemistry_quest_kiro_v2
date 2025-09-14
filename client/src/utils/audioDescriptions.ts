// Audio Description Utilities for ChemQuest

export interface AudioDescription {
  id: string;
  text: string;
  duration?: number;
  priority: 'low' | 'medium' | 'high';
  category: 'navigation' | 'game' | 'feedback' | 'instruction';
}

export class AudioDescriptionManager {
  private static instance: AudioDescriptionManager;
  private speechSynthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private queue: AudioDescription[] = [];
  private isEnabled: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;
  private rate: number = 1;
  private volume: number = 0.8;

  private constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.initializeVoice();
  }

  public static getInstance(): AudioDescriptionManager {
    if (!AudioDescriptionManager.instance) {
      AudioDescriptionManager.instance = new AudioDescriptionManager();
    }
    return AudioDescriptionManager.instance;
  }

  private initializeVoice(): void {
    // Wait for voices to be loaded
    const setVoice = () => {
      const voices = this.speechSynthesis.getVoices();
      // Prefer English voices
      this.voice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.localService
      ) || voices[0] || null;
    };

    if (this.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      this.speechSynthesis.addEventListener('voiceschanged', setVoice);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(2, rate));
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public describe(description: AudioDescription): void {
    if (!this.isEnabled) return;

    // Add to queue based on priority
    if (description.priority === 'high') {
      this.queue.unshift(description);
    } else {
      this.queue.push(description);
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (this.currentUtterance || this.queue.length === 0) return;

    const description = this.queue.shift()!;
    this.speak(description.text);
  }

  private speak(text: string): void {
    if (!this.speechSynthesis || !this.voice) return;

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.voice = this.voice;
    this.currentUtterance.rate = this.rate;
    this.currentUtterance.volume = this.volume;

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      // Process next item in queue
      setTimeout(() => this.processQueue(), 100);
    };

    this.currentUtterance.onerror = () => {
      this.currentUtterance = null;
      setTimeout(() => this.processQueue(), 100);
    };

    this.speechSynthesis.speak(this.currentUtterance);
  }

  public stop(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.queue = [];
  }

  public pause(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.speechSynthesis.paused) {
      this.speechSynthesis.resume();
    }
  }
}

// Game-specific audio descriptions
export const GameAudioDescriptions = {
  // Equation Duels descriptions
  equationDuels: {
    gameStart: (): AudioDescription => ({
      id: 'equation-duels-start',
      text: 'Equation Duels has started. Balance the chemical equation by adjusting coefficients. Use Tab to navigate between coefficient inputs, and Enter to submit your answer.',
      priority: 'high',
      category: 'instruction'
    }),

    equationPresented: (equation: string): AudioDescription => ({
      id: 'equation-presented',
      text: `New equation to balance: ${equation}. Find the correct coefficients to balance this chemical equation.`,
      priority: 'high',
      category: 'game'
    }),

    correctAnswer: (explanation?: string): AudioDescription => ({
      id: 'correct-answer',
      text: `Correct! ${explanation || 'Well done balancing the equation.'}`,
      priority: 'high',
      category: 'feedback'
    }),

    incorrectAnswer: (hint?: string): AudioDescription => ({
      id: 'incorrect-answer',
      text: `Incorrect. ${hint || 'Try adjusting the coefficients to balance the atoms on both sides.'}`,
      priority: 'high',
      category: 'feedback'
    }),

    timeWarning: (seconds: number): AudioDescription => ({
      id: 'time-warning',
      text: `${seconds} seconds remaining!`,
      priority: 'medium',
      category: 'game'
    })
  },

  // Memory Labyrinth descriptions
  memoryLabyrinth: {
    flashcardMatch: {
      gameStart: (): AudioDescription => ({
        id: 'flashcard-start',
        text: 'Flashcard Match game started. Match gas tests with their flame colors. Use arrow keys to navigate the grid, Space to flip cards, and Enter to select matches.',
        priority: 'high',
        category: 'instruction'
      }),

      cardFlipped: (content: string): AudioDescription => ({
        id: 'card-flipped',
        text: `Card revealed: ${content}`,
        priority: 'medium',
        category: 'game'
      }),

      matchFound: (pair: string): AudioDescription => ({
        id: 'match-found',
        text: `Match found! ${pair}`,
        priority: 'high',
        category: 'feedback'
      }),

      noMatch: (): AudioDescription => ({
        id: 'no-match',
        text: 'No match. Cards will flip back.',
        priority: 'medium',
        category: 'feedback'
      })
    },

    qaRoulette: {
      wheelSpinning: (): AudioDescription => ({
        id: 'wheel-spinning',
        text: 'Roulette wheel is spinning. Get ready to answer about the selected ion test.',
        priority: 'medium',
        category: 'game'
      }),

      ionSelected: (ion: string): AudioDescription => ({
        id: 'ion-selected',
        text: `Ion selected: ${ion}. Describe the test procedure and expected result. Timer has started.`,
        priority: 'high',
        category: 'game'
      })
    }
  },

  // Virtual Apprentice descriptions
  virtualApprentice: {
    stepByStep: {
      gameStart: (): AudioDescription => ({
        id: 'step-by-step-start',
        text: 'Step-by-step simulator started. Arrange the laboratory procedure steps in the correct order. Use arrow keys to navigate, Space to select, and drag to reorder.',
        priority: 'high',
        category: 'instruction'
      }),

      stepSelected: (step: string): AudioDescription => ({
        id: 'step-selected',
        text: `Step selected: ${step}`,
        priority: 'medium',
        category: 'game'
      }),

      correctOrder: (): AudioDescription => ({
        id: 'correct-order',
        text: 'Excellent! All steps are in the correct order. The procedure is now complete.',
        priority: 'high',
        category: 'feedback'
      }),

      explosion: (): AudioDescription => ({
        id: 'explosion',
        text: 'Explosion! The steps were in the wrong order. The procedure has been reset. Try again.',
        priority: 'high',
        category: 'feedback'
      })
    }
  },

  // General game descriptions
  general: {
    scoreUpdate: (score: number, maxScore?: number): AudioDescription => ({
      id: 'score-update',
      text: maxScore ? `Score: ${score} out of ${maxScore}` : `Current score: ${score}`,
      priority: 'low',
      category: 'feedback'
    }),

    levelUp: (newLevel: number): AudioDescription => ({
      id: 'level-up',
      text: `Congratulations! You've reached level ${newLevel}!`,
      priority: 'high',
      category: 'feedback'
    }),

    gameComplete: (finalScore: number): AudioDescription => ({
      id: 'game-complete',
      text: `Game completed! Your final score is ${finalScore}. Well done!`,
      priority: 'high',
      category: 'feedback'
    }),

    navigationHelp: (): AudioDescription => ({
      id: 'navigation-help',
      text: 'Use Tab to navigate between elements, Enter to activate buttons, Arrow keys for game controls, and Escape to close dialogs.',
      priority: 'medium',
      category: 'instruction'
    })
  }
};

// Hook for using audio descriptions in components
export const useAudioDescriptions = () => {
  const manager = AudioDescriptionManager.getInstance();

  const describe = (description: AudioDescription) => {
    manager.describe(description);
  };

  const stop = () => {
    manager.stop();
  };

  const setEnabled = (enabled: boolean) => {
    manager.setEnabled(enabled);
  };

  const setRate = (rate: number) => {
    manager.setRate(rate);
  };

  const setVolume = (volume: number) => {
    manager.setVolume(volume);
  };

  return {
    describe,
    stop,
    setEnabled,
    setRate,
    setVolume,
    descriptions: GameAudioDescriptions
  };
};