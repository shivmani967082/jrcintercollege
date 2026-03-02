/**
 * Teacher Authentication - Class Teacher login only
 * Login with Teacher ID + Class + Password (admin-registered teachers only)
 * No self-registration; account create only via admin panel.
 */

const TeacherAuth = {
  API_BASE: 'https://jrc-school-pro.onrender.com/api',
  SESSION_KEY: 'jrc_teacher_session',

  init() {
    if (this.isAuthenticated()) {
      if (window.location.pathname.includes('teacher-login')) {
        window.location.href = 'teacher.html';
        return;
      }
      if (window.location.pathname.includes('teacher.html')) {
        this.setupLogoutOnLeave();
      }
    } else {
      if (window.location.pathname.includes('teacher.html') && !window.location.pathname.includes('teacher-login')) {
        window.location.href = 'teacher-login.html';
        return;
      }
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  },

  setupLogoutOnLeave() {
    window.addEventListener('beforeunload', () => this.logout(true));
  },

  async handleLogin() {
    const teacherId = document.getElementById('teacherId').value.trim();
    const loginClass = document.getElementById('loginClass').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) errorMessage.classList.add('hidden');

    if (!teacherId || !loginClass || !password) {
      if (errorMessage) {
        errorMessage.textContent = 'Teacher ID, कक्षा और पासवर्ड भरें।';
        errorMessage.classList.remove('hidden');
      }
      return;
    }

    try {
      const res = await fetch(`${this.API_BASE}/teacher/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, class: loginClass, password })
      });
      const json = await res.json();

      if (json.success && json.data) {
        const session = {
          id: json.data.id,
          teacherId: json.data.teacherId,
          name: json.data.name,
          assignedClass: json.data.assignedClass,
          loginTime: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        window.location.href = 'teacher.html';
      } else {
        if (errorMessage) {
          errorMessage.textContent = json.message || 'गलत Teacher ID, कक्षा या पासवर्ड।';
          errorMessage.classList.remove('hidden');
        }
        const pwEl = document.getElementById('password');
        if (pwEl) { pwEl.value = ''; pwEl.focus(); }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (errorMessage) {
        errorMessage.textContent = 'सर्वर से कनेक्ट नहीं हो पाया। बाद में कोशिश करें।';
        errorMessage.classList.remove('hidden');
      }
    }
  },

  isAuthenticated() {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return false;
    try {
      const session = JSON.parse(sessionStr);
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(this.SESSION_KEY);
        return false;
      }
      return true;
    } catch (e) {
      localStorage.removeItem(this.SESSION_KEY);
      return false;
    }
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(this.SESSION_KEY) || '');
    } catch (e) { return null; }
  },

  getAssignedClass() {
    const s = this.getSession();
    return s ? s.assignedClass : null;
  },

  logout(silent = false) {
    localStorage.removeItem(this.SESSION_KEY);
    if (!silent && window.location.pathname.includes('teacher.html')) {
      window.location.href = 'teacher-login.html';
    }
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'teacher-login.html';
      return false;
    }
    return true;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TeacherAuth.init());
} else {
  TeacherAuth.init();
}
window.TeacherAuth = TeacherAuth;