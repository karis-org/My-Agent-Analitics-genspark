/**
 * My Agent Analytics - Theme & UI Manager
 * Handles dark mode, responsive UI, and global UI utilities
 */

class ThemeManager {
  constructor() {
    this.THEME_KEY = 'theme';
    this.currentTheme = this.loadTheme();
    this.init();
  }

  init() {
    // Apply saved theme
    this.applyTheme(this.currentTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  loadTheme() {
    const saved = localStorage.getItem(this.THEME_KEY);
    return saved || 'light'; // Default to light mode
  }

  saveTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
    this.currentTheme = theme;
  }

  applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
    
    this.saveTheme(theme);
    this.updateThemeIcon();
  }

  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;

    const actualTheme = document.documentElement.getAttribute('data-theme');
    icon.className = actualTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
  }
}

class UIManager {
  constructor() {
    this.modals = new Map();
    this.toasts = [];
    this.init();
  }

  init() {
    // Initialize toast container
    this.createToastContainer();
    
    // Handle ESC key for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopModal();
      }
    });
  }

  createToastContainer() {
    if (document.getElementById('toast-container')) return;

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 24rem;
    `;
    document.body.appendChild(container);
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type: success, error, warning, info
   * @param {number} duration - Duration in ms (default: 3000)
   */
  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    toast.innerHTML = `
      <div class="${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
        <i class="fas ${icons[type]}"></i>
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    container.appendChild(toast);
    this.toasts.push(toast);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          toast.remove();
          this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
      }, duration);
    }

    return toast;
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = '読み込み中...') {
    let overlay = document.getElementById('loading-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl flex items-center gap-4">
          <div class="spinner-lg"></div>
          <span id="loading-message" class="text-gray-900 dark:text-white font-medium">${message}</span>
        </div>
      `;
      
      document.body.appendChild(overlay);
    } else {
      overlay.style.display = 'flex';
      document.getElementById('loading-message').textContent = message;
    }

    return overlay;
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {object} options - Dialog options
   */
  async confirm(title, message, options = {}) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      
      const {
        confirmText = '確認',
        cancelText = 'キャンセル',
        confirmClass = 'btn-danger',
        type = 'warning'
      } = options;

      const typeColors = {
        warning: 'text-yellow-600',
        danger: 'text-red-600',
        info: 'text-blue-600'
      };

      const typeIcons = {
        warning: 'fa-exclamation-triangle',
        danger: 'fa-exclamation-circle',
        info: 'fa-info-circle'
      };

      modal.innerHTML = `
        <div class="modal-container">
          <div class="modal-content">
            <div class="p-6">
              <div class="flex items-start gap-4">
                <div class="${typeColors[type]} text-3xl">
                  <i class="fas ${typeIcons[type]}"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
                  <p class="text-gray-600 dark:text-gray-300">${message}</p>
                </div>
              </div>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-2">
              <button id="cancel-btn" class="btn btn-secondary">${cancelText}</button>
              <button id="confirm-btn" class="btn ${confirmClass}">${confirmText}</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#cancel-btn').onclick = () => {
        modal.remove();
        resolve(false);
      };

      modal.querySelector('#confirm-btn').onclick = () => {
        modal.remove();
        resolve(true);
      };

      modal.onclick = (e) => {
        if (e.target === modal || e.target.classList.contains('modal-container')) {
          modal.remove();
          resolve(false);
        }
      };
    });
  }

  /**
   * Close top-most modal
   */
  closeTopModal() {
    const modals = document.querySelectorAll('.modal-backdrop');
    if (modals.length > 0) {
      modals[modals.length - 1].remove();
    }
  }

  /**
   * Format number with thousand separators
   * @param {number} num - Number to format
   * @param {number} decimals - Decimal places
   */
  formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }

  /**
   * Format currency (Japanese Yen)
   * @param {number} amount - Amount to format
   */
  formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  }

  /**
   * Format date
   * @param {string|Date} date - Date to format
   * @param {string} format - Format style: short, medium, long
   */
  formatDate(date, format = 'medium') {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const options = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      medium: { year: 'numeric', month: 'long', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    };

    return new Intl.DateTimeFormat('ja-JP', options[format] || options.medium).format(d);
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('クリップボードにコピーしました', 'success', 2000);
      return true;
    } catch (err) {
      this.showToast('コピーに失敗しました', 'error', 2000);
      return false;
    }
  }

  /**
   * Validate form field
   * @param {HTMLInputElement} input - Input element
   * @param {string} type - Validation type
   */
  validateField(input, type) {
    const value = input.value.trim();
    let isValid = true;
    let message = '';

    switch (type) {
      case 'required':
        isValid = value !== '';
        message = '必須項目です';
        break;
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        message = '有効なメールアドレスを入力してください';
        break;
      case 'number':
        isValid = !isNaN(parseFloat(value));
        message = '数値を入力してください';
        break;
      case 'positive':
        isValid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
        message = '正の数値を入力してください';
        break;
      case 'phone':
        isValid = /^[0-9\-\+\(\)\s]+$/.test(value);
        message = '有効な電話番号を入力してください';
        break;
    }

    // Update UI
    if (isValid) {
      input.classList.remove('error');
      const errorEl = input.nextElementSibling;
      if (errorEl && errorEl.classList.contains('form-error')) {
        errorEl.remove();
      }
    } else {
      input.classList.add('error');
      let errorEl = input.nextElementSibling;
      if (!errorEl || !errorEl.classList.contains('form-error')) {
        errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        input.parentNode.insertBefore(errorEl, input.nextSibling);
      }
      errorEl.textContent = message;
    }

    return isValid;
  }
}

// Initialize global instances
const themeManager = new ThemeManager();
const uiManager = new UIManager();

// Export to window for global access
window.themeManager = themeManager;
window.uiManager = uiManager;

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);
