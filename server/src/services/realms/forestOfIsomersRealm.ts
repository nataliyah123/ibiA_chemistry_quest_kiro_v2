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

// Organic chemistry interfaces
export interface OrganicMolecule {
  name: string;
  iupacName: string;
  formula: string;
  structure: string; // SMILES notation or simplified structure
  functionalGroups: string[];
  difficulty: number;
  category: 'alkane' | 'alkene' | 'alkyne' | 'alcohol' | 'aldehyde' | 'ketone' | 'carboxylic_acid' | 'ester' | 'ether' | 'amine' | 'aromatic';
}

export interface ReactionMechanism {
  name: string;
  type: 'SN1' | 'SN2' | 'E1' | 'E2' | 'addition' | 'elimination' | 'substitution';
  reactants: string[];
  products: string[];
  steps: MechanismStep[];
  difficulty: number;
}

export interface MechanismStep {
  stepNumber: number;
  description: string;
  electronMovement: ElectronMovement[];
  intermediates?: string[];
}

export interface ElectronMovement {
  from: { atom: string; position: [number, number] };
  to: { atom: string; position: [number, number] };
  type: 'single' | 'double' | 'lone_pair';
}

export interface IsomerSet {
  baseFormula: string;
  isomers: IsomerMolecule[];
  category: 'structural' | 'stereoisomer' | 'enantiomer' | 'diastereomer' | 'conformational';
  difficulty: number;
}

export interface IsomerMolecule {
  name: string;
  structure: string;
  type: string;
  properties: string[];
}

export class ForestOfIsomersRealm extends RealmComponent {
  realmId = 'forest-of-isomers';
  name = 'The Forest of Isomers';
  description = 'Master organic chemistry through interactive naming, mechanism, and isomer challenges';
  requiredLevel = 8;

  // Sample reaction mechanisms for mechanism archery challenges
  private sampleMechanisms: ReactionMechanism[] = [
    // SN2 Mechanisms (Difficulty 2-3)
    {
      name: 'SN2 Nucleophilic Substitution',
      type: 'SN2',
      reactants: ['CH₃CH₂Br', 'OH⁻'],
      products: ['CH₃CH₂OH', 'Br⁻'],
      steps: [
        {
          stepNumber: 1,
          description: 'Hydroxide ion attacks the carbon from the backside',
          electronMovement: [
            {
              from: { atom: 'O', position: [100, 200] },
              to: { atom: 'C', position: [200, 200] },
              type: 'lone_pair'
            },
            {
              from: { atom: 'C', position: [200, 200] },
              to: { atom: 'Br', position: [300, 200] },
              type: 'single'
            }
          ]
        }
      ],
      difficulty: 2
    },
    {
      name: 'SN2 with Primary Alkyl Halide',
      type: 'SN2',
      reactants: ['CH₃CH₂CH₂Cl', 'CN⁻'],
      products: ['CH₃CH₂CH₂CN', 'Cl⁻'],
      steps: [
        {
          stepNumber: 1,
          description: 'Cyanide ion attacks the primary carbon',
          electronMovement: [
            {
              from: { atom: 'C(CN)', position: [80, 180] },
              to: { atom: 'C', position: [180, 180] },
              type: 'lone_pair'
            },
            {
              from: { atom: 'C', position: [180, 180] },
              to: { atom: 'Cl', position: [280, 180] },
              type: 'single'
            }
          ]
        }
      ],
      difficulty: 2
    },

    // SN1 Mechanisms (Difficulty 3-4)
    {
      name: 'SN1 Nucleophilic Substitution',
      type: 'SN1',
      reactants: ['(CH₃)₃CBr', 'H₂O'],
      products: ['(CH₃)₃COH', 'HBr'],
      steps: [
        {
          stepNumber: 1,
          description: 'Bromide leaves forming tertiary carbocation',
          electronMovement: [
            {
              from: { atom: 'C', position: [200, 200] },
              to: { atom: 'Br', position: [300, 200] },
              type: 'single'
            }
          ],
          intermediates: ['(CH₃)₃C⁺']
        },
        {
          stepNumber: 2,
          description: 'Water attacks the carbocation',
          electronMovement: [
            {
              from: { atom: 'O', position: [100, 250] },
              to: { atom: 'C', position: [200, 200] },
              type: 'lone_pair'
            }
          ]
        },
        {
          stepNumber: 3,
          description: 'Deprotonation to form alcohol',
          electronMovement: [
            {
              from: { atom: 'O', position: [150, 250] },
              to: { atom: 'H', position: [120, 270] },
              type: 'single'
            }
          ]
        }
      ],
      difficulty: 4
    },

    // E2 Elimination (Difficulty 3-4)
    {
      name: 'E2 Elimination Reaction',
      type: 'E2',
      reactants: ['CH₃CH₂CHBrCH₃', 'OH⁻'],
      products: ['CH₃CH=CHCH₃', 'H₂O', 'Br⁻'],
      steps: [
        {
          stepNumber: 1,
          description: 'Concerted elimination - base removes proton while C-Br bond breaks',
          electronMovement: [
            {
              from: { atom: 'O', position: [80, 180] },
              to: { atom: 'H', position: [150, 180] },
              type: 'lone_pair'
            },
            {
              from: { atom: 'C', position: [180, 180] },
              to: { atom: 'C', position: [220, 180] },
              type: 'single'
            },
            {
              from: { atom: 'C', position: [220, 180] },
              to: { atom: 'Br', position: [280, 180] },
              type: 'single'
            }
          ]
        }
      ],
      difficulty: 3
    },

    // E1 Elimination (Difficulty 4)
    {
      name: 'E1 Elimination Reaction',
      type: 'E1',
      reactants: ['(CH₃)₂CHCH₂Br', 'Heat'],
      products: ['(CH₃)₂C=CH₂', 'HBr'],
      steps: [
        {
          stepNumber: 1,
          description: 'Bromide leaves forming secondary carbocation',
          electronMovement: [
            {
              from: { atom: 'C', position: [200, 200] },
              to: { atom: 'Br', position: [280, 200] },
              type: 'single'
            }
          ],
          intermediates: ['(CH₃)₂CHCH₂⁺']
        },
        {
          stepNumber: 2,
          description: 'Carbocation rearrangement to more stable tertiary',
          electronMovement: [
            {
              from: { atom: 'C', position: [160, 180] },
              to: { atom: 'C', position: [200, 200] },
              type: 'single'
            }
          ],
          intermediates: ['(CH₃)₂C⁺CH₃']
        },
        {
          stepNumber: 3,
          description: 'Base removes proton forming alkene',
          electronMovement: [
            {
              from: { atom: 'C', position: [180, 220] },
              to: { atom: 'C', position: [200, 200] },
              type: 'single'
            },
            {
              from: { atom: 'C', position: [180, 220] },
              to: { atom: 'H', position: [160, 240] },
              type: 'single'
            }
          ]
        }
      ],
      difficulty: 4
    },

    // Addition Reactions (Difficulty 2-3)
    {
      name: 'Alkene Hydration',
      type: 'addition',
      reactants: ['CH₃CH=CH₂', 'H₂O', 'H⁺'],
      products: ['CH₃CH(OH)CH₃'],
      steps: [
        {
          stepNumber: 1,
          description: 'Protonation of alkene following Markovnikov rule',
          electronMovement: [
            {
              from: { atom: 'C', position: [180, 180] },
              to: { atom: 'H', position: [120, 160] },
              type: 'double'
            }
          ],
          intermediates: ['CH₃CH⁺CH₃']
        },
        {
          stepNumber: 2,
          description: 'Water attacks the carbocation',
          electronMovement: [
            {
              from: { atom: 'O', position: [100, 220] },
              to: { atom: 'C', position: [200, 200] },
              type: 'lone_pair'
            }
          ]
        },
        {
          stepNumber: 3,
          description: 'Deprotonation to form alcohol',
          electronMovement: [
            {
              from: { atom: 'O', position: [150, 220] },
              to: { atom: 'H', position: [130, 240] },
              type: 'single'
            }
          ]
        }
      ],
      difficulty: 3
    },

    // Aromatic Substitution (Difficulty 4-5)
    {
      name: 'Electrophilic Aromatic Substitution',
      type: 'substitution',
      reactants: ['C₆H₆', 'Br₂', 'FeBr₃'],
      products: ['C₆H₅Br', 'HBr'],
      steps: [
        {
          stepNumber: 1,
          description: 'Formation of electrophile Br⁺',
          electronMovement: [
            {
              from: { atom: 'Br', position: [200, 150] },
              to: { atom: 'Fe', position: [250, 150] },
              type: 'single'
            }
          ],
          intermediates: ['Br⁺', 'FeBr₄⁻']
        },
        {
          stepNumber: 2,
          description: 'Electrophile attacks benzene ring',
          electronMovement: [
            {
              from: { atom: 'C(benzene)', position: [180, 200] },
              to: { atom: 'Br', position: [200, 150] },
              type: 'double'
            }
          ],
          intermediates: ['Arenium ion']
        },
        {
          stepNumber: 3,
          description: 'Deprotonation restores aromaticity',
          electronMovement: [
            {
              from: { atom: 'C', position: [180, 220] },
              to: { atom: 'C', position: [180, 200] },
              type: 'single'
            },
            {
              from: { atom: 'C', position: [180, 220] },
              to: { atom: 'H', position: [160, 240] },
              type: 'single'
            }
          ]
        }
      ],
      difficulty: 5
    }
  ];

