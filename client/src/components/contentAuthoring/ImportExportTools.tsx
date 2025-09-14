import React, { useState } from 'react';
import { ContentImportExport } from '../../types/contentAuthoring';
import { contentAuthoringApi } from '../../services/contentAuthoringApi';
import './ImportExportTools.css';

export const ImportExportTools: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'export' | 'import'>('export');
  const [exportSettings, setExportSettings] = useState({
    contentIds: [] as string[],
    format: 'json' as 'json' | 'xml' | 'csv' | 'scorm' | 'qti',
    includeMetadata: true,
    includeAnalytics: false,
    includeMultimedia: true
  });
  const [importSettings, setImportSettings] = useState({
    format: 'json' as 'json' | 'xml' | 'csv' | 'scorm' | 'qti',
    overwriteExisting: false,
    validateContent: true,
    preserveIds: false
  });
  const [importData, setImportData] = useState('');
  const [jobs, setJobs] = useState<ContentImportExport[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (exportSettings.contentIds.length === 0) {
      alert('Please specify content IDs to export');
      return;
    }

    setLoading(true);
    try {
      const job = await contentAuthoringApi.exportContent(
        exportSettings.contentIds,
        exportSettings.format
      );
      setJobs(prev => [job, ...prev]);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Please provide data to import');
      return;
    }

    setLoading(true);
    try {
      let parsedData;
      if (importSettings.format === 'json') {
        parsedData = JSON.parse(importData);
      } else {
        parsedData = importData; // For other formats, pass as string
      }

      const job = await contentAuthoringApi.importContent(parsedData, importSettings.format);
      setJobs(prev => [job, ...prev]);
      setImportData('');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your data format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'json':
        return 'JavaScript Object Notation - Best for ChemQuest content';
      case 'xml':
        return 'Extensible Markup Language - Standard structured format';
      case 'csv':
        return 'Comma Separated Values - Simple tabular data';
      case 'scorm':
        return 'SCORM Package - E-learning standard format';
      case 'qti':
        return 'QTI Format - Assessment interoperability standard';
      default:
        return 'Unknown format';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'processing': return '#1da1f2';
      case 'failed': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      case 'pending': return '⏸️';
      default: return '❓';
    }
  };

  const renderJobCard = (job: ContentImportExport) => (
    <div key={job.id} className="job-card">
      <div className="job-header">
        <div className="job-type">
          <span className="type-icon">
            {job.type === 'export' ? '📤' : '📥'}
          </span>
          <span className="type-label">
            {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
          </span>
        </div>
        <div 
          className="job-status"
          style={{ color: getStatusColor(job.status) }}
        >
          <span className="status-icon">{getStatusIcon(job.status)}</span>
          <span className="status-text">{job.status}</span>
        </div>
      </div>

      <div className="job-details">
        <div className="detail-item">
          <strong>Format:</strong> {job.format.toUpperCase()}
        </div>
        <div className="detail-item">
          <strong>Items:</strong> {job.metadata.totalItems}
        </div>
        <div className="detail-item">
          <strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}
        </div>
        {job.completedAt && (
          <div className="detail-item">
            <strong>Completed:</strong> {new Date(job.completedAt).toLocaleString()}
          </div>
        )}
      </div>

      {job.status === 'processing' && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(job.metadata.processedItems / job.metadata.totalItems) * 100}%` 
              }}
            />
          </div>
          <div className="progress-text">
            {job.metadata.processedItems} / {job.metadata.totalItems} processed
          </div>
        </div>
      )}

      {job.status === 'completed' && (
        <div className="completion-stats">
          <div className="stat-item success">
            <span className="stat-value">{job.metadata.successfulItems}</span>
            <span className="stat-label">Successful</span>
          </div>
          <div className="stat-item error">
            <span className="stat-value">{job.metadata.failedItems}</span>
            <span className="stat-label">Failed</span>
          </div>
          {job.metadata.warnings.length > 0 && (
            <div className="stat-item warning">
              <span className="stat-value">{job.metadata.warnings.length}</span>
              <span className="stat-label">Warnings</span>
            </div>
          )}
        </div>
      )}

      {job.errorMessage && (
        <div className="error-message">
          <strong>Error:</strong> {job.errorMessage}
        </div>
      )}

      <div className="job-actions">
        {job.status === 'completed' && job.type === 'export' && (
          <button className="action-button download-button">
            Download
          </button>
        )}
        {job.status === 'failed' && (
          <button className="action-button retry-button">
            Retry
          </button>
        )}
        <button className="action-button details-button">
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="import-export-tools">
      <div className="tools-header">
        <h2>Import/Export Tools</h2>
        <p>Transfer content between systems and share curriculum materials</p>
      </div>

      <div className="mode-selector">
        <button
          className={`mode-button ${activeMode === 'export' ? 'active' : ''}`}
          onClick={() => setActiveMode('export')}
        >
          📤 Export Content
        </button>
        <button
          className={`mode-button ${activeMode === 'import' ? 'active' : ''}`}
          onClick={() => setActiveMode('import')}
        >
          📥 Import Content
        </button>
      </div>

      <div className="tools-content">
        {activeMode === 'export' ? (
          <div className="export-section">
            <h3>Export Content</h3>
            <p>Export your content to share with other educators or backup your materials.</p>

            <div className="export-form">
              <div className="form-group">
                <label>Content IDs to Export *</label>
                <textarea
                  value={exportSettings.contentIds.join('\n')}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    contentIds: e.target.value.split('\n').filter(Boolean)
                  }))}
                  placeholder="Enter content IDs (one per line)&#10;content-123&#10;content-456"
                  rows={4}
                />
                <div className="help-text">
                  Enter the IDs of content items you want to export, one per line.
                </div>
              </div>

              <div className="form-group">
                <label>Export Format</label>
                <select
                  value={exportSettings.format}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    format: e.target.value as any
                  }))}
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="csv">CSV</option>
                  <option value="scorm">SCORM</option>
                  <option value="qti">QTI</option>
                </select>
                <div className="format-description">
                  {getFormatDescription(exportSettings.format)}
                </div>
              </div>

              <div className="form-group">
                <label>Export Options</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeMetadata}
                      onChange={(e) => setExportSettings(prev => ({
                        ...prev,
                        includeMetadata: e.target.checked
                      }))}
                    />
                    Include metadata (creation dates, authors, etc.)
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeAnalytics}
                      onChange={(e) => setExportSettings(prev => ({
                        ...prev,
                        includeAnalytics: e.target.checked
                      }))}
                    />
                    Include analytics data
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeMultimedia}
                      onChange={(e) => setExportSettings(prev => ({
                        ...prev,
                        includeMultimedia: e.target.checked
                      }))}
                    />
                    Include multimedia assets
                  </label>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={loading || exportSettings.contentIds.length === 0}
                className="export-button"
              >
                {loading ? 'Starting Export...' : 'Start Export'}
              </button>
            </div>
          </div>
        ) : (
          <div className="import-section">
            <h3>Import Content</h3>
            <p>Import content from other systems or restore from backups.</p>

            <div className="import-form">
              <div className="form-group">
                <label>Import Format</label>
                <select
                  value={importSettings.format}
                  onChange={(e) => setImportSettings(prev => ({
                    ...prev,
                    format: e.target.value as any
                  }))}
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="csv">CSV</option>
                  <option value="scorm">SCORM</option>
                  <option value="qti">QTI</option>
                </select>
                <div className="format-description">
                  {getFormatDescription(importSettings.format)}
                </div>
              </div>

              <div className="form-group">
                <label>Content Data *</label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={importSettings.format === 'json' 
                    ? '{\n  "content": [\n    {\n      "title": "Example Content",\n      "description": "...",\n      ...\n    }\n  ]\n}'
                    : 'Paste your content data here...'
                  }
                  rows={8}
                />
                <div className="help-text">
                  Paste the content data you want to import in the selected format.
                </div>
              </div>

              <div className="form-group">
                <label>Import Options</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={importSettings.overwriteExisting}
                      onChange={(e) => setImportSettings(prev => ({
                        ...prev,
                        overwriteExisting: e.target.checked
                      }))}
                    />
                    Overwrite existing content with same ID
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={importSettings.validateContent}
                      onChange={(e) => setImportSettings(prev => ({
                        ...prev,
                        validateContent: e.target.checked
                      }))}
                    />
                    Validate content before importing
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={importSettings.preserveIds}
                      onChange={(e) => setImportSettings(prev => ({
                        ...prev,
                        preserveIds: e.target.checked
                      }))}
                    />
                    Preserve original content IDs
                  </label>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={loading || !importData.trim()}
                className="import-button"
              >
                {loading ? 'Starting Import...' : 'Start Import'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="jobs-section">
        <h3>Recent Jobs</h3>
        {jobs.length > 0 ? (
          <div className="jobs-list">
            {jobs.map(renderJobCard)}
          </div>
        ) : (
          <div className="no-jobs">
            <p>No import/export jobs yet. Start your first job above.</p>
          </div>
        )}
      </div>
    </div>
  );
};