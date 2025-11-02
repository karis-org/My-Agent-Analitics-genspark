/**
 * My Agent Analytics - Reusable HTML Components
 * Common UI components for consistent design across pages
 */

interface User {
  name?: string;
  email?: string;
  picture?: string;
}

/**
 * Common HTML header with theme toggle and user menu
 */
export function getAppHeader(user: User, activePage: string = ''): string {
  return `
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center space-x-4">
            <a href="/dashboard" class="flex items-center space-x-2">
              <img src="/static/icons/header-logo.png" alt="My Agent Analytics" class="h-12" style="height: auto; max-height: 48px;">
            </a>
          </div>

          <!-- Navigation & User Menu -->
          <div class="flex items-center space-x-4">
            <!-- Theme Toggle -->
            <button 
              onclick="themeManager.toggle()" 
              class="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="テーマ切り替え">
              <i id="theme-icon" class="fas fa-moon text-lg"></i>
            </button>

            <!-- User Info -->
            <div class="flex items-center space-x-3">
              <img src="${user?.picture || 'https://via.placeholder.com/40'}" 
                   alt="${user?.name}" 
                   class="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-gray-700">
              <div class="hidden md:block">
                <p class="text-sm font-medium text-gray-900 dark:text-white">${user?.name}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${user?.email}</p>
              </div>
            </div>

            <!-- Settings -->
            <a href="/settings" 
               class="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               title="設定">
              <i class="fas fa-cog text-lg"></i>
            </a>

            <!-- Logout -->
            <a href="/auth/logout" 
               class="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               title="ログアウト">
              <i class="fas fa-sign-out-alt text-lg"></i>
            </a>
          </div>
        </div>
      </div>
    </header>
  `;
}

/**
 * Common HTML head with meta tags, styles, and scripts
 */
export function getAppHead(title: string, description?: string): string {
  return `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="${description || 'AI を活用した不動産投資分析プラットフォーム'}">
      <title>${title} - My Agent Analytics</title>
      
      <!-- Styles -->
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      <link href="/static/styles.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      
      <!-- Theme Manager (load early to prevent flash) -->
      <script>
        // Immediate theme application (prevents flash)
        (function() {
          const theme = localStorage.getItem('theme') || 'light';
          const actualTheme = theme === 'auto' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;
          document.documentElement.setAttribute('data-theme', actualTheme);
        })();
      </script>
      
      <!-- Global Scripts -->
      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      <script src="/static/theme.js"></script>
    </head>
  `;
}

/**
 * Loading skeleton for content
 */
export function getLoadingSkeleton(count: number = 3): string {
  const skeletons = Array.from({ length: count }, () => `
    <div class="card p-6 mb-4">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
      <div class="skeleton skeleton-button mt-4"></div>
    </div>
  `).join('');

  return `
    <div class="loading-skeleton">
      ${skeletons}
    </div>
  `;
}

/**
 * Empty state component
 */
export function getEmptyState(
  icon: string, 
  title: string, 
  description: string, 
  actionText?: string, 
  actionHref?: string
): string {
  return `
    <div class="text-center py-12 px-4">
      <div class="text-gray-400 dark:text-gray-600 mb-4">
        <i class="fas ${icon} text-6xl"></i>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">${description}</p>
      ${actionText && actionHref ? `
        <a href="${actionHref}" class="btn btn-primary">
          <i class="fas fa-plus mr-2"></i>${actionText}
        </a>
      ` : ''}
    </div>
  `;
}

/**
 * Stats card component
 */
export function getStatsCard(
  icon: string,
  iconColor: string,
  value: string | number,
  label: string,
  sublabel?: string
): string {
  return `
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="text-3xl ${iconColor}">
          <i class="fas ${icon}"></i>
        </div>
        <span class="text-sm text-gray-500 dark:text-gray-400">${label}</span>
      </div>
      <p class="text-3xl font-bold text-gray-900 dark:text-white">${value}</p>
      ${sublabel ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${sublabel}</p>` : ''}
    </div>
  `;
}

/**
 * Action card component
 */
export function getActionCard(
  href: string,
  icon: string,
  iconColor: string,
  hoverColor: string,
  title: string,
  description: string
): string {
  return `
    <a href="${href}" 
       class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-${hoverColor} hover:bg-${hoverColor}/10 transition-colors">
      <div class="text-3xl ${iconColor} mr-4">
        <i class="fas ${icon}"></i>
      </div>
      <div>
        <p class="font-semibold text-gray-900 dark:text-white">${title}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">${description}</p>
      </div>
    </a>
  `;
}

/**
 * Breadcrumb navigation
 */
export function getBreadcrumb(items: Array<{ label: string; href?: string }>): string {
  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    return `
      ${item.href && !isLast 
        ? `<a href="${item.href}" class="text-primary-600 hover:text-primary-700">${item.label}</a>`
        : `<span class="text-gray-500 dark:text-gray-400">${item.label}</span>`
      }
      ${!isLast ? '<i class="fas fa-chevron-right text-gray-400 text-xs mx-2"></i>' : ''}
    `;
  }).join('');

  return `
    <nav class="flex items-center text-sm mb-6">
      ${breadcrumbItems}
    </nav>
  `;
}

/**
 * Page title with action button
 */
export function getPageTitle(
  title: string,
  subtitle?: string,
  actionText?: string,
  actionOnClick?: string,
  actionIcon?: string
): string {
  return `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">${title}</h1>
        ${subtitle ? `<p class="text-gray-600 dark:text-gray-400 mt-2">${subtitle}</p>` : ''}
      </div>
      ${actionText ? `
        <button onclick="${actionOnClick}" class="btn btn-primary">
          ${actionIcon ? `<i class="fas ${actionIcon} mr-2"></i>` : ''}${actionText}
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Footer component
 */
export function getAppFooter(): string {
  return `
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; ${new Date().getFullYear()} My Agent Analytics. All rights reserved.</p>
          <p class="mt-1">AIを活用した不動産投資分析プラットフォーム</p>
        </div>
      </div>
    </footer>
  `;
}
