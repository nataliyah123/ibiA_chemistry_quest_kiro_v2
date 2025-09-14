import React, { useState, useEffect } from 'react';
import { ContentVersion, CurriculumMapping } from '../../types/contentManagement';
import { contentManagementApi } from '../../services/contentManagementApi';
import './CurriculumMapper.css';

interface CurriculumMapperProps {
  selectedContent: ContentVersion | null;
}

const CURRICULUM_STANDARDS = {
  o_level: {
    name: 'O-Level Chemistry',
    topics: {
      'Atomic Structure': [
        'Atomic structure and the periodic table',
        'Electronic configuration',
        'Isotopes and relative atomic mass'
      ],
      'Chemical Bonding': [
        'Ionic bonding',
        'Covalent bonding',
        'Metallic bonding',
        'Intermolecular forces'
      ],
      'Acids and Bases': [
        'Properties of acids and bases',
        'pH scale and indicators',
        'Neutralization reactions',
        'Salt preparation'
      ],
      'Stoichiometry': [
        'Mole concept',
        'Chemical equations',
        'Percentage composition',
        'Empirical and molecular formulas'
      ],
      'Organic Chemistry': [
        'Alkanes and alkenes',
        'Alcohols and carboxylic acids',
        'Polymers',
        'Crude oil and petrochemicals'
      ]
    }
  },
  a_level: {
    name: 'A-Level Chemistry',
    topics: {
      'Atomic Structure and Periodicity': [
        'Electronic structure',
        'Periodic trends',
        'Ionization energy',
        'Atomic and ionic radii'
      ],
      'Chemical Bonding and Structure': [
        'Covalent bonding theories',
        'Molecular geometry',
        'Hybridization',
        'Resonance structures'
      ],
      'Chemical Energetics': [
        'Enthalpy changes',
        'Hess\'s law',
        'Bond energies',
        'Entropy and free energy'
      ],
      'Reaction Kinetics': [
        'Rate equations',
        'Reaction mechanisms',
        'Catalysis',
        'Activation energy'
      ],
      'Organic Chemistry': [
        'Reaction mechanisms',
        'Stereochemistry',
        'Functional group chemistry',
        'Synthetic pathways'
      ]
    }
  }
};

