import { RealmComponent, RealmMechanic } from '../realmComponent.js';
import { 
  Challenge, 
  Answer, 
  ValidationResult, 
  BossResult,
  ChallengeType,
  ChallengeContent,
  Reward
} from '../../types/game.js';

// Graph Joust interfaces
export interface ChemistryDataset {
  id: string;
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
  dataPoints: DataPoint[];
  difficulty: number;
  topic: string;
  expectedTrend: 'linear' | 'exponential' | 'logarithmic' | 'inverse' | 'sigmoidal';
  context: string;
}

export interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface GraphJoustChallenge extends Challenge {
  content: ChallengeContent & {
    dataset: ChemistryDataset;
    aiDifficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
    maxPoints: number;
  };
}

// Error Hunter interfaces
export interface DatasetWithErrors {
  id: string;
  title: string;
  description: string;
  originalData: DataPoint[];
  corruptedData: DataPoint[];
  errors: DataError[];
  difficulty: number;
  topic: string;
  context: string;
}

export interface DataError {
  id: string;
  type: 'calculation' | 'outlier' | 'transcription' | 'unit' | 'systematic';
  pointIndex: number;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  hint: string;
}

export interface ErrorHunterChallenge extends Challenge {
  content: ChallengeContent & {
    dataset: DatasetWithErrors;
    maxErrors: number;
    hintsAvailable: number;
  };
}

// Uncertainty Golem interfaces
export interface PercentageErrorProblem {
  id: string;
  scenario: string;
  measuredValue: number;
  trueValue: number;
  unit: string;
  difficulty: number;
  topic: string;
  context: string;
  distractors?: number[];
}

export interface UncertaintyGolemChallenge extends Challenge {
  content: ChallengeContent & {
    problem: PercentageErrorProblem;
    golemHealth: number;
    stage: number;
    maxStages: number;
  };
}

export class CartographersGauntletRealm extends RealmComponent {
  realmId = 'cartographers-gauntlet';
  name = "The Cartographer's Gauntlet";
  description = 'Master data analysis and graphing through competitive challenges';
  requiredLevel = 5;

