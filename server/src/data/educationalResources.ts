/**
 * Educational Resources and Reference Materials
 * Comprehensive guides, explanations, and learning aids
 */

export interface LearningGuide {
  id: string;
  title: string;
  topic: string;
  level: 'O-Level' | 'A-Level';
  content: string;
  keyPoints: string[];
  commonMistakes: string[];
  practiceQuestions: string[];
}

export interface ConceptExplanation {
  id: string;
  concept: string;
  simpleExplanation: string;
  detailedExplanation: string;
  realWorldExample: string;
  visualAids: string[];
  relatedConcepts: string[];
}

// Comprehensive Learning Guides
export const learningGuides: LearningGuide[] = [
  {
    id: 'guide_001',
    title: 'Mastering Chemical Equations',
    topic: 'equation-balancing',
    level: 'O-Level',
    content: `
# Mastering Chemical Equations

## What is a Chemical Equation?
A chemical equation is like a recipe for a chemical reaction. It shows:
- **Reactants**: What you start with (left side)
- **Products**: What you end up with (right side)
- **Arrow**: Shows the direction of reaction

## The Law of Conservation of Mass
"Matter cannot be created or destroyed in a chemical reaction"
This means: **Atoms in = Atoms out**

## Step-by-Step Balancing Method

### 1. Count Atoms
List each element and count atoms on both sides:
Example: H₂ + O₂ → H₂O
- Left: H=2, O=2
- Right: H=2, O=1

### 2. Identify Imbalances
Oxygen is unbalanced (2 ≠ 1)

### 3. Add Coefficients
Try coefficient 2 for H₂O: H₂ + O₂ → 2H₂O
- Left: H=2, O=2
- Right: H=4, O=2

### 4. Balance Remaining Elements
Now hydrogen is unbalanced, so: 2H₂ + O₂ → 2H₂O
- Left: H=4, O=2
- Right: H=4, O=2 ✓

## Pro Tips for Success
1. **Start with the most complex molecule**
2. **Balance metals first, then non-metals, then hydrogen and oxygen**
3. **Use fractions if needed, then multiply to get whole numbers**
4. **Always do a final check**
    `,
    keyPoints: [
      'Chemical equations must be balanced (equal atoms on both sides)',
      'Use coefficients, never change chemical formulas',
      'Start with the most complex molecule',
      'Check your work by counting atoms'
    ],
    commonMistakes: [
      'Changing subscripts instead of using coefficients',
      'Forgetting to multiply coefficients through entire formula',
      'Not checking the final answer',
      'Balancing in the wrong order'
    ],
    practiceQuestions: [
      'Balance: Na + Cl₂ → NaCl',
      'Balance: Fe + O₂ → Fe₂O₃',
      'Balance: C₃H₈ + O₂ → CO₂ + H₂O'
    ]
  },
  {
    id: 'guide_002',
    title: 'Understanding Moles and Stoichiometry',
    topic: 'stoichiometry',
    level: 'O-Level',
    content: `
# Understanding Moles and Stoichiometry

## What is a Mole?
A mole is simply a counting unit, like a dozen:
- 1 dozen = 12 items
- 1 mole = 6.02 × 10²³ particles (Avogadro's number)

## Why Use Moles?
Atoms are incredibly tiny! Moles let us work with manageable numbers.

## Key Formulas
1. **Moles = Mass ÷ Molar Mass**
   n = m ÷ M

2. **Mass = Moles × Molar Mass**
   m = n × M

3. **Molar Mass = Atomic masses added up**
   (from periodic table)

## Stoichiometry Steps

### Step 1: Write Balanced Equation
Example: 2H₂ + O₂ → 2H₂O

### Step 2: Identify Given and Unknown
Given: 4 moles H₂
Find: moles H₂O produced

### Step 3: Use Mole Ratios
From equation: 2 mol H₂ : 2 mol H₂O
Ratio = 1:1

### Step 4: Calculate
4 mol H₂ × (2 mol H₂O / 2 mol H₂) = 4 mol H₂O

## Real-World Connection
Baking a cake: If recipe needs 2 eggs for 1 cake, then 6 eggs make 3 cakes.
Chemistry: If 2 mol H₂ makes 2 mol H₂O, then 6 mol H₂ makes 6 mol H₂O.
    `,
    keyPoints: [
      'Mole is a counting unit (6.02 × 10²³ particles)',
      'Use molar mass to convert between grams and moles',
      'Balanced equations give mole ratios',
      'Stoichiometry is like following a recipe'
    ],
    commonMistakes: [
      'Forgetting to balance the equation first',
      'Using wrong mole ratios',
      'Mixing up mass and moles',
      'Not using proper significant figures'
    ],
    practiceQuestions: [
      'How many moles in 36g of H₂O?',
      'If 2 mol Mg react, how many mol MgO form?',
      'Calculate mass of CO₂ from 1.5 mol C'
    ]
  }
];

