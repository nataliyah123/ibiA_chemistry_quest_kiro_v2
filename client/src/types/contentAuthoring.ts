export interface ContentGuideline {
  id: string;
  title: string;
  category: 'educational' | 'technical' | 'accessibility' | 'quality';
  description: string;
  rules: GuidelineRule[];
  examples: GuidelineExample[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidelineRule {
  id: string;
  title: string;
  description: string;
  priority: 'must' | 'should' | 'could';
  rationale: string;
  checklistItems: string[];
}

export interface GuidelineExample {
  id: string;
  title: string;
  type: 'good' | 'bad' | 'neutral';
  content: any;
  explanation: string;
}

export interface DifficultyCalibration {
  id: string;
  contentId: string;
  suggestedDifficulty: number;
  factors: DifficultyFactor[];
  confidence: number;
  reasoning: string;
  calibratedBy: 'algorithm' | 'expert' | 'crowd';
  calibratedAt: Date;
}

export interface DifficultyFactor {
  name: string;
  weight: number;
  value: number;
  description: string;
}

export interface QualityAssessment {
  id: string;
  contentId: string;
  overallScore: number;
  rubricScores: RubricScore[];
  feedback: QualityFeedback[];
  assessedBy: string;
  assessedAt: Date;
  status: 'draft' | 'needs_improvement' | 'approved' | 'excellent';
}

export interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
  weight: number;
}

export interface QualityFeedback {
  type: 'strength' | 'weakness' | 'suggestion';
  category: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface MultimediaAsset {
  id: string;
  type: 'image' | 'animation' | 'video' | 'audio' | 'interactive';
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  metadata: AssetMetadata;
  tags: string[];
  accessibility: AccessibilityInfo;
  createdBy: string;
  createdAt: Date;
}

export interface AssetMetadata {
  fileSize: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  format: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface AccessibilityInfo {
  altText?: string;
  captions?: string;
  transcript?: string;
  audioDescription?: string;
  colorBlindFriendly: boolean;
  screenReaderCompatible: boolean;
}

export interface ContentImportExport {
  id: string;
  type: 'import' | 'export';
  format: 'json' | 'xml' | 'csv' | 'scorm' | 'qti';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  contentIds: string[];
  metadata: ImportExportMetadata;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface ImportExportMetadata {
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  warnings: string[];
  mappings?: { [key: string]: string };
}