  private chemistryDatasets: ChemistryDataset[] = [
    // Difficulty 1 - Simple linear relationships
    {
      id: 'ds-001',
      title: 'Concentration vs Absorbance (Beer\'s Law)',
      description: 'Plot the relationship between solution concentration and light absorbance',
      xLabel: 'Concentration (mol/L)',
      yLabel: 'Absorbance',
      dataPoints: [
        { x: 0.0, y: 0.00 },
        { x: 0.1, y: 0.15 },
        { x: 0.2, y: 0.30 },
        { x: 0.3, y: 0.45 },
        { x: 0.4, y: 0.60 },
        { x: 0.5, y: 0.75 }
      ],
      difficulty: 1,
      topic: 'Spectroscopy',
      expectedTrend: 'linear',
      context: 'A student is analyzing copper sulfate solutions of different concentrations using a colorimeter.'
    },
    {
      id: 'ds-002',
      title: 'Volume vs Temperature (Charles\' Law)',
      description: 'Plot how gas volume changes with temperature at constant pressure',
      xLabel: 'Temperature (K)',
      yLabel: 'Volume (L)',
      dataPoints: [
        { x: 273, y: 2.0 },
        { x: 300, y: 2.2 },
        { x: 350, y: 2.6 },
        { x: 400, y: 2.9 },
        { x: 450, y: 3.3 },
        { x: 500, y: 3.7 }
      ],
      difficulty: 1,
      topic: 'Gas Laws',
      expectedTrend: 'linear',
      context: 'Investigating how the volume of a gas sample changes when heated at constant pressure.'
    },
    {
      id: 'ds-003',
      title: 'Pressure vs Volume (Boyle\'s Law)',
      description: 'Plot the inverse relationship between gas pressure and volume',
      xLabel: 'Volume (L)',
      yLabel: 'Pressure (atm)',
      dataPoints: [
        { x: 1.0, y: 4.0 },
        { x: 2.0, y: 2.0 },
        { x: 3.0, y: 1.33 },
        { x: 4.0, y: 1.0 },
        { x: 5.0, y: 0.8 },
        { x: 6.0, y: 0.67 }
      ],
      difficulty: 2,
      topic: 'Gas Laws',
      expectedTrend: 'inverse',
      context: 'Compressing a gas sample at constant temperature to study pressure-volume relationships.'
    },

    // Difficulty 2 - Titration curves
    {
      id: 'ds-004',
      title: 'Strong Acid-Strong Base Titration',
      description: 'Plot pH changes during titration of HCl with NaOH',
      xLabel: 'Volume NaOH added (mL)',
      yLabel: 'pH',
      dataPoints: [
        { x: 0, y: 1.0 },
        { x: 5, y: 1.2 },
        { x: 10, y: 1.4 },
        { x: 15, y: 1.7 },
        { x: 20, y: 2.3 },
        { x: 22, y: 3.0 },
        { x: 24, y: 7.0 },
        { x: 25, y: 11.0 },
        { x: 26, y: 12.0 },
        { x: 30, y: 12.5 }
      ],
      difficulty: 2,
      topic: 'Acid-Base Titrations',
      expectedTrend: 'sigmoidal',
      context: 'Titrating 25 mL of 0.1 M HCl with 0.1 M NaOH using a pH meter.'
    },
    {
      id: 'ds-005',
      title: 'Weak Acid-Strong Base Titration',
      description: 'Plot pH changes during titration of acetic acid with NaOH',
      xLabel: 'Volume NaOH added (mL)',
      yLabel: 'pH',
      dataPoints: [
        { x: 0, y: 2.9 },
        { x: 5, y: 4.2 },
        { x: 10, y: 4.8 },
        { x: 15, y: 5.3 },
        { x: 20, y: 6.0 },
        { x: 22, y: 6.5 },
        { x: 24, y: 8.2 },
        { x: 25, y: 8.7 },
        { x: 26, y: 11.2 },
        { x: 30, y: 12.4 }
      ],
      difficulty: 3,
      topic: 'Acid-Base Titrations',
      expectedTrend: 'sigmoidal',
      context: 'Titrating 25 mL of 0.1 M acetic acid with 0.1 M NaOH, showing buffer region.'
    },

    // Difficulty 3 - Kinetics data
    {
      id: 'ds-006',
      title: 'First Order Reaction Kinetics',
      description: 'Plot concentration vs time for a first-order reaction',
      xLabel: 'Time (min)',
      yLabel: 'Concentration (M)',
      dataPoints: [
        { x: 0, y: 1.00 },
        { x: 2, y: 0.74 },
        { x: 4, y: 0.55 },
        { x: 6, y: 0.41 },
        { x: 8, y: 0.30 },
        { x: 10, y: 0.22 },
        { x: 12, y: 0.17 }
      ],
      difficulty: 3,
      topic: 'Chemical Kinetics',
      expectedTrend: 'exponential',
      context: 'Monitoring the decomposition of hydrogen peroxide over time.'
    },
    {
      id: 'ds-007',
      title: 'Arrhenius Plot (ln k vs 1/T)',
      description: 'Plot natural log of rate constant vs inverse temperature',
      xLabel: '1/T (K⁻¹)',
      yLabel: 'ln k',
      dataPoints: [
        { x: 0.00250, y: -8.5 },
        { x: 0.00270, y: -9.2 },
        { x: 0.00290, y: -9.8 },
        { x: 0.00310, y: -10.5 },
        { x: 0.00330, y: -11.1 },
        { x: 0.00350, y: -11.8 }
      ],
      difficulty: 4,
      topic: 'Chemical Kinetics',
      expectedTrend: 'linear',
      context: 'Determining activation energy from temperature-dependent rate constants.'
    },

    // Difficulty 4 - Advanced relationships
    {
      id: 'ds-008',
      title: 'Enzyme Kinetics (Michaelis-Menten)',
      description: 'Plot reaction rate vs substrate concentration',
      xLabel: 'Substrate Concentration (mM)',
      yLabel: 'Reaction Rate (μM/s)',
      dataPoints: [
        { x: 0.5, y: 12 },
        { x: 1.0, y: 20 },
        { x: 2.0, y: 29 },
        { x: 5.0, y: 38 },
        { x: 10.0, y: 43 },
        { x: 20.0, y: 47 },
        { x: 50.0, y: 49 }
      ],
      difficulty: 4,
      topic: 'Biochemistry',
      expectedTrend: 'sigmoidal',
      context: 'Studying enzyme activity as a function of substrate concentration.'
    },
    {
      id: 'ds-009',
      title: 'Electrochemical Cell Voltage vs Concentration',
      description: 'Plot cell potential vs log concentration (Nernst equation)',
      xLabel: 'log[Cu²⁺]',
      yLabel: 'Cell Potential (V)',
      dataPoints: [
        { x: -3, y: 0.25 },
        { x: -2, y: 0.28 },
        { x: -1, y: 0.31 },
        { x: 0, y: 0.34 },
        { x: 1, y: 0.37 }
      ],
      difficulty: 4,
      topic: 'Electrochemistry',
      expectedTrend: 'linear',
      context: 'Measuring cell potential of Cu²⁺/Cu electrode at different concentrations.'
    },

    // Difficulty 5 - Complex multi-variable relationships
    {
      id: 'ds-010',
      title: 'Adsorption Isotherm (Langmuir)',
      description: 'Plot amount adsorbed vs pressure for gas adsorption',
      xLabel: 'Pressure (atm)',
      yLabel: 'Amount Adsorbed (mol/g)',
      dataPoints: [
        { x: 0.1, y: 0.05 },
        { x: 0.2, y: 0.09 },
        { x: 0.5, y: 0.18 },
        { x: 1.0, y: 0.29 },
        { x: 2.0, y: 0.40 },
        { x: 5.0, y: 0.56 },
        { x: 10.0, y: 0.65 }
      ],
      difficulty: 5,
      topic: 'Surface Chemistry',
      expectedTrend: 'sigmoidal',
      context: 'Studying gas adsorption on activated carbon surface.'
    },
    {
      id: 'ds-011',
      title: 'Crystallization Kinetics',
      description: 'Plot crystal size vs time during precipitation',
      xLabel: 'Time (hours)',
      yLabel: 'Average Crystal Size (μm)',
      dataPoints: [
        { x: 0, y: 0 },
        { x: 1, y: 15 },
        { x: 2, y: 28 },
        { x: 4, y: 45 },
        { x: 8, y: 62 },
        { x: 12, y: 73 },
        { x: 24, y: 85 }
      ],
      difficulty: 3,
      topic: 'Crystal Growth',
      expectedTrend: 'logarithmic',
      context: 'Monitoring crystal growth during slow precipitation of silver chloride.'
    },
    {
      id: 'ds-012',
      title: 'Solubility vs Temperature',
      description: 'Plot solubility of potassium nitrate vs temperature',
      xLabel: 'Temperature (°C)',
      yLabel: 'Solubility (g/100g H₂O)',
      dataPoints: [
        { x: 0, y: 13 },
        { x: 20, y: 32 },
        { x: 40, y: 64 },
        { x: 60, y: 110 },
        { x: 80, y: 169 },
        { x: 100, y: 246 }
      ],
      difficulty: 2,
      topic: 'Solubility',
      expectedTrend: 'exponential',
      context: 'Determining how much KNO₃ dissolves at different temperatures.'
    },
    {
      id: 'ds-013',
      title: 'Radioactive Decay',
      description: 'Plot activity vs time for radioactive decay',
      xLabel: 'Time (days)',
      yLabel: 'Activity (counts/min)',
      dataPoints: [
        { x: 0, y: 1000 },
        { x: 5, y: 707 },
        { x: 10, y: 500 },
        { x: 15, y: 354 },
        { x: 20, y: 250 },
        { x: 25, y: 177 },
        { x: 30, y: 125 }
      ],
      difficulty: 3,
      topic: 'Nuclear Chemistry',
      expectedTrend: 'exponential',
      context: 'Monitoring radioactive decay to determine half-life.'
    },
    {
      id: 'ds-014',
      title: 'Conductivity vs Concentration',
      description: 'Plot electrical conductivity vs electrolyte concentration',
      xLabel: 'Concentration (M)',
      yLabel: 'Conductivity (mS/cm)',
      dataPoints: [
        { x: 0.001, y: 0.15 },
        { x: 0.01, y: 1.41 },
        { x: 0.1, y: 12.9 },
        { x: 0.5, y: 58.2 },
        { x: 1.0, y: 111.0 }
      ],
      difficulty: 2,
      topic: 'Electrochemistry',
      expectedTrend: 'linear',
      context: 'Measuring conductivity of NaCl solutions at different concentrations.'
    },
    {
      id: 'ds-015',
      title: 'Vapor Pressure vs Temperature',
      description: 'Plot vapor pressure vs temperature for water',
      xLabel: 'Temperature (°C)',
      yLabel: 'Vapor Pressure (mmHg)',
      dataPoints: [
        { x: 0, y: 4.6 },
        { x: 20, y: 17.5 },
        { x: 40, y: 55.3 },
        { x: 60, y: 149.4 },
        { x: 80, y: 355.1 },
        { x: 100, y: 760.0 }
      ],
      difficulty: 3,
      topic: 'Phase Changes',
      expectedTrend: 'exponential',
      context: 'Studying how vapor pressure changes with temperature for pure water.'
    }
  ];

