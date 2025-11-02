/**
 * Report Sharing Manager
 * レポート共有リンクの生成と管理
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface SharedReportConfig {
  userId: string;
  reportType: 'property' | 'analysis' | 'simulation' | 'comparison' | 'custom';
  reportId: string;
  title?: string;
  description?: string;
  permission?: 'view' | 'comment' | 'edit';
  password?: string;
  expiresAt?: Date;
  maxAccessCount?: number;
}

export interface SharedReport {
  id: string;
  userId: string;
  reportType: string;
  reportId: string;
  shareToken: string;
  title?: string;
  description?: string;
  permission: string;
  hasPassword: boolean;
  expiresAt?: string;
  accessCount: number;
  maxAccessCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

/**
 * Generate a secure random token
 */
function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  
  return token;
}

/**
 * Hash password for storage
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a shared report link
 */
export async function createSharedReport(
  db: D1Database,
  config: SharedReportConfig
): Promise<{ shareToken: string; shareUrl: string; sharedReport: SharedReport }> {
  const shareToken = generateToken();
  const shareId = `share-${Date.now()}-${generateToken(8)}`;
  
  let passwordHash: string | null = null;
  if (config.password) {
    passwordHash = await hashPassword(config.password);
  }

  await db.prepare(`
    INSERT INTO shared_reports (
      id, user_id, report_type, report_id, share_token, 
      title, description, permission, password_hash, 
      expires_at, max_access_count, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    shareId,
    config.userId,
    config.reportType,
    config.reportId,
    shareToken,
    config.title || null,
    config.description || null,
    config.permission || 'view',
    passwordHash,
    config.expiresAt ? config.expiresAt.toISOString() : null,
    config.maxAccessCount || null
  ).run();

  const sharedReport = await db.prepare(`
    SELECT id, user_id as userId, report_type as reportType, report_id as reportId,
           share_token as shareToken, title, description, permission,
           CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END as hasPassword,
           expires_at as expiresAt, access_count as accessCount,
           max_access_count as maxAccessCount, is_active as isActive,
           created_at as createdAt, updated_at as updatedAt
    FROM shared_reports WHERE id = ?
  `).bind(shareId).first<SharedReport>();

  if (!sharedReport) {
    throw new Error('Failed to create shared report');
  }

  // Generate share URL (will be completed with actual domain)
  const shareUrl = `/shared/${shareToken}`;

  return {
    shareToken,
    shareUrl,
    sharedReport,
  };
}

/**
 * Get shared report by token
 */
export async function getSharedReport(
  db: D1Database,
  shareToken: string
): Promise<SharedReport | null> {
  const sharedReport = await db.prepare(`
    SELECT id, user_id as userId, report_type as reportType, report_id as reportId,
           share_token as shareToken, title, description, permission,
           CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END as hasPassword,
           expires_at as expiresAt, access_count as accessCount,
           max_access_count as maxAccessCount, is_active as isActive,
           created_at as createdAt, updated_at as updatedAt, last_accessed_at as lastAccessedAt
    FROM shared_reports WHERE share_token = ? AND is_active = 1
  `).bind(shareToken).first<SharedReport>();

  return sharedReport || null;
}

/**
 * Verify shared report access
 */
export async function verifySharedReportAccess(
  db: D1Database,
  shareToken: string,
  password?: string
): Promise<{ valid: boolean; reason?: string; report?: SharedReport }> {
  const sharedReport = await getSharedReport(db, shareToken);

  if (!sharedReport) {
    return { valid: false, reason: 'Report not found or inactive' };
  }

  // Check expiration
  if (sharedReport.expiresAt) {
    const expirationDate = new Date(sharedReport.expiresAt);
    if (expirationDate < new Date()) {
      return { valid: false, reason: 'Report has expired' };
    }
  }

  // Check access count limit
  if (sharedReport.maxAccessCount && sharedReport.accessCount >= sharedReport.maxAccessCount) {
    return { valid: false, reason: 'Maximum access count reached' };
  }

  // Check password if required
  if (sharedReport.hasPassword) {
    if (!password) {
      return { valid: false, reason: 'Password required' };
    }

    const passwordHash = await hashPassword(password);
    const storedHash = await db.prepare(`
      SELECT password_hash FROM shared_reports WHERE share_token = ?
    `).bind(shareToken).first<{ password_hash: string }>();

    if (!storedHash || storedHash.password_hash !== passwordHash) {
      return { valid: false, reason: 'Invalid password' };
    }
  }

  return { valid: true, report: sharedReport };
}

/**
 * Log shared report access
 */
export async function logSharedReportAccess(
  db: D1Database,
  shareToken: string,
  accessedBy: string,
  userAgent?: string
): Promise<void> {
  const sharedReport = await getSharedReport(db, shareToken);
  if (!sharedReport) return;

  const logId = `log-${Date.now()}-${generateToken(8)}`;

  // Insert access log
  await db.prepare(`
    INSERT INTO report_access_log (id, shared_report_id, accessed_by, user_agent, accessed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(logId, sharedReport.id, accessedBy, userAgent || null).run();

  // Update access count and last accessed time
  await db.prepare(`
    UPDATE shared_reports 
    SET access_count = access_count + 1, 
        last_accessed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE share_token = ?
  `).bind(shareToken).run();
}

/**
 * Update shared report
 */
export async function updateSharedReport(
  db: D1Database,
  shareToken: string,
  updates: {
    title?: string;
    description?: string;
    permission?: string;
    isActive?: boolean;
    expiresAt?: Date | null;
    maxAccessCount?: number | null;
  }
): Promise<SharedReport | null> {
  const sharedReport = await getSharedReport(db, shareToken);
  if (!sharedReport) return null;

  await db.prepare(`
    UPDATE shared_reports 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        permission = COALESCE(?, permission),
        is_active = COALESCE(?, is_active),
        expires_at = ?,
        max_access_count = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE share_token = ?
  `).bind(
    updates.title || null,
    updates.description || null,
    updates.permission || null,
    updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
    updates.expiresAt ? updates.expiresAt.toISOString() : null,
    updates.maxAccessCount || null,
    shareToken
  ).run();

  return await getSharedReport(db, shareToken);
}

/**
 * Delete shared report
 */
export async function deleteSharedReport(
  db: D1Database,
  shareToken: string
): Promise<boolean> {
  const result = await db.prepare(`
    DELETE FROM shared_reports WHERE share_token = ?
  `).bind(shareToken).run();

  return result.success;
}

/**
 * Get all shared reports for a user
 */
export async function getUserSharedReports(
  db: D1Database,
  userId: string
): Promise<SharedReport[]> {
  const results = await db.prepare(`
    SELECT id, user_id as userId, report_type as reportType, report_id as reportId,
           share_token as shareToken, title, description, permission,
           CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END as hasPassword,
           expires_at as expiresAt, access_count as accessCount,
           max_access_count as maxAccessCount, is_active as isActive,
           created_at as createdAt, updated_at as updatedAt, last_accessed_at as lastAccessedAt
    FROM shared_reports WHERE user_id = ? ORDER BY created_at DESC
  `).bind(userId).all<SharedReport>();

  return results.results || [];
}

/**
 * Get access logs for a shared report
 */
export async function getSharedReportAccessLogs(
  db: D1Database,
  shareToken: string,
  limit: number = 100
): Promise<any[]> {
  const sharedReport = await getSharedReport(db, shareToken);
  if (!sharedReport) return [];

  const results = await db.prepare(`
    SELECT id, accessed_by as accessedBy, user_agent as userAgent, 
           accessed_at as accessedAt
    FROM report_access_log 
    WHERE shared_report_id = ? 
    ORDER BY accessed_at DESC 
    LIMIT ?
  `).bind(sharedReport.id, limit).all();

  return results.results || [];
}
