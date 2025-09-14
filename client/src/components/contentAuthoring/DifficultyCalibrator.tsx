import React, { useState } from 'react';
import { DifficultyCalibration, DifficultyFactor } from '../../types/contentAuthoring';
import { contentAuthoringApi } from '../../services/contentAuthoringApi';
import './DifficultyCalibrator.css';

export const DifficultyCalibrator: React.FC = () => {
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    equation: '',
    steps: [],
    difficulty: 1,
    tags: [],
    curriculumMappings: []
  });
  const [calibration, setCalibration] = useState<DifficultyCalibration | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setContentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calibrateDifficulty = async () => {
    if (!contentData.title || !contentData.description) {
      alert('Please provide at least a title and description');
      return;
    }

    setLoading(true);
    try {
      const result = await contentAuthoringApi.calibrateDifficulty('temp-id', contentData);
      setCalibration(result);
    } catch (error) {
      console.error('Failed to calibrate difficulty:', error);
      alert('Failed to calibrate difficulty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return '#28a745';
    if (difficulty <= 3.5) return '#ffc107';
    return '#dc3545';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 1.5) return 'Very Easy';
    if (difficulty <= 2.5) return 'Easy';
    if (difficulty <= 3.5) return 'Moderate';
    if (difficulty <= 4.5) return 'Hard';
    return 'Very Hard';
  };

  const renderFactor = (factor: DifficultyFactor) => (
    <div key={factor.name} className="difficulty-factor">
      <div className="factor-header">
        <span className="factor-name">{factor.name}</span>
        <span className="factor-value">{factor.value}/5</span>
      </div>
      <div className="factor-bar">
        <div 
          className="factor-fill"
          style={{ 
            width: `${(factor.value / 5) * 100}%`,
            backgroundColor: getDifficultyColor(factor.value)
          }}
        />
      </div>
      <div className="factor-details">
        <span className="factor-weight">Weight: {(factor.weight * 100).toFixed(0)}%</span>
        <span className="factor-description">{factor.description}</span>
      </div>
    </div>
  );

  return (
    <div className="difficulty-calibrator">
      <div className="calibrator-header">
        <h2>Difficulty Calibration Tool</h2>
        <p>Analyze content complexity and get AI-powered difficulty recommendations</p>
      </div>

      <div className="calibrator-layout">
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
              placeholder="Describe the content and learning objectives"
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
            <label>Number of Problem-Solving Steps</label>
            <select
              value={contentData.steps.length}
              onChange={(e) => handleInputChange('steps', new Array(parseInt(e.target.value)).fill(''))}
            >
              <option value="0">No steps required</option>
              <option value="1">1 step</option>
              <option value="2">2 steps</option>
              <option value="3">3 steps</option>
              <option value="4">4 steps</option>
              <option value="5">5 steps</option>
              <option value="6">6+ steps</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={contentData.tags.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
              placeholder="organic, stoichiometry, advanced"
            />
          </div>

          <div className="form-group">
            <label>Current Difficulty Estimate</label>
            <select
              value={contentData.difficulty}
              onChange={(e) => handleInputChange('difficulty', parseInt(e.target.value))}
            >
              <option value="1">1 - Very Easy</option>
              <option value="2">2 - Easy</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Hard</option>
              <option value="5">5 - Very Hard</option>
            </select>
          </div>

          <button
            onClick={calibrateDifficulty}
            disabled={loading || !contentData.title || !contentData.description}
            className="calibrate-button"
          >
            {loading ? 'Analyzing...' : 'Calibrate Difficulty'}
          </button>
        </div>

        <div className="results-section">
          {calibration ? (
            <>
              <h3>Calibration Results</h3>
              
              <div className="difficulty-result">
                <div className="difficulty-score">
                  <span className="score-label">Suggested Difficulty</span>
                  <div className="score-display">
                    <span 
                      className="score-value"
                      style={{ color: getDifficultyColor(calibration.suggestedDifficulty) }}
                    >
                      {calibration.suggestedDifficulty}
                    </span>
                    <span className="score-max">/5</span>
                  </div>
                  <span className="score-description">
                    {getDifficultyLabel(calibration.suggestedDifficulty)}
                  </span>
                </div>

                <div className="confidence-meter">
                  <span className="confidence-label">Confidence</span>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${calibration.confidence * 100}%` }}
                    />
                  </div>
                  <span className="confidence-value">
                    {(calibration.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="factors-analysis">
                <h4>Difficulty Factors</h4>
                <div className="factors-list">
                  {calibration.factors.map(renderFactor)}
                </div>
              </div>

              <div className="reasoning-section">
                <h4>AI Reasoning</h4>
                <div className="reasoning-text">
                  {calibration.reasoning}
                </div>
              </div>

              <div className="calibration-metadata">
                <div className="metadata-item">
                  <strong>Calibrated by:</strong> {calibration.calibratedBy}
                </div>
                <div className="metadata-item">
                  <strong>Calibrated at:</strong> {new Date(calibration.calibratedAt).toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <div className="no-results">
              <h3>Difficulty Analysis</h3>
              <p>Enter content information and click "Calibrate Difficulty" to get AI-powered difficulty recommendations.</p>
              
              <div className="calibration-info">
                <h4>What we analyze:</h4>
                <ul>
                  <li><strong>Text Complexity:</strong> Readability and vocabulary level</li>
                  <li><strong>Chemical Complexity:</strong> Number of elements, molecular complexity</li>
                  <li><strong>Problem-Solving Steps:</strong> Number and complexity of required steps</li>
                  <li><strong>Prerequisites:</strong> Required background knowledge</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};