import React, { useState } from 'react';
import { ClassManagement } from '../../types/educatorDashboard';
import { educatorDashboardApi } from '../../services/educatorDashboardApi';
import './ClassOverview.css';

interface ClassOverviewProps {
  classes: ClassManagement[];
  onClassesUpdate: (classes: ClassManagement[]) => void;
}

export const ClassOverview: React.FC<ClassOverviewProps> = ({ classes, onClassesUpdate }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClass, setNewClass] = useState({
    className: '',
    description: '',
    curriculum: 'o_level' as 'o_level' | 'a_level',
    subject: 'Chemistry',
    academicYear: '2024-2025',
    isActive: true,
    settings: {
      allowSelfEnrollment: false,
      requireParentConsent: true,
      shareProgressWithParents: true,
      defaultDifficulty: 3,
      enableCompetitiveFeatures: true,
      contentFilters: ['age-appropriate'],
      assignmentDeadlines: true
    }
  });

  const handleCreateClass = async () => {
    try {
      const createdClass = await educatorDashboardApi.createClass(newClass);
      onClassesUpdate([...classes, createdClass]);
      setShowCreateForm(false);
      setNewClass({
        className: '',
        description: '',
        curriculum: 'o_level',
        subject: 'Chemistry',
        academicYear: '2024-2025',
        isActive: true,
        settings: {
          allowSelfEnrollment: false,
          requireParentConsent: true,
          shareProgressWithParents: true,
          defaultDifficulty: 3,
          enableCompetitiveFeatures: true,
          contentFilters: ['age-appropriate'],
          assignmentDeadlines: true
        }
      });
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const renderClassCard = (classData: ClassManagement) => (
    <div key={classData.classId} className="class-card">
      <div className="class-header">
        <h3>{classData.className}</h3>
        <span className={`status-badge ${classData.isActive ? 'active' : 'inactive'}`}>
          {classData.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <p className="class-description">{classData.description}</p>
      
      <div className="class-stats">
        <div className="stat-item">
          <span className="stat-value">{classData.students.length}</span>
          <span className="stat-label">Students</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{classData.curriculum.replace('_', '-').toUpperCase()}</span>
          <span className="stat-label">Level</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{classData.academicYear}</span>
          <span className="stat-label">Year</span>
        </div>
      </div>

      <div className="class-actions">
        <button className="action-button view-button">View Details</button>
        <button className="action-button manage-button">Manage Students</button>
      </div>
    </div>
  );

  return (
    <div className="class-overview">
      <div className="overview-header">
        <h2>Class Overview</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="create-class-button"
        >
          + Create New Class
        </button>
      </div>

      {showCreateForm && (
        <div className="create-class-form">
          <h3>Create New Class</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Class Name *</label>
              <input
                type="text"
                value={newClass.className}
                onChange={(e) => setNewClass(prev => ({ ...prev, className: e.target.value }))}
                placeholder="e.g., Chemistry A-Level 2024"
              />
            </div>
            
            <div className="form-group">
              <label>Curriculum Level</label>
              <select
                value={newClass.curriculum}
                onChange={(e) => setNewClass(prev => ({ ...prev, curriculum: e.target.value as any }))}
              >
                <option value="o_level">O-Level</option>
                <option value="a_level">A-Level</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newClass.description}
              onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the class"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              onClick={() => setShowCreateForm(false)}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateClass}
              disabled={!newClass.className}
              className="create-button"
            >
              Create Class
            </button>
          </div>
        </div>
      )}

      <div className="classes-grid">
        {classes.length > 0 ? (
          classes.map(renderClassCard)
        ) : (
          <div className="empty-state">
            <h3>No Classes Yet</h3>
            <p>Create your first class to start monitoring student progress.</p>
          </div>
        )}
      </div>
    </div>
  );
};