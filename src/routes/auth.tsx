// Authentication routes for My Agent Analytics

import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { Bindings, Variables, GoogleTokenResponse, GoogleUserInfo } from '../types';
import { generateState, createCookie } from '../lib/utils';
import { getUserByEmail, createUser, updateUser, createSession, deleteSession } from '../lib/db';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Login page
 */
auth.get('/login', (c) => {
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
                
                <div class="space-y-4">
                    <a href="/auth/google" 
                       class="flex items-center justify-center w-full bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        <svg class="w-6 h-6 mr-3" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Googleでログイン
                    </a>
                    
                    <p class="text-center text-sm text-gray-500 mt-6">
                        ログインすることで、<a href="#" class="text-blue-600 hover:underline">利用規約</a>と
                        <a href="#" class="text-blue-600 hover:underline">プライバシーポリシー</a>に同意したものとみなされます。
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

/**
 * Google OAuth - Redirect to Google
 */
auth.get('/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;
  const state = generateState();
  
  // Store state in cookie for verification
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 600, // 10 minutes
  });
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/**
 * Google OAuth - Callback
 */
auth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  
  // Check for errors
  if (error) {
    return c.html(`
      <html>
        <body>
          <h1>Authentication Error</h1>
          <p>Error: ${error}</p>
          <a href="/auth/login">Try again</a>
        </body>
      </html>
    `);
  }
  
  // Verify state
  const savedState = getCookie(c, 'oauth_state');
  if (!state || state !== savedState) {
    return c.text('Invalid state parameter', 400);
  }
  
  if (!code) {
    return c.text('Missing authorization code', 400);
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${new URL(c.req.url).origin}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }
    
    const tokens: GoogleTokenResponse = await tokenResponse.json();
    
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const googleUser: GoogleUserInfo = await userInfoResponse.json();
    
    // Find or create user in database
    let user = await getUserByEmail(c.env.DB, googleUser.email);
    
    if (!user) {
      // Create new user
      user = await createUser(c.env.DB, {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        provider: 'google',
      });
    } else {
      // Update existing user
      user = await updateUser(c.env.DB, user.id, {
        name: googleUser.name,
        picture: googleUser.picture,
      });
    }
    
    // Create session
    const session = await createSession(c.env.DB, user.id);
    
    // Set session cookie
    setCookie(c, 'session_id', session.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    // Clear OAuth state cookie
    setCookie(c, 'oauth_state', '', {
      maxAge: 0,
    });
    
    // Redirect to dashboard
    return c.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.html(`
      <html>
        <body>
          <h1>Authentication Error</h1>
          <p>Failed to authenticate. Please try again.</p>
          <a href="/auth/login">Back to login</a>
        </body>
      </html>
    `);
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
