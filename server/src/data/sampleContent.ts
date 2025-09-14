/**
 * Sample Educational Content for ChemQuest: Alchemist Academy
 * Contains O-Level and A-Level chemistry problems, explanations, and resources
 */

export interface ChemistryProblem {
  id: string;
  realm: string;
  difficulty: 'O-Level' | 'A-Level';
  type: string;
  question: string;
  correctAnswer: string | string[];
  explanation: string;
  stepByStepSolution?: string[];
  hints?: string[];
  timeLimit?: number;
  points: number;
}

export interface AnimatedMnemonic {
  id: string;
  concept: string;
  title: string;
  mnemonic: string;
  animation: string;
  description: string;
  relatedTopics: string[];
}

export interface VideoScript {
  id: string;
  title: string;
  concept: string;
  script: string;
  duration: string;
  keyPoints: string[];
}

export interface FormulaSheet {
  id: string;
  category: string;
  title: string;
  formulas: Array<{
    name: string;
    formula: string;
    description: string;
    units?: string;
  }>;
}

// O-Level Chemistry Problems - Mathmage Trials Realm
export const equationBalancingProblems: ChemistryProblem[] = [
  {
    id: 'eq_bal_001',
    realm: 'mathmage-trials',
    difficulty: 'O-Level',
    type: 'equation-balancing',
    question: 'Balance the equation: H₂ + O₂ → H₂O',
    correctAnswer: '2H₂ + O₂ → 2H₂O',
    explanation: 'To balance this equation, we need 2 hydrogen molecules and 1 oxygen molecule to produce 2 water molecules.',
    stepByStepSolution: [
      'Count atoms on each side: Left: 2H, 2O | Right: 2H, 1O',
      'Oxygen is unbalanced - we have 2 on left, 1 on right',
      'Add coefficient 2 to H₂O: H₂ + O₂ → 2H₂O',
      'Now we have: Left: 2H, 2O | Right: 4H, 2O',
      'Hydrogen is unbalanced - add coefficient 2 to H₂: 2H₂ + O₂ → 2H₂O',
      'Final check: Left: 4H, 2O | Right: 4H, 2O ✓'
    ],
    hints: ['Start by counting atoms of each element', 'Balance oxygen first, then hydrogen'],
    timeLimit: 120,
    points: 10
  },
  {
    id: 'eq_bal_002',
    realm: 'mathmage-trials',
    difficulty: 'O-Level',
    type: 'equation-balancing',
    question: 'Balance the equation: Mg + HCl → MgCl₂ + H₂',
    correctAnswer: 'Mg + 2HCl → MgCl₂ + H₂',
    explanation: 'Magnesium reacts with hydrochloric acid to produce magnesium chloride and hydrogen gas.',
    stepByStepSolution: [
      'Count atoms: Left: 1Mg, 1H, 1Cl | Right: 1Mg, 2Cl, 2H',
      'Chlorine is unbalanced - 1 on left, 2 on right',
      'Add coefficient 2 to HCl: Mg + 2HCl → MgCl₂ + H₂',
      'Final check: Left: 1Mg, 2H, 2Cl | Right: 1Mg, 2Cl, 2H ✓'
    ],
    hints: ['Look at the chlorine atoms first', 'Remember that HCl provides both H and Cl'],
    timeLimit: 90,
    points: 8
  }
];

export const stoichiometryProblems: ChemistryProblem[] = [
  {
    id: 'stoich_001',
    realm: 'mathmage-trials',
    difficulty: 'O-Level',
    type: 'stoichiometry',
    question: 'How many moles of H₂O are produced when 2 moles of H₂ react completely with O₂?',
    correctAnswer: '2 moles',
    explanation: 'From the balanced equation 2H₂ + O₂ → 2H₂O, the mole ratio of H₂ to H₂O is 2:2 or 1:1.',
    stepByStepSolution: [
      'Write the balanced equation: 2H₂ + O₂ → 2H₂O',
      'Identify the mole ratio: 2 mol H₂ : 2 mol H₂O',
      'Simplify the ratio: 1 mol H₂ : 1 mol H₂O',
      'Calculate: 2 mol H₂ × (1 mol H₂O / 1 mol H₂) = 2 mol H₂O'
    ],
    hints: ['Start with the balanced chemical equation', 'Use mole ratios from coefficients'],
    timeLimit: 180,
    points: 15
  }
];

