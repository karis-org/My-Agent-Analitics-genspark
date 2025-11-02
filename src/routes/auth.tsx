// Authentication routes for My Agent Analytics

import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { Bindings, Variables } from '../types';
import { deleteSession } from '../lib/db';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Login page
 */
auth.get('/login', (c) => {
  const error = c.req.query('error');
  const errorMessage = error === 'invalid_credentials' ? '⚠️ メールアドレスまたはパスワードが正しくありません' : '';
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ログイン - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center mb-8">
                    <img src="/static/icons/app-icon.png" alt="Logo" class="h-20 w-20 mx-auto mb-4">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">My Agent Analytics</h1>
                    <p class="text-gray-600">不動産投資分析プラットフォーム</p>
                </div>
                
                ${errorMessage ? `<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">${errorMessage}</div>` : ''}
                
                <div class="space-y-4">
                    <!-- Password Login -->
                    <form method="POST" action="/auth/password" class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-user mr-1"></i>メールアドレス
                            </label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="realestate.navigator01@gmail.com"
                            >
                        </div>
                        
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-lock mr-1"></i>パスワード
                            </label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="パスワードを入力"
                            >
                        </div>
                        
                        <div class="flex items-center">
                            <input 
                                type="checkbox" 
                                id="remember" 
                                name="remember" 
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            >
                            <label for="remember" class="ml-2 block text-sm text-gray-700">
                                ログイン情報を保存する
                            </label>
                        </div>
                        
                        <button 
                            type="submit"
                            class="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors">
                            <i class="fas fa-sign-in-alt mr-2"></i>ログイン
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-sm text-gray-600">
                            アカウントをお持ちでない方は
                            <a href="/auth/signup" class="text-blue-600 hover:underline font-medium">新規登録</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

/**
 * Hash password using Web Crypto API (Cloudflare Workers compatible)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Password Login (Admin Only)
 */
auth.post('/password', async (c) => {
  try {
    const formData = await c.req.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const remember = formData.get('remember')?.toString() === 'on';
    
    if (!email || !password) {
      return c.redirect('/auth/login?error=missing_fields');
    }
    
    // Hash the provided password using Web Crypto API
    const passwordHash = await hashPassword(password);
    
    // Check user in database (all users can login)
    const stmt = c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND password_hash = ?'
    ).bind(email, passwordHash);
    
    const user = await stmt.first();
    
    if (!user) {
      return c.redirect('/auth/login?error=invalid_credentials');
    }
    
    // Create session using Web Crypto API
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    const sessionDays = remember ? 30 : 7; // 30 days if remember, 7 days otherwise
    expiresAt.setDate(expiresAt.getDate() + sessionDays);
    
    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt.toISOString()).run();
    
    // Set session cookie
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * sessionDays, // 30 or 7 days
      path: '/',
    });
    
    // Redirect to dashboard using 303 See Other to ensure GET method
    return c.redirect('/dashboard', 303);
  } catch (error) {
    console.error('Password login error:', error);
    return c.redirect('/auth/login?error=server_error');
  }
});

/**
 * Signup page
 */
auth.get('/signup', (c) => {
  const error = c.req.query('error');
  let errorMessage = '';
  
  if (error === 'email_exists') {
    errorMessage = '⚠️ このメールアドレスは既に登録されています';
  } else if (error === 'missing_fields') {
    errorMessage = '⚠️ すべての項目を入力してください';
  } else if (error === 'password_mismatch') {
    errorMessage = '⚠️ パスワードが一致しません';
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新規登録 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center mb-8">
                    <img src="/static/icons/app-icon.png" alt="Logo" class="h-20 w-20 mx-auto mb-4">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">新規登録</h1>
                    <p class="text-gray-600">My Agent Analytics</p>
                </div>
                
                ${errorMessage ? `<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">${errorMessage}</div>` : ''}
                
                <form method="POST" action="/auth/signup" class="space-y-4">
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-user mr-1"></i>お名前
                        </label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="山田 太郎"
                        >
                    </div>
                    
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-envelope mr-1"></i>メールアドレス
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="example@gmail.com"
                        >
                    </div>
                    
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-lock mr-1"></i>パスワード
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            required
                            minlength="6"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="6文字以上"
                        >
                    </div>
                    
                    <div>
                        <label for="password_confirm" class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-lock mr-1"></i>パスワード（確認）
                        </label>
                        <input 
                            type="password" 
                            id="password_confirm" 
                            name="password_confirm" 
                            required
                            minlength="6"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="もう一度入力"
                        >
                    </div>
                    
                    <button 
                        type="submit"
                        class="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors">
                        <i class="fas fa-user-plus mr-2"></i>新規登録
                    </button>
                </form>
                
                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-600">
                        既にアカウントをお持ちですか？
                        <a href="/auth/login" class="text-blue-600 hover:underline font-medium">ログイン</a>
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

/**
 * Signup - Create new user account
 */
auth.post('/signup', async (c) => {
  try {
    const formData = await c.req.formData();
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const passwordConfirm = formData.get('password_confirm')?.toString();
    
    if (!name || !email || !password || !passwordConfirm) {
      return c.redirect('/auth/signup?error=missing_fields');
    }
    
    if (password !== passwordConfirm) {
      return c.redirect('/auth/signup?error=password_mismatch');
    }
    
    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.redirect('/auth/signup?error=email_exists');
    }
    
    // Generate user ID (member number)
    // Get the count of existing users and add 1
    const userCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();
    
    const memberNumber = String((userCount?.count || 0) + 1).padStart(3, '0');
    const userId = `user-${memberNumber}`;
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name, password_hash, role, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      userId,
      email,
      name,
      passwordHash,
      'user',
      0,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
    
    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, userId, expiresAt.toISOString()).run();
    
    // Set session cookie
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    // Redirect to dashboard
    return c.redirect('/dashboard', 303);
  } catch (error) {
    console.error('Signup error:', error);
    return c.redirect('/auth/signup?error=server_error');
  }
});

/**
 * Logout
 */
auth.get('/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id');
  
  if (sessionId) {
    await deleteSession(c.env.DB, sessionId);
  }
  
  // Clear session cookie
  setCookie(c, 'session_id', '', {
    maxAge: 0,
    path: '/',
  });
  
  return c.redirect('/');
});

export default auth;
