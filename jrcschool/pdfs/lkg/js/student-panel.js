/**
 * Student Panel - Register, Login, Dashboard (profile, result, fees)
 * Optimized for high-volume data with Dynamic UI Injection (Auto-Fix).
 * Logic preserved, data display organized with Session & Month filters.
 */

const API_BASE = 'https://jrc-school-pro.onrender.com';
const TOKEN_KEY = 'jrc_student_token';
const STUDENT_KEY = 'jrc_student_info';

const StudentPanel = {
  allResults: [], 
  activeSession: 'all',
  activeMonth: 'all',

  getToken() { return localStorage.getItem(TOKEN_KEY); },
  setToken(token) { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); },
  setStudentInfo(info) { info ? localStorage.setItem(STUDENT_KEY, JSON.stringify(info)) : localStorage.removeItem(STUDENT_KEY); },
  getStudentInfo() { try { return JSON.parse(localStorage.getItem(STUDENT_KEY)); } catch(e){return null;} },
  isLoggedIn() { return !!this.getToken(); },
  logout() { 
    this.setToken(null); 
    this.setStudentInfo(null); 
    window.location.href='student-login.html'; 
  },

  showMessage(elId, text, isError) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    el.className = 'mt-4 text-center text-sm ' + (isError ? 'text-red-500 font-bold' : 'text-green-500 font-bold');
  },

  hideMessage(elId) {
    const el = document.getElementById(elId);
    if (el) el.classList.add('hidden');
  },

  async register() {
    const name = document.getElementById('regName').value.trim();
    const cls = document.getElementById('regClass').value;
    const rollNo = document.getElementById('regRollNo').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    this.hideMessage('formMessage');
    if (password !== confirmPassword) {
      this.showMessage('formMessage', 'पासवर्ड मेल नहीं खाते।', true);
      return;
    }
    
    try {
      const res = await fetch(API_BASE + '/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, class: cls, rollNo, password, confirmPassword })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
        this.setStudentInfo(data.student);
        window.location.href = 'student-panel.html';
      } else {
        this.showMessage('formMessage', data.message || 'रजिस्ट्रेशन में त्रुटि।', true);
      }
    } catch (err) { this.showMessage('formMessage', 'सर्वर त्रुटि।', true); }
  },

  async login() {
    const cls = document.getElementById('loginClass').value;
    const rollNo = document.getElementById('loginRollNo').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    this.hideMessage('formMessage');
    try {
      const res = await fetch(API_BASE + '/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class: cls, rollNo, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
        this.setStudentInfo(data.student);
        window.location.href = 'student-panel.html';
      } else {
        this.showMessage('formMessage', data.message || 'लॉगिन विफल।', true);
      }
    } catch (err) { this.showMessage('formMessage', 'सर्वर त्रुटि।', true); }
  },

  async loadDashboard() {
    const token = this.getToken();
    if (!token) return;
    const authHeader = { 'Authorization': 'Bearer ' + token };

    this.fixUIStructure();

    try {
      const res = await fetch(API_BASE + '/api/student/me', { headers: authHeader });
      const json = await res.json();
      const profileEl = document.getElementById('profileContent');
      if(json.success && profileEl) {
        const d = json.data;
        profileEl.innerHTML = `
          <div class="space-y-3 p-2">
            <p class="flex justify-between border-b border-white/5 pb-2"><span class="text-gray-400">नाम:</span> <span class="font-bold">${this.escape(d.name)}</span></p>
            <p class="flex justify-between border-b border-white/5 pb-2"><span class="text-gray-400">कक्षा:</span> <span class="font-bold">${this.escape(d.class)}</span></p>
            <p class="flex justify-between"><span class="text-gray-400">रोल नंबर:</span> <span class="font-bold">${this.escape(d.rollNo)}</span></p>
          </div>
        `;
        if(document.getElementById('studentNameNav')) document.getElementById('studentNameNav').textContent = d.name;
      }
    } catch(e) { console.error("Profile load failed"); }

    try {
      const res = await fetch(API_BASE + '/api/student/result', { headers: authHeader });
      const json = await res.json();
      if(json.success && json.data.length > 0) {
        this.allResults = json.data;
        this.generateFilters(json.data);
        this.renderResults(json.data);
      } else {
        document.getElementById('resultContent').innerHTML = '<div class="p-8 text-center opacity-50 italic">कोई परिणाम उपलब्ध नहीं है</div>';
      }
    } catch(e) { console.error("Results load failed"); }

    try {
      const res = await fetch(API_BASE + '/api/student/fees', { headers: authHeader });
      const json = await res.json();
      const feesEl = document.getElementById('feesContent');
      if(json.success && json.data.length > 0 && feesEl) {
        const statusText = { pending: 'बाकी', partial: 'आंशिक', paid: 'सफल' };
        feesEl.innerHTML = json.data.map(f => {
          const isPaid = f.status === 'paid';
          const due = (f.amount || 0) - (f.paid || 0);
          const sClass = isPaid ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10';
          
          return `
            <div class="result-card flex justify-between items-center mb-3 transition hover:border-accent">
              <div>
                <p class="font-bold text-white text-base">${this.escape(f.description)}</p>
                <p class="text-[10px] text-gray-500 uppercase tracking-tighter">${f.session || 'N/A'}</p>
                <p class="text-xs mt-1 text-gray-300">Total: ₹${f.amount} | <span class="text-yellow-400">Due: ₹${due}</span></p>
              </div>
              <div class="text-right">
                <span class="px-3 py-1 rounded-full text-[10px] font-black border ${sClass}">${statusText[f.status].toUpperCase()}</span>
              </div>
            </div>
          `;
        }).join('');
      } else if(feesEl) {
        feesEl.innerHTML = '<div class="p-8 text-center opacity-50 italic">कोई फीस रिकॉर्ड नहीं मिला</div>';
      }
    } catch(e) { console.error("Fees load failed"); }
  },

  fixUIStructure() {
    const resultHeader = document.querySelector('#titleResults')?.parentElement;
    if (resultHeader && !document.getElementById('resultFilters')) {
      const filterWrapper = document.createElement('div');
      filterWrapper.className = 'space-y-2 mb-6';
      
      const sessionFilter = document.createElement('div');
      sessionFilter.id = 'resultFilters';
      sessionFilter.className = 'flex gap-2 overflow-x-auto py-1 scrollbar-hide';
      
      const monthFilter = document.createElement('div');
      monthFilter.id = 'monthFilters';
      monthFilter.className = 'flex gap-2 overflow-x-auto py-1 scrollbar-hide';
      
      filterWrapper.appendChild(sessionFilter);
      filterWrapper.appendChild(monthFilter);
      resultHeader.after(filterWrapper);
    }

    if (!document.getElementById('jrc-injected-styles')) {
      const style = document.createElement('style');
      style.id = 'jrc-injected-styles';
      style.innerHTML = `
        .filter-chip { 
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
          padding: 6px 14px; border-radius: 12px; font-size: 10px; cursor: pointer; 
          white-space: nowrap; transition: 0.2s; color: #a1a1aa; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .filter-chip:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }
        .filter-chip.active { background: #fbbf24; color: #000; font-weight: 800; border-color: #fbbf24; box-shadow: 0 0 12px rgba(251,191,36,0.2); }
        
        #resultContent, #feesContent { 
          max-height: 550px; overflow-y: auto; overflow-x: hidden; padding-right: 8px; scroll-behavior: smooth;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .result-card { 
          background: rgba(30, 41, 59, 0.4) !important; border: 1px solid rgba(255,255,255,0.05) !important; 
          border-radius: 1.25rem !important; padding: 1.25rem !important; margin-bottom: 1rem !important; 
        }
      `;
      document.head.appendChild(style);
    }
  },

  generateFilters(data) {
    const sessions = [...new Set(data.map(r => r.session))].filter(Boolean).sort().reverse();
    const months = [...new Set(data.map(r => {
      if(!r.createdAt) return null;
      return new Date(r.createdAt).toLocaleString('hi-IN', { month: 'long' });
    }))].filter(Boolean);

    const sContainer = document.getElementById('resultFilters');
    const mContainer = document.getElementById('monthFilters');
    
    if(sContainer) {
      let sHtml = `<div class="filter-chip active" onclick="StudentPanel.updateFilter('session', 'all', this)">All Years</div>`;
      sessions.forEach(s => { sHtml += `<div class="filter-chip" onclick="StudentPanel.updateFilter('session', '${s}', this)">Year ${s}</div>`; });
      sContainer.innerHTML = sHtml;
    }

    if(mContainer) {
      let mHtml = `<div class="filter-chip active" onclick="StudentPanel.updateFilter('month', 'all', this)">All Months</div>`;
      months.forEach(m => { mHtml += `<div class="filter-chip" onclick="StudentPanel.updateFilter('month', '${m}', this)">${m}</div>`; });
      mContainer.innerHTML = mHtml;
    }
  },

  updateFilter(type, value, el) {
    const container = el.parentElement;
    container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');

    if(type === 'session') this.activeSession = value;
    if(type === 'month') this.activeMonth = value;

    this.applyCombinedFilters();
  },

  applyCombinedFilters() {
    let filtered = this.allResults;

    if(this.activeSession !== 'all') {
      filtered = filtered.filter(r => r.session === this.activeSession);
    }

    if(this.activeMonth !== 'all') {
      filtered = filtered.filter(r => {
        if(!r.createdAt) return false;
        const m = new Date(r.createdAt).toLocaleString('hi-IN', { month: 'long' });
        return m === this.activeMonth;
      });
    }

    this.renderResults(filtered);
  },

  renderResults(data) {
    const el = document.getElementById('resultContent');
    if(!el) return;

    if(data.length === 0) {
      el.innerHTML = '<div class="p-12 text-center opacity-40 italic">Chune hue filters ke liye koi result nahi mila</div>';
      return;
    }

    el.innerHTML = data.map(r => {
      let subjectsHtml = '';
      if(r.subjects && r.subjects.length > 0) {
        subjectsHtml = `
          <div class="mt-4 overflow-hidden rounded-lg border border-white/5 bg-black/20">
            <table class="w-full text-[10px] text-left">
              <thead class="bg-white/5 text-gray-500 uppercase">
                <tr><th class="p-2">Subject</th><th class="p-2 text-right">Marks</th></tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${r.subjects.map(s => `<tr><td class="p-2 text-gray-300">${s.name}</td><td class="p-2 text-right font-bold text-yellow-400">${s.obtainedMarks}/${s.maxMarks}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : '';

      return `
        <div class="result-card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-bold text-yellow-400 text-lg leading-tight">${this.escape(r.examName)}</h3>
              <p class="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-widest">${r.session || ''} • ${dateStr}</p>
            </div>
            <div class="bg-green-500/10 border border-green-500/20 px-2 py-1 rounded text-[10px] text-green-400 font-black">
              GRADE: ${r.grade || 'N/A'}
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex-1 bg-black/30 p-3 rounded-xl border border-white/5">
              <p class="text-[8px] text-gray-500 uppercase font-black mb-1">Total Score</p>
              <div class="flex items-end gap-1">
                <span class="text-2xl font-black text-white">${r.percentage || 0}%</span>
                <span class="text-[10px] text-gray-400 mb-1">Obtained</span>
              </div>
            </div>
          </div>
          ${subjectsHtml}
          ${r.remarks ? `<div class="mt-3 p-2 bg-blue-500/5 rounded border-l-2 border-blue-500 text-[10px] italic text-gray-400">"${this.escape(r.remarks)}"</div>` : ''}
        </div>
      `;
    }).join('');
  },

  escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); StudentPanel.login(); });
}
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', (e) => { e.preventDefault(); StudentPanel.register(); });
}

window.StudentPanel = StudentPanel;