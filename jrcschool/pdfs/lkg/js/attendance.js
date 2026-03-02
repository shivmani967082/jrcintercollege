const resolveApiOrigin = () => {
  const { protocol, hostname, origin } = window.location;
  const isDirectLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  const isLanHost = hostname.endsWith('.local');
  const isPrivateIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
  if (protocol === 'file:' || isDirectLocalHost) return 'http://localhost:3000';
  if (isLanHost || isPrivateIp) return `${protocol}//${hostname}:3000`;
  return origin;
};

const ATTENDANCE_API_BASE = resolveApiOrigin() + '/api';

const AttendanceModule = {
  API_BASE: ATTENDANCE_API_BASE,
  studentsCache: [],

  init() {
    const dateInput = document.getElementById('attendanceDate');
    if (!dateInput) return;

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${y}-${m}-${d}`;

    const yearEl = document.getElementById('attendanceReportYear');
    const monthEl = document.getElementById('attendanceReportMonth');
    if (yearEl) yearEl.value = String(y);
    if (monthEl) monthEl.value = String(today.getMonth() + 1);

    const loadBtn = document.getElementById('loadAttendanceBtn');
    const saveBtn = document.getElementById('saveAttendanceBtn');
    const reportBtn = document.getElementById('loadAttendanceReportBtn');

    if (loadBtn) loadBtn.addEventListener('click', () => this.loadDailyAttendance());
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveDailyAttendance());
    if (reportBtn) reportBtn.addEventListener('click', () => this.loadMonthlyReport());
  },

  getTeacherContext() {
    if (typeof TeacherAuth === 'undefined') return null;
    const session = TeacherAuth.getSession();
    if (!session || !session.id || !session.assignedClass) return null;
    return {
      teacherId: session.id,
      class: session.assignedClass
    };
  },

  renderDailyRows(students, existing = {}) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;
    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-6 text-center text-gray-500">इस कक्षा में कोई admitted छात्र नहीं मिला।</td></tr>';
      return;
    }

    tbody.innerHTML = students.map((s) => {
      const row = existing[s.id] || { status: 'present', remark: '' };
      return `
        <tr>
          <td class="px-4 py-3 text-gray-900">${this.escape(s.name)}</td>
          <td class="px-4 py-3 text-gray-700">${this.escape(s.rollNo)}</td>
          <td class="px-4 py-3">
            <select class="attendance-status input-style px-2 py-1 text-sm" data-student-id="${s.id}">
              <option value="present" ${row.status === 'present' ? 'selected' : ''}>Present</option>
              <option value="absent" ${row.status === 'absent' ? 'selected' : ''}>Absent</option>
              <option value="leave" ${row.status === 'leave' ? 'selected' : ''}>Leave</option>
              <option value="late" ${row.status === 'late' ? 'selected' : ''}>Late</option>
            </select>
          </td>
          <td class="px-4 py-3">
            <input type="text" class="attendance-remark input-style px-2 py-1 text-sm w-full" data-student-id="${s.id}" value="${this.escape(row.remark || '')}" placeholder="optional">
          </td>
        </tr>
      `;
    }).join('');
  },

  async loadDailyAttendance() {
    const ctx = this.getTeacherContext();
    const dateEl = document.getElementById('attendanceDate');
    if (!ctx || !dateEl || !dateEl.value) {
      alert('सत्र या तारीख उपलब्ध नहीं है।');
      return;
    }

    try {
      const studentsRes = await fetch(
        `${this.API_BASE}/attendance/students?teacherId=${encodeURIComponent(ctx.teacherId)}&class=${encodeURIComponent(ctx.class)}`
      );
      const studentsjson = await studentsRes.json();
      if (!studentsRes.ok || !studentsjson.success) {
        alert((studentsjson && studentsjson.message) || 'छात्र सूची नहीं मिली।');
        return;
      }
      this.studentsCache = studentsjson.data || [];

      const sessionRes = await fetch(
        `${this.API_BASE}/attendance/session?teacherId=${encodeURIComponent(ctx.teacherId)}&class=${encodeURIComponent(ctx.class)}&date=${encodeURIComponent(dateEl.value)}`
      );
      const sessionjson = await sessionRes.json();
      if (!sessionRes.ok || !sessionjson.success) {
        alert((sessionjson && sessionjson.message) || 'Attendance session नहीं मिला।');
        return;
      }

      const existing = {};
      const payload = sessionjson.data;
      if (payload && payload.records) {
        payload.records.forEach((r) => {
          existing[r.studentId] = { status: r.status || 'present', remark: r.remark || '' };
        });
        const schoolRanEl = document.getElementById('attendanceSchoolRan');
        const noteEl = document.getElementById('attendanceNote');
        if (schoolRanEl && payload.session) schoolRanEl.checked = payload.session.schoolRan !== false;
        if (noteEl && payload.session) noteEl.value = payload.session.note || '';
      } else {
        const schoolRanEl = document.getElementById('attendanceSchoolRan');
        const noteEl = document.getElementById('attendanceNote');
        if (schoolRanEl) schoolRanEl.checked = true;
        if (noteEl) noteEl.value = '';
      }

      this.renderDailyRows(this.studentsCache, existing);
    } catch (err) {
      console.error('Attendance load error:', err);
      alert('Attendance लोड नहीं हो पाया।');
    }
  },

  collectDailyRows() {
    const statuses = Array.from(document.querySelectorAll('.attendance-status'));
    const remarks = Array.from(document.querySelectorAll('.attendance-remark'));
    const remarkMap = new Map();
    remarks.forEach((el) => {
      remarkMap.set(el.getAttribute('data-student-id'), el.value || '');
    });
    return statuses.map((el) => ({
      studentId: el.getAttribute('data-student-id'),
      status: el.value,
      remark: remarkMap.get(el.getAttribute('data-student-id')) || ''
    }));
  },

  async saveDailyAttendance() {
    const ctx = this.getTeacherContext();
    const dateEl = document.getElementById('attendanceDate');
    const schoolRanEl = document.getElementById('attendanceSchoolRan');
    const noteEl = document.getElementById('attendanceNote');
    if (!ctx || !dateEl || !dateEl.value) {
      alert('सत्र या तारीख उपलब्ध नहीं है।');
      return;
    }

    const attendance = this.collectDailyRows();
    if (!attendance || attendance.length === 0) {
      alert('पहले Attendance लोड करें।');
      return;
    }

    try {
      const res = await fetch(`${this.API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: ctx.teacherId,
          class: ctx.class,
          date: dateEl.value,
          schoolRan: schoolRanEl ? schoolRanEl.checked : true,
          note: noteEl ? noteEl.value : '',
          attendance
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert((json && json.message) || 'Attendance सेव नहीं हुआ।');
        return;
      }
      alert('Attendance सेव हो गया।');
    } catch (err) {
      console.error('Attendance save error:', err);
      alert('Attendance सेव नहीं हो पाया।');
    }
  },

  async loadMonthlyReport() {
    const ctx = this.getTeacherContext();
    const yearEl = document.getElementById('attendanceReportYear');
    const monthEl = document.getElementById('attendanceReportMonth');
    const metaEl = document.getElementById('attendanceReportMeta');
    const bodyEl = document.getElementById('attendanceReportBody');
    const tableWrap = document.getElementById('attendanceReportTableWrap');
    if (!ctx || !yearEl || !monthEl || !metaEl || !bodyEl || !tableWrap) {
      return;
    }
    const year = yearEl.value;
    const month = monthEl.value;
    if (!year || !month) {
      alert('वर्ष और महीना भरें।');
      return;
    }

    try {
      const res = await fetch(
        `${this.API_BASE}/attendance/report/month?teacherId=${encodeURIComponent(ctx.teacherId)}&class=${encodeURIComponent(ctx.class)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert((json && json.message) || 'रिपोर्ट लोड नहीं हुई।');
        return;
      }
      const data = json.data || {};
      const students = data.students || [];
      metaEl.textContent = `Class ${ctx.class} | ${data.month}/${data.year} | School Run Days: ${data.schoolRunDays || 0}`;

      if (students.length === 0) {
        tableWrap.classList.add('hidden');
        metaEl.textContent += ' | कोई डेटा नहीं';
        bodyEl.innerHTML = '';
        return;
      }

      bodyEl.innerHTML = students.map((s) => `
        <tr>
          <td class="px-4 py-3 text-gray-900">${this.escape(s.name)}</td>
          <td class="px-4 py-3 text-gray-700">${this.escape(s.rollNo)}</td>
          <td class="px-4 py-3 text-emerald-700 font-bold">${s.presentDays}</td>
          <td class="px-4 py-3 text-red-700 font-bold">${s.absentDays}</td>
          <td class="px-4 py-3 text-amber-700 font-bold">${s.leaveDays}</td>
          <td class="px-4 py-3 text-indigo-700 font-bold">${s.lateDays}</td>
          <td class="px-4 py-3 font-black">${s.attendancePercent}%</td>
        </tr>
      `).join('');
      tableWrap.classList.remove('hidden');
    } catch (err) {
      console.error('Attendance report error:', err);
      alert('रिपोर्ट लोड नहीं हो पाई।');
    }
  },

  escape(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AttendanceModule.init());
} else {
  AttendanceModule.init();
}

window.AttendanceModule = AttendanceModule;
