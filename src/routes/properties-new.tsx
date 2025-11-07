// Properties routes for My Agent Analytics (Refactored)

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { renderPropertyListPage } from '../components/properties/list';

const properties = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all property routes
properties.use('/*', authMiddleware);

/**
 * Property list page
 */
properties.get('/', (c) => {
  const user = c.get('user');
  return c.html(renderPropertyListPage(user));
});

/**
 * 新規物件登録ページ
 * TODO: 別コンポーネントに分離
 */
properties.get('/new', (c) => {
  const user = c.get('user');
  // 暫定的に元のコードを使用
  return c.html('<h1>New Property Form (TODO)</h1>');
});

/**
 * 物件編集ページ
 * TODO: 別コンポーネントに分離
 */
properties.get('/:id/edit', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  // 暫定的に元のコードを使用
  return c.html('<h1>Edit Property Form (TODO)</h1>');
});

/**
 * 物件詳細ページ
 * TODO: 別コンポーネントに分離
 */
properties.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  // 暫定的に元のコードを使用
  return c.html('<h1>Property Detail (TODO)</h1>');
});

/**
 * 物件分析ページ
 * TODO: 別コンポーネントに分離
 */
properties.get('/:id/analyze', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  // 暫定的に元のコードを使用
  return c.html('<h1>Property Analysis (TODO)</h1>');
});

/**
 * 統合レポートページ
 * TODO: 別コンポーネントに分離
 */
properties.get('/:id/comprehensive-report', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  // 暫定的に元のコードを使用
  return c.html('<h1>Comprehensive Report (TODO)</h1>');
});

export default properties;
