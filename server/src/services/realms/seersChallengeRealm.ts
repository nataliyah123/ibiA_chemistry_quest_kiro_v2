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

// Precipitation reaction interfaces
export interface PrecipitationReaction {
  reactant1: string;
  reactant2: string;
  products: string[];
  willPrecipitate: boolean;
  precipitate?: string;
  explanation: string;
  difficulty: number;
  topic: string;
}

// Color change reaction interfaces
export interface ColorChangeReaction {
  id: string;
  reactants: string[];
  products: string[];
  initialColor: string;
  finalColor: string;
  colorDescription: string;
  textClue: string;
  explanation: string;
  difficulty: number;
  topic: string;
  additionalObservations?: string[];
}

// Mystery reaction interfaces
export interface MysteryReaction {
  id: string;
  reactants: string[];
  products: string[];
  gasProduced: string;
  gasProperties: {
    color: string;
    smell: string;
    density: string;
    solubility: string;
    flammability: string;
    toxicity: string;
  };
  visualEffects: string[];
  equation: string;
  explanation: string;
  difficulty: number;
  topic: string;
  crystalBallVideo?: {
    title: string;
    description: string;
    expertName: string;
    duration: string;
  };
}

export interface PrecipitatePokerChallenge extends Challenge {
  content: ChallengeContent & {
    reaction: PrecipitationReaction;
    betOptions: BetOption[];
    currentBankroll: number;
  };
}

export interface ColorClashChallenge extends Challenge {
  content: ChallengeContent & {
    reaction: ColorChangeReaction;
    maxScore: number;
  };
}

export interface MysteryReactionChallenge extends Challenge {
  content: ChallengeContent & {
    reaction: MysteryReaction;
    gasOptions: string[];
    maxScore: number;
  };
}

export interface BetOption {
  id: string;
  description: string;
  odds: number;
  confidenceLevel: 'low' | 'medium' | 'high';
}

export class SeersChallengeRealm extends RealmComponent {
  realmId = 'seers-challenge';
  name = "The Seer's Challenge";
  description = 'Master observation and interpretation skills through prediction games';
  requiredLevel = 4;

  private precipitationReactions: PrecipitationReaction[] = [
    // Difficulty 1 - Common precipitates
    {
      reactant1: "AgNO₃",
      reactant2: "NaCl",
      products: ["AgCl", "NaNO₃"],
      willPrecipitate: true,
      precipitate: "AgCl",
      explanation: "Silver chloride (AgCl) is insoluble in water and forms a white precipitate.",
      difficulty: 1,
      topic: "Halide precipitation"
    },
    {
      reactant1: "BaCl₂",
      reactant2: "Na₂SO₄",
      products: ["BaSO₄", "NaCl"],
      willPrecipitate: true,
      precipitate: "BaSO₄",
      explanation: "Barium sulfate (BaSO₄) is insoluble in water and forms a white precipitate.",
      difficulty: 1,
      topic: "Sulfate precipitation"
    },
    {
      reactant1: "Pb(NO₃)₂",
      reactant2: "KI",
      products: ["PbI₂", "KNO₃"],
      willPrecipitate: true,
      precipitate: "PbI₂",
      explanation: "Lead iodide (PbI₂) is insoluble in water and forms a bright yellow precipitate.",
      difficulty: 1,
      topic: "Heavy metal precipitation"
    },
    {
      reactant1: "CaCl₂",
      reactant2: "Na₂CO₃",
      products: ["CaCO₃", "NaCl"],
      willPrecipitate: true,
      precipitate: "CaCO₃",
      explanation: "Calcium carbonate (CaCO₃) is insoluble in water and forms a white precipitate.",
      difficulty: 1,
      topic: "Carbonate precipitation"
    },
    {
      reactant1: "FeCl₃",
      reactant2: "NaOH",
      products: ["Fe(OH)₃", "NaCl"],
      willPrecipitate: true,
      precipitate: "Fe(OH)₃",
      explanation: "Iron(III) hydroxide (Fe(OH)₃) is insoluble and forms a rust-colored precipitate.",
      difficulty: 1,
      topic: "Hydroxide precipitation"
    },

    // Difficulty 2 - Less obvious precipitates
    {
      reactant1: "Cu(NO₃)₂",
      reactant2: "Na₂S",
      products: ["CuS", "NaNO₃"],
      willPrecipitate: true,
      precipitate: "CuS",
      explanation: "Copper sulfide (CuS) is highly insoluble and forms a black precipitate.",
      difficulty: 2,
      topic: "Sulfide precipitation"
    },
    {
      reactant1: "Mg(NO₃)₂",
      reactant2: "Na₃PO₄",
      products: ["Mg₃(PO₄)₂", "NaNO₃"],
      willPrecipitate: true,
      precipitate: "Mg₃(PO₄)₂",
      explanation: "Magnesium phosphate (Mg₃(PO₄)₂) is insoluble and forms a white precipitate.",
      difficulty: 2,
      topic: "Phosphate precipitation"
    },
    {
      reactant1: "Al₂(SO₄)₃",
      reactant2: "Ba(OH)₂",
      products: ["Al(OH)₃", "BaSO₄"],
      willPrecipitate: true,
      precipitate: "Al(OH)₃ and BaSO₄",
      explanation: "Both aluminum hydroxide and barium sulfate are insoluble, forming white precipitates.",
      difficulty: 2,
      topic: "Double precipitation"
    },
    {
      reactant1: "Zn(NO₃)₂",
      reactant2: "K₂CrO₄",
      products: ["ZnCrO₄", "KNO₃"],
      willPrecipitate: true,
      precipitate: "ZnCrO₄",
      explanation: "Zinc chromate (ZnCrO₄) is insoluble and forms a yellow precipitate.",
      difficulty: 2,
      topic: "Chromate precipitation"
    },
    {
      reactant1: "Ni(NO₃)₂",
      reactant2: "Na₂CO₃",
      products: ["NiCO₃", "NaNO₃"],
      willPrecipitate: true,
      precipitate: "NiCO₃",
      explanation: "Nickel carbonate (NiCO₃) is insoluble and forms a green precipitate.",
      difficulty: 2,
      topic: "Transition metal carbonate"
    },

    // Difficulty 3 - No precipitation cases
    {
      reactant1: "NaCl",
      reactant2: "KNO₃",
      products: ["NaNO₃", "KCl"],
      willPrecipitate: false,
      explanation: "All products (NaNO₃ and KCl) are soluble in water, so no precipitate forms.",
      difficulty: 2,
      topic: "Soluble salts"
    },
    {
      reactant1: "Ca(NO₃)₂",
      reactant2: "KCl",
      products: ["CaCl₂", "KNO₃"],
      willPrecipitate: false,
      explanation: "Both calcium chloride and potassium nitrate are soluble, no precipitate forms.",
      difficulty: 2,
      topic: "Soluble salts"
    },
    {
      reactant1: "MgSO₄",
      reactant2: "NaNO₃",
      products: ["Mg(NO₃)₂", "Na₂SO₄"],
      willPrecipitate: false,
      explanation: "Magnesium nitrate and sodium sulfate are both soluble, no precipitate forms.",
      difficulty: 2,
      topic: "Soluble salts"
    },
    {
      reactant1: "NH₄Cl",
      reactant2: "KOH",
      products: ["NH₃", "H₂O", "KCl"],
      willPrecipitate: false,
      explanation: "This produces ammonia gas and water, with soluble KCl. No solid precipitate forms.",
      difficulty: 3,
      topic: "Gas evolution"
    },

    // Difficulty 3-4 - Complex cases
    {
      reactant1: "CuSO₄",
      reactant2: "NH₄OH",
      products: ["Cu(OH)₂", "(NH₄)₂SO₄"],
      willPrecipitate: true,
      precipitate: "Cu(OH)₂",
      explanation: "Copper hydroxide initially precipitates as blue solid, but dissolves in excess NH₃ to form deep blue complex.",
      difficulty: 3,
      topic: "Complex formation"
    },
    {
      reactant1: "AgNO₃",
      reactant2: "NH₄Cl",
      products: ["AgCl", "NH₄NO₃"],
      willPrecipitate: true,
      precipitate: "AgCl",
      explanation: "Silver chloride precipitates initially, but can dissolve in excess ammonia to form [Ag(NH₃)₂]⁺ complex.",
      difficulty: 3,
      topic: "Amphoteric behavior"
    },
    {
      reactant1: "Bi(NO₃)₃",
      reactant2: "H₂O",
      products: ["BiONO₃", "HNO₃"],
      willPrecipitate: true,
      precipitate: "BiONO₃",
      explanation: "Bismuth nitrate hydrolyzes in water to form insoluble bismuth oxonitrate (white precipitate).",
      difficulty: 4,
      topic: "Hydrolysis precipitation"
    },
    {
      reactant1: "FeCl₃",
      reactant2: "KSCN",
      products: ["Fe(SCN)₃", "KCl"],
      willPrecipitate: false,
      explanation: "Forms a deep red complex ion [Fe(SCN)]²⁺ in solution, not a precipitate.",
      difficulty: 3,
      topic: "Complex ion formation"
    },

    // Difficulty 4-5 - Advanced cases
    {
      reactant1: "Cr₂(SO₄)₃",
      reactant2: "Ba(OH)₂",
      products: ["Cr(OH)₃", "BaSO₄"],
      willPrecipitate: true,
      precipitate: "Cr(OH)₃ and BaSO₄",
      explanation: "Both chromium hydroxide (green) and barium sulfate (white) precipitate simultaneously.",
      difficulty: 4,
      topic: "Multiple precipitation"
    },
    {
      reactant1: "K₂Cr₂O₇",
      reactant2: "Pb(CH₃COO)₂",
      products: ["PbCrO₄", "K(CH₃COO)", "Cr(CH₃COO)₃"],
      willPrecipitate: true,
      precipitate: "PbCrO₄",
      explanation: "Lead chromate forms a bright yellow precipitate. Dichromate reduces to Cr³⁺ in acidic conditions.",
      difficulty: 4,
      topic: "Redox precipitation"
    },
    {
      reactant1: "Al(NO₃)₃",
      reactant2: "NH₄OH",
      products: ["Al(OH)₃", "NH₄NO₃"],
      willPrecipitate: true,
      precipitate: "Al(OH)₃",
      explanation: "Aluminum hydroxide precipitates as white gelatinous solid, amphoteric (dissolves in excess base).",
      difficulty: 4,
      topic: "Amphoteric hydroxide"
    },
    {
      reactant1: "Hg₂(NO₃)₂",
      reactant2: "HCl",
      products: ["Hg₂Cl₂", "HNO₃"],
      willPrecipitate: true,
      precipitate: "Hg₂Cl₂",
      explanation: "Mercury(I) chloride (calomel) forms a white precipitate, distinguishes Hg₂²⁺ from Hg²⁺.",
      difficulty: 5,
      topic: "Mercury chemistry"
    },
    {
      reactant1: "Co(NO₃)₂",
      reactant2: "K₄[Fe(CN)₆]",
      products: ["Co₃[Fe(CN)₆]₂", "KNO₃"],
      willPrecipitate: true,
      precipitate: "Co₃[Fe(CN)₆]₂",
      explanation: "Cobalt ferrocyanide forms a brown precipitate, used in qualitative analysis.",
      difficulty: 5,
      topic: "Complex precipitation"
    },

    // Additional reactions for variety
    {
      reactant1: "CdCl₂",
      reactant2: "Na₂S",
      products: ["CdS", "NaCl"],
      willPrecipitate: true,
      precipitate: "CdS",
      explanation: "Cadmium sulfide forms a bright yellow precipitate, highly insoluble.",
      difficulty: 3,
      topic: "Heavy metal sulfide"
    },
    {
      reactant1: "Mn(NO₃)₂",
      reactant2: "NaOH",
      products: ["Mn(OH)₂", "NaNO₃"],
      willPrecipitate: true,
      precipitate: "Mn(OH)₂",
      explanation: "Manganese(II) hydroxide forms a white precipitate that quickly oxidizes to brown in air.",
      difficulty: 3,
      topic: "Oxidation-sensitive precipitate"
    },
    {
      reactant1: "Sr(NO₃)₂",
      reactant2: "Na₂SO₄",
      products: ["SrSO₄", "NaNO₃"],
      willPrecipitate: true,
      precipitate: "SrSO₄",
      explanation: "Strontium sulfate is insoluble and forms a white precipitate, similar to barium sulfate.",
      difficulty: 2,
      topic: "Group 2 sulfate"
    },
    {
      reactant1: "NH₄NO₃",
      reactant2: "NaOH",
      products: ["NH₃", "H₂O", "NaNO₃"],
      willPrecipitate: false,
      explanation: "Produces ammonia gas (detectable by smell), water, and soluble sodium nitrate.",
      difficulty: 2,
      topic: "Gas evolution"
    },
    {
      reactant1: "Ca(OH)₂",
      reactant2: "CO₂",
      products: ["CaCO₃", "H₂O"],
      willPrecipitate: true,
      precipitate: "CaCO₃",
      explanation: "Limewater test: calcium carbonate precipitates, turning clear limewater milky.",
      difficulty: 1,
      topic: "Gas absorption"
    }
  ];

