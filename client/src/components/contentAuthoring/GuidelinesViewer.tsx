import React, { useState } from 'react';
import { ContentGuideline, GuidelineRule, GuidelineExample } from '../../types/contentAuthoring';
import './GuidelinesViewer.css';

interface GuidelinesViewerProps {
  guidelines: ContentGuideline[];
}

export const GuidelinesViewer: React.FC<GuidelinesViewerProps> = ({ guidelines }) => {
  const [selectedGuideline, setSelectedGuideline] = useState<ContentGuideline | null>(
    guidelines.length > 0 ? guidelines[0] : null
  );
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [showExamples, setShowExamples] = useState(false);

  const toggleRuleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'must': return '#dc3545';
      case 'should': return '#ffc107';
      case 'could': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'educational': return '🎓';
      case 'technical': return '⚙️';
      case 'accessibility': return '♿';
      case 'quality': return '⭐';
      default: return '📋';
    }
  };

  const renderRule = (rule: GuidelineRule) => {
    const isExpanded = expandedRules.has(rule.id);
    
    return (
      <div key={rule.id} className="guideline-rule">
        <div 
          className="rule-header"
          onClick={() => toggleRuleExpansion(rule.id)}
        >
          <div className="rule-title-section">
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(rule.priority) }}
            >
              {rule.priority.toUpperCase()}
            </span>
            <h4>{rule.title}</h4>
          </div>
          <button className="expand-button">
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        
        <p className="rule-description">{rule.description}</p>
        
        {isExpanded && (
          <div className="rule-details">
            <div className="rationale-section">
              <h5>Why this matters:</h5>
              <p>{rule.rationale}</p>
            </div>
            
            <div className="checklist-section">
              <h5>Checklist:</h5>
              <ul className="checklist">
                {rule.checklistItems.map((item, index) => (
                  <li key={index} className="checklist-item">
                    <span className="checkmark">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExample = (example: GuidelineExample) => {
    const getExampleTypeClass = (type: string) => {
      switch (type) {
        case 'good': return 'example-good';
        case 'bad': return 'example-bad';
        default: return 'example-neutral';
      }
    };

    return (
      <div key={example.id} className={`guideline-example ${getExampleTypeClass(example.type)}`}>
        <div className="example-header">
          <h4>{example.title}</h4>
          <span className={`example-type-badge ${example.type}`}>
            {example.type === 'good' ? '✅ Good' : example.type === 'bad' ? '❌ Bad' : '📝 Example'}
          </span>
        </div>
        
        <div className="example-content">
          <pre>{JSON.stringify(example.content, null, 2)}</pre>
        </div>
        
        <div className="example-explanation">
          <strong>Explanation:</strong> {example.explanation}
        </div>
      </div>
    );
  };

  return (
    <div className="guidelines-viewer">
      <div className="guidelines-header">
        <h2>Content Creation Guidelines</h2>
        <p>Follow these guidelines to create high-quality educational content</p>
      </div>

      <div className="guidelines-layout">
        <div className="guidelines-sidebar">
          <h3>Categories</h3>
          <div className="guidelines-list">
            {guidelines.map(guideline => (
              <div
                key={guideline.id}
                className={`guideline-item ${selectedGuideline?.id === guideline.id ? 'selected' : ''}`}
                onClick={() => setSelectedGuideline(guideline)}
              >
                <div className="guideline-icon">
                  {getCategoryIcon(guideline.category)}
                </div>
                <div className="guideline-info">
                  <h4>{guideline.title}</h4>
                  <p>{guideline.description}</p>
                  <span className="rule-count">{guideline.rules.length} rules</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="guidelines-content">
          {selectedGuideline ? (
            <>
              <div className="content-header">
                <h3>{selectedGuideline.title}</h3>
                <div className="content-actions">
                  <button
                    className={`toggle-button ${!showExamples ? 'active' : ''}`}
                    onClick={() => setShowExamples(false)}
                  >
                    Rules ({selectedGuideline.rules.length})
                  </button>
                  <button
                    className={`toggle-button ${showExamples ? 'active' : ''}`}
                    onClick={() => setShowExamples(true)}
                  >
                    Examples ({selectedGuideline.examples.length})
                  </button>
                </div>
              </div>

              <div className="content-body">
                {!showExamples ? (
                  <div className="rules-section">
                    <div className="rules-intro">
                      <p>{selectedGuideline.description}</p>
                    </div>
                    
                    <div className="rules-list">
                      {selectedGuideline.rules.map(renderRule)}
                    </div>
                  </div>
                ) : (
                  <div className="examples-section">
                    {selectedGuideline.examples.length > 0 ? (
                      <div className="examples-list">
                        {selectedGuideline.examples.map(renderExample)}
                      </div>
                    ) : (
                      <div className="no-examples">
                        <p>No examples available for this guideline yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <h3>Select a Guideline</h3>
              <p>Choose a guideline category from the sidebar to view detailed rules and examples.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};