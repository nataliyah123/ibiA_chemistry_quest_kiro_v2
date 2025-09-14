import React, { useState, useEffect } from 'react';
import { ContentVersion, ContentApproval } from '../../types/contentManagement';
import { contentManagementApi } from '../../services/contentManagementApi';
import './ApprovalWorkflow.css';

interface ApprovalWorkflowProps {
  userRole: 'reviewer' | 'admin';
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ userRole }) => {
  const [pendingContent, setPendingContent] = useState<ContentVersion[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentVersion | null>(null);
  const [approvals, setApprovals] = useState<ContentApproval[]>([]);
  const [reviewComments, setReviewComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingContent();
  }, []);

  useEffect(() => {
    if (selectedContent) {
      loadApprovals(selectedContent.contentId);
    }
  }, [selectedContent]);

  const loadPendingContent = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch content with status 'review'
      const recentContent = await contentManagementApi.getRecentContent(20);
      const pending = recentContent.filter(content => content.status === 'review');
      setPendingContent(pending);
    } catch (error) {
      console.error('Failed to load pending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async (contentId: string) => {
    try {
      const approvalsData = await contentManagementApi.getApprovals(contentId);
      setApprovals(approvalsData);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedContent) return;

    setSubmitting(true);
    try {
      await contentManagementApi.approveContent(
        selectedContent.contentId,
        selectedContent.id,
        reviewComments
      );

      // Update the content status locally
      const updatedContent = { ...selectedContent, status: 'approved' as const };
      setPendingContent(prev => prev.filter(content => content.id !== selectedContent.id));
      setSelectedContent(null);
      setReviewComments('');
      
      // Reload approvals
      await loadApprovals(selectedContent.contentId);
    } catch (error) {
      console.error('Failed to approve content:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedContent || !reviewComments.trim()) {
      alert('Please provide comments for rejection');
      return;
    }

    setSubmitting(true);
    try {
      await contentManagementApi.rejectContent(
        selectedContent.contentId,
        selectedContent.id,
        reviewComments
      );

      // Update the content status locally
      const updatedContent = { ...selectedContent, status: 'draft' as const };
      setPendingContent(prev => prev.filter(content => content.id !== selectedContent.id));
      setSelectedContent(null);
      setReviewComments('');
      
      // Reload approvals
      await loadApprovals(selectedContent.contentId);
    } catch (error) {
      console.error('Failed to reject content:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContentPreview = (content: ContentVersion) => {
    const data = content.data;
    
    return (
      <div className="content-preview">
        <h3>{data.title}</h3>
        <p className="content-description">{data.description}</p>
        
        <div className="content-metadata">
          <div className="metadata-item">
            <strong>Type:</strong> {data.templateId?.replace('-template', '').replace(/-/g, ' ')}
          </div>
          <div className="metadata-item">
            <strong>Version:</strong> {content.version}
          </div>
          <div className="metadata-item">
            <strong>Created by:</strong> {content.createdBy}
          </div>
          <div className="metadata-item">
            <strong>Created:</strong> {formatDate(content.createdAt)}
          </div>
          {content.changeLog && (
            <div className="metadata-item">
              <strong>Change Log:</strong> {content.changeLog}
            </div>
          )}
        </div>

        {data.tags && data.tags.length > 0 && (
          <div className="content-tags">
            <strong>Tags:</strong>
            {data.tags.map((tag: string, index: number) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="content-fields">
          <h4>Content Fields:</h4>
          {Object.entries(data).map(([key, value]) => {
            if (['title', 'description', 'templateId', 'tags'].includes(key)) return null;
            
            return (
              <div key={key} className="field-item">
                <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
                <div className="field-value">
                  {typeof value === 'string' && value.length > 200 
                    ? `${value.substring(0, 200)}...` 
                    : String(value)
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="approval-workflow">
        <div className="loading-state">
          <h2>Loading approval queue...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-workflow">
      <div className="workflow-header">
        <h2>Content Approval Workflow</h2>
        <div className="queue-stats">
          <span className="stat">
            {pendingContent.length} item{pendingContent.length !== 1 ? 's' : ''} pending review
          </span>
        </div>
      </div>

      <div className="workflow-content">
        <div className="pending-list">
          <h3>Pending Approval</h3>
          
          {pendingContent.length === 0 ? (
            <div className="empty-queue">
              <p>No content pending approval.</p>
            </div>
          ) : (
            <div className="content-queue">
              {pendingContent.map(content => (
                <div
                  key={content.id}
                  className={`queue-item ${selectedContent?.id === content.id ? 'selected' : ''}`}
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="queue-item-header">
                    <h4>{content.data.title}</h4>
                    <span className="version-badge">v{content.version}</span>
                  </div>
                  <p className="queue-item-description">{content.data.description}</p>
                  <div className="queue-item-meta">
                    <span>by {content.createdBy}</span>
                    <span>{formatDate(content.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="review-panel">
          {selectedContent ? (
            <>
              <div className="review-header">
                <h3>Review Content</h3>
                <div className="review-actions">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="approve-button"
                  >
                    {submitting ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={submitting || !reviewComments.trim()}
                    className="reject-button"
                  >
                    {submitting ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>

              {renderContentPreview(selectedContent)}

              <div className="review-comments-section">
                <h4>Review Comments</h4>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Enter your review comments here..."
                  rows={4}
                  className="review-comments"
                />
                <p className="comments-note">
                  Comments are required for rejection and optional for approval.
                </p>
              </div>

              {approvals.length > 0 && (
                <div className="approval-history">
                  <h4>Approval History</h4>
                  <div className="approval-list">
                    {approvals.map(approval => (
                      <div key={approval.id} className="approval-item">
                        <div className="approval-header">
                          <span className={`approval-status ${approval.status}`}>
                            {approval.status.toUpperCase()}
                          </span>
                          <span className="approval-reviewer">by {approval.reviewerId}</span>
                          {approval.reviewedAt && (
                            <span className="approval-date">
                              {formatDate(approval.reviewedAt)}
                            </span>
                          )}
                        </div>
                        {approval.comments && (
                          <div className="approval-comments">{approval.comments}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <h3>Select Content to Review</h3>
              <p>Choose an item from the pending approval queue to begin review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};