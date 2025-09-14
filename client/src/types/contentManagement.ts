export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'challenge' | 'explanation' | 'mnemonic' | 'formula_sheet';
  structure: TemplateField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'image' | 'video';
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  data: any;
  createdBy: string;
  createdAt: Date;
  changeLog: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
}

export interface ContentApproval {
  id: string;
  contentId: string;
  versionId: string;
  reviewerId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  reviewedAt?: Date;
}

export interface CurriculumMapping {
  id: string;
  contentId: string;
  curriculum: 'o_level' | 'a_level';
  subject: string;
  topic: string;
  subtopic?: string;
  learningObjectives: string[];
  difficulty: number;
}

export interface ContentAnalytics {
  contentId: string;
  totalAttempts: number;
  successRate: number;
  averageTime: number;
  difficultyRating: number;
  popularityScore: number;
  lastUsed: Date;
  userFeedback: ContentFeedback[];
}

export interface ContentFeedback {
  userId: string;
  rating: number;
  difficulty: number;
  clarity: number;
  engagement: number;
  comments?: string;
  submittedAt: Date;
}

export interface ContentCreationRequest {
  templateId: string;
  title: string;
  description: string;
  data: any;
  curriculumMappings: Omit<CurriculumMapping, 'id' | 'contentId'>[];
  tags: string[];
}

export interface ContentUpdateRequest {
  title?: string;
  description?: string;
  data?: any;
  curriculumMappings?: Omit<CurriculumMapping, 'id' | 'contentId'>[];
  tags?: string[];
  changeLog: string;
}

export interface ContentSearchFilters {
  type?: string;
  curriculum?: string;
  difficulty?: number;
  tags?: string[];
}