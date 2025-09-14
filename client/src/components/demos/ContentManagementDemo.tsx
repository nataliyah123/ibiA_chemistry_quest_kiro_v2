import React, { useState } from 'react';
import { ContentManagementDashboard } from '../contentManagement/ContentManagementDashboard';
import './ContentManagementDemo.css';

export const ContentManagementDemo: React.FC = () => {
  const [userRole, setUserRole] = useState<'creator' | 'reviewer' | 'admin'>('creator');
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    {
      title: 'Rich Content Editor',
      description: 'Create and edit educational content with a powerful rich text editor supporting chemical formulas, equations, and multimedia.',
      icon: '✏️'
    },
    {
      title: 'Template System',
      description: 'Use predefined templates for consistent content formatting across different challenge types.',
      icon: '📋'
    },
    {
      title: 'Approval Workflow',
      description: 'Quality control system with reviewer approval process to ensure content meets educational standards.',
      icon: '✅'
    },
    {
      title: 'Version Control',
      description: 'Track content changes with full version history and rollback capabilities.',
      icon: '🔄'
    },
    {
      title: 'Curriculum Mapping',
      description: 'Map content to O/A-Level curriculum standards with learning objectives and difficulty levels.',
      icon: '🎯'
    },
    {
      title: 'Analytics & Feedback',
      description: 'Monitor content performance with usage analytics and user feedback collection.',
      icon: '📊'
    }
  ];

  if (showDemo) {
    return (
      <div className="content-management-demo">
        <div className="demo-header">
          <button
            onClick={() => setShowDemo(false)}
            className="back-button"
          >
            ← Back to Overview
          </button>
          
          <div className="role-selector">
            <label>View as:</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as 'creator' | 'reviewer' | 'admin')}
            >
              <option value="creator">Content Creator</option>
              <option value="reviewer">Content Reviewer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        <ContentManagementDashboard userRole={userRole} />
      </div>
    );
  }

  return (
    <div className="content-management-demo">
      <div className="demo-overview">
        <header className="demo-hero">
          <h1>Content Management System</h1>
          <p className="hero-subtitle">
            Comprehensive tools for creating, managing, and organizing educational chemistry content
          </p>
          <button
            onClick={() => setShowDemo(true)}
            className="demo-button"
          >
            Launch Content Management System
          </button>
        </header>

        <section className="features-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="workflow-section">
          <h2>Content Creation Workflow</h2>
          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Content</h3>
                <p>Select a template and fill in content fields using the rich text editor</p>
              </div>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Map to Curriculum</h3>
                <p>Associate content with curriculum standards and learning objectives</p>
              </div>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Submit for Review</h3>
                <p>Send content through approval workflow for quality assurance</p>
              </div>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Publish & Monitor</h3>
                <p>Deploy approved content and track performance analytics</p>
              </div>
            </div>
          </div>
        </section>

        <section className="benefits-section">
          <h2>Benefits for Educators</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <h3>🎓 Educational Quality</h3>
              <p>Ensure all content meets curriculum standards with built-in quality controls</p>
            </div>
            <div className="benefit-item">
              <h3>⚡ Efficiency</h3>
              <p>Streamline content creation with templates and reusable components</p>
            </div>
            <div className="benefit-item">
              <h3>📈 Data-Driven</h3>
              <p>Make informed decisions with detailed analytics on content performance</p>
            </div>
            <div className="benefit-item">
              <h3>🔄 Flexibility</h3>
              <p>Easily update and version content as curriculum requirements change</p>
            </div>
          </div>
        </section>

        <section className="technical-section">
          <h2>Technical Implementation</h2>
          <div className="tech-details">
            <div className="tech-item">
              <h3>Rich Text Editor</h3>
              <ul>
                <li>Chemical formula and equation support</li>
                <li>Subscript and superscript formatting</li>
                <li>Multimedia content integration</li>
                <li>Real-time preview and validation</li>
              </ul>
            </div>
            <div className="tech-item">
              <h3>Content Versioning</h3>
              <ul>
                <li>Complete change history tracking</li>
                <li>Rollback to any previous version</li>
                <li>Diff visualization for changes</li>
                <li>Automated backup and recovery</li>
              </ul>
            </div>
            <div className="tech-item">
              <h3>Analytics Engine</h3>
              <ul>
                <li>Usage statistics and performance metrics</li>
                <li>User feedback collection and analysis</li>
                <li>Content effectiveness scoring</li>
                <li>Adaptive difficulty recommendations</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};