  private colorChangeReactions: ColorChangeReaction[] = [
    // Difficulty 1 - Simple color changes
    {
      id: 'cc-001',
      reactants: ['Cu²⁺', 'NH₃'],
      products: ['[Cu(NH₃)₄]²⁺'],
      initialColor: 'pale blue',
      finalColor: 'deep blue',
      colorDescription: 'deep blue',
      textClue: 'A pale blue solution of copper ions becomes intensely blue when ammonia is added dropwise.',
      explanation: 'Copper ions form a deep blue complex with ammonia: [Cu(NH₃)₄]²⁺',
      difficulty: 1,
      topic: 'Complex ion formation',
      additionalObservations: ['Solution becomes more viscous', 'No precipitate forms']
    },
    {
      id: 'cc-002',
      reactants: ['Fe³⁺', 'SCN⁻'],
      products: ['[Fe(SCN)]²⁺'],
      initialColor: 'pale yellow',
      finalColor: 'blood red',
      colorDescription: 'blood red',
      textClue: 'A pale yellow iron(III) solution turns blood red when thiocyanate ions are added.',
      explanation: 'Iron(III) forms a blood red complex with thiocyanate: [Fe(SCN)]²⁺',
      difficulty: 1,
      topic: 'Complex ion formation',
      additionalObservations: ['Intense red color even at low concentrations', 'Used as a test for Fe³⁺']
    },
    {
      id: 'cc-003',
      reactants: ['I₂', 'starch'],
      products: ['I₂-starch complex'],
      initialColor: 'brown',
      finalColor: 'blue-black',
      colorDescription: 'blue-black',
      textClue: 'Brown iodine solution turns blue-black when starch solution is added.',
      explanation: 'Iodine forms a characteristic blue-black complex with starch molecules.',
      difficulty: 1,
      topic: 'Starch test',
      additionalObservations: ['Very sensitive test for iodine', 'Color disappears on heating']
    },
    {
      id: 'cc-004',
      reactants: ['Cr₂O₇²⁻', 'H⁺'],
      products: ['Cr³⁺', 'H₂O'],
      initialColor: 'orange',
      finalColor: 'green',
      colorDescription: 'green',
      textClue: 'An orange dichromate solution turns green when a reducing agent is added in acidic conditions.',
      explanation: 'Dichromate (Cr₂O₇²⁻) is reduced to chromium(III) ions (Cr³⁺) which are green.',
      difficulty: 2,
      topic: 'Redox reactions',
      additionalObservations: ['Reaction is used in breathalyzer tests', 'Heat may be evolved']
    },
    {
      id: 'cc-005',
      reactants: ['MnO₄⁻', 'H⁺'],
      products: ['Mn²⁺', 'H₂O'],
      initialColor: 'purple',
      finalColor: 'colorless',
      colorDescription: 'colorless',
      textClue: 'A deep purple permanganate solution becomes colorless when a reducing agent is added in acidic solution.',
      explanation: 'Permanganate (MnO₄⁻) is reduced to colorless manganese(II) ions (Mn²⁺).',
      difficulty: 2,
      topic: 'Redox reactions',
      additionalObservations: ['Self-indicating reaction', 'Used in redox titrations']
    },

    // Difficulty 2 - Precipitation with color
    {
      id: 'cc-006',
      reactants: ['Pb²⁺', 'I⁻'],
      products: ['PbI₂'],
      initialColor: 'colorless',
      finalColor: 'bright yellow',
      colorDescription: 'bright yellow',
      textClue: 'Colorless solutions mix to produce a bright yellow precipitate that dissolves in hot water.',
      explanation: 'Lead iodide (PbI₂) forms a characteristic bright yellow precipitate.',
      difficulty: 2,
      topic: 'Precipitation',
      additionalObservations: ['Precipitate dissolves in hot water', 'Golden yellow crystals form on cooling']
    },
    {
      id: 'cc-007',
      reactants: ['Ag⁺', 'Br⁻'],
      products: ['AgBr'],
      initialColor: 'colorless',
      finalColor: 'cream',
      colorDescription: 'cream',
      textClue: 'Mixing colorless silver nitrate with bromide solution produces a cream-colored precipitate.',
      explanation: 'Silver bromide (AgBr) forms a cream-colored precipitate, darker than AgCl.',
      difficulty: 2,
      topic: 'Halide precipitation',
      additionalObservations: ['Precipitate is photosensitive', 'Darkens in sunlight']
    },
    {
      id: 'cc-008',
      reactants: ['Ni²⁺', 'OH⁻'],
      products: ['Ni(OH)₂'],
      initialColor: 'green',
      finalColor: 'green precipitate',
      colorDescription: 'green precipitate',
      textClue: 'A green nickel solution forms a green gelatinous precipitate when sodium hydroxide is added.',
      explanation: 'Nickel hydroxide (Ni(OH)₂) forms a characteristic green precipitate.',
      difficulty: 2,
      topic: 'Hydroxide precipitation',
      additionalObservations: ['Gelatinous texture', 'Amphoteric behavior in excess base']
    },
    {
      id: 'cc-009',
      reactants: ['Co²⁺', 'OH⁻'],
      products: ['Co(OH)₂'],
      initialColor: 'pink',
      finalColor: 'blue precipitate',
      colorDescription: 'blue precipitate',
      textClue: 'A pink cobalt solution forms a blue precipitate when hydroxide is added, which turns brown in air.',
      explanation: 'Cobalt hydroxide initially forms blue Co(OH)₂, which oxidizes to brown Co(OH)₃ in air.',
      difficulty: 3,
      topic: 'Oxidation-sensitive precipitation',
      additionalObservations: ['Color change from blue to brown in air', 'Oxidation by atmospheric oxygen']
    },

    // Difficulty 3 - Complex color changes
    {
      id: 'cc-010',
      reactants: ['CuSO₄', 'NH₃ (excess)'],
      products: ['[Cu(NH₃)₄]²⁺'],
      initialColor: 'blue',
      finalColor: 'deep blue via precipitate',
      colorDescription: 'deep blue via light blue precipitate',
      textClue: 'Blue copper sulfate solution first forms a light blue precipitate with ammonia, which then dissolves to give a deep blue solution when excess ammonia is added.',
      explanation: 'Cu(OH)₂ precipitate first forms, then dissolves in excess NH₃ to form [Cu(NH₃)₄]²⁺ complex.',
      difficulty: 3,
      topic: 'Complex formation via precipitation',
      additionalObservations: ['Two-stage reaction', 'Precipitate dissolves in excess reagent']
    },
    {
      id: 'cc-011',
      reactants: ['Zn²⁺', 'OH⁻ (excess)'],
      products: ['[Zn(OH)₄]²⁻'],
      initialColor: 'colorless',
      finalColor: 'colorless via white precipitate',
      colorDescription: 'colorless via white precipitate',
      textClue: 'Colorless zinc solution forms a white precipitate with sodium hydroxide, which dissolves in excess hydroxide to give a colorless solution.',
      explanation: 'Zn(OH)₂ precipitate forms first, then dissolves in excess OH⁻ to form zincate complex [Zn(OH)₄]²⁻.',
      difficulty: 3,
      topic: 'Amphoteric behavior',
      additionalObservations: ['Amphoteric hydroxide', 'Dissolves in both acid and excess base']
    },
    {
      id: 'cc-012',
      reactants: ['Cr³⁺', 'OH⁻ (excess)'],
      products: ['[Cr(OH)₄]⁻'],
      initialColor: 'green',
      finalColor: 'green via gray-green precipitate',
      colorDescription: 'green via gray-green precipitate',
      textClue: 'Green chromium solution forms a gray-green precipitate with hydroxide, which dissolves in excess to give a green solution.',
      explanation: 'Cr(OH)₃ precipitate forms, then dissolves in excess OH⁻ to form chromate(III) complex.',
      difficulty: 3,
      topic: 'Amphoteric behavior',
      additionalObservations: ['Gelatinous precipitate', 'Slow dissolution in excess base']
    },

    // Difficulty 4 - Organic reactions with color
    {
      id: 'cc-013',
      reactants: ['Benedict\'s reagent', 'reducing sugar'],
      products: ['Cu₂O'],
      initialColor: 'blue',
      finalColor: 'brick red',
      colorDescription: 'brick red',
      textClue: 'Blue Benedict\'s reagent turns brick red when heated with a reducing sugar.',
      explanation: 'Reducing sugars reduce Cu²⁺ in Benedict\'s reagent to Cu₂O (brick red precipitate).',
      difficulty: 2,
      topic: 'Biochemical test',
      additionalObservations: ['Requires heating', 'Precipitate formation', 'Quantitative test possible']
    },
    {
      id: 'cc-014',
      reactants: ['Fehling\'s reagent', 'aldehyde'],
      products: ['Cu₂O'],
      initialColor: 'blue',
      finalColor: 'brick red',
      colorDescription: 'brick red',
      textClue: 'Blue Fehling\'s reagent produces a brick red precipitate when heated with an aldehyde.',
      explanation: 'Aldehydes reduce Cu²⁺ in Fehling\'s reagent to Cu₂O (brick red precipitate).',
      difficulty: 2,
      topic: 'Organic functional group test',
      additionalObservations: ['Distinguishes aldehydes from ketones', 'Requires heating']
    },
    {
      id: 'cc-015',
      reactants: ['Bromine water', 'alkene'],
      products: ['dibromide'],
      initialColor: 'orange',
      finalColor: 'colorless',
      colorDescription: 'colorless',
      textClue: 'Orange bromine water becomes colorless when shaken with an alkene.',
      explanation: 'Alkenes undergo addition reactions with bromine, decolorizing the bromine water.',
      difficulty: 2,
      topic: 'Alkene test',
      additionalObservations: ['No HBr gas evolved', 'Addition reaction', 'Test for unsaturation']
    },

    // Difficulty 4-5 - Advanced reactions
    {
      id: 'cc-016',
      reactants: ['K₂Cr₂O₇', 'alcohol', 'H₂SO₄'],
      products: ['Cr³⁺', 'aldehyde/ketone'],
      initialColor: 'orange',
      finalColor: 'green',
      colorDescription: 'green',
      textClue: 'Orange acidified dichromate turns green when heated with an alcohol.',
      explanation: 'Alcohols are oxidized by dichromate, reducing Cr₂O₇²⁻ (orange) to Cr³⁺ (green).',
      difficulty: 3,
      topic: 'Alcohol oxidation',
      additionalObservations: ['Heat required', 'Different products for 1° and 2° alcohols']
    },
    {
      id: 'cc-017',
      reactants: ['Tollens\' reagent', 'aldehyde'],
      products: ['Ag mirror'],
      initialColor: 'colorless',
      finalColor: 'silver mirror',
      colorDescription: 'silver mirror',
      textClue: 'Colorless Tollens\' reagent forms a silver mirror on the test tube when heated gently with an aldehyde.',
      explanation: 'Aldehydes reduce Ag⁺ in Tollens\' reagent to metallic silver, forming a mirror.',
      difficulty: 3,
      topic: 'Aldehyde test',
      additionalObservations: ['Silver mirror formation', 'Gentle heating required', 'Specific for aldehydes']
    },
    {
      id: 'cc-018',
      reactants: ['Ninhydrin', 'amino acid'],
      products: ['purple complex'],
      initialColor: 'colorless',
      finalColor: 'purple',
      colorDescription: 'purple',
      textClue: 'Colorless ninhydrin solution turns purple when heated with an amino acid.',
      explanation: 'Ninhydrin reacts with amino acids to form a characteristic purple complex.',
      difficulty: 4,
      topic: 'Amino acid test',
      additionalObservations: ['Specific for amino acids', 'Used in chromatography', 'Heat required']
    },
    {
      id: 'cc-019',
      reactants: ['Biuret reagent', 'protein'],
      products: ['purple complex'],
      initialColor: 'blue',
      finalColor: 'purple',
      colorDescription: 'purple',
      textClue: 'Blue biuret reagent turns purple in the presence of proteins.',
      explanation: 'Proteins with peptide bonds form purple complexes with copper ions in biuret reagent.',
      difficulty: 3,
      topic: 'Protein test',
      additionalObservations: ['Tests for peptide bonds', 'No heating required', 'Quantitative test possible']
    },

    // Difficulty 5 - Very advanced
    {
      id: 'cc-020',
      reactants: ['Nessler\'s reagent', 'NH₃'],
      products: ['brown complex'],
      initialColor: 'colorless',
      finalColor: 'brown',
      colorDescription: 'brown',
      textClue: 'Colorless Nessler\'s reagent turns brown when ammonia is present.',
      explanation: 'Nessler\'s reagent (K₂HgI₄) forms a brown complex with ammonia.',
      difficulty: 4,
      topic: 'Ammonia test',
      additionalObservations: ['Very sensitive test', 'Mercury-based reagent', 'Quantitative analysis possible']
    },
    {
      id: 'cc-021',
      reactants: ['Dragendorff\'s reagent', 'alkaloid'],
      products: ['orange precipitate'],
      initialColor: 'colorless',
      finalColor: 'orange',
      colorDescription: 'orange',
      textClue: 'Colorless Dragendorff\'s reagent produces an orange precipitate with alkaloids.',
      explanation: 'Dragendorff\'s reagent forms orange precipitates with nitrogen-containing alkaloids.',
      difficulty: 5,
      topic: 'Alkaloid test',
      additionalObservations: ['Specific for alkaloids', 'Used in forensic analysis', 'Bismuth-based reagent']
    },
    {
      id: 'cc-022',
      reactants: ['Molisch\'s reagent', 'carbohydrate', 'H₂SO₄'],
      products: ['purple ring'],
      initialColor: 'colorless',
      finalColor: 'purple ring',
      colorDescription: 'purple ring',
      textClue: 'A purple ring forms at the interface when concentrated sulfuric acid is carefully layered under a solution containing carbohydrate and Molisch\'s reagent.',
      explanation: 'Carbohydrates are dehydrated by sulfuric acid to form furfural derivatives that give purple colors with α-naphthol.',
      difficulty: 5,
      topic: 'Carbohydrate test',
      additionalObservations: ['Ring test technique', 'General test for carbohydrates', 'Concentrated acid required']
    },
    {
      id: 'cc-023',
      reactants: ['Schiff\'s reagent', 'aldehyde'],
      products: ['magenta complex'],
      initialColor: 'colorless',
      finalColor: 'magenta',
      colorDescription: 'magenta',
      textClue: 'Colorless Schiff\'s reagent turns magenta (bright pink) when an aldehyde is added.',
      explanation: 'Aldehydes restore the magenta color to decolorized fuchsin (Schiff\'s reagent).',
      difficulty: 4,
      topic: 'Aldehyde test',
      additionalObservations: ['Specific for aldehydes', 'Decolorized fuchsin', 'Sensitive test']
    },
    {
      id: 'cc-024',
      reactants: ['Lucas reagent', 'alcohol'],
      products: ['alkyl chloride'],
      initialColor: 'colorless',
      finalColor: 'cloudy',
      colorDescription: 'cloudy',
      textClue: 'Clear Lucas reagent becomes cloudy when mixed with certain alcohols, with the rate depending on the alcohol type.',
      explanation: 'Lucas reagent converts alcohols to alkyl chlorides; tertiary alcohols react immediately (cloudy), secondary slowly, primary very slowly.',
      difficulty: 4,
      topic: 'Alcohol classification',
      additionalObservations: ['Rate depends on alcohol type', 'Cloudiness indicates reaction', 'SN1 mechanism']
    },
    {
      id: 'cc-025',
      reactants: ['Ceric ammonium nitrate', 'alcohol'],
      products: ['Ce³⁺ complex'],
      initialColor: 'yellow',
      finalColor: 'red',
      colorDescription: 'red',
      textClue: 'Yellow ceric ammonium nitrate solution turns red when an alcohol is added.',
      explanation: 'Alcohols reduce Ce⁴⁺ (yellow) to Ce³⁺, forming red complexes.',
      difficulty: 5,
      topic: 'Alcohol test',
      additionalObservations: ['Oxidation-reduction reaction', 'Cerium-based test', 'Color change indicates alcohol']
    }
  ];