// Memory Labyrinth Realm - Gas Tests and Flame Colors
export const gasTestProblems: ChemistryProblem[] = [
  {
    id: 'gas_test_001',
    realm: 'memory-labyrinth',
    difficulty: 'O-Level',
    type: 'gas-identification',
    question: 'What is the test for hydrogen gas?',
    correctAnswer: 'Burning splint produces a squeaky pop',
    explanation: 'Hydrogen gas burns rapidly with oxygen to produce water vapor and a characteristic squeaky pop sound.',
    stepByStepSolution: [
      'Collect the gas in a test tube',
      'Light a wooden splint',
      'Hold the burning splint to the mouth of the test tube',
      'Listen for the squeaky pop sound',
      'The pop indicates hydrogen gas is present'
    ],
    hints: ['Think about the sound hydrogen makes when it burns', 'Use a burning splint'],
    timeLimit: 60,
    points: 5
  },
  {
    id: 'gas_test_002',
    realm: 'memory-labyrinth',
    difficulty: 'O-Level',
    type: 'gas-identification',
    question: 'What happens when carbon dioxide is bubbled through limewater?',
    correctAnswer: 'Limewater turns milky/cloudy',
    explanation: 'CO₂ reacts with calcium hydroxide in limewater to form insoluble calcium carbonate, causing the milky appearance.',
    stepByStepSolution: [
      'Bubble the gas through clear limewater',
      'Observe the color change',
      'Limewater turns milky/cloudy white',
      'This confirms the presence of CO₂',
      'Chemical reaction: Ca(OH)₂ + CO₂ → CaCO₃ + H₂O'
    ],
    hints: ['Think about what happens to clear limewater', 'CO₂ forms a precipitate'],
    timeLimit: 60,
    points: 5
  }
];

export const flameColorProblems: ChemistryProblem[] = [
  {
    id: 'flame_001',
    realm: 'memory-labyrinth',
    difficulty: 'O-Level',
    type: 'flame-test',
    question: 'What color flame does sodium produce in a flame test?',
    correctAnswer: 'Yellow/Golden yellow',
    explanation: 'Sodium compounds produce a characteristic bright yellow flame due to electron transitions in sodium atoms.',
    hints: ['Think of street lights', 'Very bright and distinctive color'],
    timeLimit: 30,
    points: 3
  },
  {
    id: 'flame_002',
    realm: 'memory-labyrinth',
    difficulty: 'O-Level',
    type: 'flame-test',
    question: 'What color flame does copper produce in a flame test?',
    correctAnswer: 'Blue-green/Green',
    explanation: 'Copper compounds produce a blue-green flame color due to the electronic structure of copper atoms.',
    hints: ['Think of the color of copper compounds like copper sulfate', 'Blue-green color'],
    timeLimit: 30,
    points: 3
  }
];

// A-Level Organic Chemistry Problems - Forest of Isomers Realm
export const iupacNamingProblems: ChemistryProblem[] = [
  {
    id: 'iupac_001',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'iupac-naming',
    question: 'Name the compound: CH₃CH₂CH₂CH₂OH',
    correctAnswer: 'butan-1-ol',
    explanation: 'This is a primary alcohol with 4 carbon atoms. The -OH group is on carbon 1.',
    stepByStepSolution: [
      'Count the carbon atoms in the longest chain: 4 carbons = butane',
      'Identify the functional group: -OH = alcohol (suffix -ol)',
      'Number the chain to give the -OH group the lowest number',
      'The -OH is on carbon 1',
      'Name: butan-1-ol'
    ],
    hints: ['Count carbons in the longest chain', 'Identify the functional group', 'Number to give -OH lowest number'],
    timeLimit: 120,
    points: 12
  },
  {
    id: 'iupac_002',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'iupac-naming',
    question: 'Name the compound: CH₃CH(CH₃)CH₂CH₃',
    correctAnswer: '2-methylbutane',
    explanation: 'This is a branched alkane with 4 carbons in the main chain and a methyl branch on carbon 2.',
    stepByStepSolution: [
      'Find the longest carbon chain: 4 carbons = butane',
      'Identify branches: one CH₃ group = methyl',
      'Number the chain to give branches lowest numbers',
      'The methyl group is on carbon 2',
      'Name: 2-methylbutane'
    ],
    hints: ['Find the longest chain first', 'Identify and locate branches', 'Use lowest numbering'],
    timeLimit: 150,
    points: 15
  }
];

