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
  duration?: number; // for video/audio
  dimensions?: { width: number; height: number }; // for images/videos
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

export interface CollaborativeSession {
  id: string;
  contentId: string;
  participants: SessionParticipant[];
  status: 'active' | 'paused' | 'completed';
  changes: CollaborativeChange[];
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface SessionParticipant {
  userId: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  joinedAt: Date;
  lastSeen: Date;
  isActive: boolean;
}

export interface CollaborativeChange {
  id: string;
  userId: string;
  type: 'create' | 'update' | 'delete' | 'comment';
  field: string;
  oldValue?: any;
  newValue?: any;
  comment?: string;
  timestamp: Date;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: TemplateField[];
  guidelines: string[];
  examples: TemplateExample[];
  difficulty: {
    min: number;
    max: number;
    factors: string[];
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'image' | 'video' | 'formula';
  required: boolean;
  validation?: FieldValidation;
  guidelines?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  options?: string[];
  customValidator?: string;
}

export interface TemplateExample {
  id: string;
  title: string;
  description: string;
  sampleData: any;
  quality: 'excellent' | 'good' | 'poor';
  notes: string;
}