  private mysteryReactions: MysteryReaction[] = [
    // Difficulty 1-2 - Common gas evolution reactions
    {
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
      difficulty: 1,
      topic: 'Acid-carbonate reaction',
      crystalBallVideo: {
        title: 'The Chemistry of Limestone and Acid Rain',
        description: 'Dr. Sarah Chen explains how acid-carbonate reactions affect limestone buildings and natural formations.',
        expertName: 'Dr. Sarah Chen',
        duration: '3:45'
      }
    },
    {
      id: 'mr-002',
      reactants: ['Zn', 'HCl'],
      products: ['ZnCl₂', 'H₂'],
      gasProduced: 'H₂',
      gasProperties: {
        color: 'colorless',
        smell: 'odorless',
        density: 'lighter than air',
        solubility: 'insoluble in water',
        flammability: 'highly flammable',
        toxicity: 'non-toxic'
      },
      visualEffects: ['steady bubbling', 'metal surface becomes rough', 'gas bubbles rise quickly'],
      equation: 'Zn + 2HCl → ZnCl₂ + H₂',
      explanation: 'Zinc metal displaces hydrogen from hydrochloric acid, producing hydrogen gas which burns with a pop sound.',
      difficulty: 1,
      topic: 'Metal-acid reaction',
      crystalBallVideo: {
        title: 'Hydrogen: The Lightest Element',
        description: 'Prof. Michael Torres demonstrates hydrogen production and its unique properties.',
        expertName: 'Prof. Michael Torres',
        duration: '4:20'
      }
    },
    {
      id: 'mr-003',
      reactants: ['NH₄Cl', 'NaOH'],
      products: ['NaCl', 'H₂O', 'NH₃'],
      gasProduced: 'NH₃',
      gasProperties: {
        color: 'colorless',
        smell: 'pungent, fishy',
        density: 'lighter than air',
        solubility: 'very soluble in water',
        flammability: 'flammable',
        toxicity: 'toxic, irritating'
      },
      visualEffects: ['gentle warming', 'strong smell develops', 'turns damp red litmus blue'],
      equation: 'NH₄Cl + NaOH → NaCl + H₂O + NH₃',
      explanation: 'Ammonium chloride reacts with sodium hydroxide to produce ammonia gas, which has a characteristic pungent smell.',
      difficulty: 2,
      topic: 'Base displacement',
      crystalBallVideo: {
        title: 'Ammonia in Industry and Nature',
        description: 'Dr. Lisa Park explores the role of ammonia in fertilizers and biological systems.',
        expertName: 'Dr. Lisa Park',
        duration: '5:15'
      }
    },
    {
      id: 'mr-004',
      reactants: ['Na₂SO₃', 'HCl'],
      products: ['NaCl', 'H₂O', 'SO₂'],
      gasProduced: 'SO₂',
      gasProperties: {
        color: 'colorless',
        smell: 'sharp, choking',
        density: 'denser than air',
        solubility: 'very soluble in water',
        flammability: 'non-flammable',
        toxicity: 'toxic, respiratory irritant'
      },
      visualEffects: ['immediate fizzing', 'choking smell', 'solution may turn cloudy'],
      equation: 'Na₂SO₃ + 2HCl → 2NaCl + H₂O + SO₂',
      explanation: 'Sodium sulfite reacts with hydrochloric acid to produce sulfur dioxide, a toxic gas with a characteristic sharp smell.',
      difficulty: 2,
      topic: 'Sulfite-acid reaction',
      crystalBallVideo: {
        title: 'Sulfur Dioxide: Environmental Impact',
        description: 'Prof. James Wilson discusses SO₂ in acid rain formation and industrial processes.',
        expertName: 'Prof. James Wilson',
        duration: '4:50'
      }
    },

    // Difficulty 2-3 - More complex reactions
    {
      id: 'mr-005',
      reactants: ['KMnO₄', 'HCl'],
      products: ['KCl', 'MnCl₂', 'H₂O', 'Cl₂'],
      gasProduced: 'Cl₂',
      gasProperties: {
        color: 'pale green-yellow',
        smell: 'sharp, bleach-like',
        density: 'denser than air',
        solubility: 'moderately soluble in water',
        flammability: 'non-flammable but supports combustion',
        toxicity: 'highly toxic'
      },
      visualEffects: ['purple solution turns colorless', 'green-yellow gas evolved', 'strong bleach smell'],
      equation: '2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 8H₂O + 5Cl₂',
      explanation: 'Potassium permanganate oxidizes hydrochloric acid, producing chlorine gas which is toxic and has bleaching properties.',
      difficulty: 3,
      topic: 'Redox gas evolution',
      crystalBallVideo: {
        title: 'Chlorine: From Water Treatment to Chemical Warfare',
        description: 'Dr. Rachel Green examines the dual nature of chlorine in modern society.',
        expertName: 'Dr. Rachel Green',
        duration: '6:30'
      }
    },
    {
      id: 'mr-006',
      reactants: ['CaC₂', 'H₂O'],
      products: ['Ca(OH)₂', 'C₂H₂'],
      gasProduced: 'C₂H₂',
      gasProperties: {
        color: 'colorless',
        smell: 'garlic-like (if impure)',
        density: 'lighter than air',
        solubility: 'slightly soluble in water',
        flammability: 'extremely flammable',
        toxicity: 'mildly toxic'
      },
      visualEffects: ['vigorous reaction with water', 'heat evolution', 'gas burns with sooty flame'],
      equation: 'CaC₂ + 2H₂O → Ca(OH)₂ + C₂H₂',
      explanation: 'Calcium carbide reacts violently with water to produce acetylene gas, which burns with a very hot flame.',
      difficulty: 3,
      topic: 'Carbide hydrolysis',
      crystalBallVideo: {
        title: 'Acetylene: The Hottest Flame',
        description: 'Prof. David Kim demonstrates acetylene welding and its industrial applications.',
        expertName: 'Prof. David Kim',
        duration: '5:40'
      }
    },
    {
      id: 'mr-007',
      reactants: ['NaNO₂', 'NH₄Cl', 'heat'],
      products: ['NaCl', 'H₂O', 'N₂'],
      gasProduced: 'N₂',
      gasProperties: {
        color: 'colorless',
        smell: 'odorless',
        density: 'similar to air',
        solubility: 'insoluble in water',
        flammability: 'non-flammable',
        toxicity: 'non-toxic'
      },
      visualEffects: ['gentle bubbling when heated', 'no visible gas', 'solution volume decreases'],
      equation: 'NaNO₂ + NH₄Cl → NaCl + H₂O + N₂',
      explanation: 'Sodium nitrite and ammonium chloride react when heated to produce nitrogen gas, which is inert and colorless.',
      difficulty: 3,
      topic: 'Nitrogen formation',
      crystalBallVideo: {
        title: 'Nitrogen: The Inert Atmosphere',
        description: 'Dr. Anna Martinez explains nitrogen\'s role in preserving food and creating inert atmospheres.',
        expertName: 'Dr. Anna Martinez',
        duration: '4:15'
      }
    },

    // Difficulty 3-4 - Advanced reactions
    {
      id: 'mr-008',
      reactants: ['Cu', 'HNO₃ (conc.)'],
      products: ['Cu(NO₃)₂', 'H₂O', 'NO₂'],
      gasProduced: 'NO₂',
      gasProperties: {
        color: 'brown/reddish-brown',
        smell: 'sharp, acrid',
        density: 'denser than air',
        solubility: 'very soluble in water',
        flammability: 'non-flammable but supports combustion',
        toxicity: 'highly toxic'
      },
      visualEffects: ['brown gas evolution', 'copper dissolves', 'solution turns blue-green'],
      equation: 'Cu + 4HNO₃ → Cu(NO₃)₂ + 2H₂O + 2NO₂',
      explanation: 'Copper reacts with concentrated nitric acid to produce nitrogen dioxide, a toxic brown gas.',
      difficulty: 4,
      topic: 'Metal-nitric acid reaction',
      crystalBallVideo: {
        title: 'Nitrogen Oxides: Atmospheric Chemistry',
        description: 'Prof. Robert Chang discusses NOₓ gases in air pollution and atmospheric reactions.',
        expertName: 'Prof. Robert Chang',
        duration: '7:20'
      }
    },
    {
      id: 'mr-009',
      reactants: ['FeS', 'HCl'],
      products: ['FeCl₂', 'H₂S'],
      gasProduced: 'H₂S',
      gasProperties: {
        color: 'colorless',
        smell: 'rotten eggs',
        density: 'denser than air',
        solubility: 'moderately soluble in water',
        flammability: 'flammable',
        toxicity: 'highly toxic'
      },
      visualEffects: ['strong rotten egg smell', 'blackens silver', 'bubbling'],
      equation: 'FeS + 2HCl → FeCl₂ + H₂S',
      explanation: 'Iron sulfide reacts with hydrochloric acid to produce hydrogen sulfide, which has a characteristic rotten egg smell.',
      difficulty: 2,
      topic: 'Sulfide-acid reaction',
      crystalBallVideo: {
        title: 'Hydrogen Sulfide: Nature\'s Warning Signal',
        description: 'Dr. Emma Thompson explores H₂S in volcanic gases and biological systems.',
        expertName: 'Dr. Emma Thompson',
        duration: '5:25'
      }
    },
    {
      id: 'mr-010',
      reactants: ['Mg₃N₂', 'H₂O'],
      products: ['Mg(OH)₂', 'NH₃'],
      gasProduced: 'NH₃',
      gasProperties: {
        color: 'colorless',
        smell: 'pungent, fishy',
        density: 'lighter than air',
        solubility: 'very soluble in water',
        flammability: 'flammable',
        toxicity: 'toxic, irritating'
      },
      visualEffects: ['white precipitate forms', 'strong ammonia smell', 'alkaline solution'],
      equation: 'Mg₃N₂ + 6H₂O → 3Mg(OH)₂ + 2NH₃',
      explanation: 'Magnesium nitride hydrolyzes in water to produce ammonia gas and magnesium hydroxide precipitate.',
      difficulty: 3,
      topic: 'Nitride hydrolysis',
      crystalBallVideo: {
        title: 'Metal Nitrides: Unusual Compounds',
        description: 'Prof. Kevin Lee demonstrates the unique properties of metal nitrides.',
        expertName: 'Prof. Kevin Lee',
        duration: '4:45'
      }
    },

    // Difficulty 4-5 - Very advanced reactions
    {
      id: 'mr-011',
      reactants: ['P₄', 'NaOH', 'H₂O'],
      products: ['NaH₂PO₂', 'PH₃'],
      gasProduced: 'PH₃',
      gasProperties: {
        color: 'colorless',
        smell: 'garlic-like, fishy',
        density: 'denser than air',
        solubility: 'slightly soluble in water',
        flammability: 'spontaneously flammable in air',
        toxicity: 'extremely toxic'
      },
      visualEffects: ['white phosphorus glows', 'spontaneous ignition of gas', 'garlic smell'],
      equation: 'P₄ + 3NaOH + 3H₂O → 3NaH₂PO₂ + PH₃',
      explanation: 'White phosphorus disproportionates in alkali to produce phosphine gas, which is extremely toxic and spontaneously flammable.',
      difficulty: 5,
      topic: 'Phosphorus disproportionation',
      crystalBallVideo: {
        title: 'Phosphine: The Deadly Gas',
        description: 'Dr. Maria Santos discusses phosphine\'s role in fumigation and its extreme toxicity.',
        expertName: 'Dr. Maria Santos',
        duration: '6:15'
      }
    },
    {
      id: 'mr-012',
      reactants: ['Al₄C₃', 'H₂O'],
      products: ['Al(OH)₃', 'CH₄'],
      gasProduced: 'CH₄',
      gasProperties: {
        color: 'colorless',
        smell: 'odorless',
        density: 'lighter than air',
        solubility: 'insoluble in water',
        flammability: 'highly flammable',
        toxicity: 'non-toxic but asphyxiant'
      },
      visualEffects: ['aluminum hydroxide precipitate', 'gas bubbles', 'burns with blue flame'],
      equation: 'Al₄C₃ + 12H₂O → 4Al(OH)₃ + 3CH₄',
      explanation: 'Aluminum carbide hydrolyzes to produce methane gas and aluminum hydroxide precipitate.',
      difficulty: 4,
      topic: 'Carbide hydrolysis',
      crystalBallVideo: {
        title: 'Methane: From Swamps to Energy',
        description: 'Prof. Jennifer Walsh explores methane as a greenhouse gas and energy source.',
        expertName: 'Prof. Jennifer Walsh',
        duration: '5:55'
      }
    },
    {
      id: 'mr-013',
      reactants: ['NaClO', 'NH₃'],
      products: ['NaCl', 'H₂O', 'N₂H₄'],
      gasProduced: 'N₂H₄',
      gasProperties: {
        color: 'colorless',
        smell: 'ammonia-like',
        density: 'similar to air',
        solubility: 'very soluble in water',
        flammability: 'highly flammable',
        toxicity: 'highly toxic, carcinogenic'
      },
      visualEffects: ['solution becomes warm', 'ammonia-like smell', 'may form explosive mixture'],
      equation: '3NaClO + NH₃ → 3NaCl + 3H₂O + N₂H₄',
      explanation: 'Sodium hypochlorite reacts with ammonia to produce hydrazine, an extremely toxic and explosive compound.',
      difficulty: 5,
      topic: 'Dangerous gas formation',
      crystalBallVideo: {
        title: 'Hydrazine: Rocket Fuel and Poison',
        description: 'Dr. Thomas Brown explains hydrazine\'s use in space exploration and its extreme dangers.',
        expertName: 'Dr. Thomas Brown',
        duration: '7:45'
      }
    },
    {
      id: 'mr-014',
      reactants: ['CaP₂', 'H₂O'],
      products: ['Ca(OH)₂', 'PH₃'],
      gasProduced: 'PH₃',
      gasProperties: {
        color: 'colorless',
        smell: 'garlic-like, fishy',
        density: 'denser than air',
        solubility: 'slightly soluble in water',
        flammability: 'spontaneously flammable in air',
        toxicity: 'extremely toxic'
      },
      visualEffects: ['spontaneous ignition', 'white smoke rings', 'garlic odor'],
      equation: 'CaP₂ + 6H₂O → 3Ca(OH)₂ + 2PH₃',
      explanation: 'Calcium phosphide reacts with water to produce phosphine gas, which ignites spontaneously in air.',
      difficulty: 5,
      topic: 'Phosphide hydrolysis',
      crystalBallVideo: {
        title: 'Will-o\'-the-Wisp: Chemistry of Ghost Lights',
        description: 'Prof. Helen Carter explains how phosphine creates mysterious lights in nature.',
        expertName: 'Prof. Helen Carter',
        duration: '6:00'
      }
    },
    {
      id: 'mr-015',
      reactants: ['SiH₄', 'air'],
      products: ['SiO₂', 'H₂O'],
      gasProduced: 'SiH₄',
      gasProperties: {
        color: 'colorless',
        smell: 'odorless',
        density: 'denser than air',
        solubility: 'decomposes in water',
        flammability: 'spontaneously flammable in air',
        toxicity: 'toxic',
      },
      visualEffects: ['spontaneous ignition', 'white smoke formation', 'bright flame'],
      equation: 'SiH₄ + 2O₂ → SiO₂ + 2H₂O',
      explanation: 'Silane gas ignites spontaneously in air, producing silicon dioxide and water vapor.',
      difficulty: 5,
      topic: 'Silane combustion',
      crystalBallVideo: {
        title: 'Silane: Silicon\'s Dangerous Cousin',
        description: 'Dr. Patricia Adams discusses silane\'s use in semiconductor manufacturing.',
        expertName: 'Dr. Patricia Adams',
        duration: '5:30'
      }
    },
    {
      id: 'mr-016',
      reactants: ['AsH₃', 'heat'],
      products: ['As', 'H₂'],
      gasProduced: 'AsH₃',
      gasProperties: {
        color: 'colorless',
        smell: 'garlic-like',
        density: 'denser than air',
        solubility: 'slightly soluble in water',
        flammability: 'flammable',
        toxicity: 'extremely toxic'
      },
      visualEffects: ['garlic smell', 'metallic mirror formation', 'decomposition on heating'],
      equation: '2AsH₃ → 2As + 3H₂',
      explanation: 'Arsine gas decomposes on heating to produce metallic arsenic and hydrogen gas. Extremely toxic.',
      difficulty: 5,
      topic: 'Arsine decomposition',
      crystalBallVideo: {
        title: 'Arsine: The Silent Killer',
        description: 'Prof. Mark Johnson discusses arsine poisoning in industrial accidents.',
        expertName: 'Prof. Mark Johnson',
        duration: '8:10'
      }
    },
    {
      id: 'mr-017',
      reactants: ['Sb₂O₃', 'Zn', 'HCl'],
      products: ['ZnCl₂', 'H₂O', 'SbH₃'],
      gasProduced: 'SbH₃',
      gasProperties: {
        color: 'colorless',
        smell: 'odorless',
        density: 'denser than air',
        solubility: 'slightly soluble in water',
        flammability: 'flammable',
        toxicity: 'extremely toxic'
      },
      visualEffects: ['metallic mirror formation', 'gas decomposes on heating', 'no obvious smell'],
      equation: 'Sb₂O₃ + 3Zn + 6HCl → 3ZnCl₂ + 3H₂O + 2SbH₃',
      explanation: 'Antimony oxide is reduced by zinc in acid to produce stibine gas, which is extremely toxic.',
      difficulty: 5,
      topic: 'Stibine formation',
      crystalBallVideo: {
        title: 'Stibine: The Marsh Test for Antimony',
        description: 'Dr. Catherine Lee demonstrates historical methods for detecting antimony poisoning.',
        expertName: 'Dr. Catherine Lee',
        duration: '6:45'
      }
    },
    {
      id: 'mr-018',
      reactants: ['GeH₄', 'air'],
      products: ['GeO₂', 'H₂O'],
      gasProduced: 'GeH₄',
      gasProperties: {
        color: 'colorless',
        smell: 'odorless',
        density: 'denser than air',
        solubility: 'decomposes in water',
        flammability: 'flammable in air',
        toxicity: 'toxic'
      },
      visualEffects: ['burns with pale flame', 'white smoke formation', 'germanium mirror'],
      equation: 'GeH₄ + 2O₂ → GeO₂ + 2H₂O',
      explanation: 'Germane gas burns in air to produce germanium dioxide and water vapor.',
      difficulty: 5,
      topic: 'Germane combustion',
      crystalBallVideo: {
        title: 'Germanium Hydrides: Semiconductor Chemistry',
        description: 'Prof. Steven Clark explores germanium compounds in electronics.',
        expertName: 'Prof. Steven Clark',
        duration: '5:20'
      }
    },
    {
      id: 'mr-019',
      reactants: ['B₂H₆', 'air'],
      products: ['B₂O₃', 'H₂O'],
      gasProduced: 'B₂H₆',
      gasProperties: {
        color: 'colorless',
        smell: 'sweet',
        density: 'similar to air',
        solubility: 'hydrolyzes in water',
        flammability: 'spontaneously flammable in air',
        toxicity: 'toxic'
      },
      visualEffects: ['green flame', 'spontaneous ignition', 'white smoke'],
      equation: 'B₂H₆ + 3O₂ → B₂O₃ + 3H₂O',
      explanation: 'Diborane ignites spontaneously in air, burning with a characteristic green flame.',
      difficulty: 5,
      topic: 'Borane combustion',
      crystalBallVideo: {
        title: 'Diborane: Rocket Fuel Chemistry',
        description: 'Dr. Michelle Rodriguez discusses borane compounds as high-energy fuels.',
        expertName: 'Dr. Michelle Rodriguez',
        duration: '6:25'
      }
    },
    {
      id: 'mr-020',
      reactants: ['ClF₃', 'organic matter'],
      products: ['various fluorides', 'CO₂', 'HF'],
      gasProduced: 'HF',
      gasProperties: {
        color: 'colorless',
        smell: 'sharp, acrid',
        density: 'similar to air',
        solubility: 'very soluble in water',
        flammability: 'non-flammable but highly reactive',
        toxicity: 'extremely toxic and corrosive'
      },
      visualEffects: ['violent reaction', 'white fumes', 'etches glass'],
      equation: 'ClF₃ + organic matter → fluorides + CO₂ + HF',
      explanation: 'Chlorine trifluoride reacts violently with organic matter, producing hydrogen fluoride among other products.',
      difficulty: 5,
      topic: 'Extreme fluorination',
      crystalBallVideo: {
        title: 'Chlorine Trifluoride: The Most Dangerous Chemical',
        description: 'Prof. Daniel White explains why ClF₃ is considered one of the most dangerous chemicals known.',
        expertName: 'Prof. Daniel White',
        duration: '7:55'
      }
    }
  ];

