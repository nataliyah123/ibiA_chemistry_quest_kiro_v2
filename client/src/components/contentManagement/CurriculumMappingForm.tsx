import React, { useState } from 'react';
import { CurriculumMapping } from '../../types/contentManagement';
import './CurriculumMappingForm.css';

interface CurriculumMappingFormProps {
  mappings: Omit<CurriculumMapping, 'id' | 'contentId'>[];
  onChange: (mappings: Omit<CurriculumMapping, 'id' | 'contentId'>[]) => void;
}

const CURRICULUM_OPTIONS = [
  { value: 'o_level', label: 'O-Level' },
  { value: 'a_level', label: 'A-Level' }
];

const SUBJECT_OPTIONS = [
  'Chemistry',
  'Physics',
  'Biology',
  'Mathematics'
];

const CHEMISTRY_TOPICS = {
  o_level: [
    'Atomic Structure',
    'Chemical Bonding',
    'Acids and Bases',
    'Salts',
    'Periodic Table',
    'Chemical Reactions',
    'Metals and Non-metals',
    'Organic Chemistry',
    'Air and Water',
    'Stoichiometry'
  ],
  a_level: [
    'Atomic Structure and Periodicity',
    'Chemical Bonding and Structure',
    'States of Matter',
    'Chemical Energetics',
    'Electrochemistry',
    'Equilibria',
    'Reaction Kinetics',
    'Organic Chemistry',
    'Analytical Chemistry',
    'Environmental Chemistry'
  ]
};

export const CurriculumMappingForm: React.FC<CurriculumMappingFormProps> = ({
  mappings,
  onChange
}) => {
  const [newMapping, setNewMapping] = useState<Omit<CurriculumMapping, 'id' | 'contentId'>>({
    curriculum: 'o_level',
    subject: 'Chemistry',
    topic: '',
    subtopic: '',
    learningObjectives: [],
    difficulty: 1
  });

  const addMapping = () => {
    if (newMapping.topic) {
      onChange([...mappings, { ...newMapping }]);
      setNewMapping({
        curriculum: 'o_level',
        subject: 'Chemistry',
        topic: '',
        subtopic: '',
        learningObjectives: [],
        difficulty: 1
      });
    }
  };

  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index: number, field: keyof CurriculumMapping, value: any) => {
    const updated = mappings.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    );
    onChange(updated);
  };

  const addLearningObjective = (index: number) => {
    const objective = prompt('Enter learning objective:');
    if (objective) {
      const mapping = mappings[index];
      updateMapping(index, 'learningObjectives', [...mapping.learningObjectives, objective]);
    }
  };

  const removeLearningObjective = (mappingIndex: number, objectiveIndex: number) => {
    const mapping = mappings[mappingIndex];
    const updated = mapping.learningObjectives.filter((_, i) => i !== objectiveIndex);
    updateMapping(mappingIndex, 'learningObjectives', updated);
  };

  const getTopicsForCurriculum = (curriculum: string) => {
    return CHEMISTRY_TOPICS[curriculum as keyof typeof CHEMISTRY_TOPICS] || [];
  };

  return (
    <div className="curriculum-mapping-form">
      <div className="existing-mappings">
        {mappings.map((mapping, index) => (
          <div key={index} className="mapping-card">
            <div className="mapping-header">
              <h4>
                {CURRICULUM_OPTIONS.find(c => c.value === mapping.curriculum)?.label} - {mapping.subject}
              </h4>
              <button
                type="button"
                onClick={() => removeMapping(index)}
                className="remove-button"
                title="Remove mapping"
              >
                ×
              </button>
            </div>

            <div className="mapping-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Topic</label>
                  <select
                    value={mapping.topic}
                    onChange={(e) => updateMapping(index, 'topic', e.target.value)}
                  >
                    <option value="">Select topic</option>
                    {getTopicsForCurriculum(mapping.curriculum).map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subtopic (Optional)</label>
                  <input
                    type="text"
                    value={mapping.subtopic || ''}
                    onChange={(e) => updateMapping(index, 'subtopic', e.target.value)}
                    placeholder="Enter subtopic"
                  />
                </div>

                <div className="form-group">
                  <label>Difficulty (1-5)</label>
                  <select
                    value={mapping.difficulty}
                    onChange={(e) => updateMapping(index, 'difficulty', parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="learning-objectives">
                <div className="objectives-header">
                  <label>Learning Objectives</label>
                  <button
                    type="button"
                    onClick={() => addLearningObjective(index)}
                    className="add-objective-button"
                  >
                    + Add Objective
                  </button>
                </div>
                
                {mapping.learningObjectives.length > 0 && (
                  <ul className="objectives-list">
                    {mapping.learningObjectives.map((objective, objIndex) => (
                      <li key={objIndex} className="objective-item">
                        <span>{objective}</span>
                        <button
                          type="button"
                          onClick={() => removeLearningObjective(index, objIndex)}
                          className="remove-objective-button"
                          title="Remove objective"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="add-mapping-section">
        <h4>Add New Curriculum Mapping</h4>
        
        <div className="form-row">
          <div className="form-group">
            <label>Curriculum</label>
            <select
              value={newMapping.curriculum}
              onChange={(e) => setNewMapping(prev => ({ 
                ...prev, 
                curriculum: e.target.value as 'o_level' | 'a_level',
                topic: '' // Reset topic when curriculum changes
              }))}
            >
              {CURRICULUM_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <select
              value={newMapping.subject}
              onChange={(e) => setNewMapping(prev => ({ ...prev, subject: e.target.value }))}
            >
              {SUBJECT_OPTIONS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Topic</label>
            <select
              value={newMapping.topic}
              onChange={(e) => setNewMapping(prev => ({ ...prev, topic: e.target.value }))}
            >
              <option value="">Select topic</option>
              {getTopicsForCurriculum(newMapping.curriculum).map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <select
              value={newMapping.difficulty}
              onChange={(e) => setNewMapping(prev => ({ 
                ...prev, 
                difficulty: parseInt(e.target.value) 
              }))}
            >
              {[1, 2, 3, 4, 5].map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={addMapping}
          disabled={!newMapping.topic}
          className="add-mapping-button"
        >
          Add Mapping
        </button>
      </div>
    </div>
  );
};