// Detailed Concept Explanations
export const conceptExplanations: ConceptExplanation[] = [
  {
    id: 'concept_001',
    concept: 'Ionic Bonding',
    simpleExplanation: 'Ionic bonding happens when metals give electrons to non-metals, creating charged ions that attract each other.',
    detailedExplanation: `
Ionic bonding occurs between metals and non-metals through electron transfer:

**The Process:**
1. **Metal atoms lose electrons** → become positive cations
2. **Non-metal atoms gain electrons** → become negative anions  
3. **Opposite charges attract** → ionic bond forms

**Why does this happen?**
- Metals have few outer electrons (easy to lose)
- Non-metals need few electrons to complete outer shell
- Both atoms achieve stable electron configurations

**Properties of Ionic Compounds:**
- High melting/boiling points (strong electrostatic forces)
- Conduct electricity when molten/dissolved (mobile ions)
- Often soluble in water (polar solvent)
- Form crystal lattices (regular 3D arrangements)

**Energy Changes:**
- Ionization energy: energy to remove electron from metal
- Electron affinity: energy released when non-metal gains electron
- Lattice energy: energy released when ionic solid forms
    `,
    realWorldExample: 'Table salt (NaCl): Sodium loses 1 electron to chlorine. The Na⁺ and Cl⁻ ions attract strongly, making salt crystals that dissolve in water and conduct electricity.',
    visualAids: [
      'Electron transfer diagram showing Na → Na⁺ + e⁻',
      'Crystal lattice structure of NaCl',
      'Born-Haber cycle energy diagram'
    ],
    relatedConcepts: ['Covalent bonding', 'Metallic bonding', 'Electronegativity', 'Crystal structures']
  },
  {
    id: 'concept_002',
    concept: 'Organic Functional Groups',
    simpleExplanation: 'Functional groups are specific arrangements of atoms that give organic molecules their characteristic properties and reactions.',
    detailedExplanation: `
Functional groups are the "business end" of organic molecules:

**What are Functional Groups?**
- Specific atom arrangements that determine molecular behavior
- Same functional group = similar properties and reactions
- Allow us to predict and understand organic chemistry

**Major Functional Groups:**

**Alcohols (-OH)**
- Polar, can hydrogen bond
- Higher boiling points than alkanes
- React with acids to form esters

**Aldehydes (R-CHO)**
- Carbonyl carbon at end of chain
- Easily oxidized to carboxylic acids
- Characteristic smell (vanilla, almonds)

**Ketones (R-CO-R)**
- Carbonyl carbon in middle of chain
- Less reactive than aldehydes
- Common solvents (acetone)

**Carboxylic Acids (R-COOH)**
- Acidic hydrogen
- Form salts with bases
- Can form dimers through hydrogen bonding

**Reaction Patterns:**
Each functional group has predictable reactions:
- Alcohols → Aldehydes/Ketones (oxidation)
- Aldehydes → Carboxylic acids (oxidation)
- Acids + Alcohols → Esters (esterification)
    `,
    realWorldExample: 'Aspirin contains both carboxylic acid (-COOH) and ester (-COO-) functional groups. The acid group makes it slightly acidic, while the ester can be hydrolyzed in the body.',
    visualAids: [
      'Functional group structure diagrams',
      'Reaction pathway flowchart',
      'Molecular models showing 3D shapes'
    ],
    relatedConcepts: ['Organic synthesis', 'Reaction mechanisms', 'Isomerism', 'Spectroscopy']
  }
];