  async getChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    
    // Generate precipitation poker challenges
    for (let i = 0; i < this.precipitationReactions.length; i++) {
      const reaction = this.precipitationReactions[i];
      const challenge = await this.generatePrecipitatePokerChallenge(reaction.difficulty, reaction);
      challenges.push(challenge);
    }

    // Generate color clash challenges
    for (let i = 0; i < this.colorChangeReactions.length; i++) {
      const reaction = this.colorChangeReactions[i];
      const challenge = await this.generateColorClashChallenge(reaction.difficulty, reaction);
      challenges.push(challenge);
    }

    // Generate mystery reaction challenges
    for (let i = 0; i < this.mysteryReactions.length; i++) {
      const reaction = this.mysteryReactions[i];
      const challenge = await this.generateMysteryReactionChallenge(reaction.difficulty, reaction);
      challenges.push(challenge);
    }

    return challenges;
  }

  async generateChallenge(difficulty: number): Promise<Challenge> {
    // Randomly choose between precipitation poker, color clash, and mystery reaction
    const challengeTypes = ['precipitation', 'color_clash', 'mystery_reaction'];
    const selectedType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

    if (selectedType === 'precipitation') {
      // Filter precipitation reactions by difficulty
      const suitableReactions = this.precipitationReactions.filter(r => r.difficulty === difficulty);
      
      if (suitableReactions.length === 0) {
        // Fallback to closest difficulty
        const closestReactions = this.precipitationReactions.filter(r => 
          Math.abs(r.difficulty - difficulty) <= 1
        );
        const randomReaction = closestReactions[Math.floor(Math.random() * closestReactions.length)];
        return this.generatePrecipitatePokerChallenge(difficulty, randomReaction);
      }

      const randomReaction = suitableReactions[Math.floor(Math.random() * suitableReactions.length)];
      return this.generatePrecipitatePokerChallenge(difficulty, randomReaction);
    } else if (selectedType === 'color_clash') {
      // Filter color change reactions by difficulty
      const suitableReactions = this.colorChangeReactions.filter(r => r.difficulty === difficulty);
      
      if (suitableReactions.length === 0) {
        // Fallback to closest difficulty
        const closestReactions = this.colorChangeReactions.filter(r => 
          Math.abs(r.difficulty - difficulty) <= 1
        );
        const randomReaction = closestReactions[Math.floor(Math.random() * closestReactions.length)];
        return this.generateColorClashChallenge(difficulty, randomReaction);
      }

      const randomReaction = suitableReactions[Math.floor(Math.random() * suitableReactions.length)];
      return this.generateColorClashChallenge(difficulty, randomReaction);
    } else {
      // Filter mystery reactions by difficulty
      const suitableReactions = this.mysteryReactions.filter(r => r.difficulty === difficulty);
      
      if (suitableReactions.length === 0) {
        // Fallback to closest difficulty
        const closestReactions = this.mysteryReactions.filter(r => 
          Math.abs(r.difficulty - difficulty) <= 1
        );
        const randomReaction = closestReactions[Math.floor(Math.random() * closestReactions.length)];
        return this.generateMysteryReactionChallenge(difficulty, randomReaction);
      }

      const randomReaction = suitableReactions[Math.floor(Math.random() * suitableReactions.length)];
      return this.generateMysteryReactionChallenge(difficulty, randomReaction);
    }
  }

  private async generatePrecipitatePokerChallenge(
    difficulty: number, 
    reactionData: PrecipitationReaction
  ): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.PRECIPITATION_POKER,
      difficulty,
      `Precipitate Poker: ${reactionData.topic}`,
      `Predict whether a precipitate will form when these solutions are mixed.`
    );

    const betOptions: BetOption[] = [
      {
        id: 'precipitate_yes_high',
        description: 'Precipitate will form (High confidence)',
        odds: reactionData.willPrecipitate ? 1.2 : 0.1,
        confidenceLevel: 'high'
      },
      {
        id: 'precipitate_yes_medium',
        description: 'Precipitate will form (Medium confidence)',
        odds: reactionData.willPrecipitate ? 1.5 : 0.3,
        confidenceLevel: 'medium'
      },
      {
        id: 'precipitate_yes_low',
        description: 'Precipitate will form (Low confidence)',
        odds: reactionData.willPrecipitate ? 2.0 : 0.5,
        confidenceLevel: 'low'
      },
      {
        id: 'precipitate_no_high',
        description: 'No precipitate will form (High confidence)',
        odds: !reactionData.willPrecipitate ? 1.2 : 0.1,
        confidenceLevel: 'high'
      },
      {
        id: 'precipitate_no_medium',
        description: 'No precipitate will form (Medium confidence)',
        odds: !reactionData.willPrecipitate ? 1.5 : 0.3,
        confidenceLevel: 'medium'
      },
      {
        id: 'precipitate_no_low',
        description: 'No precipitate will form (Low confidence)',
        odds: !reactionData.willPrecipitate ? 2.0 : 0.5,
        confidenceLevel: 'low'
      }
    ];

    const content: ChallengeContent = {
      question: `What happens when ${reactionData.reactant1} solution is mixed with ${reactionData.reactant2} solution?\n\nPlace your bet on the outcome:`,
      correctAnswer: reactionData.willPrecipitate ? 'precipitate' : 'no_precipitate',
      explanation: reactionData.explanation,
      hints: [
        "Consider the solubility rules for ionic compounds",
        "Check if any of the possible products are insoluble",
        "Remember: most nitrates and acetates are soluble",
        `This involves ${reactionData.topic}`
      ],
      visualAids: [
        {
          type: 'diagram',
          url: `/images/reactions/${reactionData.topic.replace(/\s+/g, '_')}.png`,
          altText: `Diagram showing ${reactionData.topic} reaction`,
          interactive: false
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: Math.max(45, difficulty * 15), // 45-75 seconds based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['precipitation', 'solubility rules', reactionData.topic],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        gameSpecific: {
          reaction: reactionData,
          betOptions,
          currentBankroll: 1000 // Starting bankroll
        }
      }
    } as Challenge;
  }

  private async generateColorClashChallenge(
    difficulty: number, 
    reactionData: ColorChangeReaction
  ): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.COLOR_CLASH,
      difficulty,
      `Color Clash: ${reactionData.topic}`,
      `Describe the color change in this chemical reaction based on the given clues.`
    );

    const content: ChallengeContent = {
      question: `${reactionData.textClue}\n\nDescribe the color change you would observe:`,
      correctAnswer: reactionData.colorDescription.toLowerCase(),
      explanation: reactionData.explanation,
      hints: [
        "Consider the initial and final states of the reaction",
        "Think about what chemical species are responsible for the colors",
        "Look for clues about the type of reaction occurring",
        `This involves ${reactionData.topic}`
      ],
      visualAids: [
        {
          type: 'diagram',
          url: `/images/color_changes/${reactionData.topic.replace(/\s+/g, '_')}.png`,
          altText: `Diagram showing ${reactionData.topic} color change`,
          interactive: false
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: Math.max(90, difficulty * 20), // 90-190 seconds based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['color changes', 'chemical reactions', reactionData.topic],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        gameSpecific: {
          reaction: reactionData,
          maxScore: 100,
          scoringCriteria: {
            exactMatch: 100,
            partialMatch: 60,
            colorMentioned: 30,
            noMatch: 0
          }
        }
      }
    } as Challenge;
  }

  private async generateMysteryReactionChallenge(
    difficulty: number, 
    reactionData: MysteryReaction
  ): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.MYSTERY_REACTION,
      difficulty,
      `Mystery Reaction: ${reactionData.topic}`,
      `Watch the animated reaction and identify the gas produced, then write the balanced equation.`
    );

    // Generate gas options for multiple choice
    const allGases = ['H₂', 'O₂', 'CO₂', 'NH₃', 'SO₂', 'Cl₂', 'H₂S', 'NO₂', 'N₂', 'CH₄', 'C₂H₂', 'PH₃', 'HF'];
    const gasOptions = [reactionData.gasProduced];
    
    // Add 3-4 other plausible gas options
    while (gasOptions.length < 4) {
      const randomGas = allGases[Math.floor(Math.random() * allGases.length)];
      if (!gasOptions.includes(randomGas)) {
        gasOptions.push(randomGas);
      }
    }
    
    // Shuffle the options
    for (let i = gasOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gasOptions[i], gasOptions[j]] = [gasOptions[j], gasOptions[i]];
    }

    const content: ChallengeContent = {
      question: `Watch the animated reaction and answer the following:\n\n1. What gas is being produced?\n2. Write the balanced chemical equation for this reaction.\n\nReactants: ${reactionData.reactants.join(' + ')}\nVisual effects: ${reactionData.visualEffects.join(', ')}`,
      correctAnswer: JSON.stringify({
        gas: reactionData.gasProduced,
        equation: reactionData.equation
      }),
      explanation: reactionData.explanation,
      hints: [
        "Observe the visual effects carefully - they give clues about the gas",
        "Consider the properties of different gases (color, smell, density)",
        "Think about what type of reaction this might be",
        `This involves ${reactionData.topic}`
      ],
      visualAids: [
        {
          type: 'animation',
          url: `/animations/reactions/${reactionData.id}.mp4`,
          altText: `Animation showing ${reactionData.topic} reaction`,
          interactive: true
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: Math.max(120, difficulty * 30), // 120-270 seconds based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['gas identification', 'chemical equations', reactionData.topic],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        gameSpecific: {
          reaction: reactionData,
          gasOptions,
          maxScore: 100,
          scoringCriteria: {
            bothCorrect: 100,
            gasOnly: 60,
            equationOnly: 40,
            neither: 0
          }
        }
      }
    } as Challenge;
  }

  async validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    // Handle different challenge types
    if (challenge.type === ChallengeType.COLOR_CLASH) {
      return this.validateColorClashAnswer(challenge, answer);
    } else if (challenge.type === ChallengeType.PRECIPITATION_POKER) {
      return this.validatePrecipitatePokerAnswer(challenge, answer);
    } else if (challenge.type === ChallengeType.MYSTERY_REACTION) {
      return this.validateMysteryReactionAnswer(challenge, answer);
    }
    
    return {
      isCorrect: false,
      score: 0,
      feedback: "Unknown challenge type",
      explanation: "This challenge type is not supported"
    };
  }

  private async validateColorClashAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (typeof answer.response !== 'string') {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide a text description of the color change",
        explanation: "Answer should be a text description"
      };
    }

    const userAnswer = (answer.response as string).toLowerCase().trim();
    const correctAnswer = (challenge.content.correctAnswer as string).toLowerCase();
    const gameData = challenge.metadata?.gameSpecific;
    const reaction = gameData?.reaction as ColorChangeReaction;

    // Scoring logic for color descriptions
    let score = 0;
    let isCorrect = false;
    let feedback = "";

    // Check for exact match
    if (userAnswer === correctAnswer) {
      isCorrect = true;
      score = 100;
      feedback = "Perfect! You described the color change exactly right!";
    }
    // Check for partial matches
    else if (this.checkColorMatch(userAnswer, correctAnswer)) {
      isCorrect = true;
      score = 80;
      feedback = "Great! You got the main color change correct!";
    }
    // Check if they mentioned the correct colors
    else if (this.checkColorMentioned(userAnswer, reaction)) {
      score = 60;
      feedback = "Good! You mentioned the right colors, but could be more specific about the change.";
    }
    // Check if they mentioned any relevant colors
    else if (this.checkAnyColorMentioned(userAnswer)) {
      score = 30;
      feedback = "You mentioned some colors, but not quite the right description.";
    }
    else {
      score = 0;
      feedback = "Not quite right. Try to describe what color change you would observe.";
    }

    return {
      isCorrect,
      score,
      feedback,
      explanation: challenge.content.explanation,
      metadata: {
        userDescription: userAnswer,
        expectedDescription: correctAnswer,
        detailedFeedback: this.generateDetailedColorFeedback(userAnswer, reaction)
      }
    };
  }

  private async validatePrecipitatePokerAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (typeof answer.response !== 'object' || answer.response === null) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please select a betting option and specify your wager amount",
        explanation: "Answer should include both prediction and bet amount"
      };
    }

    const userAnswer = answer.response as { 
      prediction: string; 
      betAmount: number; 
      confidenceLevel: string;
    };

    if (!userAnswer.prediction || !userAnswer.betAmount || !userAnswer.confidenceLevel) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide prediction, bet amount, and confidence level",
        explanation: "Complete betting information is required"
      };
    }

    const correctAnswer = challenge.content.correctAnswer as string;
    const isCorrectPrediction = 
      (correctAnswer === 'precipitate' && userAnswer.prediction.includes('yes')) ||
      (correctAnswer === 'no_precipitate' && userAnswer.prediction.includes('no'));

    // Calculate winnings based on bet and odds
    const gameData = challenge.metadata?.gameSpecific;
    const betOptions = gameData?.betOptions || [];
    const selectedBet = betOptions.find((bet: any) => bet.id === userAnswer.prediction);
    
    let winnings = 0;
    let score = 0;

    if (isCorrectPrediction && selectedBet) {
      winnings = Math.floor(userAnswer.betAmount * selectedBet.odds);
      // Higher score for higher confidence correct bets
      const confidenceMultiplier = userAnswer.confidenceLevel === 'high' ? 1.5 : 
                                  userAnswer.confidenceLevel === 'medium' ? 1.2 : 1.0;
      score = Math.floor(winnings * confidenceMultiplier);
    } else {
      winnings = -userAnswer.betAmount; // Lose the bet
      score = 0;
    }

    return {
      isCorrect: isCorrectPrediction,
      score: Math.max(0, score),
      feedback: isCorrectPrediction 
        ? `Correct! You won ${winnings} gold with ${userAnswer.confidenceLevel} confidence!` 
        : `Incorrect prediction. You lost ${Math.abs(winnings)} gold.`,
      explanation: challenge.content.explanation,
      metadata: {
        winnings,
        newBankroll: (gameData?.currentBankroll || 1000) + winnings
      }
    };
  }

  private async validateMysteryReactionAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (typeof answer.response !== 'object' || answer.response === null) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide both gas identification and chemical equation",
        explanation: "Answer should include both gas and equation"
      };
    }

    const userAnswer = answer.response as { gas: string; equation: string };
    const correctAnswerData = JSON.parse(challenge.content.correctAnswer as string);
    const gameData = challenge.metadata?.gameSpecific;
    const reaction = gameData?.reaction as MysteryReaction;

    if (!userAnswer.gas || !userAnswer.equation) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide both gas identification and chemical equation",
        explanation: "Both parts are required for full credit"
      };
    }

    // Check gas identification
    const gasCorrect = userAnswer.gas.trim() === correctAnswerData.gas;
    
    // Check equation (normalize whitespace and check for chemical equivalence)
    const equationCorrect = this.checkEquationEquivalence(
      userAnswer.equation.trim(), 
      correctAnswerData.equation
    );

    let score = 0;
    let isCorrect = false;
    let feedback = "";

    if (gasCorrect && equationCorrect) {
      isCorrect = true;
      score = 100;
      feedback = "Excellent! You correctly identified the gas and wrote the balanced equation!";
    } else if (gasCorrect && !equationCorrect) {
      score = 60;
      feedback = "Good! You identified the gas correctly, but the equation needs work.";
    } else if (!gasCorrect && equationCorrect) {
      score = 40;
      feedback = "Nice equation! But the gas identification is incorrect.";
    } else {
      score = 0;
      feedback = "Not quite right. Review the visual clues and try again.";
    }

    return {
      isCorrect,
      score,
      feedback,
      explanation: challenge.content.explanation,
      metadata: {
        gasCorrect,
        equationCorrect,
        correctGas: correctAnswerData.gas,
        correctEquation: correctAnswerData.equation,
        gasProperties: reaction.gasProperties,
        crystalBallUnlocked: isCorrect && reaction.crystalBallVideo
      }
    };
  }

  private checkEquationEquivalence(userEquation: string, correctEquation: string): boolean {
    // Simple check - normalize whitespace and compare
    // In a real implementation, you'd want more sophisticated chemical equation parsing
    const normalize = (eq: string) => eq.replace(/\s+/g, ' ').trim().toLowerCase();
    
    const normalizedUser = normalize(userEquation);
    const normalizedCorrect = normalize(correctEquation);
    
    return normalizedUser === normalizedCorrect;
  }

  calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number {
    const baseScore = this.calculateBaseScore(true, challenge.difficulty);
    
    // Time bonus for quick decisions
    const timeLimit = challenge.timeLimit || 60;
    const timeBonus = Math.max(0, (timeLimit - timeElapsed) / timeLimit * 0.3);
    
    // Confidence bonus - reward confident correct answers
    const userAnswer = answer.response as { confidenceLevel: string };
    const confidenceBonus = userAnswer.confidenceLevel === 'high' ? 0.2 : 
                           userAnswer.confidenceLevel === 'medium' ? 0.1 : 0;
    
    const finalScore = Math.floor(baseScore * (1 + timeBonus + confidenceBonus));
    return Math.max(0, finalScore);
  }

  getSpecialMechanics(): RealmMechanic[] {
    return [
      {
        id: 'virtual_gold_system',
        name: 'Virtual Gold Wagering',
        description: 'Bet virtual gold on precipitation outcomes with variable payouts',
        parameters: {
          startingBankroll: 1000,
          minimumBet: 10,
          maximumBet: 500,
          bankruptcyThreshold: 0
        }
      },
      {
        id: 'confidence_betting',
        name: 'Confidence Level Betting',
        description: 'Higher confidence bets have different risk/reward ratios',
        parameters: {
          highConfidenceOdds: 1.2,
          mediumConfidenceOdds: 1.5,
          lowConfidenceOdds: 2.0
        }
      },
      {
        id: 'bankroll_management',
        name: 'Bankroll Tracking',
        description: 'Track wins and losses across multiple betting rounds',
        parameters: {
          trackingEnabled: true,
          showStatistics: true,
          resetOnBankruptcy: true
        }
      }
    ];
  }

  async processBossChallenge(userId: string, bossId: string): Promise<BossResult> {
    // No boss challenges in this subtask - will be implemented in later subtasks
    throw new Error(`Boss challenges not implemented for ${bossId}`);
  }

  // Helper methods for color matching
  private checkColorMatch(userAnswer: string, correctAnswer: string): boolean {
    // Check for synonyms and variations
    const colorSynonyms: Record<string, string[]> = {
      'red': ['crimson', 'scarlet', 'cherry', 'blood red', 'brick red'],
      'blue': ['azure', 'navy', 'deep blue', 'pale blue', 'light blue'],
      'green': ['emerald', 'lime', 'forest green', 'pale green'],
      'yellow': ['golden', 'bright yellow', 'pale yellow', 'lemon'],
      'purple': ['violet', 'magenta', 'lavender', 'deep purple'],
      'orange': ['amber', 'bright orange', 'golden orange'],
      'brown': ['tan', 'chocolate', 'dark brown', 'light brown'],
      'black': ['dark', 'charcoal', 'jet black'],
      'white': ['colorless', 'clear', 'transparent', 'pale'],
      'pink': ['rose', 'salmon', 'light red'],
      'cream': ['off-white', 'beige', 'pale yellow']
    };

    // Check if user answer contains key color words from correct answer
    const correctWords = correctAnswer.split(/\s+/);
    const userWords = userAnswer.split(/\s+/);

    for (const correctWord of correctWords) {
      if (userWords.includes(correctWord)) {
        return true;
      }
      
      // Check synonyms
      for (const [baseColor, synonyms] of Object.entries(colorSynonyms)) {
        if (synonyms.includes(correctWord) && userWords.some(word => 
          word === baseColor || synonyms.includes(word)
        )) {
          return true;
        }
      }
    }

    return false;
  }

  private checkColorMentioned(userAnswer: string, reaction: ColorChangeReaction): boolean {
    const initialColor = reaction.initialColor.toLowerCase();
    const finalColor = reaction.finalColor.toLowerCase();
    
    return userAnswer.includes(initialColor) || userAnswer.includes(finalColor) ||
           userAnswer.includes(reaction.colorDescription.toLowerCase());
  }

  private checkAnyColorMentioned(userAnswer: string): boolean {
    const colors = [
      'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'brown', 'black', 
      'white', 'pink', 'cream', 'colorless', 'clear', 'dark', 'light', 'pale',
      'deep', 'bright', 'crimson', 'scarlet', 'azure', 'emerald', 'golden',
      'violet', 'magenta', 'amber'
    ];
    
    return colors.some(color => userAnswer.includes(color));
  }

  private generateDetailedColorFeedback(userAnswer: string, reaction: ColorChangeReaction): string {
    let feedback = `Expected: ${reaction.colorDescription}\n`;
    feedback += `Initial color: ${reaction.initialColor}\n`;
    feedback += `Final color: ${reaction.finalColor}\n`;
    
    if (reaction.additionalObservations) {
      feedback += `Additional observations: ${reaction.additionalObservations.join(', ')}`;
    }
    
    return feedback;
  }

  protected getSpecialRewards(): Reward[] {
    return [
      {
        type: 'badge' as const,
        itemId: 'precipitation_prophet',
        description: 'Precipitation Prophet Badge'
      },
      {
        type: 'badge' as const,
        itemId: 'color_clash_champion',
        description: 'Color Clash Champion Badge'
      },
      {
        type: 'unlock' as const,
        itemId: 'solubility_tables',
        description: 'Advanced Solubility Tables'
      },
      {
        type: 'unlock' as const,
        itemId: 'color_change_guide',
        description: 'Chemical Color Change Reference Guide'
      }
    ];
  }
}