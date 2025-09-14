import React, { useState, useEffect } from 'react';
import { ClassManagement, InterventionAlert } from '../../types/educatorDashboard';
import { educatorDashboardApi } from '../../services/educatorDashboardApi';
import { ClassOverview } from './ClassOverview';
import { StudentMonitoring } from './StudentMonitoring';
import { PerformanceReporting } from './PerformanceReporting';
import { InterventionCenter } from './InterventionCenter';
import { ContentAnalytics } from './ContentAnalytics';
import './EducatorDashboard.css';

export const EducatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'reports' | 'interventions' | 'content'>('overview');
  const [classes, setClasses] = useState<ClassManagement[]>([]);
  const [alerts, setAlerts] = useState<InterventionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [classesData, alertsData] = await Promise.all([
        educatorDashboardApi.getEducatorClasses(),
        educatorDashboardApi.getInterventionAlerts()
      ]);

      setClasses(classesData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertCount = (severity?: string) => {
    if (!severity) return alerts.filter(alert => !alert.isResolved).length;
    return alerts.filter(alert => !alert.isResolved && alert.severity === severity).length;
  };

  const getTotalStudents = () => {
    return classes.reduce((total, cls) => total + cls.students.length, 0);
  };

  if (loading) {
    return (
      <div className="educator-dashboard loading">
        <div className="loading-spinner">Loading educator dashboard...</div>
      </div>
    );
  }

  return (
    <div className="educator-dashboard">
      <header className="dashboard-header">
        <h1>Educator Dashboard</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-value">{classes.length}</span>
            <span className="stat-label">Active Classes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{getTotalStudents()}</span>
            <span className="stat-label">Total Students</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{getAlertCount('high') + getAlertCount('critical')}</span>
            <span className="stat-label">Priority Alerts</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{getAlertCount()}</span>
            <span className="stat-label">Open Interventions</span>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Class Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Student Monitoring
        </button>
        <button
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Performance Reports
        </button>
        <button
          className={`nav-tab ${activeTab === 'interventions' ? 'active' : ''}`}
          onClick={() => setActiveTab('interventions')}
        >
          🚨 Interventions
          {getAlertCount() > 0 && (
            <span className="alert-badge">{getAlertCount()}</span>
          )}
        </button>
        <button
          className={`nav-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📚 Content Analytics
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <ClassOverview
            classes={classes}
            onClassesUpdate={setClasses}
          />
        )}

        {activeTab === 'students' && (
          <StudentMonitoring
            classes={classes}
          />
        )}

        {activeTab === 'reports' && (
          <PerformanceReporting
            classes={classes}
          />
        )}

        {activeTab === 'interventions' && (
          <InterventionCenter
            alerts={alerts}
            onAlertsUpdate={setAlerts}
          />
        )}

        {activeTab === 'content' && (
          <ContentAnalytics />
        )}
      </main>
    </div>
  );
};