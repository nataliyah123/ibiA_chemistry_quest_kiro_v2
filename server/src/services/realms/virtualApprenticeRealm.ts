import { RealmComponent, RealmMechanic } from '../realmComponent';
import { 
  Challenge, 
  Answer, 
  ValidationResult, 
  BossResult,
  ChallengeType,
  ChallengeContent,
  Reward
} from '../../types/game';

// Lab procedure interfaces
export interface LabProcedure {
  id: string;
  name: string;
  description: string;
  steps: ProcedureStep[];
  difficulty: number;
  category: string;
  timeLimit: number;
  safetyNotes: string[];
}

export interface ProcedureStep {
  id: string;
  order: number;
  description: string;
  isRequired: boolean;
  safetyLevel: 'low' | 'medium' | 'high';
  equipment: string[];
  chemicals: string[];
}

export interface StepByStepChallenge extends Challenge {
  content: ChallengeContent & {
    procedure: LabProcedure;
    shuffledSteps: ProcedureStep[];
    correctOrder: number[];
  };
}

export class VirtualApprenticeRealm extends RealmComponent {
  realmId = 'virtual-apprentice';
  name = 'Virtual Apprentice';
  description = 'Master laboratory techniques through virtual simulations and step-by-step procedures';
  requiredLevel = 3;

