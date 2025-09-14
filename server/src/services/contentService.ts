/**
 * Content Service for Educational Materials Management
 * Handles sample content, problems, and educational resources
 */

import { allSampleContent, ChemistryProblem, AnimatedMnemonic, VideoScript, FormulaSheet } from '../data/sampleContent';
import { allAdvancedContent } from '../data/advancedContent';
import { allEducationalResources, LearningGuide, ConceptExplanation } from '../data/educationalResources';

export interface ContentFilter {
  realm?: string;
  difficulty?: 'O-Level' | 'A-Level';
  type?: string;
  topic?: string;
}

export interface ContentSearchResult {
  problems: ChemistryProblem[];
  mnemonics: AnimatedMnemonic[];
  guides: LearningGuide[];
  explanations: ConceptExplanation[];
  total: number;
}

class ContentService {
  private allProblems: ChemistryProblem[];
  private allMnemonics: AnimatedMnemonic[];
  private allGuides: LearningGuide[];
  private allExplanations: ConceptExplanation[];

  constructor() {
    this.initializeContent();
  }

  private initializeContent(): void {
    // Combine all problem sets
    this.allProblems = [
      ...allSampleContent.equationBalancingProblems,
      ...allSampleContent.stoichiometryProblems,
      ...allSampleContent.gasTestProblems,
      ...allSampleContent.flameColorProblems,
      ...allSampleContent.iupacNamingProblems,
      ...allSampleContent.mechanismProblems,
      ...allSampleContent.labTechniqueProblems,
      ...allSampleContent.observationProblems,
      ...allSampleContent.dataAnalysisProblems,
      ...allAdvancedContent.advancedOrganicProblems,
      ...allAdvancedContent.reactionMechanisms,
      ...allAdvancedContent.spectroscopyProblems,
      ...allAdvancedContent.comprehensiveProblems.equilibriumProblems,
      ...allAdvancedContent.comprehensiveProblems.thermodynamicsProblems
    ];

    // Combine all mnemonics
    this.allMnemonics = [
      ...allSampleContent.animatedMnemonics,
      ...allAdvancedContent.advancedMnemonics
    ];

    // Educational resources
    this.allGuides = allEducationalResources.learningGuides;
    this.allExplanations = allEducationalResources.conceptExplanations;
  }

  /**
   * Get problems by realm and difficulty
   */
  getProblemsByRealm(realm: string, difficulty?: 'O-Level' | 'A-Level'): ChemistryProblem[] {
    return this.allProblems.filter(problem => {
      const realmMatch = problem.realm === realm;
      const difficultyMatch = !difficulty || problem.difficulty === difficulty;
      return realmMatch && difficultyMatch;
    });
  }