  // Sample isomer sets for isomer zoo challenges
  private sampleIsomerSets: IsomerSet[] = [
    // Structural Isomers (Difficulty 2-3)
    {
      baseFormula: 'C₄H₁₀',
      isomers: [
        {
          name: 'butane',
          structure: 'CH₃CH₂CH₂CH₃',
          type: 'straight-chain alkane',
          properties: ['bp: -0.5°C', 'linear structure', 'primary carbons at ends']
        },
        {
          name: '2-methylpropane',
          structure: 'CH₃CH(CH₃)CH₃',
          type: 'branched alkane',
          properties: ['bp: -11.7°C', 'branched structure', 'tertiary carbon center']
        }
      ],
      category: 'structural',
      difficulty: 2
    },
    {
      baseFormula: 'C₅H₁₂',
      isomers: [
        {
          name: 'pentane',
          structure: 'CH₃CH₂CH₂CH₂CH₃',
          type: 'straight-chain alkane',
          properties: ['bp: 36.1°C', 'linear structure', 'highest boiling point']
        },
        {
          name: '2-methylbutane',
          structure: 'CH₃CH(CH₃)CH₂CH₃',
          type: 'branched alkane',
          properties: ['bp: 27.8°C', 'one branch', 'secondary carbon with methyl']
        },
        {
          name: '2,2-dimethylpropane',
          structure: 'CH₃C(CH₃)₂CH₃',
          type: 'highly branched alkane',
          properties: ['bp: 9.5°C', 'quaternary carbon', 'lowest boiling point']
        }
      ],
      category: 'structural',
      difficulty: 3
    },
    {
      baseFormula: 'C₄H₁₀O',
      isomers: [
        {
          name: 'butan-1-ol',
          structure: 'CH₃CH₂CH₂CH₂OH',
          type: 'primary alcohol',
          properties: ['bp: 117.7°C', 'primary OH group', 'hydrogen bonding']
        },
        {
          name: 'butan-2-ol',
          structure: 'CH₃CH(OH)CH₂CH₃',
          type: 'secondary alcohol',
          properties: ['bp: 99.5°C', 'secondary OH group', 'chiral center']
        },
        {
          name: '2-methylpropan-1-ol',
          structure: 'CH₃CH(CH₃)CH₂OH',
          type: 'primary alcohol (branched)',
          properties: ['bp: 108°C', 'branched primary alcohol', 'steric hindrance']
        },
        {
          name: '2-methylpropan-2-ol',
          structure: 'CH₃C(OH)(CH₃)CH₃',
          type: 'tertiary alcohol',
          properties: ['bp: 82.4°C', 'tertiary OH group', 'no oxidation']
        },
        {
          name: 'diethyl ether',
          structure: 'CH₃CH₂OCH₂CH₃',
          type: 'ether',
          properties: ['bp: 34.6°C', 'ether functional group', 'no hydrogen bonding']
        },
        {
          name: 'methyl propyl ether',
          structure: 'CH₃OCH₂CH₂CH₃',
          type: 'ether',
          properties: ['bp: 39°C', 'asymmetric ether', 'volatile']
        }
      ],
      category: 'structural',
      difficulty: 4
    },

    // Stereoisomers (Difficulty 4-5)
    {
      baseFormula: 'C₄H₈Cl₂',
      isomers: [
        {
          name: '1,2-dichlorobutane',
          structure: 'CH₃CH(Cl)CH(Cl)CH₃',
          type: 'vicinal dichloride',
          properties: ['two chiral centers', 'meso compound possible', 'diastereomers exist']
        },
        {
          name: '1,3-dichlorobutane',
          structure: 'CH₃CH(Cl)CH₂CH(Cl)',
          type: 'geminal dichloride',
          properties: ['one chiral center', 'enantiomers exist', 'optically active']
        },
        {
          name: '1,4-dichlorobutane',
          structure: 'ClCH₂CH₂CH₂CH₂Cl',
          type: 'terminal dichloride',
          properties: ['no chiral centers', 'achiral molecule', 'symmetric']
        }
      ],
      category: 'stereoisomer',
      difficulty: 4
    },

    // Enantiomers (Difficulty 5)
    {
      baseFormula: 'C₄H₉Cl',
      isomers: [
        {
          name: '(R)-2-chlorobutane',
          structure: 'CH₃CH(Cl)CH₂CH₃',
          type: 'R-enantiomer',
          properties: ['[α]D = +31.1°', 'dextrorotatory', 'R-configuration']
        },
        {
          name: '(S)-2-chlorobutane',
          structure: 'CH₃CH(Cl)CH₂CH₃',
          type: 'S-enantiomer',
          properties: ['[α]D = -31.1°', 'levorotatory', 'S-configuration']
        }
      ],
      category: 'enantiomer',
      difficulty: 5
    },
    {
      baseFormula: 'C₅H₁₁Br',
      isomers: [
        {
          name: '(R)-2-bromopentan',
          structure: 'CH₃CH(Br)CH₂CH₂CH₃',
          type: 'R-enantiomer',
          properties: ['chiral carbon at C-2', 'R-configuration', 'optically active']
        },
        {
          name: '(S)-2-bromopentan',
          structure: 'CH₃CH(Br)CH₂CH₂CH₃',
          type: 'S-enantiomer',
          properties: ['chiral carbon at C-2', 'S-configuration', 'optically active']
        }
      ],
      category: 'enantiomer',
      difficulty: 5
    },

    // Diastereomers (Difficulty 5)
    {
      baseFormula: 'C₄H₈Br₂',
      isomers: [
        {
          name: '(2R,3R)-2,3-dibromobutane',
          structure: 'CH₃CH(Br)CH(Br)CH₃',
          type: 'R,R-diastereomer',
          properties: ['two chiral centers', 'R,R configuration', 'optically active']
        },
        {
          name: '(2S,3S)-2,3-dibromobutane',
          structure: 'CH₃CH(Br)CH(Br)CH₃',
          type: 'S,S-diastereomer',
          properties: ['two chiral centers', 'S,S configuration', 'enantiomer of R,R']
        },
        {
          name: '(2R,3S)-2,3-dibromobutane',
          structure: 'CH₃CH(Br)CH(Br)CH₃',
          type: 'meso compound',
          properties: ['internal plane of symmetry', 'optically inactive', 'meso form']
        }
      ],
      category: 'diastereomer',
      difficulty: 5
    },

    // Conformational Isomers (Difficulty 3)
    {
      baseFormula: 'C₂H₆',
      isomers: [
        {
          name: 'ethane (staggered)',
          structure: 'CH₃-CH₃ (staggered)',
          type: 'staggered conformation',
          properties: ['lowest energy', 'maximum separation', 'most stable']
        },
        {
          name: 'ethane (eclipsed)',
          structure: 'CH₃-CH₃ (eclipsed)',
          type: 'eclipsed conformation',
          properties: ['higher energy', 'torsional strain', 'less stable']
        }
      ],
      category: 'conformational',
      difficulty: 3
    }
  ];