  private sampleSaltProcedures: Array<{
    id: string;
    name: string;
    description: string;
    steps: Array<{
      id: string;
      order: number;
      description: string;
      action: string;
      isRequired: boolean;
      timeBonus: number;
      equipment: string[];
      chemicals: string[];
    }>;
    difficulty: number;
    timeLimit: number;
    expectedProducts: string[];
    safetyNotes: string[];
  }> = [
    {
      id: 'sodium_chloride_prep',
      name: 'Sodium Chloride Preparation',
      description: 'Prepare pure sodium chloride by neutralizing hydrochloric acid with sodium hydroxide',
      difficulty: 1,
      timeLimit: 300,
      expectedProducts: ['NaCl', 'H₂O'],
      safetyNotes: [
        'Wear safety goggles and gloves',
        'Handle acids and bases with care',
        'Work in well-ventilated area'
      ],
      steps: [
        {
          id: 'measure_acid',
          order: 1,
          description: 'Measure 25.0 cm³ of 0.1 M HCl using a measuring cylinder',
          action: 'Measure HCl solution',
          isRequired: true,
          timeBonus: 20,
          equipment: ['measuring_cylinder', 'beaker'],
          chemicals: ['HCl_0.1M']
        },
        {
          id: 'add_indicator',
          order: 2,
          description: 'Add 2-3 drops of universal indicator to the acid',
          action: 'Add indicator',
          isRequired: true,
          timeBonus: 15,
          equipment: ['dropper_bottle'],
          chemicals: ['universal_indicator']
        },
        {
          id: 'titrate_base',
          order: 3,
          description: 'Slowly add 0.1 M NaOH until the solution turns green (neutral)',
          action: 'Neutralize with NaOH',
          isRequired: true,
          timeBonus: 25,
          equipment: ['burette', 'conical_flask'],
          chemicals: ['NaOH_0.1M']
        },
        {
          id: 'evaporate_water',
          order: 4,
          description: 'Gently heat the solution to evaporate water and crystallize salt',
          action: 'Evaporate to crystallize',
          isRequired: true,
          timeBonus: 30,
          equipment: ['evaporating_dish', 'bunsen_burner', 'tripod'],
          chemicals: []
        },
        {
          id: 'collect_crystals',
          order: 5,
          description: 'Allow to cool and collect the white sodium chloride crystals',
          action: 'Collect salt crystals',
          isRequired: true,
          timeBonus: 10,
          equipment: ['spatula', 'watch_glass'],
          chemicals: []
        }
      ]
    },
    {
      id: 'copper_sulfate_prep',
      name: 'Copper Sulfate Preparation',
      description: 'Prepare copper sulfate by reacting copper oxide with sulfuric acid',
      difficulty: 2,
      timeLimit: 400,
      expectedProducts: ['CuSO₄·5H₂O'],
      safetyNotes: [
        'Handle sulfuric acid with extreme care',
        'Use fume cupboard when heating',
        'Wear protective equipment at all times'
      ],
      steps: [
        {
          id: 'measure_copper_oxide',
          order: 1,
          description: 'Weigh 2.0 g of copper oxide using an analytical balance',
          action: 'Weigh copper oxide',
          isRequired: true,
          timeBonus: 15,
          equipment: ['analytical_balance', 'weighing_boat'],
          chemicals: ['CuO']
        },
        {
          id: 'add_sulfuric_acid',
          order: 2,
          description: 'Add 25 cm³ of dilute sulfuric acid to a beaker',
          action: 'Add sulfuric acid',
          isRequired: true,
          timeBonus: 20,
          equipment: ['beaker', 'measuring_cylinder'],
          chemicals: ['H2SO4_dilute']
        },
        {
          id: 'heat_mixture',
          order: 3,
          description: 'Heat the mixture gently while stirring until copper oxide dissolves',
          action: 'Heat and dissolve',
          isRequired: true,
          timeBonus: 35,
          equipment: ['bunsen_burner', 'tripod', 'gauze', 'stirring_rod'],
          chemicals: []
        },
        {
          id: 'filter_excess',
          order: 4,
          description: 'Filter to remove any unreacted copper oxide',
          action: 'Filter solution',
          isRequired: true,
          timeBonus: 25,
          equipment: ['filter_paper', 'funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'evaporate_partially',
          order: 5,
          description: 'Evaporate about half the water by gentle heating',
          action: 'Concentrate solution',
          isRequired: true,
          timeBonus: 40,
          equipment: ['evaporating_dish', 'bunsen_burner'],
          chemicals: []
        },
        {
          id: 'cool_crystallize',
          order: 6,
          description: 'Allow to cool slowly to form blue copper sulfate crystals',
          action: 'Cool and crystallize',
          isRequired: true,
          timeBonus: 20,
          equipment: ['crystallizing_dish'],
          chemicals: []
        },
        {
          id: 'collect_dry',
          order: 7,
          description: 'Filter and dry the crystals between filter papers',
          action: 'Collect and dry crystals',
          isRequired: true,
          timeBonus: 15,
          equipment: ['filter_paper', 'funnel'],
          chemicals: []
        }
      ]
    },
    {
      id: 'magnesium_sulfate_prep',
      name: 'Magnesium Sulfate Preparation',
      description: 'Prepare magnesium sulfate by reacting magnesium with sulfuric acid',
      difficulty: 2,
      timeLimit: 350,
      expectedProducts: ['MgSO₄·7H₂O', 'H₂'],
      safetyNotes: [
        'Hydrogen gas is produced - avoid flames',
        'Reaction may be vigorous - add magnesium slowly',
        'Ensure good ventilation'
      ],
      steps: [
        {
          id: 'measure_acid_mg',
          order: 1,
          description: 'Measure 30 cm³ of dilute sulfuric acid into a beaker',
          action: 'Measure sulfuric acid',
          isRequired: true,
          timeBonus: 15,
          equipment: ['measuring_cylinder', 'beaker'],
          chemicals: ['H2SO4_dilute']
        },
        {
          id: 'add_magnesium',
          order: 2,
          description: 'Add magnesium ribbon slowly until no more dissolves',
          action: 'Add magnesium ribbon',
          isRequired: true,
          timeBonus: 30,
          equipment: ['tongs', 'magnesium_ribbon'],
          chemicals: ['Mg']
        },
        {
          id: 'test_complete_reaction',
          order: 3,
          description: 'Test that reaction is complete by adding more magnesium',
          action: 'Test reaction completion',
          isRequired: true,
          timeBonus: 20,
          equipment: ['magnesium_ribbon'],
          chemicals: ['Mg']
        },
        {
          id: 'filter_unreacted',
          order: 4,
          description: 'Filter to remove any unreacted magnesium',
          action: 'Filter excess magnesium',
          isRequired: true,
          timeBonus: 25,
          equipment: ['filter_paper', 'funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'evaporate_solution',
          order: 5,
          description: 'Evaporate the solution until crystals start to form',
          action: 'Evaporate to crystallize',
          isRequired: true,
          timeBonus: 35,
          equipment: ['evaporating_dish', 'bunsen_burner'],
          chemicals: []
        },
        {
          id: 'cool_collect',
          order: 6,
          description: 'Cool and collect the white magnesium sulfate crystals',
          action: 'Cool and collect',
          isRequired: true,
          timeBonus: 15,
          equipment: ['spatula', 'filter_paper'],
          chemicals: []
        }
      ]
    },
    {
      id: 'zinc_chloride_prep',
      name: 'Zinc Chloride Preparation',
      description: 'Prepare zinc chloride by reacting zinc with hydrochloric acid',
      difficulty: 2,
      timeLimit: 320,
      expectedProducts: ['ZnCl₂', 'H₂'],
      safetyNotes: [
        'Hydrogen gas evolved - no naked flames',
        'Use fume cupboard for good ventilation',
        'Add zinc gradually to control reaction rate'
      ],
      steps: [
        {
          id: 'measure_hcl',
          order: 1,
          description: 'Measure 25 cm³ of dilute hydrochloric acid',
          action: 'Measure HCl',
          isRequired: true,
          timeBonus: 15,
          equipment: ['measuring_cylinder', 'beaker'],
          chemicals: ['HCl_dilute']
        },
        {
          id: 'add_zinc_granules',
          order: 2,
          description: 'Add zinc granules gradually until effervescence stops',
          action: 'Add zinc granules',
          isRequired: true,
          timeBonus: 30,
          equipment: ['spatula'],
          chemicals: ['Zn_granules']
        },
        {
          id: 'ensure_excess_zinc',
          order: 3,
          description: 'Ensure excess zinc is present to consume all acid',
          action: 'Check for excess zinc',
          isRequired: true,
          timeBonus: 20,
          equipment: ['spatula'],
          chemicals: ['Zn_granules']
        },
        {
          id: 'filter_solution',
          order: 4,
          description: 'Filter to remove unreacted zinc',
          action: 'Filter unreacted zinc',
          isRequired: true,
          timeBonus: 25,
          equipment: ['filter_paper', 'funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'evaporate_concentrate',
          order: 5,
          description: 'Evaporate the solution to concentrate it',
          action: 'Concentrate solution',
          isRequired: true,
          timeBonus: 35,
          equipment: ['evaporating_dish', 'bunsen_burner'],
          chemicals: []
        },
        {
          id: 'crystallize_product',
          order: 6,
          description: 'Allow to cool and crystallize zinc chloride',
          action: 'Crystallize product',
          isRequired: true,
          timeBonus: 20,
          equipment: ['crystallizing_dish'],
          chemicals: []
        }
      ]
    },
    {
      id: 'iron_sulfate_prep',
      name: 'Iron(II) Sulfate Preparation',
      description: 'Prepare iron(II) sulfate by reacting iron with sulfuric acid',
      difficulty: 3,
      timeLimit: 380,
      expectedProducts: ['FeSO₄·7H₂O', 'H₂'],
      safetyNotes: [
        'Iron(II) compounds oxidize easily - work quickly',
        'Hydrogen gas produced - avoid ignition sources',
        'Use freshly prepared iron filings'
      ],
      steps: [
        {
          id: 'prepare_iron',
          order: 1,
          description: 'Clean iron filings with sandpaper to remove oxide layer',
          action: 'Clean iron filings',
          isRequired: true,
          timeBonus: 20,
          equipment: ['sandpaper', 'iron_filings'],
          chemicals: ['Fe']
        },
        {
          id: 'measure_acid_fe',
          order: 2,
          description: 'Measure 30 cm³ of dilute sulfuric acid',
          action: 'Measure sulfuric acid',
          isRequired: true,
          timeBonus: 15,
          equipment: ['measuring_cylinder', 'beaker'],
          chemicals: ['H2SO4_dilute']
        },
        {
          id: 'add_iron_slowly',
          order: 3,
          description: 'Add iron filings slowly to control the reaction',
          action: 'Add iron filings',
          isRequired: true,
          timeBonus: 35,
          equipment: ['spatula'],
          chemicals: ['Fe']
        },
        {
          id: 'heat_gently',
          order: 4,
          description: 'Heat gently to speed up the reaction if needed',
          action: 'Heat if necessary',
          isRequired: false,
          timeBonus: 25,
          equipment: ['bunsen_burner', 'tripod'],
          chemicals: []
        },
        {
          id: 'filter_excess_iron',
          order: 5,
          description: 'Filter to remove unreacted iron',
          action: 'Filter excess iron',
          isRequired: true,
          timeBonus: 25,
          equipment: ['filter_paper', 'funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'evaporate_quickly',
          order: 6,
          description: 'Evaporate quickly to prevent oxidation to iron(III)',
          action: 'Evaporate rapidly',
          isRequired: true,
          timeBonus: 40,
          equipment: ['evaporating_dish', 'bunsen_burner'],
          chemicals: []
        },
        {
          id: 'collect_green_crystals',
          order: 7,
          description: 'Collect the pale green iron(II) sulfate crystals',
          action: 'Collect crystals',
          isRequired: true,
          timeBonus: 15,
          equipment: ['spatula', 'filter_paper'],
          chemicals: []
        }
      ]
    },
    {
      id: 'calcium_chloride_prep',
      name: 'Calcium Chloride Preparation',
      description: 'Prepare calcium chloride by reacting calcium carbonate with hydrochloric acid',
      difficulty: 3,
      timeLimit: 420,
      expectedProducts: ['CaCl₂·6H₂O', 'CO₂', 'H₂O'],
      safetyNotes: [
        'Carbon dioxide gas evolved - ensure ventilation',
        'Calcium chloride is hygroscopic - store carefully',
        'Reaction may foam - use large beaker'
      ],
      steps: [
        {
          id: 'weigh_carbonate',
          order: 1,
          description: 'Weigh 2.5 g of calcium carbonate',
          action: 'Weigh calcium carbonate',
          isRequired: true,
          timeBonus: 15,
          equipment: ['analytical_balance', 'weighing_boat'],
          chemicals: ['CaCO3']
        },
        {
          id: 'measure_hcl_ca',
          order: 2,
          description: 'Measure 30 cm³ of dilute hydrochloric acid',
          action: 'Measure HCl',
          isRequired: true,
          timeBonus: 15,
          equipment: ['measuring_cylinder', 'large_beaker'],
          chemicals: ['HCl_dilute']
        },
        {
          id: 'add_carbonate_slowly',
          order: 3,
          description: 'Add calcium carbonate slowly to prevent excessive foaming',
          action: 'Add carbonate slowly',
          isRequired: true,
          timeBonus: 30,
          equipment: ['spatula'],
          chemicals: ['CaCO3']
        },
        {
          id: 'stir_until_complete',
          order: 4,
          description: 'Stir until effervescence stops and carbonate dissolves',
          action: 'Stir until complete',
          isRequired: true,
          timeBonus: 25,
          equipment: ['stirring_rod'],
          chemicals: []
        },
        {
          id: 'test_lime_water',
          order: 5,
          description: 'Test evolved gas with lime water to confirm CO₂',
          action: 'Test for CO₂',
          isRequired: false,
          timeBonus: 20,
          equipment: ['test_tube', 'delivery_tube'],
          chemicals: ['lime_water']
        },
        {
          id: 'filter_undissolved',
          order: 6,
          description: 'Filter to remove any undissolved material',
          action: 'Filter solution',
          isRequired: true,
          timeBonus: 25,
          equipment: ['filter_paper', 'funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'evaporate_crystallize',
          order: 7,
          description: 'Evaporate solution to crystallize calcium chloride',
          action: 'Evaporate and crystallize',
          isRequired: true,
          timeBonus: 40,
          equipment: ['evaporating_dish', 'bunsen_burner'],
          chemicals: []
        },
        {
          id: 'store_desiccator',
          order: 8,
          description: 'Store crystals in desiccator to prevent water absorption',
          action: 'Store in desiccator',
          isRequired: true,
          timeBonus: 10,
          equipment: ['desiccator', 'watch_glass'],
          chemicals: []
        }
      ]
    },
    {
      id: 'ammonium_sulfate_prep',
      name: 'Ammonium Sulfate Preparation',
      description: 'Prepare ammonium sulfate by neutralizing ammonia with sulfuric acid',
      difficulty: 3,
      timeLimit: 360,
      expectedProducts: ['(NH₄)₂SO₄'],
      safetyNotes: [
        'Ammonia has strong odor - use fume cupboard',
        'Both reactants are corrosive - handle with care',
        'Monitor pH carefully during neutralization'
      ],
      steps: [
        {
          id: 'measure_ammonia',
          order: 1,
          description: 'Measure 25 cm³ of dilute ammonia solution',
          action: 'Measure ammonia solution',
          isRequired: true,
          timeBonus: 15,
          equipment: ['measuring_cylinder', 'beaker'],
          chemicals: ['NH3_solution']
        },
        {
          id: 'add_indicator_nh3',
          order: 2,
          description: 'Add universal indicator to the ammonia solution',
          action: 'Add indicator',
          isRequired: true,
          timeBonus: 15,
          equipment: ['dropper_bottle'],
          chemicals: ['universal_indicator']
        },
        {
          id: 'titrate_acid',
          order: 3,
          description: 'Slowly add dilute sulfuric acid until neutral (green)',
          action: 'Neutralize with acid',
          isRequired: true,
          timeBonus: 35,
          equipment: ['burette', 'conical_flask'],
          chemicals: ['H2SO4_dilute']
        },
        {
          id: 'check_neutrality',
          order: 4,
          description: 'Check solution is exactly neutral using pH paper',
          action: 'Check pH',
          isRequired: true,
          timeBonus: 20,
          equipment: ['pH_paper', 'glass_rod'],
          chemicals: []
        },
        {
          id: 'evaporate_ammonium',
          order: 5,
          description: 'Evaporate the solution carefully to avoid decomposition',
          action: 'Evaporate carefully',
          isRequired: true,
          timeBonus: 40,
          equipment: ['evaporating_dish', 'bunsen_burner'],
          chemicals: []
        },
        {
          id: 'collect_white_crystals',
          order: 6,
          description: 'Collect the white ammonium sulfate crystals',
          action: 'Collect crystals',
          isRequired: true,
          timeBonus: 15,
          equipment: ['spatula', 'watch_glass'],
          chemicals: []
        }
      ]
    },
    {
      id: 'potassium_nitrate_prep',
      name: 'Potassium Nitrate Preparation',
      description: 'Prepare potassium nitrate by double decomposition reaction',
      difficulty: 4,
      timeLimit: 450,
      expectedProducts: ['KNO₃', 'NaCl'],
      safetyNotes: [
        'Potassium nitrate is an oxidizing agent',
        'Keep away from combustible materials',
        'Handle hot solutions with care'
      ],
      steps: [
        {
          id: 'dissolve_sodium_nitrate',
          order: 1,
          description: 'Dissolve 8.5 g sodium nitrate in 20 cm³ hot water',
          action: 'Dissolve sodium nitrate',
          isRequired: true,
          timeBonus: 20,
          equipment: ['beaker', 'stirring_rod', 'hot_plate'],
          chemicals: ['NaNO3', 'distilled_water']
        },
        {
          id: 'dissolve_potassium_chloride',
          order: 2,
          description: 'Dissolve 7.5 g potassium chloride in 15 cm³ hot water',
          action: 'Dissolve potassium chloride',
          isRequired: true,
          timeBonus: 20,
          equipment: ['beaker', 'stirring_rod', 'hot_plate'],
          chemicals: ['KCl', 'distilled_water']
        },
        {
          id: 'mix_hot_solutions',
          order: 3,
          description: 'Mix the two hot solutions together',
          action: 'Mix hot solutions',
          isRequired: true,
          timeBonus: 15,
          equipment: ['stirring_rod'],
          chemicals: []
        },
        {
          id: 'cool_slowly',
          order: 4,
          description: 'Cool the solution slowly to room temperature',
          action: 'Cool solution slowly',
          isRequired: true,
          timeBonus: 30,
          equipment: ['large_beaker', 'ice_bath'],
          chemicals: []
        },
        {
          id: 'filter_crystals',
          order: 5,
          description: 'Filter to collect potassium nitrate crystals',
          action: 'Filter crystals',
          isRequired: true,
          timeBonus: 25,
          equipment: ['filter_paper', 'funnel', 'suction_flask'],
          chemicals: []
        },
        {
          id: 'wash_crystals',
          order: 6,
          description: 'Wash crystals with small amount of cold distilled water',
          action: 'Wash crystals',
          isRequired: true,
          timeBonus: 20,
          equipment: ['wash_bottle'],
          chemicals: ['distilled_water']
        },
        {
          id: 'dry_product',
          order: 7,
          description: 'Dry the crystals between filter papers',
          action: 'Dry crystals',
          isRequired: true,
          timeBonus: 15,
          equipment: ['filter_paper', 'desiccator'],
          chemicals: []
        },
        {
          id: 'test_purity',
          order: 8,
          description: 'Test purity by checking melting point or flame test',
          action: 'Test purity',
          isRequired: false,
          timeBonus: 25,
          equipment: ['melting_point_apparatus', 'nichrome_wire'],
          chemicals: []
        }
      ]
    }
  ];

  private sampleProcedures: LabProcedure[] = [
    // Difficulty 1 - Basic procedures
    {
      id: 'simple_titration',
      name: 'Acid-Base Titration',
      description: 'Perform a simple acid-base titration to determine concentration',
      difficulty: 1,
      category: 'titration',
      timeLimit: 300,
      safetyNotes: [
        'Wear safety goggles at all times',
        'Handle acids and bases with care',
        'Clean up spills immediately'
      ],
      steps: [
        {
          id: 'setup_burette',
          order: 1,
          description: 'Set up the burette and clamp it securely to the stand',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['burette', 'clamp', 'stand'],
          chemicals: []
        },
        {
          id: 'rinse_burette',
          order: 2,
          description: 'Rinse the burette with distilled water, then with the titrant solution',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['burette', 'wash_bottle'],
          chemicals: ['distilled_water', 'NaOH_solution']
        },
        {
          id: 'fill_burette',
          order: 3,
          description: 'Fill the burette with NaOH solution and record the initial reading',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['burette', 'funnel'],
          chemicals: ['NaOH_solution']
        },
        {
          id: 'prepare_conical_flask',
          order: 4,
          description: 'Measure 25.0 cm³ of HCl solution into a conical flask using a pipette',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['pipette', 'conical_flask', 'pipette_filler'],
          chemicals: ['HCl_solution']
        },
        {
          id: 'add_indicator',
          order: 5,
          description: 'Add 2-3 drops of phenolphthalein indicator to the flask',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['dropper_bottle'],
          chemicals: ['phenolphthalein']
        },
        {
          id: 'titrate',
          order: 6,
          description: 'Titrate slowly, swirling the flask, until the first permanent pink color appears',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['burette', 'conical_flask'],
          chemicals: ['NaOH_solution', 'HCl_solution']
        },
        {
          id: 'record_final_reading',
          order: 7,
          description: 'Record the final burette reading and calculate the titre volume',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['burette'],
          chemicals: []
        }
      ]
    },
    {
      id: 'crystallization',
      name: 'Crystallization of Copper Sulfate',
      description: 'Prepare pure copper sulfate crystals through crystallization',
      difficulty: 2,
      category: 'crystallization',
      timeLimit: 450,
      safetyNotes: [
        'Handle hot solutions with care',
        'Use tongs when handling hot equipment',
        'Allow solutions to cool gradually'
      ],
      steps: [
        {
          id: 'prepare_solution',
          order: 1,
          description: 'Dissolve copper sulfate in minimum amount of hot distilled water',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['beaker', 'stirring_rod', 'hot_plate'],
          chemicals: ['copper_sulfate', 'distilled_water']
        },
        {
          id: 'heat_solution',
          order: 2,
          description: 'Heat the solution gently while stirring until fully dissolved',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['beaker', 'stirring_rod', 'hot_plate'],
          chemicals: ['copper_sulfate_solution']
        },
        {
          id: 'test_saturation',
          order: 3,
          description: 'Test for saturation by adding small amounts of solid until no more dissolves',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['stirring_rod'],
          chemicals: ['copper_sulfate']
        },
        {
          id: 'filter_hot',
          order: 4,
          description: 'Filter the hot saturated solution to remove any undissolved impurities',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['filter_paper', 'funnel', 'conical_flask'],
          chemicals: ['copper_sulfate_solution']
        },
        {
          id: 'cool_slowly',
          order: 5,
          description: 'Allow the filtered solution to cool slowly to room temperature',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['conical_flask'],
          chemicals: ['copper_sulfate_solution']
        },
        {
          id: 'collect_crystals',
          order: 6,
          description: 'Collect the crystals by filtration and wash with cold distilled water',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['filter_paper', 'funnel', 'wash_bottle'],
          chemicals: ['copper_sulfate_crystals', 'distilled_water']
        },
        {
          id: 'dry_crystals',
          order: 7,
          description: 'Dry the crystals between filter papers or in a desiccator',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['filter_paper', 'desiccator'],
          chemicals: ['copper_sulfate_crystals']
        }
      ]
    },
    {
      id: 'simple_distillation',
      name: 'Simple Distillation',
      description: 'Separate a liquid mixture using simple distillation',
      difficulty: 2,
      category: 'distillation',
      timeLimit: 400,
      safetyNotes: [
        'Ensure all joints are properly sealed',
        'Never heat a closed system',
        'Use anti-bumping granules to prevent violent boiling'
      ],
      steps: [
        {
          id: 'setup_apparatus',
          order: 1,
          description: 'Set up the distillation apparatus with round-bottom flask, condenser, and receiver',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['round_bottom_flask', 'condenser', 'receiver_flask', 'clamps'],
          chemicals: []
        },
        {
          id: 'add_mixture',
          order: 2,
          description: 'Add the liquid mixture and anti-bumping granules to the round-bottom flask',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['round_bottom_flask', 'funnel'],
          chemicals: ['liquid_mixture', 'anti_bumping_granules']
        },
        {
          id: 'connect_condenser',
          order: 3,
          description: 'Connect the condenser with water flowing in at the bottom and out at the top',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['condenser', 'rubber_tubing'],
          chemicals: ['water']
        },
        {
          id: 'heat_gently',
          order: 4,
          description: 'Heat the flask gently until the liquid begins to boil steadily',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['heating_mantle', 'thermometer'],
          chemicals: []
        },
        {
          id: 'collect_distillate',
          order: 5,
          description: 'Collect the distillate in the receiver flask, monitoring the temperature',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['receiver_flask', 'thermometer'],
          chemicals: []
        },
        {
          id: 'change_receiver',
          order: 6,
          description: 'Change receiver flasks when the boiling point changes significantly',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['receiver_flask'],
          chemicals: []
        },
        {
          id: 'stop_heating',
          order: 7,
          description: 'Stop heating and allow the apparatus to cool before dismantling',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['heating_mantle'],
          chemicals: []
        }
      ]
    },
    {
      id: 'fractional_distillation',
      name: 'Fractional Distillation',
      description: 'Separate a complex liquid mixture using fractional distillation',
      difficulty: 3,
      category: 'distillation',
      timeLimit: 600,
      safetyNotes: [
        'Monitor temperature carefully throughout the process',
        'Ensure fractionating column is properly packed',
        'Never leave the apparatus unattended while heating'
      ],
      steps: [
        {
          id: 'setup_fractional_apparatus',
          order: 1,
          description: 'Set up fractional distillation apparatus with fractionating column',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['round_bottom_flask', 'fractionating_column', 'condenser', 'receiver_flask'],
          chemicals: []
        },
        {
          id: 'pack_column',
          order: 2,
          description: 'Pack the fractionating column with glass beads or rings',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['fractionating_column', 'glass_beads'],
          chemicals: []
        },
        {
          id: 'add_complex_mixture',
          order: 3,
          description: 'Add the complex liquid mixture and anti-bumping granules to the flask',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['round_bottom_flask', 'funnel'],
          chemicals: ['complex_mixture', 'anti_bumping_granules']
        },
        {
          id: 'setup_thermometer',
          order: 4,
          description: 'Position thermometer at the top of the fractionating column',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['thermometer', 'thermometer_adapter'],
          chemicals: []
        },
        {
          id: 'start_heating',
          order: 5,
          description: 'Begin heating gently and allow the column to reach thermal equilibrium',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['heating_mantle'],
          chemicals: []
        },
        {
          id: 'collect_fractions',
          order: 6,
          description: 'Collect fractions based on boiling point ranges, changing receivers as needed',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['receiver_flask', 'thermometer'],
          chemicals: []
        },
        {
          id: 'monitor_temperature',
          order: 7,
          description: 'Continuously monitor temperature and adjust heating to maintain steady distillation',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['thermometer', 'heating_mantle'],
          chemicals: []
        },
        {
          id: 'complete_distillation',
          order: 8,
          description: 'Continue until all desired fractions are collected, then cool apparatus',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['heating_mantle'],
          chemicals: []
        }
      ]
    },
    {
      id: 'recrystallization',
      name: 'Recrystallization Purification',
      description: 'Purify an impure solid using recrystallization technique',
      difficulty: 3,
      category: 'purification',
      timeLimit: 500,
      safetyNotes: [
        'Handle hot solvents with extreme care',
        'Work in a well-ventilated area',
        'Never heat flammable solvents with an open flame'
      ],
      steps: [
        {
          id: 'choose_solvent',
          order: 1,
          description: 'Choose an appropriate solvent where the compound is soluble when hot, insoluble when cold',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['test_tubes', 'hot_plate'],
          chemicals: ['impure_solid', 'various_solvents']
        },
        {
          id: 'dissolve_hot',
          order: 2,
          description: 'Dissolve the impure solid in minimum amount of hot solvent',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['beaker', 'stirring_rod', 'hot_plate'],
          chemicals: ['impure_solid', 'chosen_solvent']
        },
        {
          id: 'add_decolorizing_carbon',
          order: 3,
          description: 'Add activated carbon if solution is colored, then heat briefly',
          isRequired: false,
          safetyLevel: 'medium',
          equipment: ['stirring_rod', 'hot_plate'],
          chemicals: ['activated_carbon']
        },
        {
          id: 'filter_hot_solution',
          order: 4,
          description: 'Filter the hot solution through fluted filter paper to remove impurities',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['fluted_filter_paper', 'funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'cool_for_crystallization',
          order: 5,
          description: 'Allow the filtrate to cool slowly to room temperature for crystal formation',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['conical_flask'],
          chemicals: []
        },
        {
          id: 'induce_crystallization',
          order: 6,
          description: 'If no crystals form, scratch the flask walls or add a seed crystal',
          isRequired: false,
          safetyLevel: 'low',
          equipment: ['glass_rod'],
          chemicals: ['seed_crystal']
        },
        {
          id: 'collect_pure_crystals',
          order: 7,
          description: 'Collect crystals by suction filtration and wash with cold solvent',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['buchner_funnel', 'filter_paper', 'suction_flask'],
          chemicals: ['cold_solvent']
        },
        {
          id: 'dry_product',
          order: 8,
          description: 'Dry the purified crystals in an oven or desiccator',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['oven', 'desiccator'],
          chemicals: []
        }
      ]
    },
    {
      id: 'extraction',
      name: 'Liquid-Liquid Extraction',
      description: 'Separate compounds using liquid-liquid extraction technique',
      difficulty: 3,
      category: 'extraction',
      timeLimit: 350,
      safetyNotes: [
        'Vent the separating funnel regularly to release pressure',
        'Handle organic solvents in a fume hood',
        'Never shake vigorously with volatile solvents'
      ],
      steps: [
        {
          id: 'prepare_mixture',
          order: 1,
          description: 'Prepare the aqueous solution containing the compound to be extracted',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['beaker', 'stirring_rod'],
          chemicals: ['aqueous_solution', 'target_compound']
        },
        {
          id: 'add_to_separating_funnel',
          order: 2,
          description: 'Transfer the aqueous solution to a separating funnel',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['separating_funnel', 'funnel'],
          chemicals: ['aqueous_solution']
        },
        {
          id: 'add_organic_solvent',
          order: 3,
          description: 'Add the organic extraction solvent to the separating funnel',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['separating_funnel'],
          chemicals: ['organic_solvent']
        },
        {
          id: 'shake_and_vent',
          order: 4,
          description: 'Shake the funnel gently and vent regularly to release pressure',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['separating_funnel'],
          chemicals: []
        },
        {
          id: 'allow_separation',
          order: 5,
          description: 'Allow the layers to separate completely in the separating funnel',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['separating_funnel', 'ring_stand'],
          chemicals: []
        },
        {
          id: 'drain_lower_layer',
          order: 6,
          description: 'Carefully drain the lower layer into a separate container',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['separating_funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'collect_upper_layer',
          order: 7,
          description: 'Pour out the upper layer through the top of the separating funnel',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['separating_funnel', 'conical_flask'],
          chemicals: []
        },
        {
          id: 'repeat_extraction',
          order: 8,
          description: 'Repeat the extraction process 2-3 times for maximum efficiency',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['separating_funnel'],
          chemicals: ['organic_solvent']
        }
      ]
    },
    {
      id: 'gravimetric_analysis',
      name: 'Gravimetric Analysis',
      description: 'Determine the composition of a sample by gravimetric analysis',
      difficulty: 4,
      category: 'analysis',
      timeLimit: 600,
      safetyNotes: [
        'Handle precipitates carefully to avoid losses',
        'Ensure complete precipitation before filtering',
        'Use analytical balance for accurate measurements'
      ],
      steps: [
        {
          id: 'prepare_sample_solution',
          order: 1,
          description: 'Accurately weigh and dissolve the sample in distilled water',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['analytical_balance', 'volumetric_flask', 'stirring_rod'],
          chemicals: ['sample', 'distilled_water']
        },
        {
          id: 'add_precipitating_agent',
          order: 2,
          description: 'Add excess precipitating agent slowly with constant stirring',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['beaker', 'stirring_rod', 'burette'],
          chemicals: ['precipitating_agent']
        },
        {
          id: 'test_complete_precipitation',
          order: 3,
          description: 'Test for complete precipitation by adding more precipitating agent',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['test_tube', 'dropper'],
          chemicals: ['precipitating_agent']
        },
        {
          id: 'digest_precipitate',
          order: 4,
          description: 'Heat the solution gently to digest the precipitate and improve crystal size',
          isRequired: true,
          safetyLevel: 'high',
          equipment: ['beaker', 'hot_plate', 'stirring_rod'],
          chemicals: []
        },
        {
          id: 'prepare_filter_paper',
          order: 5,
          description: 'Prepare and weigh ashless filter paper for quantitative filtration',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['ashless_filter_paper', 'analytical_balance'],
          chemicals: []
        },
        {
          id: 'filter_precipitate',
          order: 6,
          description: 'Filter the precipitate using quantitative filter paper, washing thoroughly',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['funnel', 'ashless_filter_paper', 'wash_bottle'],
          chemicals: ['distilled_water']
        },
        {
          id: 'dry_precipitate',
          order: 7,
          description: 'Dry the precipitate in an oven at appropriate temperature',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['oven', 'crucible'],
          chemicals: []
        },
        {
          id: 'weigh_product',
          order: 8,
          description: 'Cool in desiccator and weigh the dried precipitate accurately',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['analytical_balance', 'desiccator'],
          chemicals: []
        },
        {
          id: 'calculate_composition',
          order: 9,
          description: 'Calculate the percentage composition of the original sample',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['calculator'],
          chemicals: []
        }
      ]
    },
    {
      id: 'colorimetric_analysis',
      name: 'Colorimetric Analysis',
      description: 'Determine concentration using colorimetric analysis and Beer\'s Law',
      difficulty: 4,
      category: 'analysis',
      timeLimit: 450,
      safetyNotes: [
        'Handle colored solutions carefully to avoid staining',
        'Ensure cuvettes are clean and dry',
        'Calibrate spectrophotometer before use'
      ],
      steps: [
        {
          id: 'prepare_standard_solutions',
          order: 1,
          description: 'Prepare a series of standard solutions of known concentrations',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['volumetric_flasks', 'pipettes', 'burette'],
          chemicals: ['stock_solution', 'distilled_water']
        },
        {
          id: 'add_color_reagent',
          order: 2,
          description: 'Add color-developing reagent to all solutions including the unknown',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['pipettes', 'volumetric_flasks'],
          chemicals: ['color_reagent']
        },
        {
          id: 'allow_color_development',
          order: 3,
          description: 'Allow sufficient time for complete color development',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['timer'],
          chemicals: []
        },
        {
          id: 'calibrate_spectrophotometer',
          order: 4,
          description: 'Calibrate the spectrophotometer using a blank solution',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['spectrophotometer', 'cuvettes'],
          chemicals: ['blank_solution']
        },
        {
          id: 'measure_absorbance_standards',
          order: 5,
          description: 'Measure absorbance of all standard solutions at appropriate wavelength',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['spectrophotometer', 'cuvettes'],
          chemicals: ['standard_solutions']
        },
        {
          id: 'plot_calibration_curve',
          order: 6,
          description: 'Plot calibration curve of absorbance vs concentration',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['graph_paper', 'calculator'],
          chemicals: []
        },
        {
          id: 'measure_unknown',
          order: 7,
          description: 'Measure absorbance of the unknown solution',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['spectrophotometer', 'cuvettes'],
          chemicals: ['unknown_solution']
        },
        {
          id: 'determine_concentration',
          order: 8,
          description: 'Use calibration curve to determine concentration of unknown',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['calibration_curve', 'calculator'],
          chemicals: []
        }
      ]
    },
    {
      id: 'electrochemical_cell',
      name: 'Electrochemical Cell Setup',
      description: 'Construct and test an electrochemical cell',
      difficulty: 4,
      category: 'electrochemistry',
      timeLimit: 400,
      safetyNotes: [
        'Handle metal electrodes carefully',
        'Avoid short circuits in the cell',
        'Dispose of metal salt solutions properly'
      ],
      steps: [
        {
          id: 'prepare_half_cells',
          order: 1,
          description: 'Prepare two half-cells with appropriate metal electrodes and salt solutions',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['beakers', 'metal_electrodes'],
          chemicals: ['metal_salt_solutions']
        },
        {
          id: 'clean_electrodes',
          order: 2,
          description: 'Clean metal electrodes with sandpaper and rinse with distilled water',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['sandpaper', 'wash_bottle'],
          chemicals: ['distilled_water']
        },
        {
          id: 'prepare_salt_bridge',
          order: 3,
          description: 'Prepare salt bridge using agar gel and potassium chloride solution',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['U_tube', 'cotton_wool'],
          chemicals: ['agar', 'KCl_solution']
        },
        {
          id: 'assemble_cell',
          order: 4,
          description: 'Assemble the complete electrochemical cell with salt bridge connection',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['beakers', 'salt_bridge', 'electrodes'],
          chemicals: []
        },
        {
          id: 'connect_voltmeter',
          order: 5,
          description: 'Connect high-resistance voltmeter to measure cell potential',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['voltmeter', 'connecting_wires'],
          chemicals: []
        },
        {
          id: 'measure_emf',
          order: 6,
          description: 'Measure and record the electromotive force (EMF) of the cell',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['voltmeter'],
          chemicals: []
        },
        {
          id: 'test_polarity',
          order: 7,
          description: 'Determine the polarity of electrodes and direction of electron flow',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['voltmeter'],
          chemicals: []
        },
        {
          id: 'compare_theoretical',
          order: 8,
          description: 'Compare measured EMF with theoretical value from standard electrode potentials',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['data_tables', 'calculator'],
          chemicals: []
        }
      ]
    },
    {
      id: 'chromatography',
      name: 'Paper Chromatography',
      description: 'Separate and identify components using paper chromatography',
      difficulty: 2,
      category: 'separation',
      timeLimit: 300,
      safetyNotes: [
        'Handle organic solvents in well-ventilated area',
        'Keep chromatography chamber covered',
        'Handle chromatography paper by edges only'
      ],
      steps: [
        {
          id: 'prepare_chromatography_paper',
          order: 1,
          description: 'Cut chromatography paper to size and draw pencil line 2cm from bottom',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['chromatography_paper', 'ruler', 'pencil'],
          chemicals: []
        },
        {
          id: 'apply_sample_spots',
          order: 2,
          description: 'Apply small spots of sample solutions along the pencil line',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['capillary_tubes', 'chromatography_paper'],
          chemicals: ['sample_solutions']
        },
        {
          id: 'prepare_solvent_system',
          order: 3,
          description: 'Prepare the mobile phase solvent system in the chromatography tank',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['chromatography_tank', 'measuring_cylinder'],
          chemicals: ['mobile_phase_solvents']
        },
        {
          id: 'saturate_chamber',
          order: 4,
          description: 'Saturate the chromatography chamber with solvent vapor',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['chromatography_tank', 'filter_paper'],
          chemicals: ['mobile_phase_solvents']
        },
        {
          id: 'place_paper_in_tank',
          order: 5,
          description: 'Place chromatography paper in tank ensuring solvent just touches the bottom',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['chromatography_tank', 'chromatography_paper'],
          chemicals: []
        },
        {
          id: 'allow_development',
          order: 6,
          description: 'Cover tank and allow solvent to rise up the paper until near the top',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['chromatography_tank'],
          chemicals: []
        },
        {
          id: 'remove_and_dry',
          order: 7,
          description: 'Remove paper, mark solvent front, and allow to dry completely',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['pencil'],
          chemicals: []
        },
        {
          id: 'visualize_spots',
          order: 8,
          description: 'Visualize spots using UV light or developing reagent if necessary',
          isRequired: true,
          safetyLevel: 'medium',
          equipment: ['UV_lamp', 'developing_reagent'],
          chemicals: ['developing_reagent']
        },
        {
          id: 'calculate_rf_values',
          order: 9,
          description: 'Measure distances and calculate Rf values for each component',
          isRequired: true,
          safetyLevel: 'low',
          equipment: ['ruler', 'calculator'],
          chemicals: []
        }
      ]
    }
  ];

  async getChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    
    // Generate step-by-step simulator challenges
    for (const procedure of this.sampleProcedures) {
      const challenge = await this.generateStepByStepChallenge(procedure);
      challenges.push(challenge);
    }

    return challenges;
  }

  async generateChallenge(difficulty: number, challengeType?: ChallengeType): Promise<Challenge> {
    if (challengeType === ChallengeType.TIME_ATTACK) {
      return this.generateTimeAttackChallenge(difficulty);
    }
    
    if (challengeType === ChallengeType.BOSS_BATTLE) {
      return this.generateBossChallenge(difficulty);
    }
    
    // Default to step-by-step challenges
    const suitableProcedures = this.sampleProcedures.filter(proc => proc.difficulty === difficulty);
    
    if (suitableProcedures.length === 0) {
      // Fallback to closest difficulty
      const closestProcedures = this.sampleProcedures.filter(proc => 
        Math.abs(proc.difficulty - difficulty) <= 1
      );
      const randomProcedure = closestProcedures[Math.floor(Math.random() * closestProcedures.length)];
      return this.generateStepByStepChallenge(randomProcedure);
    }

    const randomProcedure = suitableProcedures[Math.floor(Math.random() * suitableProcedures.length)];
    return this.generateStepByStepChallenge(randomProcedure);
  }

  private async generateTimeAttackChallenge(difficulty: number): Promise<Challenge> {
    // Filter salt procedures by difficulty
    const suitableProcedures = this.sampleSaltProcedures.filter(proc => proc.difficulty === difficulty);
    
    if (suitableProcedures.length === 0) {
      // Fallback to closest difficulty
      const closestProcedures = this.sampleSaltProcedures.filter(proc => 
        Math.abs(proc.difficulty - difficulty) <= 1
      );
      const randomProcedure = closestProcedures[Math.floor(Math.random() * closestProcedures.length)];
      return this.generateTimeAttackSaltChallenge(randomProcedure);
    }

    const randomProcedure = suitableProcedures[Math.floor(Math.random() * suitableProcedures.length)];
    return this.generateTimeAttackSaltChallenge(randomProcedure);
  }

  private async generateTimeAttackSaltChallenge(procedureData: typeof this.sampleSaltProcedures[0]): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.TIME_ATTACK,
      procedureData.difficulty,
      `${procedureData.name} - Time Attack`,
      procedureData.description
    );

    const correctSequence = procedureData.steps.map(step => step.order);

    const content: ChallengeContent = {
      question: `Complete the salt preparation procedure as quickly as possible: ${procedureData.name}`,
      correctAnswer: JSON.stringify({
        expectedSteps: procedureData.steps.length,
        maxTime: procedureData.timeLimit,
        expectedProducts: procedureData.expectedProducts
      }),
      explanation: `Salt preparation procedure for ${procedureData.name}:\n\n${procedureData.steps
        .sort((a, b) => a.order - b.order)
        .map((step, index) => `${index + 1}. ${step.action}: ${step.description}`)
        .join('\n')}\n\nExpected products: ${procedureData.expectedProducts.join(', ')}`,
      hints: [
        "Work quickly but safely to maximize time bonuses",
        "Follow the correct sequence to avoid mistakes",
        "Each step has a time bonus that decreases over time",
        "Focus on accuracy first, then speed"
      ],
      visualAids: [
        {
          type: 'diagram',
          url: `/images/salt_prep/${procedureData.id}_setup.png`,
          altText: `Diagram showing ${procedureData.name} setup`,
          interactive: true
        }
      ]
    };

    return {
      ...baseChallenge,
      content: {
        ...content,
        procedure: procedureData,
        steps: procedureData.steps,
        correctSequence
      } as any,
      timeLimit: procedureData.timeLimit,
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['salt preparation', 'laboratory techniques', 'time management'],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        expectedProducts: procedureData.expectedProducts
      }
    } as Challenge;
  }

  private async generateBossChallenge(difficulty: number): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.BOSS_BATTLE,
      Math.max(4, difficulty), // Boss battles are always high difficulty
      'Distillation Dragon Boss Battle',
      'Defeat the mighty Distillation Dragon by mastering fractional distillation techniques'
    );

    // Define the distillation setup for the boss battle
    const distillationSetup = {
      id: 'distillation_dragon_setup',
      name: 'Complex Organic Mixture',
      description: 'A challenging mixture of organic compounds that must be separated using fractional distillation',
      components: [
        {
          id: 'ethanol',
          name: 'Ethanol',
          boilingPoint: 78,
          concentration: 25,
          color: '#4CAF50'
        },
        {
          id: 'acetone',
          name: 'Acetone',
          boilingPoint: 56,
          concentration: 20,
          color: '#2196F3'
        },
        {
          id: 'benzene',
          name: 'Benzene',
          boilingPoint: 80,
          concentration: 30,
          color: '#FF9800'
        },
        {
          id: 'toluene',
          name: 'Toluene',
          boilingPoint: 111,
          concentration: 25,
          color: '#9C27B0'
        }
      ],
      optimalConditions: {
        temperature: 78, // Start with ethanol BP
        pressure: 1.0,
        refluxRatio: 2.5,
        flowRate: 60
      },
      dragonHealth: 100,
      maxHealth: 100
    };

    const content: ChallengeContent = {
      question: 'Defeat the Distillation Dragon by optimizing fractional distillation conditions to separate the complex organic mixture',
      correctAnswer: JSON.stringify({
        victory: true,
        optimalConditions: distillationSetup.optimalConditions,
        targetComponents: distillationSetup.components.map(c => c.id)
      }),
      explanation: `To defeat the Distillation Dragon, you must:\n\n1. Optimize temperature control for each component's boiling point\n2. Maintain proper pressure for efficient separation\n3. Adjust reflux ratio for maximum purity\n4. Control flow rate for optimal throughput\n\nOptimal conditions:\n- Temperature: ${distillationSetup.optimalConditions.temperature}°C\n- Pressure: ${distillationSetup.optimalConditions.pressure} atm\n- Reflux Ratio: ${distillationSetup.optimalConditions.refluxRatio}\n- Flow Rate: ${distillationSetup.optimalConditions.flowRate}%`,
      hints: [
        "Start by matching the temperature to the lowest boiling point component",
        "Adjust pressure to improve separation efficiency",
        "Higher reflux ratios give better purity but slower throughput",
        "Monitor the dragon's health - high accuracy deals more damage",
        "Collect pure fractions to weaken the dragon significantly"
      ],
      visualAids: [
        {
          type: 'diagram',
          url: '/images/distillation/fractional_distillation_setup.png',
          altText: 'Fractional distillation apparatus diagram',
          interactive: true
        }
      ]
    };

    return {
      ...baseChallenge,
      content: {
        ...content,
        distillationSetup,
        targetComponents: distillationSetup.components.map(c => c.id),
        timeLimit: 600 // 10 minutes for boss battle
      } as any,
      timeLimit: 600,
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['fractional distillation', 'boss battle', 'optimization', 'separation techniques'],
        curriculumStandards: ['A-Level Chemistry', 'University Chemistry'],
        bossType: 'distillation-dragon'
      }
    } as Challenge;
  }