  private datasetsWithErrors: DatasetWithErrors[] = [
    // Difficulty 1 - Simple calculation errors
    {
      id: 'de-001',
      title: 'Titration Data with Calculation Errors',
      description: 'Find errors in this acid-base titration dataset',
      originalData: [
        { x: 0, y: 1.0 },
        { x: 5, y: 1.2 },
        { x: 10, y: 1.4 },
        { x: 15, y: 1.7 },
        { x: 20, y: 2.3 },
        { x: 25, y: 7.0 },
        { x: 30, y: 12.5 }
      ],
      corruptedData: [
        { x: 0, y: 1.0 },
        { x: 5, y: 1.2 },
        { x: 10, y: 1.4 },
        { x: 15, y: 1.7 },
        { x: 20, y: 2.3 },
        { x: 25, y: 7.0 },
        { x: 30, y: 1.25 } // Error: decimal point misplaced
      ],
      errors: [
        {
          id: 'e1',
          type: 'calculation',
          pointIndex: 6,
          description: 'Decimal point error: 1.25 should be 12.5',
          severity: 'major',
          hint: 'Check the decimal placement in the final pH reading'
        }
      ],
      difficulty: 1,
      topic: 'Acid-Base Titrations',
      context: 'A student recorded pH values during a strong acid-strong base titration.'
    },
    {
      id: 'de-002',
      title: 'Gas Law Data with Unit Errors',
      description: 'Identify unit conversion mistakes in this gas law experiment',
      originalData: [
        { x: 273, y: 2.0 },
        { x: 300, y: 2.2 },
        { x: 350, y: 2.6 },
        { x: 400, y: 2.9 },
        { x: 450, y: 3.3 }
      ],
      corruptedData: [
        { x: 273, y: 2.0 },
        { x: 300, y: 2.2 },
        { x: 77, y: 2.6 }, // Error: Celsius instead of Kelvin
        { x: 400, y: 2.9 },
        { x: 450, y: 3.3 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'unit',
          pointIndex: 2,
          description: 'Temperature in Celsius (77°C) instead of Kelvin (350K)',
          severity: 'major',
          hint: 'Check temperature units - should all be in Kelvin'
        }
      ],
      difficulty: 1,
      topic: 'Gas Laws',
      context: 'Measuring gas volume at different temperatures for Charles\' Law verification.'
    },

    // Difficulty 2 - Outliers and transcription errors
    {
      id: 'de-003',
      title: 'Kinetics Data with Outliers',
      description: 'Find the outlier points in this reaction rate study',
      originalData: [
        { x: 0, y: 1.00 },
        { x: 2, y: 0.74 },
        { x: 4, y: 0.55 },
        { x: 6, y: 0.41 },
        { x: 8, y: 0.30 },
        { x: 10, y: 0.22 }
      ],
      corruptedData: [
        { x: 0, y: 1.00 },
        { x: 2, y: 0.74 },
        { x: 4, y: 0.55 },
        { x: 6, y: 0.41 },
        { x: 8, y: 0.85 }, // Outlier: should be 0.30
        { x: 10, y: 0.22 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'outlier',
          pointIndex: 4,
          description: 'Concentration value 0.85 M is inconsistent with exponential decay pattern',
          severity: 'critical',
          hint: 'This point breaks the expected exponential decay trend'
        }
      ],
      difficulty: 2,
      topic: 'Chemical Kinetics',
      context: 'Following the decomposition of hydrogen peroxide over time.'
    },
    {
      id: 'de-004',
      title: 'Spectroscopy Data with Transcription Errors',
      description: 'Identify data entry mistakes in this Beer\'s Law experiment',
      originalData: [
        { x: 0.0, y: 0.00 },
        { x: 0.1, y: 0.15 },
        { x: 0.2, y: 0.30 },
        { x: 0.3, y: 0.45 },
        { x: 0.4, y: 0.60 }
      ],
      corruptedData: [
        { x: 0.0, y: 0.00 },
        { x: 0.1, y: 0.15 },
        { x: 0.2, y: 0.30 },
        { x: 0.3, y: 0.54 }, // Transcription error: 0.54 instead of 0.45
        { x: 0.4, y: 0.60 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'transcription',
          pointIndex: 3,
          description: 'Absorbance value 0.54 appears to be misread from 0.45',
          severity: 'minor',
          hint: 'Check if this reading was copied correctly from the instrument'
        }
      ],
      difficulty: 2,
      topic: 'Spectroscopy',
      context: 'Measuring absorbance of copper sulfate solutions at different concentrations.'
    },

    // Difficulty 3 - Multiple errors and systematic errors
    {
      id: 'de-005',
      title: 'Titration Curve with Multiple Issues',
      description: 'This dataset has several types of errors - find them all!',
      originalData: [
        { x: 0, y: 2.9 },
        { x: 5, y: 4.2 },
        { x: 10, y: 4.8 },
        { x: 15, y: 5.3 },
        { x: 20, y: 6.0 },
        { x: 25, y: 8.7 },
        { x: 30, y: 12.4 }
      ],
      corruptedData: [
        { x: 0, y: 2.9 },
        { x: 5, y: 4.2 },
        { x: 10, y: 4.8 },
        { x: 15, y: 5.3 },
        { x: 20, y: 0.6 }, // Decimal error: 0.6 instead of 6.0
        { x: 25, y: 8.7 },
        { x: 30, y: 14.2 } // Calculation error: 14.2 instead of 12.4
      ],
      errors: [
        {
          id: 'e1',
          type: 'calculation',
          pointIndex: 4,
          description: 'pH value 0.6 is impossible - should be 6.0',
          severity: 'critical',
          hint: 'This pH value is physically impossible for this titration'
        },
        {
          id: 'e2',
          type: 'calculation',
          pointIndex: 6,
          description: 'Final pH of 14.2 is too high - should be around 12.4',
          severity: 'major',
          hint: 'Check the calculation for this pH reading'
        }
      ],
      difficulty: 3,
      topic: 'Acid-Base Titrations',
      context: 'Weak acid-strong base titration with multiple data recording issues.'
    },
    {
      id: 'de-006',
      title: 'Systematic Error in Temperature Measurements',
      description: 'Find the systematic bias in this temperature-dependent study',
      originalData: [
        { x: 273, y: 2.0 },
        { x: 300, y: 2.2 },
        { x: 350, y: 2.6 },
        { x: 400, y: 2.9 },
        { x: 450, y: 3.3 }
      ],
      corruptedData: [
        { x: 283, y: 2.0 }, // Systematic +10K error
        { x: 310, y: 2.2 }, // Systematic +10K error
        { x: 360, y: 2.6 }, // Systematic +10K error
        { x: 410, y: 2.9 }, // Systematic +10K error
        { x: 460, y: 3.3 }  // Systematic +10K error
      ],
      errors: [
        {
          id: 'e1',
          type: 'systematic',
          pointIndex: -1, // Affects all points
          description: 'All temperature readings appear to be 10K higher than expected',
          severity: 'major',
          hint: 'Check if the thermometer has a calibration offset'
        }
      ],
      difficulty: 3,
      topic: 'Gas Laws',
      context: 'Temperature measurements show consistent bias across all readings.'
    },

    // Additional error datasets to meet the 12+ requirement
    {
      id: 'de-007',
      title: 'Solubility Data with Mixed Errors',
      description: 'Multiple error types in solubility measurements',
      originalData: [
        { x: 20, y: 32 },
        { x: 40, y: 64 },
        { x: 60, y: 110 },
        { x: 80, y: 169 },
        { x: 100, y: 246 }
      ],
      corruptedData: [
        { x: 20, y: 32 },
        { x: 40, y: 64 },
        { x: 60, y: 11 }, // Transcription error: 11 instead of 110
        { x: 80, y: 169 },
        { x: 100, y: 246 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'transcription',
          pointIndex: 2,
          description: 'Solubility value 11 appears to be missing a digit (should be 110)',
          severity: 'critical',
          hint: 'Check if a digit was dropped during data entry'
        }
      ],
      difficulty: 2,
      topic: 'Solubility',
      context: 'Recording solubility of potassium nitrate at different temperatures.'
    },
    {
      id: 'de-008',
      title: 'Reaction Rate Data with Calculation Errors',
      description: 'Find calculation mistakes in rate measurements',
      originalData: [
        { x: 0, y: 0.5 },
        { x: 10, y: 0.4 },
        { x: 20, y: 0.32 },
        { x: 30, y: 0.26 },
        { x: 40, y: 0.21 }
      ],
      corruptedData: [
        { x: 0, y: 0.5 },
        { x: 10, y: 0.4 },
        { x: 20, y: 0.32 },
        { x: 30, y: 2.6 }, // Decimal error: 2.6 instead of 0.26
        { x: 40, y: 0.21 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'calculation',
          pointIndex: 3,
          description: 'Rate value 2.6 has decimal point in wrong position (should be 0.26)',
          severity: 'major',
          hint: 'Check decimal point placement in rate calculations'
        }
      ],
      difficulty: 2,
      topic: 'Chemical Kinetics',
      context: 'Measuring reaction rates at different time intervals.'
    },
    {
      id: 'de-009',
      title: 'pH Measurements with Outliers',
      description: 'Identify outlier readings in pH data',
      originalData: [
        { x: 0, y: 1.0 },
        { x: 5, y: 1.5 },
        { x: 10, y: 2.0 },
        { x: 15, y: 2.5 },
        { x: 20, y: 3.0 }
      ],
      corruptedData: [
        { x: 0, y: 1.0 },
        { x: 5, y: 1.5 },
        { x: 10, y: 8.0 }, // Outlier: 8.0 instead of 2.0
        { x: 15, y: 2.5 },
        { x: 20, y: 3.0 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'outlier',
          pointIndex: 2,
          description: 'pH value 8.0 is inconsistent with the linear trend',
          severity: 'major',
          hint: 'This reading breaks the expected linear progression'
        }
      ],
      difficulty: 2,
      topic: 'Acid-Base Chemistry',
      context: 'Monitoring pH changes during gradual addition of base.'
    },
    {
      id: 'de-010',
      title: 'Conductivity Data with Unit Errors',
      description: 'Find unit conversion mistakes',
      originalData: [
        { x: 0.1, y: 1.41 },
        { x: 0.2, y: 2.82 },
        { x: 0.3, y: 4.23 },
        { x: 0.4, y: 5.64 },
        { x: 0.5, y: 7.05 }
      ],
      corruptedData: [
        { x: 0.1, y: 1.41 },
        { x: 0.2, y: 2.82 },
        { x: 0.3, y: 423 }, // Unit error: 423 instead of 4.23 (mS instead of S)
        { x: 0.4, y: 5.64 },
        { x: 0.5, y: 7.05 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'unit',
          pointIndex: 2,
          description: 'Conductivity value 423 appears to be in wrong units (mS instead of S)',
          severity: 'major',
          hint: 'Check if units were converted correctly'
        }
      ],
      difficulty: 2,
      topic: 'Electrochemistry',
      context: 'Measuring electrical conductivity of salt solutions.'
    },
    {
      id: 'de-011',
      title: 'Spectroscopy Data with Multiple Issues',
      description: 'Complex dataset with several error types',
      originalData: [
        { x: 400, y: 0.1 },
        { x: 450, y: 0.3 },
        { x: 500, y: 0.8 },
        { x: 550, y: 0.6 },
        { x: 600, y: 0.2 }
      ],
      corruptedData: [
        { x: 400, y: 0.1 },
        { x: 450, y: 0.03 }, // Decimal error: 0.03 instead of 0.3
        { x: 500, y: 0.8 },
        { x: 550, y: 6.0 }, // Calculation error: 6.0 instead of 0.6
        { x: 600, y: 0.2 }
      ],
      errors: [
        {
          id: 'e1',
          type: 'calculation',
          pointIndex: 1,
          description: 'Absorbance 0.03 should be 0.3 (decimal point error)',
          severity: 'major',
          hint: 'Check decimal point placement'
        },
        {
          id: 'e2',
          type: 'calculation',
          pointIndex: 3,
          description: 'Absorbance 6.0 is too high, should be 0.6',
          severity: 'critical',
          hint: 'This value exceeds typical absorbance ranges'
        }
      ],
      difficulty: 3,
      topic: 'Spectroscopy',
      context: 'UV-Vis absorption spectrum analysis with multiple measurement errors.'
    },
    {
      id: 'de-012',
      title: 'Thermodynamics Data with Systematic Bias',
      description: 'Systematic error in temperature measurements',
      originalData: [
        { x: 298, y: -394 },
        { x: 323, y: -389 },
        { x: 348, y: -384 },
        { x: 373, y: -379 },
        { x: 398, y: -374 }
      ],
      corruptedData: [
        { x: 303, y: -394 }, // Systematic +5K error
        { x: 328, y: -389 }, // Systematic +5K error
        { x: 353, y: -384 }, // Systematic +5K error
        { x: 378, y: -379 }, // Systematic +5K error
        { x: 403, y: -374 }  // Systematic +5K error
      ],
      errors: [
        {
          id: 'e1',
          type: 'systematic',
          pointIndex: -1,
          description: 'All temperature readings are consistently 5K higher than expected',
          severity: 'major',
          hint: 'Check for systematic calibration error in temperature sensor'
        }
      ],
      difficulty: 3,
      topic: 'Thermodynamics',
      context: 'Measuring enthalpy changes at different temperatures.'
    }
  ];

