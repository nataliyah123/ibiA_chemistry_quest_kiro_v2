// User behavior analytics service
export interface UserAction {
  id: string;
  userId: string;
  sessionId: string;
  action: string;
  category: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  duration?: number; // in milliseconds
  path: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  actions: number;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  referrer?: string;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  topActions: Array<{ action: string; count: number }>;
  topPages: Array<{ path: string; views: number }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
}

class UserBehaviorAnalytics {
  private actions: UserAction[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private maxActions = 10000; // Keep last 10k actions in memory
  private maxSessions = 1000; // Keep last 1k sessions in memory

  // Track user action
  trackAction(action: Omit<UserAction, 'id' | 'timestamp'>): void {
    const userAction: UserAction = {
      ...action,
      id: this.generateActionId(),
      timestamp: new Date()
    };

    // Add to actions array
    this.actions.unshift(userAction);
    
    // Keep only recent actions
    if (this.actions.length > this.maxActions) {
      this.actions = this.actions.slice(0, this.maxActions);
    }

    // Update session
    this.updateSession(action.sessionId, action.userId);

    // Log action
    console.log(`[ANALYTICS] User ${action.userId} performed ${action.action} in ${action.category}`, {
      sessionId: action.sessionId,
      path: action.path,
      metadata: action.metadata
    });
  }

  // Start new session
  startSession(userId: string, sessionData: Partial<UserSession>): string {
    const sessionId = this.generateSessionId();
    
    const session: UserSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      pageViews: 0,
      actions: 0,
      deviceType: sessionData.deviceType || 'desktop',
      browser: sessionData.browser || 'unknown',
      os: sessionData.os || 'unknown',
      referrer: sessionData.referrer
    };

    this.sessions.set(sessionId, session);
    
    // Clean up old sessions
    if (this.sessions.size > this.maxSessions) {
      const oldestSession = Array.from(this.sessions.keys())[this.maxSessions];
      this.sessions.delete(oldestSession);
    }

    console.log(`[ANALYTICS] New session started for user ${userId}: ${sessionId}`);
    return sessionId;
  }

  // End session
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();
      
      console.log(`[ANALYTICS] Session ended: ${sessionId}, Duration: ${session.duration}ms`);
    }
  }

  // Update session with new action
  private updateSession(sessionId: string, userId: string): void {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // Create new session if it doesn't exist
      session = {
        id: sessionId,
        userId,
        startTime: new Date(),
        pageViews: 0,
        actions: 0,
        deviceType: 'desktop',
        browser: 'unknown',
        os: 'unknown'
      };
      this.sessions.set(sessionId, session);
    }

    session.actions++;
  }

  // Track page view
  trackPageView(userId: string, sessionId: string, path: string, metadata?: Record<string, any>): void {
    this.trackAction({
      userId,
      sessionId,
      action: 'page_view',
      category: 'navigation',
      path,
      metadata
    });

    // Update session page views
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pageViews++;
    }
  }

  // Track game action
  trackGameAction(
    userId: string, 
    sessionId: string, 
    action: string, 
    realmId: string, 
    challengeId?: string,
    score?: number,
    duration?: number
  ): void {
    this.trackAction({
      userId,
      sessionId,
      action,
      category: 'game',
      path: `/game/${realmId}`,
      duration,
      metadata: {
        realmId,
        challengeId,
        score
      }
    });
  }

  // Get analytics metrics
  getAnalyticsMetrics(timeRange?: { start: Date; end: Date }): AnalyticsMetrics {
    let filteredActions = this.actions;
    let filteredSessions = Array.from(this.sessions.values());

    // Apply time filter if provided
    if (timeRange) {
      filteredActions = this.actions.filter(action => 
        action.timestamp >= timeRange.start && action.timestamp <= timeRange.end
      );
      filteredSessions = filteredSessions.filter(session =>
        session.startTime >= timeRange.start && session.startTime <= timeRange.end
      );
    }

    // Calculate metrics
    const uniqueUsers = new Set(filteredActions.map(action => action.userId)).size;
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(s => s.endTime).length;
    const totalDuration = filteredSessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    
    const averageSessionDuration = completedSessions > 0 ? totalDuration / completedSessions : 0;
    
    // Calculate bounce rate (sessions with only 1 action)
    const bouncedSessions = filteredSessions.filter(s => s.actions <= 1).length;
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    // Top actions
    const actionCounts = filteredActions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Top pages
    const pageCounts = filteredActions
      .filter(action => action.action === 'page_view')
      .reduce((acc, action) => {
        acc[action.path] = (acc[action.path] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    // Device breakdown
    const deviceBreakdown = filteredSessions.reduce((acc, session) => {
      acc[session.deviceType] = (acc[session.deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Browser breakdown
    const browserBreakdown = filteredSessions.reduce((acc, session) => {
      acc[session.browser] = (acc[session.browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers: uniqueUsers,
      activeUsers: uniqueUsers, // For now, same as total users
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      topActions,
      topPages,
      deviceBreakdown,
      browserBreakdown
    };
  }

  // Get user journey for specific user
  getUserJourney(userId: string, limit: number = 50): UserAction[] {
    return this.actions
      .filter(action => action.userId === userId)
      .slice(0, limit);
  }

  // Get session details
  getSessionDetails(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Get active sessions
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values())
      .filter(session => !session.endTime);
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Global analytics instance
export const userBehaviorAnalytics = new UserBehaviorAnalytics();