  private async generateStepByStepChallenge(procedure: LabProcedure): Promise<StepByStepChallenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.STEP_BY_STEP,
      procedure.difficulty,
      `${procedure.name} - Step-by-Step Simulator`,
      procedure.description
    );

    // Shuffle the steps for the challenge
    const shuffledSteps = [...procedure.steps].sort(() => Math.random() - 0.5);
    const correctOrder = procedure.steps.map(step => step.order);

    const content: ChallengeContent = {
      question: `Arrange the following laboratory procedure steps in the correct order for: ${procedure.name}`,
      correctAnswer: correctOrder.join(','),
      explanation: `The correct procedure for ${procedure.name}:\n\n${procedure.steps
        .sort((a, b) => a.order - b.order)
        .map((step, index) => `${index + 1}. ${step.description}`)
        .join('\n')}`,
      hints: [
        "Consider the logical flow of the procedure",
        "Safety steps often come first",
        "Setup usually precedes the actual procedure",
        "Cleanup and measurement steps typically come last"
      ],
      visualAids: [
        {
          type: 'diagram',
          url: `/images/procedures/${procedure.category}_setup.png`,
          altText: `Diagram showing ${procedure.category} laboratory setup`,
          interactive: true
        }
      ]
    };

    return {
      ...baseChallenge,
      content: {
        ...content,
        procedure,
        shuffledSteps,
        correctOrder
      },
      timeLimit: procedure.timeLimit,
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['laboratory techniques', procedure.category, 'safety procedures'],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        safetyLevel: Math.max(...procedure.steps.map(step => 
          step.safetyLevel === 'high' ? 3 : step.safetyLevel === 'medium' ? 2 : 1
        ))
      }
    } as StepByStepChallenge;
  }

  async validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (challenge.type === ChallengeType.TIME_ATTACK) {
      return this.validateTimeAttackAnswer(challenge, answer);
    }

    if (challenge.type === ChallengeType.BOSS_BATTLE) {
      return this.validateBossAnswer(challenge, answer);
    }

    // Default step-by-step validation
    if (!this.validateAnswerFormat(answer, 'string')) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide the step order as comma-separated numbers (e.g., 1,3,2,4)",
        explanation: "Answer format should be step numbers separated by commas"
      };
    }

    const userOrder = (answer.response as string)
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    const correctOrder = (challenge.content.correctAnswer as string)
      .split(',')
      .map(s => parseInt(s.trim()));

    // Check if the user provided a valid format
    const responseStr = answer.response as string;
    const validFormatRegex = /^[\d\s,]+$/;
    
    if (!validFormatRegex.test(responseStr) || userOrder.length === 0) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide the step order as comma-separated numbers (e.g., 1,3,2,4)",
        explanation: "Answer format should be step numbers separated by commas"
      };
    }

    if (userOrder.length !== correctOrder.length) {
      return {
        isCorrect: false,
        score: 0,
        feedback: `Please provide exactly ${correctOrder.length} step numbers`,
        explanation: "You must include all procedure steps in your answer"
      };
    }

    const isCorrect = this.arraysEqual(userOrder, correctOrder);
    
    let partialCredit = 0;
    if (!isCorrect) {
      // Calculate partial credit based on correct positions
      const correctPositions = userOrder.filter((step, index) => 
        step === correctOrder[index]
      ).length;
      partialCredit = correctPositions / correctOrder.length;
    }

    const score = isCorrect ? this.calculateBaseScore(isCorrect, challenge.difficulty, partialCredit) : 0;
    
    return {
      isCorrect,
      score,
      partialCredit,
      feedback: isCorrect 
        ? "Perfect! You've arranged the procedure steps correctly!" 
        : `Good effort! You got ${Math.floor(partialCredit * 100)}% of the steps in the right position.`,
      explanation: challenge.content.explanation
    };
  }

  private async validateTimeAttackAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    try {
      const responseData = JSON.parse(answer.response as string);
      const expectedData = JSON.parse(challenge.content.correctAnswer as string);
      
      const completedSteps = responseData.completedSteps || 0;
      const totalTime = responseData.totalTime || 0;
      const finalScore = responseData.finalScore || 0;
      
      // Check if all steps were completed
      const isCorrect = completedSteps === expectedData.expectedSteps;
      
      // Calculate performance rating
      let performanceRating = 'Good';
      const averageStepTime = totalTime / completedSteps;
      
      if (averageStepTime < 5000) {
        performanceRating = 'Excellent';
      } else if (averageStepTime < 10000) {
        performanceRating = 'Good';
      } else {
        performanceRating = 'Needs Improvement';
      }
      
      const feedback = isCorrect 
        ? `Excellent work! You completed all ${completedSteps} steps in ${(totalTime / 1000).toFixed(1)} seconds. Performance: ${performanceRating}`
        : `You completed ${completedSteps} out of ${expectedData.expectedSteps} steps. Keep practicing!`;
      
      return {
        isCorrect,
        score: finalScore,
        feedback,
        explanation: challenge.content.explanation,
        bonusPoints: Math.max(0, finalScore - (completedSteps * 100))
      };
    } catch (error) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Invalid response format for time attack challenge",
        explanation: "Please complete the challenge properly"
      };
    }
  }

  private async validateBossAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    try {
      const responseData = JSON.parse(answer.response as string);
      const expectedData = JSON.parse(challenge.content.correctAnswer as string);
      
      const victory = responseData.victory || false;
      const finalAccuracy = responseData.finalAccuracy || 0;
      const dragonHealthRemaining = responseData.dragonHealthRemaining || 100;
      const playerHealthRemaining = responseData.playerHealthRemaining || 0;
      const collectedFractions = responseData.collectedFractions || 0;
      const targetFractions = responseData.targetFractions || 4;
      
      // Calculate performance score
      let score = 0;
      
      if (victory) {
        // Base victory score
        score = 500;
        
        // Bonus for high accuracy
        score += Math.floor(finalAccuracy * 2);
        
        // Bonus for remaining player health
        score += playerHealthRemaining * 2;
        
        // Bonus for collected fractions
        score += (collectedFractions / targetFractions) * 100;
        
        // Time bonus (if completed quickly)
        const timeBonus = Math.max(0, (600 - answer.timeElapsed) / 10);
        score += timeBonus;
      } else {
        // Partial credit for damage dealt
        const damageDealt = 100 - dragonHealthRemaining;
        score = Math.floor(damageDealt * 2);
        
        // Small bonus for accuracy even in defeat
        score += Math.floor(finalAccuracy / 2);
      }
      
      const feedback = victory 
        ? `🏆 Victory! You have defeated the Distillation Dragon with ${finalAccuracy.toFixed(1)}% accuracy! The Golden Flask Badge is yours!`
        : `💀 Defeat! The dragon overwhelmed you, but you dealt ${100 - dragonHealthRemaining} damage. Study distillation theory and try again!`;
      
      return {
        isCorrect: victory,
        score: Math.floor(score),
        feedback,
        explanation: challenge.content.explanation,
        bonusPoints: victory ? Math.floor(finalAccuracy * 2) : 0
      };
    } catch (error) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Invalid response format for boss battle",
        explanation: "Please complete the boss battle properly"
      };
    }
  }

  calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number {
    const baseScore = this.calculateBaseScore(true, challenge.difficulty);
    
    // Time bonus calculation
    const timeLimit = challenge.timeLimit || 300;
    const timeBonus = Math.max(0, (timeLimit - timeElapsed) / timeLimit * 0.3);
    
    // Hint penalty
    const hintPenalty = answer.hintsUsed * 0.1;
    
    // Accuracy bonus for perfect order
    const accuracyBonus = 0.2;
    
    const finalScore = Math.floor(baseScore * (1 + timeBonus + accuracyBonus - hintPenalty));
    return Math.max(0, finalScore);
  }

  getSpecialMechanics(): RealmMechanic[] {
    return [
      {
        id: 'explosion_animation',
        name: 'Laboratory Explosion',
        description: 'Explosion animation for incorrect step sequences',
        parameters: {
          animationDuration: 3000,
          shakeIntensity: 'high',
          soundEffect: 'explosion'
        }
      },
      {
        id: 'accuracy_bonus',
        name: 'Precision Bonus',
        description: 'Bonus points for completing procedures with perfect accuracy',
        parameters: {
          perfectAccuracyBonus: 0.5,
          nearPerfectThreshold: 0.9
        }
      },
      {
        id: 'safety_system',
        name: 'Safety Monitoring',
        description: 'Track safety violations and provide feedback',
        parameters: {
          safetyViolationPenalty: 0.2,
          safetyBonusMultiplier: 1.1
        }
      }
    ];
  }

  async processBossChallenge(userId: string, bossId: string): Promise<BossResult> {
    if (bossId === 'distillation-dragon') {
      return {
        defeated: true,
        score: 750,
        specialRewards: [
          {
            type: 'badge',
            itemId: 'golden_flask',
            description: 'Golden Flask Badge - Master of Laboratory Techniques'
          },
          {
            type: 'unlock',
            itemId: 'advanced_procedures',
            description: 'Advanced Laboratory Procedures'
          }
        ],
        unlockedContent: ['advanced_procedures', 'industrial_processes']
      };
    }
    
    throw new Error(`Unknown boss: ${bossId}`);
  }

  // Utility methods
  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  protected getSpecialRewards(): Reward[] {
    return [
      {
        type: 'badge' as const,
        itemId: 'lab_apprentice',
        description: 'Laboratory Apprentice Badge'
      },
      {
        type: 'unlock' as const,
        itemId: 'golden_flask',
        description: 'Golden Flask Badge'
      }
    ];
  }
}