// Study Strategies and Tips
export const studyStrategies = {
  memoryTechniques: [
    {
      technique: 'Acronyms',
      example: 'OIL RIG - Oxidation Is Loss (of electrons), Reduction Is Gain',
      application: 'Redox reactions, electron transfer'
    },
    {
      technique: 'Visual Associations',
      example: 'Sodium flame = Street light yellow',
      application: 'Flame tests, metal identification'
    },
    {
      technique: 'Story Method',
      example: 'Hydrogen goes "POP!" like a surprised balloon',
      application: 'Gas tests and identification'
    },
    {
      technique: 'Rhymes and Songs',
      example: 'All nitrates are soluble, no exceptions to see!',
      application: 'Solubility rules'
    }
  ],
  
  problemSolvingSteps: [
    {
      step: 1,
      title: 'Understand the Question',
      description: 'Read carefully, identify what\'s given and what\'s asked',
      tips: ['Highlight key information', 'Draw diagrams if helpful']
    },
    {
      step: 2,
      title: 'Plan Your Approach',
      description: 'Choose the right formula or method',
      tips: ['Write down relevant equations', 'Consider units needed']
    },
    {
      step: 3,
      title: 'Execute the Solution',
      description: 'Work through step-by-step',
      tips: ['Show all working', 'Keep track of significant figures']
    },
    {
      step: 4,
      title: 'Check Your Answer',
      description: 'Does it make sense?',
      tips: ['Check units', 'Estimate to verify magnitude']
    }
  ],

  examTechniques: [
    {
      category: 'Time Management',
      tips: [
        'Read all questions first to plan time allocation',
        'Start with questions you\'re most confident about',
        'Leave time for checking at the end'
      ]
    },
    {
      category: 'Calculation Questions',
      tips: [
        'Always show your working clearly',
        'Include units in your final answer',
        'Use appropriate significant figures'
      ]
    },
    {
      category: 'Explanation Questions',
      tips: [
        'Use scientific terminology correctly',
        'Give reasons for your statements',
        'Include balanced equations where relevant'
      ]
    }
  ]
};

// Common Chemistry Misconceptions and Corrections
export const commonMisconceptions = [
  {
    misconception: 'Heavier molecules always have higher boiling points',
    correction: 'Intermolecular forces matter more than molecular weight. Hydrogen bonding can make lighter molecules have higher boiling points.',
    example: 'Water (H₂O, 18 g/mol) boils at 100°C, while methane (CH₄, 16 g/mol) boils at -164°C due to hydrogen bonding in water.'
  },
  {
    misconception: 'Catalysts are consumed in reactions',
    correction: 'Catalysts are regenerated and not consumed overall. They provide alternative reaction pathways with lower activation energy.',
    example: 'Enzymes can catalyze thousands of reactions without being used up.'
  },
  {
    misconception: 'Equilibrium means equal concentrations',
    correction: 'Equilibrium means constant concentrations, not necessarily equal. The equilibrium constant determines the ratio.',
    example: 'In N₂ + 3H₂ ⇌ 2NH₃, equilibrium might have more reactants than products.'
  },
  {
    misconception: 'Acids always contain hydrogen',
    correction: 'Lewis acids don\'t need hydrogen. They accept electron pairs.',
    example: 'BF₃ is a Lewis acid because it can accept electron pairs, despite having no hydrogen.'
  }
];

export const allEducationalResources = {
  learningGuides,
  conceptExplanations,
  studyStrategies,
  commonMisconceptions
};

export default allEducationalResources;