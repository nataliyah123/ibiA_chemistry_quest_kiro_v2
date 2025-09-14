/**
 * Advanced A-Level Chemistry Content
 * Comprehensive organic chemistry problems and advanced concepts
 */

import { ChemistryProblem, AnimatedMnemonic } from './sampleContent';

// Advanced A-Level Organic Chemistry Problems
export const advancedOrganicProblems: ChemistryProblem[] = [
  {
    id: 'org_adv_001',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'stereochemistry',
    question: 'How many stereoisomers does 2,3-dibromobutane have?',
    correctAnswer: '3 stereoisomers',
    explanation: 'Two chiral centers give 2² = 4 possible stereoisomers, but one pair is meso, leaving 3 unique stereoisomers.',
    stepByStepSolution: [
      '1. Identify chiral centers: C2 and C3 both have 4 different groups',
      '2. Calculate maximum stereoisomers: 2ⁿ = 2² = 4',
      '3. Draw all possibilities: RR, RS, SR, SS',
      '4. Check for meso compounds: RS and SR are identical (meso)',
      '5. Final count: RR, SS, and meso form = 3 stereoisomers'
    ],
    hints: ['Look for chiral carbons', 'Check for meso compounds', 'Use 2ⁿ rule'],
    timeLimit: 300,
    points: 25
  },
  {
    id: 'org_adv_002',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'reaction-mechanism',
    question: 'What is the major product when 2-methylbut-2-ene reacts with HBr?',
    correctAnswer: '2-bromo-2-methylbutane',
    explanation: 'Markovnikov addition occurs - H adds to carbon with more hydrogens, Br adds to more substituted carbon.',
    stepByStepSolution: [
      '1. Identify the alkene: 2-methylbut-2-ene has C=C between C2 and C3',
      '2. Apply Markovnikov\'s rule: H goes to C with more H atoms',
      '3. C3 has 2 H atoms, C2 has 0 H atoms',
      '4. H adds to C3, Br adds to C2',
      '5. Product: 2-bromo-2-methylbutane'
    ],
    hints: ['Apply Markovnikov\'s rule', 'H goes to carbon with more hydrogens'],
    timeLimit: 240,
    points: 20
  },
  {
    id: 'org_adv_003',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'synthesis',
    question: 'How would you convert benzene to nitrobenzene?',
    correctAnswer: 'Nitration with HNO₃/H₂SO₄',
    explanation: 'Electrophilic aromatic substitution using nitric acid and sulfuric acid as catalyst.',
    stepByStepSolution: [
      '1. Use concentrated HNO₃ and H₂SO₄',
      '2. H₂SO₄ protonates HNO₃ to form NO₂⁺ electrophile',
      '3. NO₂⁺ attacks benzene ring',
      '4. Intermediate loses H⁺ to restore aromaticity',
      '5. Product: nitrobenzene + H₂O'
    ],
    hints: ['Think electrophilic aromatic substitution', 'Need strong acid catalyst'],
    timeLimit: 180,
    points: 18
  }
];

// Advanced Reaction Mechanisms
export const reactionMechanisms: ChemistryProblem[] = [
  {
    id: 'mech_adv_001',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'mechanism-drawing',
    question: 'Draw the mechanism for SN1 reaction of tert-butyl bromide with water.',
    correctAnswer: 'Two-step mechanism via carbocation intermediate',
    explanation: 'Tertiary halides undergo SN1 via stable carbocation intermediate.',
    stepByStepSolution: [
      'Step 1: (CH₃)₃CBr → (CH₃)₃C⁺ + Br⁻ (ionization)',
      'Step 2: (CH₃)₃C⁺ + H₂O → (CH₃)₃COH₂⁺ (nucleophilic attack)',
      'Step 3: (CH₃)₃COH₂⁺ → (CH₃)₃COH + H⁺ (deprotonation)',
      'Overall: (CH₃)₃CBr + H₂O → (CH₃)₃COH + HBr'
    ],
    hints: ['Tertiary halides favor SN1', 'Forms stable carbocation', 'Water acts as nucleophile'],
    timeLimit: 360,
    points: 30
  },
  {
    id: 'mech_adv_002',
    realm: 'forest-of-isomers',
    difficulty: 'A-Level',
    type: 'mechanism-drawing',
    question: 'Show the mechanism for aldol condensation of acetaldehyde.',
    correctAnswer: 'Enolate formation followed by nucleophilic addition',
    explanation: 'Base-catalyzed aldol condensation forms C-C bonds between carbonyl compounds.',
    stepByStepSolution: [
      'Step 1: Base removes α-hydrogen to form enolate anion',
      'Step 2: Enolate attacks carbonyl carbon of another acetaldehyde',
      'Step 3: Protonation gives β-hydroxyaldehyde (aldol)',
      'Step 4: Dehydration eliminates water to form α,β-unsaturated aldehyde'
    ],
    hints: ['Enolate is key intermediate', 'Forms new C-C bond', 'Can eliminate water'],
    timeLimit: 420,
    points: 35
  }
];