  private percentageErrorProblems: PercentageErrorProblem[] = [
    // Difficulty 1 - Simple percentage errors
    {
      id: 'pe-001',
      scenario: 'A student measures the mass of a copper coin',
      measuredValue: 3.15,
      trueValue: 3.11,
      unit: 'g',
      difficulty: 1,
      topic: 'Mass measurement',
      context: 'Using an analytical balance to determine the mass of a penny',
      distractors: [1.29, 0.04, 4.0]
    },
    {
      id: 'pe-002',
      scenario: 'Measuring the volume of water using a graduated cylinder',
      measuredValue: 25.3,
      trueValue: 25.0,
      unit: 'mL',
      difficulty: 1,
      topic: 'Volume measurement',
      context: 'Reading the meniscus level in a 50 mL graduated cylinder',
      distractors: [1.2, 0.3, 98.8]
    },
    {
      id: 'pe-003',
      scenario: 'Determining the melting point of benzoic acid',
      measuredValue: 124.5,
      trueValue: 122.4,
      unit: '°C',
      difficulty: 1,
      topic: 'Temperature measurement',
      context: 'Using a melting point apparatus to identify an unknown compound',
      distractors: [1.72, 2.1, 98.3]
    },

    // Difficulty 2 - Titration and concentration errors
    {
      id: 'pe-004',
      scenario: 'Standardizing NaOH solution against KHP',
      measuredValue: 0.1034,
      trueValue: 0.1000,
      unit: 'M',
      difficulty: 2,
      topic: 'Solution concentration',
      context: 'Determining the exact molarity of sodium hydroxide solution',
      distractors: [3.4, 0.0034, 96.6]
    },
    {
      id: 'pe-005',
      scenario: 'Measuring the density of ethanol',
      measuredValue: 0.785,
      trueValue: 0.789,
      unit: 'g/mL',
      difficulty: 2,
      topic: 'Density determination',
      context: 'Using a pycnometer to measure liquid density accurately',
      distractors: [0.51, 4.0, 99.5]
    },
    {
      id: 'pe-006',
      scenario: 'Determining the molecular weight of an unknown gas',
      measuredValue: 44.2,
      trueValue: 44.0,
      unit: 'g/mol',
      difficulty: 2,
      topic: 'Molecular weight',
      context: 'Using the ideal gas law to calculate molar mass from PVT data',
      distractors: [0.45, 0.2, 99.5]
    },

    // Difficulty 3 - Complex analytical measurements
    {
      id: 'pe-007',
      scenario: 'Quantitative analysis of iron in ore sample',
      measuredValue: 23.7,
      trueValue: 24.1,
      unit: '% Fe',
      difficulty: 3,
      topic: 'Quantitative analysis',
      context: 'Using permanganate titration to determine iron content',
      distractors: [1.66, 0.4, 98.3]
    },
    {
      id: 'pe-008',
      scenario: 'Measuring the heat of combustion of methanol',
      measuredValue: 726,
      trueValue: 764,
      unit: 'kJ/mol',
      difficulty: 3,
      topic: 'Thermochemistry',
      context: 'Using bomb calorimetry to measure enthalpy of combustion',
      distractors: [4.97, 38, 95.0]
    },
    {
      id: 'pe-009',
      scenario: 'Determining the rate constant for a first-order reaction',
      measuredValue: 0.0234,
      trueValue: 0.0251,
      unit: 'min⁻¹',
      difficulty: 3,
      topic: 'Chemical kinetics',
      context: 'Analyzing concentration vs time data to find rate constant',
      distractors: [6.77, 0.0017, 93.2]
    },

    // Difficulty 4 - Instrumental analysis errors
    {
      id: 'pe-010',
      scenario: 'UV-Vis spectroscopy analysis of aspirin',
      measuredValue: 278.5,
      trueValue: 280.0,
      unit: 'nm (λmax)',
      difficulty: 4,
      topic: 'Spectroscopy',
      context: 'Determining the wavelength of maximum absorbance for aspirin',
      distractors: [0.54, 1.5, 99.5]
    },
    {
      id: 'pe-011',
      scenario: 'GC-MS analysis of ethyl acetate purity',
      measuredValue: 97.8,
      trueValue: 99.2,
      unit: '% purity',
      difficulty: 4,
      topic: 'Chromatography',
      context: 'Using gas chromatography to determine compound purity',
      distractors: [1.41, 1.4, 98.6]
    },
    {
      id: 'pe-012',
      scenario: 'Electrochemical determination of copper concentration',
      measuredValue: 0.0847,
      trueValue: 0.0825,
      unit: 'M',
      difficulty: 4,
      topic: 'Electrochemistry',
      context: 'Using cyclic voltammetry to measure Cu²⁺ concentration',
      distractors: [2.67, 0.0022, 97.3]
    },

    // Difficulty 5 - Advanced analytical techniques
    {
      id: 'pe-013',
      scenario: 'NMR integration analysis of compound ratio',
      measuredValue: 2.87,
      trueValue: 3.00,
      unit: 'integration ratio',
      difficulty: 5,
      topic: 'NMR spectroscopy',
      context: 'Determining proton ratios from ¹H NMR integration',
      distractors: [4.33, 0.13, 95.7]
    },
    {
      id: 'pe-014',
      scenario: 'X-ray crystallography bond length measurement',
      measuredValue: 1.547,
      trueValue: 1.540,
      unit: 'Å',
      difficulty: 5,
      topic: 'Crystallography',
      context: 'Measuring C-C bond length in crystal structure',
      distractors: [0.45, 0.007, 99.5]
    },
    {
      id: 'pe-015',
      scenario: 'Mass spectrometry molecular ion peak',
      measuredValue: 180.08,
      trueValue: 180.16,
      unit: 'm/z',
      difficulty: 5,
      topic: 'Mass spectrometry',
      context: 'High-resolution MS determination of exact mass',
      distractors: [0.044, 0.08, 99.96]
    },

    // Additional problems for variety
    {
      id: 'pe-016',
      scenario: 'Measuring the pH of buffer solution',
      measuredValue: 7.23,
      trueValue: 7.00,
      unit: 'pH units',
      difficulty: 2,
      topic: 'pH measurement',
      context: 'Calibrating and using a digital pH meter',
      distractors: [3.29, 0.23, 96.7]
    },
    {
      id: 'pe-017',
      scenario: 'Determining the water content in hydrated salt',
      measuredValue: 18.2,
      trueValue: 18.0,
      unit: '% H₂O',
      difficulty: 2,
      topic: 'Gravimetric analysis',
      context: 'Heating copper sulfate pentahydrate to remove water',
      distractors: [1.11, 0.2, 98.9]
    },
    {
      id: 'pe-018',
      scenario: 'Measuring the wavelength of laser light',
      measuredValue: 632.5,
      trueValue: 632.8,
      unit: 'nm',
      difficulty: 3,
      topic: 'Optical measurements',
      context: 'Using a diffraction grating to measure laser wavelength',
      distractors: [0.047, 0.3, 99.95]
    },
    {
      id: 'pe-019',
      scenario: 'Determining the activation energy of reaction',
      measuredValue: 85.2,
      trueValue: 87.5,
      unit: 'kJ/mol',
      difficulty: 4,
      topic: 'Chemical kinetics',
      context: 'Using Arrhenius plot to calculate activation energy',
      distractors: [2.63, 2.3, 97.4]
    },
    {
      id: 'pe-020',
      scenario: 'Measuring the refractive index of liquid',
      measuredValue: 1.3325,
      trueValue: 1.3330,
      unit: 'n₂₀ᴰ',
      difficulty: 3,
      topic: 'Physical properties',
      context: 'Using an Abbe refractometer to measure refractive index',
      distractors: [0.038, 0.0005, 99.96]
    }
  ];

