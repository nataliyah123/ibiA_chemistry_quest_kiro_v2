import React, { useState, useEffect } from 'react';
import { MultimediaAsset } from '../../types/contentAuthoring';
import { contentAuthoringApi } from '../../services/contentAuthoringApi';
import './MultimediaManager.css';

export const MultimediaManager: React.FC = () => {
  const [assets, setAssets] = useState<MultimediaAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MultimediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    tags: '',
    createdBy: ''
  });
  const [newAsset, setNewAsset] = useState({
    type: 'image' as 'image' | 'animation' | 'video' | 'audio' | 'interactive',
    title: '',
    description: '',
    url: '',
    tags: [] as string[],
    accessibility: {
      altText: '',
      captions: '',
      transcript: '',
      audioDescription: '',
      colorBlindFriendly: false,
      screenReaderCompatible: false
    },
    metadata: {
      fileSize: 0,
      format: '',
      quality: 'medium' as 'low' | 'medium' | 'high' | 'ultra'
    }
  });

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, filters]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const assetsData = await contentAuthoringApi.getMultimediaAssets();
      setAssets(assetsData);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assets];

    if (filters.type) {
      filtered = filtered.filter(asset => asset.type === filters.type);
    }

    if (filters.tags) {
      const searchTags = filters.tags.toLowerCase().split(',').map(tag => tag.trim());
      filtered = filtered.filter(asset =>
        searchTags.some(searchTag =>
          asset.tags.some(tag => tag.toLowerCase().includes(searchTag))
        )
      );
    }

    if (filters.createdBy) {
      filtered = filtered.filter(asset =>
        asset.createdBy.toLowerCase().includes(filters.createdBy.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  };

  const handleUpload = async () => {
    if (!newAsset.title || !newAsset.url) {
      alert('Please provide at least a title and URL');
      return;
    }

    try {
      const uploadedAsset = await contentAuthoringApi.uploadMultimediaAsset({
        ...newAsset,
        createdBy: 'current-user' // In real app, get from auth context
      });

      setAssets(prev => [uploadedAsset, ...prev]);
      setUploadMode(false);
      setNewAsset({
        type: 'image',
        title: '',
        description: '',
        url: '',
        tags: [],
        accessibility: {
          altText: '',
          captions: '',
          transcript: '',
          audioDescription: '',
          colorBlindFriendly: false,
          screenReaderCompatible: false
        },
        metadata: {
          fileSize: 0,
          format: '',
          quality: 'medium'
        }
      });
    } catch (error) {
      console.error('Failed to upload asset:', error);
      alert('Failed to upload asset. Please try again.');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'animation': return '🎬';
      case 'video': return '📹';
      case 'audio': return '🎵';
      case 'interactive': return '🎮';
      default: return '📄';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'ultra': return '#28a745';
      case 'high': return '#17a2b8';
      case 'medium': return '#ffc107';
      case 'low': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAssetCard = (asset: MultimediaAsset) => (
    <div key={asset.id} className="asset-card">
      <div className="asset-header">
        <div className="asset-type">
          <span className="type-icon">{getTypeIcon(asset.type)}</span>
          <span className="type-label">{asset.type}</span>
        </div>
        <div 
          className="quality-badge"
          style={{ backgroundColor: getQualityColor(asset.metadata.quality) }}
        >
          {asset.metadata.quality}
        </div>
      </div>

      <div className="asset-preview">
        {asset.type === 'image' && (
          <img 
            src={asset.thumbnailUrl || asset.url} 
            alt={asset.accessibility.altText || asset.title}
            className="preview-image"
          />
        )}
        {asset.type === 'video' && (
          <video 
            src={asset.url} 
            className="preview-video"
            controls={false}
            muted
          />
        )}
        {(asset.type === 'audio' || asset.type === 'animation' || asset.type === 'interactive') && (
          <div className="preview-placeholder">
            <span className="placeholder-icon">{getTypeIcon(asset.type)}</span>
          </div>
        )}
      </div>

      <div className="asset-info">
        <h4 className="asset-title">{asset.title}</h4>
        <p className="asset-description">{asset.description}</p>
        
        <div className="asset-metadata">
          <span className="metadata-item">
            {formatFileSize(asset.metadata.fileSize)}
          </span>
          <span className="metadata-item">
            {asset.metadata.format.toUpperCase()}
          </span>
          {asset.metadata.duration && (
            <span className="metadata-item">
              {Math.floor(asset.metadata.duration / 60)}:{(asset.metadata.duration % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>

        {asset.tags.length > 0 && (
          <div className="asset-tags">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
            {asset.tags.length > 3 && (
              <span className="tag-more">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="accessibility-indicators">
          {asset.accessibility.altText && <span className="accessibility-badge">Alt</span>}
          {asset.accessibility.captions && <span className="accessibility-badge">CC</span>}
          {asset.accessibility.transcript && <span className="accessibility-badge">T</span>}
          {asset.accessibility.screenReaderCompatible && <span className="accessibility-badge">SR</span>}
        </div>
      </div>

      <div className="asset-actions">
        <button className="action-button view-button">View</button>
        <button className="action-button edit-button">Edit</button>
        <button className="action-button copy-button">Copy URL</button>
      </div>
    </div>
  );

  return (
    <div className="multimedia-manager">
      <div className="manager-header">
        <h2>Multimedia Asset Manager</h2>
        <p>Manage images, videos, animations, and interactive content for your educational materials</p>
      </div>

      <div className="manager-controls">
        <div className="filters-section">
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="animation">Animations</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="interactive">Interactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Tags:</label>
            <input
              type="text"
              value={filters.tags}
              onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Search by tags..."
            />
          </div>

          <div className="filter-group">
            <label>Creator:</label>
            <input
              type="text"
              value={filters.createdBy}
              onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value }))}
              placeholder="Search by creator..."
            />
          </div>
        </div>

        <button
          onClick={() => setUploadMode(true)}
          className="upload-button"
        >
          📤 Upload Asset
        </button>
      </div>

      {uploadMode && (
        <div className="upload-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload New Asset</h3>
              <button
                onClick={() => setUploadMode(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="upload-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={newAsset.type}
                    onChange={(e) => setNewAsset(prev => ({ 
                      ...prev, 
                      type: e.target.value as any 
                    }))}
                  >
                    <option value="image">Image</option>
                    <option value="animation">Animation</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="interactive">Interactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quality</label>
                  <select
                    value={newAsset.metadata.quality}
                    onChange={(e) => setNewAsset(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, quality: e.target.value as any }
                    }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newAsset.title}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter asset title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newAsset.description}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the asset and its purpose"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>URL *</label>
                <input
                  type="url"
                  value={newAsset.url}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/asset.jpg"
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={newAsset.tags.join(', ')}
                  onChange={(e) => setNewAsset(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  placeholder="chemistry, organic, molecules"
                />
              </div>

              <div className="accessibility-section">
                <h4>Accessibility</h4>
                <div className="form-group">
                  <label>Alt Text</label>
                  <input
                    type="text"
                    value={newAsset.accessibility.altText}
                    onChange={(e) => setNewAsset(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, altText: e.target.value }
                    }))}
                    placeholder="Describe the visual content"
                  />
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newAsset.accessibility.colorBlindFriendly}
                      onChange={(e) => setNewAsset(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility, colorBlindFriendly: e.target.checked }
                      }))}
                    />
                    Color-blind friendly
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newAsset.accessibility.screenReaderCompatible}
                      onChange={(e) => setNewAsset(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility, screenReaderCompatible: e.target.checked }
                      }))}
                    />
                    Screen reader compatible
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  onClick={() => setUploadMode(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="upload-submit-button"
                >
                  Upload Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="assets-grid">
        {loading ? (
          <div className="loading-state">Loading assets...</div>
        ) : filteredAssets.length > 0 ? (
          filteredAssets.map(renderAssetCard)
        ) : (
          <div className="empty-state">
            <h3>No Assets Found</h3>
            <p>Upload your first multimedia asset to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};