export const CurriculumMapper: React.FC<CurriculumMapperProps> = ({ selectedContent }) => {
  const [mappings, setMappings] = useState<CurriculumMapping[]>([]);
  const [contentByCurriculum, setContentByCurriculum] = useState<{
    [key: string]: ContentVersion[]
  }>({});
  const [selectedCurriculum, setSelectedCurriculum] = useState<'o_level' | 'a_level'>('o_level');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedContent) {
      loadMappings(selectedContent.contentId);
    }
  }, [selectedContent]);

  useEffect(() => {
    loadContentByCurriculum();
  }, [selectedCurriculum, selectedTopic]);

  const loadMappings = async (contentId: string) => {
    try {
      const mappingsData = await contentManagementApi.getCurriculumMappings(contentId);
      setMappings(mappingsData);
    } catch (error) {
      console.error('Failed to load curriculum mappings:', error);
    }
  };

  const loadContentByCurriculum = async () => {
    setLoading(true);
    try {
      const content = await contentManagementApi.getContentByCurriculum(
        selectedCurriculum,
        'Chemistry',
        selectedTopic || undefined
      );
      
      setContentByCurriculum(prev => ({
        ...prev,
        [`${selectedCurriculum}-${selectedTopic}`]: content
      }));
    } catch (error) {
      console.error('Failed to load content by curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurriculumStandards = () => {
    return CURRICULUM_STANDARDS[selectedCurriculum];
  };

  const getContentForCurrentSelection = () => {
    const key = `${selectedCurriculum}-${selectedTopic}`;
    return contentByCurriculum[key] || [];
  };

  const renderMappingCard = (mapping: CurriculumMapping) => {
    const standards = CURRICULUM_STANDARDS[mapping.curriculum];
    
    return (
      <div key={mapping.id} className="mapping-card">
        <div className="mapping-header">
          <h4>{standards.name}</h4>
          <span className={`difficulty-badge difficulty-${mapping.difficulty}`}>
            Level {mapping.difficulty}
          </span>
        </div>
        
        <div className="mapping-details">
          <div className="mapping-item">
            <strong>Topic:</strong> {mapping.topic}
          </div>
          {mapping.subtopic && (
            <div className="mapping-item">
              <strong>Subtopic:</strong> {mapping.subtopic}
            </div>
          )}
          
          {mapping.learningObjectives.length > 0 && (
            <div className="mapping-item">
              <strong>Learning Objectives:</strong>
              <ul className="objectives-list">
                {mapping.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContentCard = (content: ContentVersion) => (
    <div key={content.id} className="curriculum-content-card">
      <div className="content-header">
        <h4>{content.data.title}</h4>
        <span className={`status-badge status-${content.status}`}>
          {content.status}
        </span>
      </div>
      
      <p className="content-description">{content.data.description}</p>
      
      <div className="content-meta">
        <span>v{content.version}</span>
        <span>by {content.createdBy}</span>
      </div>
      
      {content.data.tags && content.data.tags.length > 0 && (
        <div className="content-tags">
          {content.data.tags.slice(0, 3).map((tag: string, index: number) => (
            <span key={index} className="tag">{tag}</span>
          ))}
          {content.data.tags.length > 3 && (
            <span className="tag-more">+{content.data.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="curriculum-mapper">
      <div className="mapper-header">
        <h2>Curriculum Mapping</h2>
        <p>Map content to curriculum standards and explore content by curriculum topics.</p>
      </div>

      {selectedContent ? (
        <div className="selected-content-section">
          <h3>Mappings for: {selectedContent.data.title}</h3>
          
          {mappings.length > 0 ? (
            <div className="mappings-grid">
              {mappings.map(renderMappingCard)}
            </div>
          ) : (
            <div className="no-mappings">
              <p>No curriculum mappings found for this content.</p>
              <p>Mappings can be added when creating or editing content.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="no-content-selected">
          <p>Select content from the Content Management tab to view its curriculum mappings.</p>
        </div>
      )}

      <div className="curriculum-explorer">
        <h3>Explore Content by Curriculum</h3>
        
        <div className="curriculum-filters">
          <div className="filter-group">
            <label>Curriculum Level:</label>
            <select
              value={selectedCurriculum}
              onChange={(e) => {
                setSelectedCurriculum(e.target.value as 'o_level' | 'a_level');
                setSelectedTopic('');
              }}
            >
              <option value="o_level">O-Level</option>
              <option value="a_level">A-Level</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Topic:</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="">All Topics</option>
              {Object.keys(getCurriculumStandards().topics).map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="curriculum-content">
          <div className="curriculum-standards">
            <h4>Curriculum Standards</h4>
            <div className="standards-list">
              {Object.entries(getCurriculumStandards().topics).map(([topic, subtopics]) => (
                <div
                  key={topic}
                  className={`standard-item ${selectedTopic === topic ? 'selected' : ''}`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <h5>{topic}</h5>
                  <ul>
                    {subtopics.slice(0, 3).map((subtopic, index) => (
                      <li key={index}>{subtopic}</li>
                    ))}
                    {subtopics.length > 3 && (
                      <li className="more-items">+{subtopics.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mapped-content">
            <h4>
              Content for {getCurriculumStandards().name}
              {selectedTopic && ` - ${selectedTopic}`}
            </h4>
            
            {loading ? (
              <div className="loading-content">Loading content...</div>
            ) : (
              <div className="content-grid">
                {getContentForCurrentSelection().length > 0 ? (
                  getContentForCurrentSelection().map(renderContentCard)
                ) : (
                  <div className="no-content">
                    <p>No content found for the selected curriculum and topic.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};