  /**
   * Get random problems for challenge generation
   */
  getRandomProblems(filter: ContentFilter, count: number = 5): ChemistryProblem[] {
    const filteredProblems = this.filterProblems(filter);
    const shuffled = [...filteredProblems].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Filter problems based on criteria
   */
  private filterProblems(filter: ContentFilter): ChemistryProblem[] {
    return this.allProblems.filter(problem => {
      if (filter.realm && problem.realm !== filter.realm) return false;
      if (filter.difficulty && problem.difficulty !== filter.difficulty) return false;
      if (filter.type && problem.type !== filter.type) return false;
      return true;
    });
  }

  /**
   * Get specific problem by ID
   */
  getProblemById(id: string): ChemistryProblem | undefined {
    return this.allProblems.find(problem => problem.id === id);
  }

  /**
   * Get mnemonics by concept
   */
  getMnemonicsByConcept(concept: string): AnimatedMnemonic[] {
    return this.allMnemonics.filter(mnemonic => 
      mnemonic.concept === concept || 
      mnemonic.relatedTopics.includes(concept)
    );
  }

  /**
   * Get all available mnemonics
   */
  getAllMnemonics(): AnimatedMnemonic[] {
    return this.allMnemonics;
  }

  /**
   * Get video scripts for explanations
   */
  getVideoScripts(): VideoScript[] {
    return allSampleContent.videoScripts;
  }

  /**
   * Get formula sheets
   */
  getFormulaSheet(category: string): FormulaSheet | undefined {
    if (category === 'calculation-formulas') {
      return allSampleContent.arcaneFormulae;
    }
    if (category === 'data-analysis-formulas') {
      return allSampleContent.sagesRuler;
    }
    return undefined;
  }

  /**
   * Get learning guides by topic
   */
  getLearningGuides(topic?: string, level?: 'O-Level' | 'A-Level'): LearningGuide[] {
    return this.allGuides.filter(guide => {
      if (topic && guide.topic !== topic) return false;
      if (level && guide.level !== level) return false;
      return true;
    });
  }

  /**
   * Get concept explanations
   */
  getConceptExplanations(concept?: string): ConceptExplanation[] {
    if (concept) {
      return this.allExplanations.filter(explanation => 
        explanation.concept.toLowerCase().includes(concept.toLowerCase()) ||
        explanation.relatedConcepts.some(related => 
          related.toLowerCase().includes(concept.toLowerCase())
        )
      );
    }
    return this.allExplanations;
  }

  /**
   * Search across all content types
   */
  searchContent(query: string, filter?: ContentFilter): ContentSearchResult {
    const lowerQuery = query.toLowerCase();
    
    const problems = this.allProblems.filter(problem => {
      const matchesQuery = 
        problem.question.toLowerCase().includes(lowerQuery) ||
        problem.explanation.toLowerCase().includes(lowerQuery) ||
        problem.type.toLowerCase().includes(lowerQuery);
      
      if (!matchesQuery) return false;
      
      // Apply additional filters
      if (filter?.realm && problem.realm !== filter.realm) return false;
      if (filter?.difficulty && problem.difficulty !== filter.difficulty) return false;
      if (filter?.type && problem.type !== filter.type) return false;
      
      return true;
    });

    const mnemonics = this.allMnemonics.filter(mnemonic =>
      mnemonic.title.toLowerCase().includes(lowerQuery) ||
      mnemonic.concept.toLowerCase().includes(lowerQuery) ||
      mnemonic.mnemonic.toLowerCase().includes(lowerQuery)
    );

    const guides = this.allGuides.filter(guide =>
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.topic.toLowerCase().includes(lowerQuery) ||
      guide.content.toLowerCase().includes(lowerQuery)
    );

    const explanations = this.allExplanations.filter(explanation =>
      explanation.concept.toLowerCase().includes(lowerQuery) ||
      explanation.simpleExplanation.toLowerCase().includes(lowerQuery) ||
      explanation.detailedExplanation.toLowerCase().includes(lowerQuery)
    );

    return {
      problems,
      mnemonics,
      guides,
      explanations,
      total: problems.length + mnemonics.length + guides.length + explanations.length
    };
  }

  /**
   * Get content statistics
   */
  getContentStatistics() {
    const problemsByRealm = this.allProblems.reduce((acc, problem) => {
      acc[problem.realm] = (acc[problem.realm] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const problemsByDifficulty = this.allProblems.reduce((acc, problem) => {
      acc[problem.difficulty] = (acc[problem.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const problemsByType = this.allProblems.reduce((acc, problem) => {
      acc[problem.type] = (acc[problem.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProblems: this.allProblems.length,
      totalMnemonics: this.allMnemonics.length,
      totalGuides: this.allGuides.length,
      totalExplanations: this.allExplanations.length,
      problemsByRealm,
      problemsByDifficulty,
      problemsByType,
      videoScripts: allSampleContent.videoScripts.length,
      formulaSheets: 2 // arcaneFormulae and sagesRuler
    };
  }

  /**
   * Get problems for specific challenge types
   */
  getEquationBalancingProblems(difficulty?: 'O-Level' | 'A-Level'): ChemistryProblem[] {
    return this.getProblemsByType('equation-balancing', difficulty);
  }

  getStoichiometryProblems(difficulty?: 'O-Level' | 'A-Level'): ChemistryProblem[] {
    return this.getProblemsByType('stoichiometry', difficulty);
  }

  getGasTestProblems(): ChemistryProblem[] {
    return this.getProblemsByType('gas-identification');
  }

  getFlameTestProblems(): ChemistryProblem[] {
    return this.getProblemsByType('flame-test');
  }

  getIUPACNamingProblems(): ChemistryProblem[] {
    return this.getProblemsByType('iupac-naming');
  }

  getMechanismProblems(): ChemistryProblem[] {
    return this.allProblems.filter(problem => 
      problem.type.includes('mechanism') || problem.type.includes('reaction-mechanism')
    );
  }

  private getProblemsByType(type: string, difficulty?: 'O-Level' | 'A-Level'): ChemistryProblem[] {
    return this.allProblems.filter(problem => {
      const typeMatch = problem.type === type;
      const difficultyMatch = !difficulty || problem.difficulty === difficulty;
      return typeMatch && difficultyMatch;
    });
  }

  /**
   * Get study strategies and tips
   */
  getStudyStrategies() {
    return allEducationalResources.studyStrategies;
  }

  /**
   * Get common misconceptions
   */
  getCommonMisconceptions() {
    return allEducationalResources.commonMisconceptions;
  }

  /**
   * Validate problem content
   */
  validateProblem(problem: Partial<ChemistryProblem>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!problem.question || problem.question.trim().length === 0) {
      errors.push('Question is required');
    }

    if (!problem.correctAnswer) {
      errors.push('Correct answer is required');
    }

    if (!problem.explanation || problem.explanation.trim().length === 0) {
      errors.push('Explanation is required');
    }

    if (!problem.realm) {
      errors.push('Realm is required');
    }

    if (!problem.difficulty || !['O-Level', 'A-Level'].includes(problem.difficulty)) {
      errors.push('Valid difficulty level is required');
    }

    if (!problem.type) {
      errors.push('Problem type is required');
    }

    if (typeof problem.points !== 'number' || problem.points <= 0) {
      errors.push('Points must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const contentService = new ContentService();
export default contentService;