  // Sample organic molecules for IUPAC naming challenges
  private sampleMolecules: OrganicMolecule[] = [
    // Alkanes (Difficulty 1-2)
    {
      name: 'methane',
      iupacName: 'methane',
      formula: 'CH₄',
      structure: 'C',
      functionalGroups: [],
      difficulty: 1,
      category: 'alkane'
    },
    {
      name: 'ethane',
      iupacName: 'ethane',
      formula: 'C₂H₆',
      structure: 'CC',
      functionalGroups: [],
      difficulty: 1,
      category: 'alkane'
    },
    {
      name: 'propane',
      iupacName: 'propane',
      formula: 'C₃H₈',
      structure: 'CCC',
      functionalGroups: [],
      difficulty: 1,
      category: 'alkane'
    },
    {
      name: 'butane',
      iupacName: 'butane',
      formula: 'C₄H₁₀',
      structure: 'CCCC',
      functionalGroups: [],
      difficulty: 1,
      category: 'alkane'
    },
    {
      name: '2-methylpropane',
      iupacName: '2-methylpropane',
      formula: 'C₄H₁₀',
      structure: 'CC(C)C',
      functionalGroups: [],
      difficulty: 2,
      category: 'alkane'
    },
    {
      name: 'pentane',
      iupacName: 'pentane',
      formula: 'C₅H₁₂',
      structure: 'CCCCC',
      functionalGroups: [],
      difficulty: 2,
      category: 'alkane'
    },
    {
      name: '2-methylbutane',
      iupacName: '2-methylbutane',
      formula: 'C₅H₁₂',
      structure: 'CCCC(C)',
      functionalGroups: [],
      difficulty: 2,
      category: 'alkane'
    },
    {
      name: '2,2-dimethylpropane',
      iupacName: '2,2-dimethylpropane',
      formula: 'C₅H₁₂',
      structure: 'CC(C)(C)C',
      functionalGroups: [],
      difficulty: 3,
      category: 'alkane'
    },

    // Alkenes (Difficulty 2-3)
    {
      name: 'ethene',
      iupacName: 'ethene',
      formula: 'C₂H₄',
      structure: 'C=C',
      functionalGroups: ['alkene'],
      difficulty: 2,
      category: 'alkene'
    },
    {
      name: 'propene',
      iupacName: 'propene',
      formula: 'C₃H₆',
      structure: 'C=CC',
      functionalGroups: ['alkene'],
      difficulty: 2,
      category: 'alkene'
    },
    {
      name: 'but-1-ene',
      iupacName: 'but-1-ene',
      formula: 'C₄H₈',
      structure: 'C=CCC',
      functionalGroups: ['alkene'],
      difficulty: 2,
      category: 'alkene'
    },
    {
      name: 'but-2-ene',
      iupacName: 'but-2-ene',
      formula: 'C₄H₈',
      structure: 'CC=CC',
      functionalGroups: ['alkene'],
      difficulty: 3,
      category: 'alkene'
    },
    {
      name: '2-methylprop-1-ene',
      iupacName: '2-methylprop-1-ene',
      formula: 'C₄H₈',
      structure: 'C=C(C)C',
      functionalGroups: ['alkene'],
      difficulty: 3,
      category: 'alkene'
    },

    // Alcohols (Difficulty 2-4)
    {
      name: 'methanol',
      iupacName: 'methanol',
      formula: 'CH₄O',
      structure: 'CO',
      functionalGroups: ['alcohol'],
      difficulty: 2,
      category: 'alcohol'
    },
    {
      name: 'ethanol',
      iupacName: 'ethanol',
      formula: 'C₂H₆O',
      structure: 'CCO',
      functionalGroups: ['alcohol'],
      difficulty: 2,
      category: 'alcohol'
    },
    {
      name: 'propan-1-ol',
      iupacName: 'propan-1-ol',
      formula: 'C₃H₈O',
      structure: 'CCCO',
      functionalGroups: ['alcohol'],
      difficulty: 2,
      category: 'alcohol'
    },
    {
      name: 'propan-2-ol',
      iupacName: 'propan-2-ol',
      formula: 'C₃H₈O',
      structure: 'CC(O)C',
      functionalGroups: ['alcohol'],
      difficulty: 3,
      category: 'alcohol'
    },
    {
      name: 'butan-1-ol',
      iupacName: 'butan-1-ol',
      formula: 'C₄H₁₀O',
      structure: 'CCCCO',
      functionalGroups: ['alcohol'],
      difficulty: 3,
      category: 'alcohol'
    },
    {
      name: 'butan-2-ol',
      iupacName: 'butan-2-ol',
      formula: 'C₄H₁₀O',
      structure: 'CCC(O)C',
      functionalGroups: ['alcohol'],
      difficulty: 3,
      category: 'alcohol'
    },
    {
      name: '2-methylpropan-1-ol',
      iupacName: '2-methylpropan-1-ol',
      formula: 'C₄H₁₀O',
      structure: 'CC(C)CO',
      functionalGroups: ['alcohol'],
      difficulty: 4,
      category: 'alcohol'
    },
    {
      name: '2-methylpropan-2-ol',
      iupacName: '2-methylpropan-2-ol',
      formula: 'C₄H₁₀O',
      structure: 'CC(C)(O)C',
      functionalGroups: ['alcohol'],
      difficulty: 4,
      category: 'alcohol'
    },

    // Aldehydes (Difficulty 3-4)
    {
      name: 'methanal',
      iupacName: 'methanal',
      formula: 'CH₂O',
      structure: 'C=O',
      functionalGroups: ['aldehyde'],
      difficulty: 3,
      category: 'aldehyde'
    },
    {
      name: 'ethanal',
      iupacName: 'ethanal',
      formula: 'C₂H₄O',
      structure: 'CC=O',
      functionalGroups: ['aldehyde'],
      difficulty: 3,
      category: 'aldehyde'
    },
    {
      name: 'propanal',
      iupacName: 'propanal',
      formula: 'C₃H₆O',
      structure: 'CCC=O',
      functionalGroups: ['aldehyde'],
      difficulty: 3,
      category: 'aldehyde'
    },
    {
      name: 'butanal',
      iupacName: 'butanal',
      formula: 'C₄H₈O',
      structure: 'CCCC=O',
      functionalGroups: ['aldehyde'],
      difficulty: 3,
      category: 'aldehyde'
    },
    {
      name: '2-methylpropanal',
      iupacName: '2-methylpropanal',
      formula: 'C₄H₈O',
      structure: 'CC(C)C=O',
      functionalGroups: ['aldehyde'],
      difficulty: 4,
      category: 'aldehyde'
    },

    // Ketones (Difficulty 3-4)
    {
      name: 'propanone',
      iupacName: 'propanone',
      formula: 'C₃H₆O',
      structure: 'CC(=O)C',
      functionalGroups: ['ketone'],
      difficulty: 3,
      category: 'ketone'
    },
    {
      name: 'butanone',
      iupacName: 'butanone',
      formula: 'C₄H₈O',
      structure: 'CCC(=O)C',
      functionalGroups: ['ketone'],
      difficulty: 3,
      category: 'ketone'
    },
    {
      name: 'pentan-2-one',
      iupacName: 'pentan-2-one',
      formula: 'C₅H₁₀O',
      structure: 'CCCC(=O)C',
      functionalGroups: ['ketone'],
      difficulty: 4,
      category: 'ketone'
    },
    {
      name: 'pentan-3-one',
      iupacName: 'pentan-3-one',
      formula: 'C₅H₁₀O',
      structure: 'CCC(=O)CC',
      functionalGroups: ['ketone'],
      difficulty: 4,
      category: 'ketone'
    },

    // Carboxylic acids (Difficulty 4-5)
    {
      name: 'methanoic acid',
      iupacName: 'methanoic acid',
      formula: 'CH₂O₂',
      structure: 'C(=O)O',
      functionalGroups: ['carboxylic_acid'],
      difficulty: 4,
      category: 'carboxylic_acid'
    },
    {
      name: 'ethanoic acid',
      iupacName: 'ethanoic acid',
      formula: 'C₂H₄O₂',
      structure: 'CC(=O)O',
      functionalGroups: ['carboxylic_acid'],
      difficulty: 4,
      category: 'carboxylic_acid'
    },
    {
      name: 'propanoic acid',
      iupacName: 'propanoic acid',
      formula: 'C₃H₆O₂',
      structure: 'CCC(=O)O',
      functionalGroups: ['carboxylic_acid'],
      difficulty: 4,
      category: 'carboxylic_acid'
    },
    {
      name: 'butanoic acid',
      iupacName: 'butanoic acid',
      formula: 'C₄H₈O₂',
      structure: 'CCCC(=O)O',
      functionalGroups: ['carboxylic_acid'],
      difficulty: 4,
      category: 'carboxylic_acid'
    },
    {
      name: '2-methylpropanoic acid',
      iupacName: '2-methylpropanoic acid',
      formula: 'C₄H₈O₂',
      structure: 'CC(C)C(=O)O',
      functionalGroups: ['carboxylic_acid'],
      difficulty: 5,
      category: 'carboxylic_acid'
    },

    // Esters (Difficulty 4-5)
    {
      name: 'methyl methanoate',
      iupacName: 'methyl methanoate',
      formula: 'C₂H₄O₂',
      structure: 'COC=O',
      functionalGroups: ['ester'],
      difficulty: 4,
      category: 'ester'
    },
    {
      name: 'ethyl ethanoate',
      iupacName: 'ethyl ethanoate',
      formula: 'C₄H₈O₂',
      structure: 'CCOC(=O)C',
      functionalGroups: ['ester'],
      difficulty: 4,
      category: 'ester'
    },
    {
      name: 'methyl propanoate',
      iupacName: 'methyl propanoate',
      formula: 'C₄H₈O₂',
      structure: 'COC(=O)CC',
      functionalGroups: ['ester'],
      difficulty: 5,
      category: 'ester'
    },
    {
      name: 'propyl ethanoate',
      iupacName: 'propyl ethanoate',
      formula: 'C₅H₁₀O₂',
      structure: 'CCCOC(=O)C',
      functionalGroups: ['ester'],
      difficulty: 5,
      category: 'ester'
    },

    // Aromatic compounds (Difficulty 5)
    {
      name: 'benzene',
      iupacName: 'benzene',
      formula: 'C₆H₆',
      structure: 'c1ccccc1',
      functionalGroups: ['aromatic'],
      difficulty: 5,
      category: 'aromatic'
    },
    {
      name: 'methylbenzene',
      iupacName: 'methylbenzene',
      formula: 'C₇H₈',
      structure: 'Cc1ccccc1',
      functionalGroups: ['aromatic'],
      difficulty: 5,
      category: 'aromatic'
    },
    {
      name: 'phenol',
      iupacName: 'phenol',
      formula: 'C₆H₆O',
      structure: 'Oc1ccccc1',
      functionalGroups: ['aromatic', 'alcohol'],
      difficulty: 5,
      category: 'aromatic'
    }
  ];