export const mechanismProblems: ChemistryProblem[] = [
  {
    id: 'mech_001',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'reaction-mechanism',
    question: 'What type of mechanism occurs when 1-bromobutane reacts with hydroxide ion?',
    correctAnswer: 'SN2 mechanism',
    explanation: 'Primary alkyl halides undergo SN2 (substitution nucleophilic bimolecular) reactions with strong nucleophiles.',
    stepByStepSolution: [
      '1-bromobutane is a primary alkyl halide',
      'OH⁻ is a strong nucleophile',
      'Primary halides favor SN2 over SN1',
      'SN2 involves backside attack by nucleophile',
      'Results in inversion of configuration'
    ],
    hints: ['Consider the structure of 1-bromobutane', 'Primary halides prefer SN2', 'Strong nucleophile favors SN2'],
    timeLimit: 180,
    points: 18
  }
];

// Animated Mnemonics for Common Chemistry Concepts
export const animatedMnemonics: AnimatedMnemonic[] = [
  {
    id: 'mnem_001',
    concept: 'periodic-trends',
    title: 'Atomic Radius Trend',
    mnemonic: 'Atoms get SMALLER as you go RIGHT (more protons pull electrons closer)',
    animation: 'atoms-shrinking-right',
    description: 'Visualizes how atomic radius decreases across a period due to increasing nuclear charge',
    relatedTopics: ['periodic table', 'atomic structure', 'electron configuration']
  },
  {
    id: 'mnem_002',
    concept: 'gas-tests',
    title: 'Hydrogen Test Memory',
    mnemonic: 'Hydrogen goes POP like a balloon!',
    animation: 'balloon-popping',
    description: 'Helps remember the squeaky pop test for hydrogen gas',
    relatedTopics: ['gas tests', 'hydrogen', 'laboratory techniques']
  },
  {
    id: 'mnem_003',
    concept: 'flame-colors',
    title: 'Sodium Flame Color',
    mnemonic: 'Sodium Street lights are YELLOW!',
    animation: 'street-light-glow',
    description: 'Associates sodium\'s yellow flame with familiar street lighting',
    relatedTopics: ['flame tests', 'sodium', 'metal identification']
  },
  {
    id: 'mnem_004',
    concept: 'solubility-rules',
    title: 'Nitrate Solubility',
    mnemonic: 'ALL Nitrates are Soluble - NO exceptions!',
    animation: 'dissolving-crystals',
    description: 'Emphasizes that all nitrate compounds dissolve in water',
    relatedTopics: ['solubility', 'ionic compounds', 'precipitation']
  },
  {
    id: 'mnem_005',
    concept: 'organic-functional-groups',
    title: 'Alcohol Functional Group',
    mnemonic: 'Alcohols have OH - like saying "OH, I need a drink!"',
    animation: 'molecule-with-oh-group',
    description: 'Memorable way to remember the -OH functional group in alcohols',
    relatedTopics: ['organic chemistry', 'functional groups', 'alcohols']
  }
];