// Advanced Spectroscopy Problems
export const spectroscopyProblems: ChemistryProblem[] = [
  {
    id: 'spec_001',
    realm: 'seers-challenge',
    difficulty: 'A-Level',
    type: 'nmr-interpretation',
    question: 'A compound C₄H₈O shows NMR: δ 1.0 (3H, t), δ 2.4 (2H, q), δ 9.8 (1H, s). What is the structure?',
    correctAnswer: 'Butanal (CH₃CH₂CH₂CHO)',
    explanation: 'The chemical shifts and splitting patterns indicate an aldehyde with a propyl chain.',
    stepByStepSolution: [
      '1. δ 9.8 (1H, s): Aldehyde proton (CHO)',
      '2. δ 2.4 (2H, q): CH₂ next to C=O, coupled to CH₃',
      '3. δ 1.0 (3H, t): CH₃ coupled to CH₂',
      '4. Molecular formula C₄H₈O fits aldehyde',
      '5. Structure: CH₃CH₂CH₂CHO (butanal)'
    ],
    hints: ['δ 9.8 suggests aldehyde', 'Triplet-quartet pattern indicates ethyl group'],
    timeLimit: 300,
    points: 25
  },
  {
    id: 'spec_002',
    realm: 'seers-challenge',
    difficulty: 'A-Level',
    type: 'ir-interpretation',
    question: 'An IR spectrum shows peaks at 3300 cm⁻¹ (broad), 1650 cm⁻¹ (strong). What functional group is present?',
    correctAnswer: 'Amide (CONH₂)',
    explanation: 'The combination of N-H stretch and C=O stretch indicates an amide functional group.',
    stepByStepSolution: [
      '1. 3300 cm⁻¹ (broad): N-H stretch of primary amide',
      '2. 1650 cm⁻¹ (strong): C=O stretch, lower than ketone due to resonance',
      '3. Combination indicates amide functional group',
      '4. Primary amide shows two N-H stretches (often overlapping)'
    ],
    hints: ['Broad peak around 3300 suggests N-H', 'C=O at 1650 is lower than normal ketone'],
    timeLimit: 180,
    points: 20
  }
];

