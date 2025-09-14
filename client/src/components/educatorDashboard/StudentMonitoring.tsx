import React, { useState } from 'react';
import { ClassManagement } from '../../types/educatorDashboard';

interface StudentMonitoringProps {
  classes: ClassManagement[];
}

export const StudentMonitoring: React.FC<StudentMonitoringProps> = ({ classes }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');

  return (
    <div className="student-monitoring">
      <h2>Student Progress Monitoring</h2>
      <p>Monitor individual student progress and identify areas needing attention.</p>
      
      <div className="class-selector">
        <label>Select Class:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls.classId} value={cls.classId}>
              {cls.className}
            </option>
          ))}
        </select>
      </div>

      <div className="monitoring-placeholder">
        <h3>🚧 Coming Soon</h3>
        <p>Detailed student progress monitoring interface will be available here.</p>
        <ul>
          <li>Individual student progress tracking</li>
          <li>Performance trends and analytics</li>
          <li>Weak area identification</li>
          <li>Personalized recommendations</li>
        </ul>
      </div>
    </div>
  );
};