// Video Scripts for Crystal Ball Expert Explanations
export const videoScripts: VideoScript[] = [
  {
    id: 'video_001',
    title: 'Understanding Precipitation Reactions',
    concept: 'precipitation',
    script: `
Welcome to the Crystal Ball! Today we're exploring precipitation reactions.

[Scene 1 - Introduction]
When two solutions mix, sometimes a solid forms - this is called a precipitate. Think of it like magic, but it's actually chemistry!

[Scene 2 - The Science]
Precipitation happens when ions in solution combine to form an insoluble compound. For example, when silver nitrate meets sodium chloride:
AgNO₃ + NaCl → AgCl↓ + NaNO₃

[Scene 3 - Visual Demonstration]
Watch as we mix these clear solutions... and suddenly a white solid appears! That's silver chloride precipitating out.

[Scene 4 - Prediction Rules]
To predict precipitates, remember:
- Most chlorides are soluble, EXCEPT silver, lead, and mercury
- Most sulfates are soluble, EXCEPT barium, lead, and calcium
- Most carbonates are INSOLUBLE, EXCEPT Group 1 metals

[Scene 5 - Conclusion]
Practice predicting precipitates, and soon you'll be a master alchemist!
    `,
    duration: '3:45',
    keyPoints: [
      'Precipitation forms insoluble solids',
      'Use solubility rules to predict',
      'Practice with common ion combinations',
      'Visual cues help identify precipitates'
    ]
  },
  {
    id: 'video_002',
    title: 'Gas Evolution Reactions Explained',
    concept: 'gas-evolution',
    script: `
Greetings, young alchemist! Let's explore reactions that produce gases.

[Scene 1 - Types of Gas Reactions]
Three main types produce gases:
1. Acid + Metal → Salt + Hydrogen
2. Acid + Carbonate → Salt + Water + Carbon Dioxide  
3. Decomposition reactions

[Scene 2 - Hydrogen Production]
When zinc meets hydrochloric acid:
Zn + 2HCl → ZnCl₂ + H₂↑
The bubbling you see is hydrogen gas escaping!

[Scene 3 - Carbon Dioxide Production]
Limestone in acid produces CO₂:
CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑
This is why caves form in limestone regions.

[Scene 4 - Safety Note]
Always test gases safely:
- Hydrogen: burning splint makes a pop
- CO₂: turns limewater milky
- Oxygen: relights a glowing splint

[Scene 5 - Real World Applications]
These reactions power everything from antacid tablets to rocket engines!
    `,
    duration: '4:20',
    keyPoints: [
      'Three main types of gas-producing reactions',
      'Recognize reaction patterns',
      'Safe gas testing methods',
      'Real-world applications'
    ]
  }
];

// Formula Reference Sheets
export const arcaneFormulae: FormulaSheet = {
  id: 'arcane_formulae',
  category: 'calculation-formulas',
  title: 'Arcane Formulae - Essential Calculation Magic',
  formulas: [
    {
      name: 'Moles Calculation',
      formula: 'n = m / M',
      description: 'Number of moles equals mass divided by molar mass',
      units: 'n (mol), m (g), M (g/mol)'
    },
    {
      name: 'Concentration',
      formula: 'C = n / V',
      description: 'Concentration equals moles divided by volume',
      units: 'C (mol/dm³), n (mol), V (dm³)'
    },
    {
      name: 'Ideal Gas Law',
      formula: 'PV = nRT',
      description: 'Pressure × Volume = moles × Gas constant × Temperature',
      units: 'P (Pa), V (m³), n (mol), R (8.314 J/mol·K), T (K)'
    },
    {
      name: 'Percentage Yield',
      formula: '% Yield = (Actual / Theoretical) × 100',
      description: 'Efficiency of a chemical reaction',
      units: 'Percentage (%)'
    },
    {
      name: 'Dilution Formula',
      formula: 'C₁V₁ = C₂V₂',
      description: 'Initial concentration × volume = Final concentration × volume',
      units: 'C (mol/dm³), V (dm³)'
    },
    {
      name: 'Rate of Reaction',
      formula: 'Rate = Δ[concentration] / Δtime',
      description: 'Change in concentration over change in time',
      units: 'mol/dm³/s'
    }
  ]
};

export const sagesRuler: FormulaSheet = {
  id: 'sages_ruler',
  category: 'data-analysis-formulas',
  title: 'Sage\'s Ruler - Data Analysis Mastery',
  formulas: [
    {
      name: 'Percentage Error',
      formula: '% Error = |Experimental - Theoretical| / Theoretical × 100',
      description: 'Measures accuracy of experimental results',
      units: 'Percentage (%)'
    },
    {
      name: 'Mean (Average)',
      formula: 'Mean = Σx / n',
      description: 'Sum of all values divided by number of values',
      units: 'Same as original data'
    },
    {
      name: 'Standard Deviation',
      formula: 'σ = √(Σ(x - μ)² / n)',
      description: 'Measure of data spread around the mean',
      units: 'Same as original data'
    },
    {
      name: 'Gradient of Line',
      formula: 'm = (y₂ - y₁) / (x₂ - x₁)',
      description: 'Slope of a straight line between two points',
      units: 'y-units / x-units'
    },
    {
      name: 'Uncertainty Propagation (Addition)',
      formula: 'δ(A + B) = δA + δB',
      description: 'Absolute uncertainties add when adding/subtracting',
      units: 'Same as measured quantity'
    },
    {
      name: 'Uncertainty Propagation (Multiplication)',
      formula: 'δ(A × B) / (A × B) = δA/A + δB/B',
      description: 'Relative uncertainties add when multiplying/dividing',
      units: 'Percentage or fraction'
    }
  ]
};

