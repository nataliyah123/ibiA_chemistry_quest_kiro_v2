import React, { useState, useEffect } from 'react';
import { ContentVersion, ContentAnalytics as ContentAnalyticsType } from '../../types/contentManagement';
import { contentManagementApi } from '../../services/contentManagementApi';
import './ContentAnalytics.css';

interface ContentAnalyticsProps {
  selectedContent: ContentVersion | null;
}

export const ContentAnalytics: React.FC<ContentAnalyticsProps> = ({ selectedContent }) => {
  const [analytics, setAnalytics] = useState<ContentAnalyticsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    difficulty: 3,
    clarity: 5,
    engagement: 5,
    comments: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (selectedContent) {
      loadAnalytics(selectedContent.contentId);
    }
  }, [selectedContent]);

  const loadAnalytics = async (contentId: string) => {
    setLoading(true);
    try {
      const analyticsData = await contentManagementApi.getContentAnalytics(contentId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedContent) return;

    setSubmittingFeedback(true);
    try {
      await contentManagementApi.submitFeedback(selectedContent.contentId, feedbackForm);
      
      // Reset form
      setFeedbackForm({
        rating: 5,
        difficulty: 3,
        clarity: 5,
        engagement: 5,
        comments: ''
      });

      // Reload analytics to show updated feedback
      await loadAnalytics(selectedContent.contentId);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPerformanceColor = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  if (!selectedContent) {
    return (
      <div className="content-analytics">
        <div className="no-selection">
          <h2>Content Analytics</h2>
          <p>Select a content item from the Content Management tab to view its analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="content-analytics">
        <div className="loading-state">
          <h2>Loading Analytics...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="content-analytics">
      <div className="analytics-header">
        <h2>Content Analytics</h2>
        <div className="content-info">
          <h3>{selectedContent.data.title}</h3>
          <p>{selectedContent.data.description}</p>
        </div>
      </div>

      {analytics && (
        <div className="analytics-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{analytics.totalAttempts}</div>
              <div className="metric-label">Total Attempts</div>
            </div>

            <div className="metric-card">
              <div 
                className="metric-value"
                style={{ color: getPerformanceColor(analytics.successRate) }}
              >
                {(analytics.successRate * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Success Rate</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">
                {Math.round(analytics.averageTime / 60)}m {analytics.averageTime % 60}s
              </div>
              <div className="metric-label">Average Time</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">
                {analytics.difficultyRating.toFixed(1)}/5
              </div>
              <div className="metric-label">Difficulty Rating</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">{analytics.popularityScore}</div>
              <div className="metric-label">Popularity Score</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">{formatDate(analytics.lastUsed)}</div>
              <div className="metric-label">Last Used</div>
            </div>
          </div>

          <div className="feedback-section">
            <h3>User Feedback</h3>
            
            {analytics.userFeedback.length > 0 ? (
              <div className="feedback-list">
                {analytics.userFeedback.slice(0, 5).map((feedback, index) => (
                  <div key={index} className="feedback-item">
                    <div className="feedback-header">
                      <div className="feedback-ratings">
                        <span className="rating">Overall: {feedback.rating}/5</span>
                        <span className="rating">Difficulty: {feedback.difficulty}/5</span>
                        <span className="rating">Clarity: {feedback.clarity}/5</span>
                        <span className="rating">Engagement: {feedback.engagement}/5</span>
                      </div>
                      <div className="feedback-date">{formatDate(feedback.submittedAt)}</div>
                    </div>
                    {feedback.comments && (
                      <div className="feedback-comments">{feedback.comments}</div>
                    )}
                  </div>
                ))}
                
                {analytics.userFeedback.length > 5 && (
                  <div className="feedback-more">
                    And {analytics.userFeedback.length - 5} more feedback entries...
                  </div>
                )}
              </div>
            ) : (
              <div className="no-feedback">
                <p>No user feedback available yet.</p>
              </div>
            )}
          </div>

          <div className="submit-feedback-section">
            <h3>Submit Your Feedback</h3>
            
            <div className="feedback-form">
              <div className="rating-group">
                <label>Overall Rating</label>
                <select
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm(prev => ({ 
                    ...prev, 
                    rating: parseInt(e.target.value) 
                  }))}
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="rating-group">
                <label>Difficulty Level</label>
                <select
                  value={feedbackForm.difficulty}
                  onChange={(e) => setFeedbackForm(prev => ({ 
                    ...prev, 
                    difficulty: parseInt(e.target.value) 
                  }))}
                >
                  <option value={1}>Very Easy</option>
                  <option value={2}>Easy</option>
                  <option value={3}>Moderate</option>
                  <option value={4}>Hard</option>
                  <option value={5}>Very Hard</option>
                </select>
              </div>

              <div className="rating-group">
                <label>Clarity</label>
                <select
                  value={feedbackForm.clarity}
                  onChange={(e) => setFeedbackForm(prev => ({ 
                    ...prev, 
                    clarity: parseInt(e.target.value) 
                  }))}
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="rating-group">
                <label>Engagement</label>
                <select
                  value={feedbackForm.engagement}
                  onChange={(e) => setFeedbackForm(prev => ({ 
                    ...prev, 
                    engagement: parseInt(e.target.value) 
                  }))}
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="comments-group">
                <label>Comments (Optional)</label>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm(prev => ({ 
                    ...prev, 
                    comments: e.target.value 
                  }))}
                  placeholder="Share your thoughts about this content..."
                  rows={4}
                />
              </div>

              <button
                onClick={submitFeedback}
                disabled={submittingFeedback}
                className="submit-feedback-button"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};