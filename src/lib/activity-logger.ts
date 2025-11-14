// Activity Logger for My Agent Analytics
// Logs user activities to activity_logs table

/**
 * Log user activity to database
 * @param db - D1 Database instance
 * @param userId - User ID performing the action
 * @param action - Action type (e.g., 'property_created', 'analysis_completed')
 * @param details - Optional details about the action
 */
export async function logActivity(
  db: D1Database,
  userId: string,
  action: string,
  details?: string
): Promise<void> {
  try {
    const id = `activity-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO activity_logs (id, user_id, admin_id, action, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, userId, action, details || null, now).run();
  } catch (error) {
    // Log error but don't throw - activity logging should not break main functionality
    console.error('Failed to log activity:', error);
  }
}

/**
 * Activity action types for type safety
 */
export const ActivityActions = {
  // Property actions
  PROPERTY_CREATED: 'property_created',
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_DELETED: 'property_deleted',
  PROPERTY_VIEWED: 'property_viewed',
  
  // Analysis actions
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  
  // OCR actions
  OCR_EXECUTED: 'ocr_executed',
  OCR_COMPLETED: 'ocr_completed',
  OCR_FAILED: 'ocr_failed',
  
  // Itandi BB actions
  ITANDI_SEARCH: 'itandi_search',
  ITANDI_COMPLETED: 'itandi_completed',
  ITANDI_FAILED: 'itandi_failed',
  
  // Stigma check actions
  STIGMA_CHECK: 'stigma_check',
  STIGMA_COMPLETED: 'stigma_completed',
  STIGMA_FAILED: 'stigma_failed',
  
  // Report actions
  REPORT_GENERATED: 'report_generated',
  REPORT_VIEWED: 'report_viewed',
  REPORT_EXPORTED: 'report_exported',
  
  // Auth actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
} as const;

export type ActivityAction = typeof ActivityActions[keyof typeof ActivityActions];