// Advanced Mnemonics for A-Level Concepts
export const advancedMnemonics: AnimatedMnemonic[] = [
  {
    id: 'adv_mnem_001',
    concept: 'sn1-vs-sn2',
    title: 'SN1 vs SN2 Mechanism Choice',
    mnemonic: 'SN1: Tertiary loves to Leave first (forms stable carbocation). SN2: Primary Prefers backside Push!',
    animation: 'mechanism-comparison',
    description: 'Helps remember which substrates favor which substitution mechanism',
    relatedTopics: ['nucleophilic substitution', 'reaction mechanisms', 'carbocations']
  },
  {
    id: 'adv_mnem_002',
    concept: 'markovnikov-rule',
    title: 'Markovnikov Addition Rule',
    mnemonic: 'Rich get Richer - H goes to carbon with More Hydrogens!',
    animation: 'alkene-addition',
    description: 'Remember that hydrogen adds to the carbon that already has more hydrogens',
    relatedTopics: ['alkene reactions', 'addition reactions', 'regioselectivity']
  },
  {
    id: 'adv_mnem_003',
    concept: 'nmr-chemical-shifts',
    title: 'NMR Chemical Shift Ranges',
    mnemonic: 'Aldehyde Always Around 10, Aromatic Around 7, Alkyl Around 1!',
    animation: 'nmr-spectrum',
    description: 'Quick reference for common NMR chemical shift ranges',
    relatedTopics: ['NMR spectroscopy', 'chemical shifts', 'structure determination']
  },
  {
    id: 'adv_mnem_004',
    concept: 'ir-frequencies',
    title: 'IR Frequency Ranges',
    mnemonic: 'OH is High (3500), C=O in the Middle (1700), Fingerprint is Low (below 1500)!',
    animation: 'ir-spectrum',
    description: 'Remember key IR absorption ranges for functional group identification',
    relatedTopics: ['IR spectroscopy', 'functional groups', 'molecular vibrations']
  },
  {
    id: 'adv_mnem_005',
    concept: 'stereochemistry',
    title: 'R/S Configuration',
    mnemonic: 'Right-handed = R, Steering wheel Right = R configuration!',
    animation: 'chiral-center-rotation',
    description: 'Visual way to remember R/S stereochemical assignments',
    relatedTopics: ['stereochemistry', 'chirality', 'optical activity']
  }
];

// Comprehensive Problem Sets by Topic
export const comprehensiveProblems = {
  // Equilibrium and Kinetics
  equilibriumProblems: [
    {
      id: 'eq_001',
      realm: 'cartographers-gauntlet',
      difficulty: 'A-Level',
      type: 'equilibrium-calculation',
      question: 'For the reaction N₂ + 3H₂ ⇌ 2NH₃, Kc = 0.5 at 500°C. If [N₂] = 0.1 M, [H₂] = 0.3 M, what is [NH₃] at equilibrium?',
      correctAnswer: '0.082 M',
      explanation: 'Use the equilibrium expression Kc = [NH₃]² / ([N₂][H₂]³) to solve for [NH₃].',
      stepByStepSolution: [
        '1. Write equilibrium expression: Kc = [NH₃]² / ([N₂][H₂]³)',
        '2. Substitute known values: 0.5 = [NH₃]² / (0.1 × 0.3³)',
        '3. Calculate denominator: 0.1 × 0.027 = 0.0027',
        '4. Solve: [NH₃]² = 0.5 × 0.0027 = 0.00135',
        '5. [NH₃] = √0.00135 = 0.037 M'
      ],
      hints: ['Write the equilibrium expression first', 'Be careful with stoichiometric coefficients'],
      timeLimit: 300,
      points: 25
    }
  ],

  // Thermodynamics
  thermodynamicsProblems: [
    {
      id: 'thermo_001',
      realm: 'cartographers-gauntlet',
      difficulty: 'A-Level',
      type: 'enthalpy-calculation',
      question: 'Calculate ΔH for: C₂H₄ + H₂ → C₂H₆ using bond enthalpies: C=C (612), C-C (348), C-H (412), H-H (436) kJ/mol',
      correctAnswer: '-124 kJ/mol',
      explanation: 'ΔH = Bonds broken - Bonds formed. Break C=C and H-H, form C-C and 2 C-H bonds.',
      stepByStepSolution: [
        '1. Bonds broken: 1 C=C (612) + 1 H-H (436) = 1048 kJ/mol',
        '2. Bonds formed: 1 C-C (348) + 2 C-H (2×412) = 1172 kJ/mol',
        '3. ΔH = Energy in - Energy out = 1048 - 1172 = -124 kJ/mol',
        '4. Negative value indicates exothermic reaction'
      ],
      hints: ['Energy required to break bonds', 'Energy released when forming bonds'],
      timeLimit: 240,
      points: 20
    }
  ]
};

export const allAdvancedContent = {
  advancedOrganicProblems,
  reactionMechanisms,
  spectroscopyProblems,
  advancedMnemonics,
  comprehensiveProblems
};

export default allAdvancedContent;