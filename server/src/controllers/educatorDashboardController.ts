import { Request, Response } from 'express';
import { EducatorDashboardService } from '../services/educatorDashboardService';
import { ReportFilters } from '../types/educatorDashboard';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    [key: string]: any;
  };
}

export class EducatorDashboardController {
  private dashboardService: EducatorDashboardService;

  constructor() {
    this.dashboardService = new EducatorDashboardService();
  }

  // Student Progress Monitoring
  getStudentProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const progress = await this.dashboardService.getStudentProgress(studentId);

      if (!progress) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch student progress' });
    }
  };

  getClassProgress = async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const progress = await this.dashboardService.getClassProgress(classId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch class progress' });
    }
  };

  // Class Management
  getEducatorClasses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const educatorId = req.user?.id;

      if (!educatorId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const classes = await this.dashboardService.getEducatorClasses(educatorId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  };

  createClass = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const educatorId = req.user?.id;

      if (!educatorId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const classData = {
        ...req.body,
        educatorId
      };

      const newClass = await this.dashboardService.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create class' });
    }
  };

  addStudentToClass = async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const studentData = req.body;

      await this.dashboardService.addStudentToClass(classId, studentData);
      res.json({ message: 'Student added to class successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add student to class' });
    }
  };

  removeStudentFromClass = async (req: Request, res: Response) => {
    try {
      const { classId, studentId } = req.params;

      await this.dashboardService.removeStudentFromClass(classId, studentId);
      res.json({ message: 'Student removed from class successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove student from class' });
    }
  };

  // Performance Reporting
  generatePerformanceReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const filters: ReportFilters = req.body.filters || {};
      const generatedBy = req.user?.id;

      if (!generatedBy) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const report = await this.dashboardService.generatePerformanceReport(
        type as any,
        filters,
        generatedBy
      );

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate performance report' });
    }
  };

  // Intervention System
  getInterventionAlerts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const educatorId = req.user?.id;

      if (!educatorId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const alerts = await this.dashboardService.getInterventionAlerts(educatorId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch intervention alerts' });
    }
  };

  resolveAlert = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { alertId } = req.params;
      const { notes } = req.body;
      const resolvedBy = req.user?.id;

      if (!resolvedBy) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.dashboardService.resolveAlert(alertId, resolvedBy, notes);
      res.json({ message: 'Alert resolved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  };

  // Parent Communication
  sendProgressReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { parentEmail, reportType } = req.body;
      const sentBy = req.user?.id;

      if (!sentBy) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const communication = await this.dashboardService.sendProgressReport(
        studentId,
        parentEmail,
        reportType,
        sentBy
      );

      res.json(communication);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send progress report' });
    }
  };

  // Content Effectiveness Analysis
  analyzeContentEffectiveness = async (req: Request, res: Response) => {
    try {
      const { contentIds } = req.query;
      const contentIdArray = contentIds
        ? (contentIds as string).split(',')
        : undefined;

      const analysis = await this.dashboardService.analyzeContentEffectiveness(contentIdArray);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze content effectiveness' });
    }
  };
}