// Additional O-Level Problems for Different Realms
export const labTechniqueProblems: ChemistryProblem[] = [
  {
    id: 'lab_001',
    realm: 'virtual-apprentice',
    difficulty: 'O-Level',
    type: 'procedure-ordering',
    question: 'Arrange the steps for preparing copper sulfate crystals by crystallization:',
    correctAnswer: ['Heat solution gently', 'Filter hot solution', 'Cool slowly', 'Filter crystals', 'Wash and dry'],
    explanation: 'Crystallization requires controlled cooling to form pure crystals.',
    stepByStepSolution: [
      '1. Heat the copper sulfate solution gently to concentrate it',
      '2. Filter the hot solution to remove impurities',
      '3. Cool the solution slowly to allow crystal formation',
      '4. Filter the crystals from the remaining solution',
      '5. Wash crystals with distilled water and dry'
    ],
    hints: ['Start by concentrating the solution', 'Slow cooling gives better crystals'],
    timeLimit: 180,
    points: 12
  },
  {
    id: 'lab_002',
    realm: 'virtual-apprentice',
    difficulty: 'O-Level',
    type: 'salt-preparation',
    question: 'How would you prepare sodium chloride from sodium hydroxide and hydrochloric acid?',
    correctAnswer: 'Neutralization followed by evaporation',
    explanation: 'Acid-base neutralization produces salt and water: NaOH + HCl → NaCl + H₂O',
    stepByStepSolution: [
      '1. Add NaOH solution to a beaker',
      '2. Add HCl dropwise until neutral (pH 7)',
      '3. Use indicator or pH meter to detect neutralization',
      '4. Evaporate water to obtain solid NaCl',
      '5. Heat gently to avoid decomposition'
    ],
    hints: ['Use neutralization reaction', 'Monitor pH carefully'],
    timeLimit: 240,
    points: 15
  }
];

export const observationProblems: ChemistryProblem[] = [
  {
    id: 'obs_001',
    realm: 'seers-challenge',
    difficulty: 'O-Level',
    type: 'precipitation-prediction',
    question: 'Will a precipitate form when silver nitrate solution is mixed with sodium chloride solution?',
    correctAnswer: 'Yes, white precipitate of AgCl',
    explanation: 'Silver chloride is insoluble in water, so it precipitates when Ag⁺ and Cl⁻ ions meet.',
    stepByStepSolution: [
      '1. Identify the ions: Ag⁺, NO₃⁻, Na⁺, Cl⁻',
      '2. Consider possible combinations: AgCl and NaNO₃',
      '3. Check solubility: AgCl is insoluble, NaNO₃ is soluble',
      '4. Conclusion: AgCl precipitates as white solid'
    ],
    hints: ['Check solubility rules for chlorides', 'Silver compounds are often insoluble'],
    timeLimit: 120,
    points: 10
  }
];

export const dataAnalysisProblems: ChemistryProblem[] = [
  {
    id: 'data_001',
    realm: 'cartographers-gauntlet',
    difficulty: 'O-Level',
    type: 'percentage-error',
    question: 'If the theoretical yield is 5.0g but you obtained 4.7g, what is the percentage error?',
    correctAnswer: '6.0%',
    explanation: 'Percentage error = |experimental - theoretical| / theoretical × 100',
    stepByStepSolution: [
      '1. Identify values: Theoretical = 5.0g, Experimental = 4.7g',
      '2. Calculate difference: |4.7 - 5.0| = 0.3g',
      '3. Apply formula: (0.3 / 5.0) × 100',
      '4. Calculate: 0.06 × 100 = 6.0%'
    ],
    hints: ['Use absolute value for the difference', 'Remember to multiply by 100 for percentage'],
    timeLimit: 90,
    points: 8
  }
];

// Export all content collections
export const allSampleContent = {
  equationBalancingProblems,
  stoichiometryProblems,
  gasTestProblems,
  flameColorProblems,
  iupacNamingProblems,
  mechanismProblems,
  labTechniqueProblems,
  observationProblems,
  dataAnalysisProblems,
  animatedMnemonics,
  videoScripts,
  arcaneFormulae,
  sagesRuler
};

export default allSampleContent;