  getSpecialMechanics(): RealmMechanic[] {
    return [
      {
        id: 'graph-joust',
        name: 'Graph Joust',
        description: 'Compete against AI to plot data points accurately and quickly',
        parameters: { aiDifficulty: 'medium', timeLimit: 120 }
      },
      {
        id: 'error-hunter',
        name: 'Error Hunter',
        description: 'Find and categorize errors in corrupted datasets',
        parameters: { maxHints: 3, timeLimit: 180 }
      },
      {
        id: 'uncertainty-golem',
        name: 'Uncertainty Golem Boss',
        description: 'Defeat the golem by calculating percentage errors correctly',
        parameters: { stages: 3, golemHealth: 100 }
      }
    ];
  }

  async getChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    
    // Add Graph Joust challenges
    this.chemistryDatasets.forEach((dataset, index) => {
      challenges.push({
        id: `graph-joust-${dataset.id}`,
        realmId: this.realmId,
        type: ChallengeType.GRAPH_JOUST,
        difficulty: dataset.difficulty,
        title: `Graph Joust: ${dataset.title}`,
        description: dataset.description,
        content: {
          question: `Plot the data points for: ${dataset.title}`,
          correctAnswer: JSON.stringify(dataset.dataPoints),
          explanation: dataset.context,
          hints: [
            `This shows a ${dataset.expectedTrend} relationship`,
            `Pay attention to the ${dataset.xLabel} and ${dataset.yLabel}`,
            `The topic is ${dataset.topic}`
          ]
        },
        timeLimit: 120,
        requiredLevel: this.requiredLevel,
        rewards: [
          { type: 'xp', amount: 50 + (dataset.difficulty * 10), description: 'Graph plotting XP' },
          { type: 'gold', amount: 25 + (dataset.difficulty * 5), description: 'Graph plotting gold' }
        ],
        metadata: {
          concepts: [dataset.topic],
          curriculumStandards: [],
          estimatedDuration: 120,
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSpecific: { topic: dataset.topic, skillType: 'data-analysis' }
        }
      });
    });