  async getChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    
    // Generate IUPAC naming challenges
    for (let i = 0; i < this.sampleMolecules.length; i++) {
      const molecule = this.sampleMolecules[i];
      const challenge = await this.generateNamingChallenge(molecule);
      challenges.push(challenge);
    }

    // Generate mechanism challenges
    for (let i = 0; i < this.sampleMechanisms.length; i++) {
      const mechanism = this.sampleMechanisms[i];
      const challenge = await this.generateMechanismChallenge(mechanism);
      challenges.push(challenge);
    }

    // Generate isomer challenges
    for (let i = 0; i < this.sampleIsomerSets.length; i++) {
      const isomerSet = this.sampleIsomerSets[i];
      const challenge = await this.generateIsomerChallenge(isomerSet);
      challenges.push(challenge);
    }

    return challenges;
  }

  async generateChallenge(difficulty: number): Promise<Challenge> {
    // Randomly choose between naming, mechanism, and isomer challenges
    const rand = Math.random();
    const challengeType = rand < 0.33 ? 'naming' : rand < 0.66 ? 'mechanism' : 'isomer';
    
    if (challengeType === 'naming') {
      // Filter molecules by difficulty
      const suitableMolecules = this.sampleMolecules.filter(mol => mol.difficulty === difficulty);
      
      if (suitableMolecules.length === 0) {
        // Fallback to closest difficulty
        const closestMolecules = this.sampleMolecules.filter(mol => 
          Math.abs(mol.difficulty - difficulty) <= 1
        );
        const randomMolecule = closestMolecules[Math.floor(Math.random() * closestMolecules.length)];
        return this.generateNamingChallenge(randomMolecule);
      }

      const randomMolecule = suitableMolecules[Math.floor(Math.random() * suitableMolecules.length)];
      return this.generateNamingChallenge(randomMolecule);
    } else if (challengeType === 'mechanism') {
      // Filter mechanisms by difficulty
      const suitableMechanisms = this.sampleMechanisms.filter(mech => mech.difficulty === difficulty);
      
      if (suitableMechanisms.length === 0) {
        // Fallback to closest difficulty
        const closestMechanisms = this.sampleMechanisms.filter(mech => 
          Math.abs(mech.difficulty - difficulty) <= 1
        );
        const randomMechanism = closestMechanisms[Math.floor(Math.random() * closestMechanisms.length)];
        return this.generateMechanismChallenge(randomMechanism);
      }

      const randomMechanism = suitableMechanisms[Math.floor(Math.random() * suitableMechanisms.length)];
      return this.generateMechanismChallenge(randomMechanism);
    } else {
      // Filter isomer sets by difficulty
      const suitableIsomerSets = this.sampleIsomerSets.filter(set => set.difficulty === difficulty);
      
      if (suitableIsomerSets.length === 0) {
        // Fallback to closest difficulty
        const closestIsomerSets = this.sampleIsomerSets.filter(set => 
          Math.abs(set.difficulty - difficulty) <= 1
        );
        const randomIsomerSet = closestIsomerSets[Math.floor(Math.random() * closestIsomerSets.length)];
        return this.generateIsomerChallenge(randomIsomerSet);
      }

      const randomIsomerSet = suitableIsomerSets[Math.floor(Math.random() * suitableIsomerSets.length)];
      return this.generateIsomerChallenge(randomIsomerSet);
    }
  }

  private async generateNamingChallenge(molecule: OrganicMolecule): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.ORGANIC_NAMING,
      molecule.difficulty,
      `Name the Organic Molecule`,
      `Provide the correct IUPAC name for this ${molecule.category} compound.`
    );

    const content: ChallengeContent = {
      question: `What is the IUPAC name of the following organic compound?\n\nMolecular Formula: ${molecule.formula}\nStructure: ${molecule.structure}`,
      correctAnswer: molecule.iupacName,
      explanation: `The correct IUPAC name is "${molecule.iupacName}". This is a ${molecule.category} compound with the molecular formula ${molecule.formula}.`,
      hints: [
        `This is a ${molecule.category} compound`,
        `Look for the longest carbon chain`,
        `Number the carbons to give functional groups the lowest numbers`,
        `Remember the naming rules for ${molecule.category} compounds`
      ],
      visualAids: [
        {
          type: 'molecular_structure',
          url: `/images/molecules/${molecule.name.replace(/\s+/g, '_')}.png`,
          altText: `Structural diagram of ${molecule.name}`,
          interactive: true
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: Math.max(30, molecule.difficulty * 15), // 30-75 seconds based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['IUPAC naming', 'organic chemistry', molecule.category, ...molecule.functionalGroups],
        curriculumStandards: ['A-Level Chemistry', 'Organic Chemistry'],
        gameData: {
          molecule,
          vineStrangulationTime: Math.max(20, molecule.difficulty * 10)
        }
      }
    } as Challenge;
  }

  private async generateMechanismChallenge(mechanism: ReactionMechanism): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.MECHANISM,
      mechanism.difficulty,
      `Mechanism Archery: ${mechanism.name}`,
      `Show the electron movement for this ${mechanism.type} reaction mechanism.`
    );

    const content: ChallengeContent = {
      question: `Draw the electron movement arrows for the following ${mechanism.type} reaction:\n\n${mechanism.reactants.join(' + ')} → ${mechanism.products.join(' + ')}`,
      correctAnswer: JSON.stringify(mechanism.steps.map(step => step.electronMovement)),
      explanation: `This is a ${mechanism.type} mechanism. ${mechanism.steps.map((step, i) => 
        `Step ${step.stepNumber}: ${step.description}`
      ).join(' ')}`,
      hints: [
        `This is a ${mechanism.type} reaction`,
        `Look for the ${mechanism.type === 'SN2' ? 'backside attack' : mechanism.type === 'SN1' ? 'carbocation intermediate' : 'key intermediate'}`,
        `Consider the stereochemistry and regioselectivity`,
        `Remember the electron flow direction`
      ],
      visualAids: [
        {
          type: 'diagram',
          url: `/images/mechanisms/${mechanism.type.toLowerCase()}_${mechanism.name.replace(/\s+/g, '_')}.png`,
          altText: `Reaction mechanism diagram for ${mechanism.name}`,
          interactive: true
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: Math.max(90, mechanism.difficulty * 30), // 90-150 seconds based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['reaction mechanisms', mechanism.type, 'electron movement', 'organic chemistry'],
        curriculumStandards: ['A-Level Chemistry', 'Organic Chemistry'],
        gameData: {
          mechanism,
          targetAccuracy: 0.8, // 80% accuracy required for full points
          allowedMisses: Math.max(1, Math.floor(mechanism.steps.length / 2))
        }
      }
    } as Challenge;
  }

  private async generateIsomerChallenge(isomerSet: IsomerSet): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.ISOMER_IDENTIFICATION,
      isomerSet.difficulty,
      `Isomer Zoo: ${isomerSet.category} Isomers`,
      `Catch and categorize the floating ${isomerSet.category} isomers with formula ${isomerSet.baseFormula}.`
    );

    // Create the challenge where user needs to categorize isomers
    const shuffledIsomers = [...isomerSet.isomers].sort(() => Math.random() - 0.5);
    
    const content: ChallengeContent = {
      question: `Categorize these isomers with molecular formula ${isomerSet.baseFormula}:\n\n${shuffledIsomers.map((isomer, i) => 
        `${i + 1}. ${isomer.name}: ${isomer.structure}`
      ).join('\n')}`,
      correctAnswer: JSON.stringify(shuffledIsomers.map(isomer => ({
        name: isomer.name,
        category: isomerSet.category,
        type: isomer.type
      }))),
      explanation: `These are ${isomerSet.category} isomers of ${isomerSet.baseFormula}. ${shuffledIsomers.map(isomer => 
        `${isomer.name} is a ${isomer.type} with properties: ${isomer.properties.join(', ')}`
      ).join('. ')}`,
      hints: [
        `These are ${isomerSet.category} isomers`,
        `Look for differences in ${isomerSet.category === 'structural' ? 'connectivity' : 'spatial arrangement'}`,
        `Consider the ${isomerSet.category === 'enantiomer' ? 'stereochemistry' : 'molecular structure'}`,
        `All molecules have the same molecular formula: ${isomerSet.baseFormula}`
      ],
      visualAids: [
        {
          type: 'molecular_structure',
          url: `/images/isomers/${isomerSet.category}_${isomerSet.baseFormula.replace(/[₀-₉]/g, '')}.png`,
          altText: `${isomerSet.category} isomers of ${isomerSet.baseFormula}`,
          interactive: true
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: Math.max(120, isomerSet.difficulty * 40), // 120-200 seconds based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['isomers', isomerSet.category, 'stereochemistry', 'molecular structure'],
        curriculumStandards: ['A-Level Chemistry', 'Organic Chemistry'],
        gameData: {
          isomerSet,
          floatingSpeed: 2, // pixels per frame
          netSize: 50, // net radius in pixels
          requiredAccuracy: 0.8 // 80% correct categorization required
        }
      }
    } as Challenge;
  }

  async validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (challenge.type === ChallengeType.ORGANIC_NAMING) {
      return this.validateNamingAnswer(challenge, answer);
    } else if (challenge.type === ChallengeType.MECHANISM) {
      return this.validateMechanismAnswer(challenge, answer);
    } else if (challenge.type === ChallengeType.ISOMER_IDENTIFICATION) {
      return this.validateIsomerAnswer(challenge, answer);
    }
    
    return {
      isCorrect: false,
      score: 0,
      feedback: "Unknown challenge type",
      explanation: "This challenge type is not supported"
    };
  }

  private async validateNamingAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (!this.validateAnswerFormat(answer, 'string')) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide the IUPAC name as text",
        explanation: "Answer should be a valid IUPAC name"
      };
    }

    const userAnswer = (answer.response as string).toLowerCase().trim();
    const correctAnswer = (challenge.content.correctAnswer as string).toLowerCase().trim();

    // Check for exact match
    const isExactMatch = userAnswer === correctAnswer;
    
    // Check for common acceptable variations
    const acceptableVariations = this.getAcceptableVariations(correctAnswer);
    const isAcceptableVariation = acceptableVariations.some(variation => 
      userAnswer === variation.toLowerCase()
    );

    const isCorrect = isExactMatch || isAcceptableVariation;
    
    let partialCredit = 0;
    if (!isCorrect) {
      // Calculate partial credit based on similarity
      partialCredit = this.calculateNameSimilarity(userAnswer, correctAnswer);
    }

    const score = this.calculateBaseScore(isCorrect, challenge.difficulty, partialCredit);
    
    return {
      isCorrect,
      score,
      partialCredit,
      feedback: isCorrect 
        ? "Excellent! You've named the molecule correctly!" 
        : `Not quite right. The correct IUPAC name is "${challenge.content.correctAnswer}".`,
      explanation: challenge.content.explanation
    };
  }

  private async validateMechanismAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (!answer.response || typeof answer.response !== 'object') {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please draw the electron movement arrows",
        explanation: "Answer should contain electron movement data"
      };
    }

    try {
      const userArrows = answer.response as any; // Array of electron movements
      const correctArrows = JSON.parse(challenge.content.correctAnswer as string);
      
      // Calculate accuracy based on correct arrow placements
      const accuracy = this.calculateMechanismAccuracy(userArrows, correctArrows);
      const targetAccuracy = challenge.metadata?.gameData?.targetAccuracy || 0.8;
      
      const isCorrect = accuracy >= targetAccuracy;
      const partialCredit = accuracy;
      
      const score = this.calculateBaseScore(isCorrect, challenge.difficulty, partialCredit);
      
      return {
        isCorrect,
        score,
        partialCredit,
        feedback: isCorrect 
          ? `Excellent archery! You hit ${Math.round(accuracy * 100)}% of your targets!` 
          : `Good attempt! You hit ${Math.round(accuracy * 100)}% of targets. Need ${Math.round(targetAccuracy * 100)}% for full credit.`,
        explanation: challenge.content.explanation
      };
    } catch (error) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Invalid mechanism data format",
        explanation: "Please ensure your electron arrows are properly formatted"
      };
    }
  }

  private async validateIsomerAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (!answer.response || typeof answer.response !== 'object') {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please categorize the isomers by dragging them to the correct nets",
        explanation: "Answer should contain isomer categorization data"
      };
    }

    try {
      const userCategorizations = answer.response as any; // Array of {name, category, type}
      const correctCategorizations = JSON.parse(challenge.content.correctAnswer as string);
      
      // Calculate accuracy based on correct categorizations
      const accuracy = this.calculateIsomerAccuracy(userCategorizations, correctCategorizations);
      const requiredAccuracy = challenge.metadata?.gameData?.requiredAccuracy || 0.8;
      
      const isCorrect = accuracy >= requiredAccuracy;
      const partialCredit = accuracy;
      
      const score = this.calculateBaseScore(isCorrect, challenge.difficulty, partialCredit);
      
      return {
        isCorrect,
        score,
        partialCredit,
        feedback: isCorrect 
          ? `Excellent zoo keeping! You correctly categorized ${Math.round(accuracy * 100)}% of the isomers!` 
          : `Good attempt! You categorized ${Math.round(accuracy * 100)}% correctly. Need ${Math.round(requiredAccuracy * 100)}% for full credit.`,
        explanation: challenge.content.explanation
      };
    } catch (error) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Invalid isomer categorization data format",
        explanation: "Please ensure your isomer categorizations are properly formatted"
      };
    }
  }

  calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number {
    const baseScore = this.calculateBaseScore(true, challenge.difficulty);
    
    // Time bonus calculation - reward speed
    const timeLimit = challenge.timeLimit || 60;
    const timeBonus = Math.max(0, (timeLimit - timeElapsed) / timeLimit * 0.4);
    
    // Hint penalty
    const hintPenalty = answer.hintsUsed * 0.1;
    
    const finalScore = Math.floor(baseScore * (1 + timeBonus - hintPenalty));
    return Math.max(0, finalScore);
  }

  getSpecialMechanics(): RealmMechanic[] {
    return [
      {
        id: 'vine_strangulation',
        name: 'Vine Strangulation',
        description: 'Vines slowly strangle you if you take too long to name molecules',
        parameters: {
          strangulationRate: 5, // HP loss per second after time limit
          warningTime: 10, // seconds before strangulation starts
          visualEffect: 'growing_vines'
        }
      },
      {
        id: 'naming_streak',
        name: 'Naming Streak',
        description: 'Build up naming streaks for bonus points',
        parameters: {
          streakMultiplier: 1.2,
          maxStreakBonus: 3.0,
          streakResetOnError: true
        }
      },
      {
        id: 'molecular_visualization',
        name: 'Interactive Molecules',
        description: 'Rotate and examine 3D molecular structures',
        parameters: {
          rotationEnabled: true,
          zoomEnabled: true,
          highlightFunctionalGroups: true
        }
      },
      {
        id: 'electron_archery',
        name: 'Electron Archery',
        description: 'Shoot arrows to show electron movement in reaction mechanisms',
        parameters: {
          arrowAccuracy: 0.8, // Required accuracy for full points
          maxMisses: 3, // Maximum missed arrows before penalty
          timeBonus: true, // Bonus for quick accurate shots
          visualFeedback: 'arrow_trails'
        }
      },
      {
        id: 'mechanism_progression',
        name: 'Step-by-Step Mechanisms',
        description: 'Progress through reaction mechanisms step by step',
        parameters: {
          stepValidation: true,
          intermediateVisualization: true,
          hintSystem: true,
          replayMode: true
        }
      },
      {
        id: 'floating_molecules',
        name: 'Floating Molecular Structures',
        description: 'Catch floating molecular isomers with nets',
        parameters: {
          floatingSpeed: 2, // pixels per frame
          moleculeCount: 6, // number of floating molecules
          netSize: 50, // net radius in pixels
          gravityEffect: false // molecules float freely
        }
      },
      {
        id: 'categorization_nets',
        name: 'Isomer Categorization Nets',
        description: 'Drag molecules into correct category nets',
        parameters: {
          netTypes: ['structural', 'stereoisomer', 'enantiomer', 'diastereomer', 'conformational'],
          dragAndDrop: true,
          visualFeedback: true,
          autoValidation: true
        }
      },
      {
        id: 'elixir_unlock',
        name: 'Elixir of Clarity Unlock',
        description: 'Unlock animated reaction pathways upon mastery',
        parameters: {
          requiredAccuracy: 0.9, // 90% accuracy to unlock
          animatedPathways: true,
          reactionLibrary: true,
          expertCommentary: true
        }
      }
    ];
  }

  async processBossChallenge(userId: string, bossId: string): Promise<BossResult> {
    // This will be implemented in later subtasks
    throw new Error(`Boss challenges not yet implemented for Forest of Isomers`);
  }

  // Utility methods for mechanism validation
  private calculateMechanismAccuracy(userArrows: any[], correctArrows: any[]): number {
    if (!Array.isArray(userArrows) || !Array.isArray(correctArrows)) {
      return 0;
    }

    if (correctArrows.length === 0) {
      return userArrows.length === 0 ? 1 : 0;
    }

    let correctCount = 0;
    const tolerance = 20; // Pixel tolerance for arrow positioning

    // Flatten the correct arrows from all steps
    const allCorrectArrows = correctArrows.flat();

    for (const userArrow of userArrows) {
      for (const correctArrow of allCorrectArrows) {
        if (this.arrowsMatch(userArrow, correctArrow, tolerance)) {
          correctCount++;
          break; // Each user arrow can only match one correct arrow
        }
      }
    }

    // Calculate accuracy as (correct arrows / total expected arrows)
    // Penalize for extra arrows
    const accuracy = correctCount / allCorrectArrows.length;
    const extraArrowPenalty = Math.max(0, userArrows.length - allCorrectArrows.length) * 0.1;
    
    return Math.max(0, accuracy - extraArrowPenalty);
  }

  private arrowsMatch(userArrow: any, correctArrow: any, tolerance: number): boolean {
    if (!userArrow || !correctArrow) return false;
    
    // Check if arrow types match
    if (userArrow.type !== correctArrow.type) return false;
    
    // Check if positions are within tolerance
    const fromMatch = this.positionsMatch(userArrow.from?.position, correctArrow.from?.position, tolerance);
    const toMatch = this.positionsMatch(userArrow.to?.position, correctArrow.to?.position, tolerance);
    
    return fromMatch && toMatch;
  }

  private positionsMatch(pos1: [number, number], pos2: [number, number], tolerance: number): boolean {
    if (!pos1 || !pos2) return false;
    
    const dx = Math.abs(pos1[0] - pos2[0]);
    const dy = Math.abs(pos1[1] - pos2[1]);
    
    return dx <= tolerance && dy <= tolerance;
  }

  // Utility methods for isomer validation
  private calculateIsomerAccuracy(userCategorizations: any[], correctCategorizations: any[]): number {
    if (!Array.isArray(userCategorizations) || !Array.isArray(correctCategorizations)) {
      return 0;
    }

    if (correctCategorizations.length === 0) {
      return userCategorizations.length === 0 ? 1 : 0;
    }

    let correctCount = 0;

    for (const userCat of userCategorizations) {
      for (const correctCat of correctCategorizations) {
        if (this.categorizationsMatch(userCat, correctCat)) {
          correctCount++;
          break; // Each user categorization can only match one correct categorization
        }
      }
    }

    // Calculate accuracy as (correct categorizations / total expected categorizations)
    const accuracy = correctCount / correctCategorizations.length;
    
    return Math.max(0, accuracy);
  }

  private categorizationsMatch(userCat: any, correctCat: any): boolean {
    if (!userCat || !correctCat) return false;
    
    // Check if names match (case insensitive)
    const nameMatch = userCat.name?.toLowerCase() === correctCat.name?.toLowerCase();
    
    // Check if categories match (case insensitive)
    const categoryMatch = userCat.category?.toLowerCase() === correctCat.category?.toLowerCase();
    
    // For full credit, both name and category must match
    // For partial credit, just category matching could be considered
    return nameMatch && categoryMatch;
  }

  // Utility methods for naming validation
  private getAcceptableVariations(iupacName: string): string[] {
    const variations: string[] = [iupacName];
    
    // Add common variations (e.g., with/without hyphens, spaces)
    variations.push(iupacName.replace(/-/g, ''));
    variations.push(iupacName.replace(/-/g, ' '));
    variations.push(iupacName.replace(/\s+/g, ''));
    
    return [...new Set(variations)]; // Remove duplicates
  }

  private calculateNameSimilarity(userAnswer: string, correctAnswer: string): number {
    // Simple similarity calculation based on common characters
    const userChars = userAnswer.split('');
    const correctChars = correctAnswer.split('');
    
    let matches = 0;
    const maxLength = Math.max(userAnswer.length, correctAnswer.length);
    
    for (let i = 0; i < Math.min(userAnswer.length, correctAnswer.length); i++) {
      if (userChars[i] === correctChars[i]) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }

  protected getSpecialRewards(): Reward[] {
    return [
      {
        type: 'badge' as const,
        itemId: 'organic_apprentice',
        description: 'Organic Chemistry Apprentice Badge'
      },
      {
        type: 'unlock' as const,
        itemId: 'elixir_of_clarity',
        description: 'Elixir of Clarity - Animated Reaction Pathways'
      }
    ];
  }
}