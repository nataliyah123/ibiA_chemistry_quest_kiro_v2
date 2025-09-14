import React, { useState } from 'react';
import { ContentVersion } from '../../types/contentManagement';
import { contentManagementApi } from '../../services/contentManagementApi';
import './ContentList.css';

interface ContentListProps {
  recentContent: ContentVersion[];
  popularContent: ContentVersion[];
  onContentSelected: (content: ContentVersion) => void;
  onContentUpdated: (content: ContentVersion) => void;
}

export const ContentList: React.FC<ContentListProps> = ({
  recentContent,
  popularContent,
  onContentSelected,
  onContentUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'popular' | 'search'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentVersion[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    type: '',
    curriculum: '',
    difficulty: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const filters = {
        type: searchFilters.type || undefined,
        curriculum: searchFilters.curriculum || undefined,
        difficulty: searchFilters.difficulty ? parseInt(searchFilters.difficulty) : undefined,
        tags: searchFilters.tags ? searchFilters.tags.split(',').map(tag => tag.trim()) : undefined
      };

      const results = await contentManagementApi.searchContent(searchQuery, filters);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (contentId: string, versionId: string) => {
    if (!confirm('Are you sure you want to rollback to this version?')) return;

    try {
      const rolledBackContent = await contentManagementApi.rollbackContent(contentId, versionId);
      onContentUpdated(rolledBackContent);
    } catch (error) {
      console.error('Rollback failed:', error);
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

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'status-draft',
      review: 'status-review',
      approved: 'status-approved',
      archived: 'status-archived'
    };

    return (
      <span className={`status-badge ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderContentCard = (content: ContentVersion) => (
    <div key={content.id} className="content-card">
      <div className="content-header">
        <h3 onClick={() => onContentSelected(content)} className="content-title">
          {content.data.title}
        </h3>
        {getStatusBadge(content.status)}
      </div>

      <p className="content-description">{content.data.description}</p>

      <div className="content-meta">
        <span className="content-version">v{content.version}</span>
        <span className="content-date">{formatDate(content.createdAt)}</span>
        <span className="content-author">by {content.createdBy}</span>
      </div>

      {content.data.tags && content.data.tags.length > 0 && (
        <div className="content-tags">
          {content.data.tags.map((tag: string, index: number) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="content-actions">
        <button
          onClick={() => onContentSelected(content)}
          className="action-button view-button"
        >
          View Details
        </button>
        <button
          onClick={() => handleRollback(content.contentId, content.id)}
          className="action-button rollback-button"
          disabled={content.status === 'archived'}
        >
          Rollback
        </button>
      </div>
    </div>
  );

  return (
    <div className="content-list">
      <div className="content-list-header">
        <h2>Content Management</h2>
        
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="search-button"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="search-filters">
            <select
              value={searchFilters.type}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="challenge">Challenge</option>
              <option value="explanation">Explanation</option>
              <option value="mnemonic">Mnemonic</option>
              <option value="formula_sheet">Formula Sheet</option>
            </select>

            <select
              value={searchFilters.curriculum}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, curriculum: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Curricula</option>
              <option value="o_level">O-Level</option>
              <option value="a_level">A-Level</option>
            </select>

            <select
              value={searchFilters.difficulty}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Difficulties</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>

            <input
              type="text"
              value={searchFilters.tags}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Tags (comma-separated)"
              className="filter-input"
            />
          </div>
        </div>
      </div>

      <div className="content-tabs">
        <button
          className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent Content ({recentContent.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'popular' ? 'active' : ''}`}
          onClick={() => setActiveTab('popular')}
        >
          Popular Content ({popularContent.length})
        </button>
        {searchResults.length > 0 && (
          <button
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search Results ({searchResults.length})
          </button>
        )}
      </div>

      <div className="content-grid">
        {activeTab === 'recent' && recentContent.map(renderContentCard)}
        {activeTab === 'popular' && popularContent.map(renderContentCard)}
        {activeTab === 'search' && searchResults.map(renderContentCard)}

        {((activeTab === 'recent' && recentContent.length === 0) ||
          (activeTab === 'popular' && popularContent.length === 0) ||
          (activeTab === 'search' && searchResults.length === 0)) && (
          <div className="empty-state">
            <p>No content found.</p>
          </div>
        )}
      </div>
    </div>
  );
};