    // Add Error Hunter challenges
    this.datasetsWithErrors.forEach((dataset, index) => {
      challenges.push({
        id: `error-hunter-${dataset.id}`,
        realmId: this.realmId,
        type: ChallengeType.ERROR_HUNTER,
        difficulty: dataset.difficulty,
        title: `Error Hunter: ${dataset.title}`,
        description: dataset.description,
        content: {
          question: `Find all errors in this dataset: ${dataset.title}`,
          correctAnswer: JSON.stringify(dataset.errors.map(e => e.id)),
          explanation: dataset.context,
          hints: dataset.errors.map(e => e.hint)
        },
        timeLimit: 180,
        requiredLevel: this.requiredLevel,
        rewards: [
          { type: 'xp', amount: 75 + (dataset.difficulty * 15), description: 'Error detection XP' },
          { type: 'gold', amount: 40 + (dataset.difficulty * 10), description: 'Error detection gold' }
        ],
        metadata: {
          concepts: [dataset.topic],
          curriculumStandards: [],
          estimatedDuration: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSpecific: { topic: dataset.topic, skillType: 'error-detection' }
        }
      });
    });

    // Add Uncertainty Golem challenges
    this.percentageErrorProblems.forEach((problem, index) => {
      const correctAnswer = Math.abs((problem.measuredValue - problem.trueValue) / problem.trueValue * 100);
      
      challenges.push({
        id: `uncertainty-golem-${problem.id}`,
        realmId: this.realmId,
        type: ChallengeType.UNCERTAINTY_GOLEM,
        difficulty: problem.difficulty,
        title: `Uncertainty Golem: ${problem.scenario}`,
        description: 'Calculate the percentage error to damage the golem',
        content: {
          question: `${problem.scenario}. Measured: ${problem.measuredValue} ${problem.unit}, True value: ${problem.trueValue} ${problem.unit}. Calculate the percentage error.`,
          correctAnswer: correctAnswer.toFixed(2),
          explanation: problem.context,
          hints: [
            'Use the formula: |measured - true| / true × 100%',
            'Remember to take the absolute value',
            'Round to 2 decimal places'
          ]
        },
        timeLimit: 90,
        requiredLevel: this.requiredLevel,
        rewards: [
          { type: 'xp', amount: 60 + (problem.difficulty * 12), description: 'Percentage error XP' },
          { type: 'gold', amount: 30 + (problem.difficulty * 8), description: 'Percentage error gold' }
        ],
        metadata: {
          concepts: [problem.topic],
          curriculumStandards: [],
          estimatedDuration: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSpecific: { topic: problem.topic, skillType: 'error-calculation' }
        }
      });
    });

