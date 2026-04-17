/**
 * Admin Authentication
 * Handles login and session management using sessionStorage.
 * - Session is cleared automatically when the browser tab closes.
 * - 30-minute inactivity auto-logout with a 2-minute warning.
 */

const AdminAuth = {
  // Session key
  SESSION_KEY: 'jrc_admin_session',

  // Inactivity settings (milliseconds)
  INACTIVITY_LIMIT: 30 * 60 * 1000,   // 30 minutes
  WARNING_BEFORE: 2 * 60 * 1000,      // warn 2 minutes before logout

  // Timer references
  _inactivityTimer: null,
  _warningTimer: null,
  _warningShown: false,

  init() {
    // Check if already logged in
    if (this.isAuthenticated()) {
      // If on login page, redirect to admin
      if (window.location.pathname.includes('admin-login')) {
        window.location.href = 'admin.html';
        return;
      }

      // If on admin page, setup inactivity timer
      if (window.location.pathname.includes('admin.html')) {
        this._startInactivityTimer();
        this._bindActivityEvents();
      }
    } else {
      // If on admin page but not logged in, redirect to login
      if (window.location.pathname.includes('admin.html') && !window.location.pathname.includes('admin-login')) {
        window.location.href = 'admin-login.html';
        return;
      }
    }

    // Setup login form if exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Setup logout if exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Setup change password if exists
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeChangePasswordBtn = document.getElementById('closeChangePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (changePasswordBtn && changePasswordModal) {
      changePasswordBtn.addEventListener('click', () => {
        changePasswordModal.classList.remove('hidden');
        changePasswordModal.classList.add('flex');
      });
    }

    if (closeChangePasswordBtn && changePasswordModal) {
      closeChangePasswordBtn.addEventListener('click', () => {
        changePasswordModal.classList.add('hidden');
        changePasswordModal.classList.remove('flex');
      });
    }

    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChangePassword();
      });
    }
  },

  // ===================== INACTIVITY TIMER =====================

  _bindActivityEvents() {
    const resetFn = () => this._resetInactivityTimer();
    ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, resetFn, { passive: true });
    });
  },

  _startInactivityTimer() {
    this._clearTimers();
    this._warningShown = false;

    // Set warning timer (fires 2 min before logout)
    this._warningTimer = setTimeout(() => {
      this._warningShown = true;
      alert('⚠️ आप 2 मिनट में निष्क्रियता के कारण लॉगआउट हो जाएंगे। (You will be logged out in 2 minutes due to inactivity)');
    }, this.INACTIVITY_LIMIT - this.WARNING_BEFORE);

    // Set logout timer
    this._inactivityTimer = setTimeout(() => {
      this.logout();
      alert('⏳ निष्क्रियता के कारण आपको लॉगआउट कर दिया गया है। (Logged out due to inactivity)');
    }, this.INACTIVITY_LIMIT);
  },

  _resetInactivityTimer() {
    // Only reset if we haven't already shown the final logout
    if (this.isAuthenticated()) {
      this._startInactivityTimer();
    }
  },

  _clearTimers() {
    if (this._inactivityTimer) clearTimeout(this._inactivityTimer);
    if (this._warningTimer) clearTimeout(this._warningTimer);
    this._inactivityTimer = null;
    this._warningTimer = null;
  },

  // ===================== LOGIN / LOGOUT =====================

  async handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Clear previous errors
    errorMessage.classList.add('hidden');

    try {
      const API_BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
        ? 'http://localhost:3000'
        : 'https://jrcintercollege.onrender.com';

      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Create session — stored in sessionStorage (clears on tab close)
        const session = {
          username: username,
          loginTime: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        // Redirect to admin panel
        window.location.href = 'admin.html';
      } else {
        errorMessage.textContent = data.message || 'अवैध क्रेडेंशियल्स';
        errorMessage.classList.remove('hidden');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
      }
    } catch (err) {
      console.error('Login error:', err);
      errorMessage.textContent = 'सर्वर से संपर्क नहीं हो सका';
      errorMessage.classList.remove('hidden');
    }
  },

  async handleChangePassword() {
    const cpCurrent = document.getElementById('cpCurrent').value;
    const cpNew = document.getElementById('cpNew').value;
    const cpConfirm = document.getElementById('cpConfirm').value;
    const cpMessage = document.getElementById('cpMessage');

    cpMessage.classList.add('hidden');
    cpMessage.classList.remove('text-red-500', 'text-green-500');

    if (cpNew !== cpConfirm) {
      cpMessage.textContent = 'नए पासवर्ड मेल नहीं खाते हैं (New passwords do not match)';
      cpMessage.classList.remove('hidden');
      cpMessage.classList.add('text-red-500');
      return;
    }

    const session = this.getSession();
    if (!session) return;

    try {
      const API_BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
        ? 'http://localhost:3000'
        : 'https://jrcintercollege.onrender.com';

      const res = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: session.username,
          currentPassword: cpCurrent,
          newPassword: cpNew
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        cpMessage.textContent = data.message || 'पासवर्ड सफलतापूर्वक बदल गया';
        cpMessage.classList.remove('hidden');
        cpMessage.classList.add('text-green-500');
        setTimeout(() => {
          document.getElementById('changePasswordModal').classList.add('hidden');
          document.getElementById('changePasswordModal').classList.remove('flex');
          document.getElementById('changePasswordForm').reset();
          cpMessage.classList.add('hidden');
        }, 2000);
      } else {
        cpMessage.textContent = data.message || 'त्रुटि (Error)';
        cpMessage.classList.remove('hidden');
        cpMessage.classList.add('text-red-500');
      }
    } catch (err) {
      console.error(err);
      cpMessage.textContent = 'सर्वर से संपर्क नहीं हो सका';
      cpMessage.classList.remove('hidden');
      cpMessage.classList.add('text-red-500');
    }
  },

  // ===================== SESSION HELPERS =====================

  isAuthenticated() {
    const sessionStr = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return false;

    try {
      const session = JSON.parse(sessionStr);

      // Check if session expired
      if (new Date(session.expiresAt) < new Date()) {
        sessionStorage.removeItem(this.SESSION_KEY);
        return false;
      }

      return true;
    } catch (error) {
      sessionStorage.removeItem(this.SESSION_KEY);
      return false;
    }
  },

  getSession() {
    const sessionStr = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return null;

    try {
      return JSON.parse(sessionStr);
    } catch (error) {
      return null;
    }
  },

  logout(silent = false) {
    this._clearTimers();
    sessionStorage.removeItem(this.SESSION_KEY);

    // Also clear any leftover localStorage key from old code
    localStorage.removeItem(this.SESSION_KEY);

    // Only redirect if not already on login page and not silent logout
    if (!silent && !window.location.pathname.includes('admin-login')) {
      if (window.location.pathname.includes('admin.html')) {
        window.location.href = 'admin-login.html';
      }
    }
  },

  // Check authentication on admin pages
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AdminAuth.init());
} else {
  AdminAuth.init();
}

// Export
window.AdminAuth = AdminAuth;
