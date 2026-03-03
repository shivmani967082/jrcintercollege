/**
 * Admin Authentication
 * Handles login and session management
 */

const AdminAuth = {
  // Admin credentials
  ADMIN_USERNAME: 'v',
  ADMIN_PASSWORD: 'j',
  
  // Session key
  SESSION_KEY: 'jrc_admin_session',
  
  init() {
    // Check if already logged in
    if (this.isAuthenticated()) {
      // If on login page, redirect to admin
      if (window.location.pathname.includes('admin-login')) {
        window.location.href = 'admin.html';
        return;
      }
      
      // If on admin page, setup auto-logout on navigation
      if (window.location.pathname.includes('admin.html')) {
        this.setupAutoLogout();
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
  },

  setupAutoLogout() {
    // Logout when navigating away from admin page
    window.addEventListener('beforeunload', () => {
      this.logout();
    });

    // Logout when page visibility changes (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched tab or minimized window
        setTimeout(() => {
          if (document.hidden) {
            this.logout();
          }
        }, 1000); // Wait 1 second to avoid immediate logout on quick switches
      }
    });

    // Logout when navigating to non-admin pages
    const allLinks = document.querySelectorAll('a[href]');
    allLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        // If clicking a link that goes outside admin section
        if (href && !href.includes('admin') && !href.startsWith('#')) {
          this.logout();
        }
      });
    });

    // Logout on browser back/forward navigation
    window.addEventListener('popstate', () => {
      if (!window.location.pathname.includes('admin')) {
        this.logout();
      }
    });

    // Monitor URL changes (for SPA-like navigation)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        if (!currentUrl.includes('admin')) {
          this.logout();
        }
      }
    }, 500);
  },

  handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Clear previous errors
    errorMessage.classList.add('hidden');

    // Validate credentials
    if (username.toLowerCase() === this.ADMIN_USERNAME.toLowerCase() && password === this.ADMIN_PASSWORD) {
      // Create session
      const session = {
        username: username,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        currentPage: 'admin.html' // Track current admin page
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      // Redirect to admin panel
      window.location.href = 'admin.html';
    } else {
      // Show error
      errorMessage.classList.remove('hidden');
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    }
  },

  isAuthenticated() {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return false;

    try {
      const session = JSON.parse(sessionStr);
      
      // Check if session expired
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(this.SESSION_KEY);
        return false;
      }
      
      return true;
    } catch (error) {
      localStorage.removeItem(this.SESSION_KEY);
      return false;
    }
  },

  getSession() {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return null;

    try {
      return JSON.parse(sessionStr);
    } catch (error) {
      return null;
    }
  },

  logout(silent = false) {
    localStorage.removeItem(this.SESSION_KEY);
    
    // Only redirect if not already on login page and not silent logout
    if (!silent && !window.location.pathname.includes('admin-login')) {
      // Check if we're leaving admin section
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
