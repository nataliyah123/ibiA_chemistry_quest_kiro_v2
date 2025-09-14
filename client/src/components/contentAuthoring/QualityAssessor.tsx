import React, { useState } from 'react';
import { QualityAssessment, RubricScore, QualityFeedback } from '../../types/contentAuthoring';
import { contentAuthoringApi } from '../../services/contentAuthoringApi';
import './QualityAssessor.css';

export const QualityAssessor: React.FC = () => {
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    learningObjectives: [],
    curriculumMappings: [],
    explanation: '',
    equation: '',
    interactive: false,
    multimedia: [],
    altText: '',
    captions: '',
    keyboardAccessible: false
  });
  const [assessment, setAssessment] = useState<QualityAssessment | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setContentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const assessQuality = async () => {
    if (!contentData.title || !contentData.description) {
      alert('Please provide at least a title and description');
      return;
    }

    setLoading(true);
    try {
      const result = await contentAuthoringApi.assessContentQuality('temp-id', contentData);
      setAssessment(result);
    } catch (error) {
      console.error('Failed to assess quality:', error);
      alert('Failed to assess quality. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#28a745';
      case 'approved': return '#17a2b8';
      case 'needs_improvement': return '#ffc107';
      case 'draft': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent Quality';
      case 'approved': return 'Approved';
      case 'needs_improvement': return 'Needs Improvement';
      case 'draft': return 'Draft Quality';
      default: return status;
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'strength': return '💪';
      case 'weakness': return '⚠️';
      case 'suggestion': return '💡';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const renderRubricScore = (score: RubricScore) => {
    const percentage = (score.score / score.maxScore) * 100;
    
    return (
      <div key={score.criterion} className="rubric-score">
        <div className="score-header">
          <span className="criterion-name">{score.criterion}</span>
          <span className="score-value">
            {score.score}/{score.maxScore}
          </span>
        </div>
        
        <div className="score-bar">
          <div 
            className="score-fill"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: getScoreColor(score.score, score.maxScore)
            }}
          />
        </div>
        
        <div className="score-details">
          <span className="score-percentage">{percentage.toFixed(0)}%</span>
          <span className="score-weight">Weight: {(score.weight * 100).toFixed(0)}%</span>
        </div>
        
        <div className="score-feedback">
          {score.feedback}
        </div>
      </div>
    );
  };

  const renderFeedback = (feedback: QualityFeedback) => (
    <div key={`${feedback.category}-${feedback.message}`} className={`quality-feedback ${feedback.type}`}>
      <div className="feedback-header">
        <span className="feedback-icon">{getFeedbackIcon(feedback.type)}</span>
        <span className="feedback-category">{feedback.category}</span>
        <span 
          className="feedback-severity"
          style={{ color: getSeverityColor(feedback.severity) }}
        >
          {feedback.severity}
        </span>
      </div>
      <div className="feedback-message">
        {feedback.message}
      </div>
    </div>
  );

  return (
    <div className="quality-assessor">
      <div className="assessor-header">
        <h2>Content Quality Assessment</h2>
        <p>Evaluate content against educational quality standards and best practices</p>
      </div>

      <div className="assessor-layout">
        <div className="input-section">
          <h3>Content Information</h3>
          
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={contentData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter content title"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={contentData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the content and its purpose"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Learning Objectives</label>
            <textarea
              value={contentData.learningObjectives.join('\n')}
              onChange={(e) => handleInputChange('learningObjectives', e.target.value.split('\n').filter(Boolean))}
              placeholder="Enter learning objectives (one per line)"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Explanation/Solution</label>
            <textarea
              value={contentData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder="Provide detailed explanation or solution steps"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Chemical Equation (if applicable)</label>
            <input
              type="text"
              value={contentData.equation}
              onChange={(e) => handleInputChange('equation', e.target.value)}
              placeholder="e.g., H2 + O2 → H2O"
            />
          </div>

          <div className="form-group">
            <label>Interactive Elements</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={contentData.interactive}
                  onChange={(e) => handleInputChange('interactive', e.target.checked)}
                />
                Has interactive components
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Multimedia Count</label>
            <select
              value={contentData.multimedia.length}
              onChange={(e) => handleInputChange('multimedia', new Array(parseInt(e.target.value)).fill(''))}
            >
              <option value="0">No multimedia</option>
              <option value="1">1 multimedia element</option>
              <option value="2">2 multimedia elements</option>
              <option value="3">3+ multimedia elements</option>
            </select>
          </div>

          <div className="form-group">
            <label>Accessibility Features</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!contentData.altText}
                  onChange={(e) => handleInputChange('altText', e.target.checked ? 'Alt text provided' : '')}
                />
                Alt text for images
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!contentData.captions}
                  onChange={(e) => handleInputChange('captions', e.target.checked ? 'Captions provided' : '')}
                />
                Video captions
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={contentData.keyboardAccessible}
                  onChange={(e) => handleInputChange('keyboardAccessible', e.target.checked)}
                />
                Keyboard accessible
              </label>
            </div>
          </div>

          <button
            onClick={assessQuality}
            disabled={loading || !contentData.title || !contentData.description}
            className="assess-button"
          >
            {loading ? 'Assessing...' : 'Assess Quality'}
          </button>
        </div>

        <div className="results-section">
          {assessment ? (
            <>
              <h3>Quality Assessment Results</h3>
              
              <div className="overall-score">
                <div className="score-circle">
                  <span className="score-number">{assessment.overallScore}</span>
                  <span className="score-label">/ 100</span>
                </div>
                <div className="score-info">
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(assessment.status) }}
                  >
                    {getStatusLabel(assessment.status)}
                  </div>
                  <div className="assessment-date">
                    Assessed on {new Date(assessment.assessedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="rubric-scores">
                <h4>Detailed Scores</h4>
                <div className="scores-list">
                  {assessment.rubricScores.map(renderRubricScore)}
                </div>
              </div>

              <div className="quality-feedback-section">
                <h4>Feedback & Recommendations</h4>
                {assessment.feedback.length > 0 ? (
                  <div className="feedback-list">
                    {assessment.feedback.map(renderFeedback)}
                  </div>
                ) : (
                  <div className="no-feedback">
                    <p>No specific feedback available. Overall quality is good!</p>
                  </div>
                )}
              </div>

              <div className="assessment-metadata">
                <div className="metadata-item">
                  <strong>Assessed by:</strong> {assessment.assessedBy}
                </div>
                <div className="metadata-item">
                  <strong>Assessment ID:</strong> {assessment.id}
                </div>
              </div>
            </>
          ) : (
            <div className="no-results">
              <h3>Quality Assessment</h3>
              <p>Enter content information and click "Assess Quality" to get a comprehensive quality evaluation.</p>
              
              <div className="assessment-info">
                <h4>Assessment Criteria:</h4>
                <ul>
                  <li><strong>Educational Value:</strong> Learning objectives and curriculum alignment</li>
                  <li><strong>Content Accuracy:</strong> Scientific correctness and validity</li>
                  <li><strong>Clarity & Organization:</strong> Clear presentation and structure</li>
                  <li><strong>Engagement:</strong> Interactive elements and student engagement</li>
                  <li><strong>Accessibility:</strong> Inclusive design and accessibility features</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};