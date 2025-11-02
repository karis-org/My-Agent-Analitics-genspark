// Database operations for My Agent Analytics

import type { User, Session } from '../types';
import { generateSessionId, getSessionExpiration, isSessionExpired } from './utils';

/**
 * Get user by ID
 */
export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>();
  
  return result || null;
}

/**
 * Create a new session
 */
export async function createSession(
  db: D1Database,
  userId: string,
  expirationDays: number = 7
): Promise<Session> {
  const id = generateSessionId();
  const expiresAt = getSessionExpiration(expirationDays).toISOString();
  const now = new Date().toISOString();
  
  await db
    .prepare(
      'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
    )
    .bind(id, userId, expiresAt, now)
    .run();
  
  const session = await getSessionById(db, id);
  if (!session) throw new Error('Failed to create session');
  
  return session;
}

/**
 * Get session by ID
 */
export async function getSessionById(db: D1Database, id: string): Promise<Session | null> {
  const result = await db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .bind(id)
    .first<Session>();
  
  if (!result) return null;
  
  // Check if session is expired
  if (isSessionExpired(result.expires_at)) {
    await deleteSession(db, id);
    return null;
  }
  
  return result;
}

/**
 * Get session with user
 */
export async function getSessionWithUser(
  db: D1Database,
  sessionId: string
): Promise<{ session: Session; user: User } | null> {
  const session = await getSessionById(db, sessionId);
  if (!session) return null;
  
  const user = await getUserById(db, session.user_id);
  if (!user) return null;
  
  return { session, user };
}

/**
 * Delete session
 */
export async function deleteSession(db: D1Database, id: string): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE id = ?')
    .bind(id)
    .run();
}

/**
 * Delete expired sessions
 */
export async function deleteExpiredSessions(db: D1Database): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare('DELETE FROM sessions WHERE expires_at < ?')
    .bind(now)
    .run();
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(db: D1Database, userId: string): Promise<Session[]> {
  const result = await db
    .prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all<Session>();
  
  return result.results || [];
}