    return challenges;
  }

  async generateChallenge(difficulty: number): Promise<Challenge> {
    const challengeTypes = ['graph-joust', 'error-hunter', 'uncertainty-golem'];
    const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    switch (randomType) {
      case 'graph-joust':
        return this.generateGraphJoustChallenge(difficulty);
      case 'error-hunter':
        return this.generateErrorHunterChallenge(difficulty);
      case 'uncertainty-golem':
        return this.generateUncertaintyGolemChallenge(difficulty);
      default:
        return this.generateGraphJoustChallenge(difficulty);
    }
  }

  private generateGraphJoustChallenge(difficulty: number): GraphJoustChallenge {
    const suitableDatasets = this.chemistryDatasets.filter(d => d.difficulty === difficulty);
    const dataset = suitableDatasets[Math.floor(Math.random() * suitableDatasets.length)] || this.chemistryDatasets[0];
    
    const aiDifficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const aiDifficulty = aiDifficulties[Math.min(difficulty - 1, 2)];
    
    return {
      id: `graph-joust-${dataset.id}-${Date.now()}`,
      realmId: this.realmId,
      type: ChallengeType.GRAPH_JOUST,
      difficulty,
      title: `Graph Joust: ${dataset.title}`,
      description: dataset.description,
      content: {
        question: `Compete against the AI to plot these data points accurately: ${dataset.title}`,
        correctAnswer: JSON.stringify(dataset.dataPoints),
        explanation: dataset.context,
        hints: [
          `This shows a ${dataset.expectedTrend} relationship`,
          `Focus on accuracy over speed`,
          `The AI difficulty is ${aiDifficulty}`
        ],
        dataset,
        aiDifficulty,
        timeLimit: 120,
        maxPoints: 100
      },
      timeLimit: 120,
      requiredLevel: this.requiredLevel,
      rewards: [
        { type: 'xp', amount: 50 + (difficulty * 10), description: 'Graph joust XP' },
        { type: 'gold', amount: 25 + (difficulty * 5), description: 'Graph joust gold' }
      ],
      metadata: {
        concepts: [dataset.topic],
        curriculumStandards: [],
        estimatedDuration: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameSpecific: { topic: dataset.topic, skillType: 'competitive-plotting' }
      }
    };
  }

  private generateErrorHunterChallenge(difficulty: number): ErrorHunterChallenge {
    const suitableDatasets = this.datasetsWithErrors.filter(d => d.difficulty === difficulty);
    const dataset = suitableDatasets[Math.floor(Math.random() * suitableDatasets.length)] || this.datasetsWithErrors[0];
    
    return {
      id: `error-hunter-${dataset.id}-${Date.now()}`,
      realmId: this.realmId,
      type: ChallengeType.ERROR_HUNTER,
      difficulty,
      title: `Error Hunter: ${dataset.title}`,
      description: dataset.description,
      content: {
        question: `Find all errors in this dataset. Click on suspicious data points and categorize the errors.`,
        correctAnswer: JSON.stringify(dataset.errors.map(e => ({ id: e.id, type: e.type, pointIndex: e.pointIndex }))),
        explanation: dataset.context,
        hints: dataset.errors.map(e => e.hint),
        dataset,
        maxErrors: dataset.errors.length,
        hintsAvailable: Math.min(3, dataset.errors.length)
      },
      timeLimit: 180,
      requiredLevel: this.requiredLevel,
      rewards: [
        { type: 'xp', amount: 75 + (difficulty * 15), description: 'Error hunter XP' },
        { type: 'gold', amount: 40 + (difficulty * 10), description: 'Error hunter gold' }
      ],
      metadata: {
        concepts: [dataset.topic],
        curriculumStandards: [],
        estimatedDuration: 180,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameSpecific: { topic: dataset.topic, skillType: 'error-detection' }
      }
    };
  }

  private generateUncertaintyGolemChallenge(difficulty: number): UncertaintyGolemChallenge {
    const suitableProblems = this.percentageErrorProblems.filter(p => p.difficulty === difficulty);
    const problem = suitableProblems[Math.floor(Math.random() * suitableProblems.length)] || this.percentageErrorProblems[0];
    
    const correctAnswer = Math.abs((problem.measuredValue - problem.trueValue) / problem.trueValue * 100);
    
    return {
      id: `uncertainty-golem-${problem.id}-${Date.now()}`,
      realmId: this.realmId,
      type: ChallengeType.UNCERTAINTY_GOLEM,
      difficulty,
      title: `Uncertainty Golem: ${problem.scenario}`,
      description: 'Calculate percentage errors to weaken the golem',
      content: {
        question: `The Uncertainty Golem challenges you! ${problem.scenario}. Measured: ${problem.measuredValue} ${problem.unit}, True value: ${problem.trueValue} ${problem.unit}. What is the percentage error?`,
        correctAnswer: correctAnswer.toFixed(2),
        explanation: problem.context,
        hints: [
          'Formula: |measured - true| / true × 100%',
          'Take the absolute value of the difference',
          'Express as a percentage to 2 decimal places'
        ],
        problem,
        golemHealth: 100,
        stage: 1,
        maxStages: 3
      },
      timeLimit: 90,
      requiredLevel: this.requiredLevel,
      rewards: [
        { type: 'xp', amount: 60 + (difficulty * 12), description: 'Uncertainty golem XP' },
        { type: 'gold', amount: 30 + (difficulty * 8), description: 'Uncertainty golem gold' }
      ],
      metadata: {
        concepts: [problem.topic],
        curriculumStandards: [],
        estimatedDuration: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameSpecific: { topic: problem.topic, skillType: 'percentage-error' }
      }
    };
  }

  async validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    const challengeType = challenge.type;
    
    switch (challengeType) {
      case ChallengeType.GRAPH_JOUST:
        return this.validateGraphJoustAnswer(challenge as GraphJoustChallenge, answer);
      case ChallengeType.ERROR_HUNTER:
        return this.validateErrorHunterAnswer(challenge as ErrorHunterChallenge, answer);
      case ChallengeType.UNCERTAINTY_GOLEM:
        return this.validateUncertaintyGolemAnswer(challenge as UncertaintyGolemChallenge, answer);
      default:
        return {
          isCorrect: false,
          score: 0,
          feedback: 'Unknown challenge type',
          explanation: ''
        };
    }
  }

  private validateGraphJoustAnswer(challenge: GraphJoustChallenge, answer: Answer): ValidationResult {
    try {
      const userPoints = JSON.parse(answer.response as string) as DataPoint[];
      const correctPoints = challenge.content.dataset.dataPoints;
      
      let totalError = 0;
      let pointsScored = 0;
      
      for (let i = 0; i < Math.min(userPoints.length, correctPoints.length); i++) {
        const userPoint = userPoints[i];
        const correctPoint = correctPoints[i];
        
        const xError = Math.abs(userPoint.x - correctPoint.x) / Math.abs(correctPoint.x || 1);
        const yError = Math.abs(userPoint.y - correctPoint.y) / Math.abs(correctPoint.y || 1);
        
        const pointError = (xError + yError) / 2;
        totalError += pointError;
        
        if (pointError < 0.05) { // 5% tolerance
          pointsScored += 10;
        } else if (pointError < 0.1) { // 10% tolerance
          pointsScored += 5;
        }
      }
      
      const averageError = totalError / correctPoints.length;
      const accuracy = Math.max(0, 1 - averageError);
      const score = Math.round(accuracy * 100);
      
      return {
        isCorrect: accuracy > 0.8,
        score,
        feedback: accuracy > 0.9 ? 'Excellent plotting accuracy!' : 
                 accuracy > 0.8 ? 'Good job! Minor inaccuracies detected.' :
                 accuracy > 0.6 ? 'Fair attempt, but several points are off.' :
                 'Poor accuracy. Review the data more carefully.',
        explanation: `You plotted ${userPoints.length} points with ${(accuracy * 100).toFixed(1)}% accuracy. ${pointsScored} bonus points earned for precise plotting.`
      };
    } catch (error) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Invalid answer format. Please provide valid data points.',
        explanation: 'Answer must be in JSON format with x,y coordinates.'
      };
    }
  }

  private validateErrorHunterAnswer(challenge: ErrorHunterChallenge, answer: Answer): ValidationResult {
    try {
      const userErrors = JSON.parse(answer.response as string) as { id: string; type: string; pointIndex: number }[];
      const correctErrors = challenge.content.dataset.errors;
      
      let correctlyIdentified = 0;
      let falsePositives = 0;
      
      for (const userError of userErrors) {
        const matchingError = correctErrors.find(e => 
          e.pointIndex === userError.pointIndex && e.type === userError.type
        );
        
        if (matchingError) {
          correctlyIdentified++;
        } else {
          falsePositives++;
        }
      }
      
      const missedErrors = correctErrors.length - correctlyIdentified;
      const accuracy = correctlyIdentified / correctErrors.length;
      const precision = userErrors.length > 0 ? correctlyIdentified / userErrors.length : 0;
      
      const score = Math.round((accuracy * 0.7 + precision * 0.3) * 100);
      
      return {
        isCorrect: accuracy >= 0.8 && precision >= 0.8,
        score,
        feedback: accuracy === 1 && precision === 1 ? 'Perfect error detection!' :
                 accuracy >= 0.8 ? 'Great job finding most errors!' :
                 accuracy >= 0.6 ? 'Good effort, but some errors were missed.' :
                 'Many errors remain undetected. Review the data more carefully.',
        explanation: `Found ${correctlyIdentified}/${correctErrors.length} errors correctly. ${falsePositives} false positives. ${missedErrors} errors missed.`
      };
    } catch (error) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Invalid answer format. Please identify errors properly.',
        explanation: 'Answer must specify error locations and types.'
      };
    }
  }

  private validateUncertaintyGolemAnswer(challenge: UncertaintyGolemChallenge, answer: Answer): ValidationResult {
    const userAnswer = parseFloat(answer.response as string);
    const correctAnswer = parseFloat(challenge.content.correctAnswer as string);
    
    const tolerance = 0.1; // 0.1% tolerance
    const difference = Math.abs(userAnswer - correctAnswer);
    const isCorrect = difference <= tolerance;
    
    let score = 0;
    if (isCorrect) {
      score = 100;
    } else if (difference <= 0.5) {
      score = 80;
    } else if (difference <= 1.0) {
      score = 60;
    } else if (difference <= 2.0) {
      score = 40;
    } else {
      score = 20;
    }
    
    const damage = isCorrect ? 35 : Math.max(5, score / 3);
    
    return {
      isCorrect,
      score,
      feedback: isCorrect ? `Critical hit! The golem takes ${damage} damage!` :
               difference <= 0.5 ? `Close! The golem takes ${damage} damage.` :
               difference <= 2.0 ? `Glancing blow. ${damage} damage dealt.` :
               'Miss! The golem barely takes any damage.',
      explanation: `Correct answer: ${correctAnswer.toFixed(2)}%. Your answer: ${userAnswer.toFixed(2)}%. Difference: ${difference.toFixed(2)}%`
    };
  }

  calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number {
    // Call validation methods directly to avoid async issues
    let validation: ValidationResult;
    
    switch (challenge.type) {
      case ChallengeType.GRAPH_JOUST:
        validation = this.validateGraphJoustAnswer(challenge as GraphJoustChallenge, answer);
        break;
      case ChallengeType.ERROR_HUNTER:
        validation = this.validateErrorHunterAnswer(challenge as ErrorHunterChallenge, answer);
        break;
      case ChallengeType.UNCERTAINTY_GOLEM:
        validation = this.validateUncertaintyGolemAnswer(challenge as UncertaintyGolemChallenge, answer);
        break;
      default:
        validation = {
          isCorrect: false,
          score: 0,
          feedback: 'Unknown challenge type',
          explanation: ''
        };
    }
    
    let score = validation.score;
    
    // Time bonus for quick responses
    const timeLimit = challenge.timeLimit || 120;
    const timeBonus = Math.max(0, (timeLimit - timeElapsed) / timeLimit * 20);
    
    return Math.round(score + timeBonus);
  }

  async processBossChallenge(userId: string, bossId: string): Promise<BossResult> {
    if (bossId === 'uncertainty-golem') {
      // Multi-stage boss battle with increasing difficulty
      const stages = [
        this.generateUncertaintyGolemChallenge(3),
        this.generateUncertaintyGolemChallenge(4),
        this.generateUncertaintyGolemChallenge(5)
      ];
      
      return {
        defeated: false, // Will be determined by completing all stages
        score: 0,
        specialRewards: [
          { type: 'badge', amount: 1, description: 'Sage\'s Ruler - Formula Reference Sheet' },
          { type: 'xp', amount: 500, description: 'Boss victory XP' },
          { type: 'gold', amount: 200, description: 'Boss victory gold' }
        ],
        unlockedContent: ['sages-ruler-formula-sheet']
      };
    }
    
    throw new Error(`Unknown boss: ${bossId}`);
  }
}