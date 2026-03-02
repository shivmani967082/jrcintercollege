/**
 * Teacher Dashboard - student registration, class filter, results & fees
 */

const API_BASE = 'https://jrc-school-pro.onrender.com/api';
const TeacherPortal = {
  selectedStudent: null,

  init() {
    if (typeof TeacherAuth !== 'undefined' && !TeacherAuth.requireAuth()) return;
    this.bindEvents();
    this.loadStudents();
  },

  bindEvents() {
    document.getElementById('classFilter').addEventListener('change', () => this.loadStudents());
    document.getElementById('refreshBtn').addEventListener('click', () => this.loadStudents());
    document.getElementById('registerStudentForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.registerStudent();
    });
    document.getElementById('addResultForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addResult();
    });
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    if (addSubjectBtn) {
      addSubjectBtn.addEventListener('click', () => this.addSubjectRow());
    }
    document.getElementById('addFeeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addFee();
    });
  },

  updateAutoGrade() {
    const tbody = document.getElementById('subjectsTableBody');
    let total = 0;
    let obtained = 0;
    let hasAny = false;
    if (tbody) {
      tbody.querySelectorAll('tr').forEach((row) => {
        const maxInput = row.querySelector('.subMax');
        const obtInput = row.querySelector('.subObt');
        const max = maxInput ? parseFloat(maxInput.value) : NaN;
        const obt = obtInput ? parseFloat(obtInput.value) : NaN;
        if (!isNaN(max)) {
          total += max;
          hasAny = true;
        }
        if (!isNaN(obt)) {
          obtained += obt;
          hasAny = true;
        }
      });
    } else {
      // Fallback: use manual total/obtained if subjects table not present
      total = parseFloat(document.getElementById('resultTotalMarks').value) || 0;
      obtained = parseFloat(document.getElementById('resultObtainedMarks').value);
      hasAny = true;
    }

    if (!hasAny || total <= 0 || isNaN(obtained)) {
      document.getElementById('resultTotalMarks').value = '';
      document.getElementById('resultObtainedMarks').value = '';
      document.getElementById('autoPercentage').textContent = '--';
      document.getElementById('autoGrade').textContent = '--';
      document.getElementById('autoPassFail').textContent = '--';
      return;
    }
    document.getElementById('resultTotalMarks').value = String(total);
    document.getElementById('resultObtainedMarks').value = String(obtained);
    const pct = Math.round((obtained / total) * 10000) / 100;
    let grade = 'F';
    if (pct >= 90) grade = 'A+';
    else if (pct >= 80) grade = 'A';
    else if (pct >= 70) grade = 'B';
    else if (pct >= 50) grade = 'C';
    else if (pct >= 30) grade = 'D';
    const pf = pct >= 30 ? 'Pass' : 'Fail';
    document.getElementById('autoPercentage').textContent = pct + '%';
    document.getElementById('autoGrade').textContent = grade;
    document.getElementById('autoPassFail').textContent = pf;
  },

  addSubjectRow() {
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'subject-row';
    tr.innerHTML = `
      <td class="px-2 py-1">
        <input type="text" class="subName w-full border rounded px-2 py-1 text-sm" placeholder="विषय का नाम">
      </td>
      <td class="px-2 py-1">
        <input type="number" class="subMax w-full border rounded px-2 py-1 text-sm" min="0" placeholder="100">
      </td>
      <td class="px-2 py-1">
        <input type="number" class="subObt w-full border rounded px-2 py-1 text-sm" min="0" placeholder="80">
      </td>
      <td class="px-2 py-1 text-center">
        <button type="button" class="removeSubjectBtn text-xs text-red-600 hover:text-red-800">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('.subMax, .subObt').forEach((input) => {
      input.addEventListener('input', () => this.updateAutoGrade());
    });
    const removeBtn = tr.querySelector('.removeSubjectBtn');
    removeBtn.addEventListener('click', () => {
      tr.remove();
      this.updateAutoGrade();
    });
    this.updateAutoGrade();
  },

  async loadStudents() {
    const classFilter = document.getElementById('classFilter').value;
    const url = classFilter ? `${API_BASE}/student/list?class=${encodeURIComponent(classFilter)}` : `${API_BASE}/student/list`;
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center">लोड हो रहा है...</td></tr>';
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'लोड नहीं हो पाया');
      const list = json.data || [];
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">कोई छात्र नहीं मिला। पहले रजिस्टर करें।</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(s => {
        const safeName = String(s.name || '').replace(/"/g, '&quot;');
        return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-2 text-gray-900">${this.escape(s.name)}</td>
          <td class="px-4 py-2 text-gray-600">${this.escape(s.class)}</td>
          <td class="px-4 py-2 text-gray-600">${this.escape(s.rollNo)}</td>
          <td class="px-4 py-2">${s.hasAccount ? '<span class="text-green-600 font-medium">हाँ</span>' : '<span class="text-orange-600">नहीं</span>'}</td>
          <td class="px-4 py-2">
            <div class="flex gap-2 flex-wrap">
              <button type="button" class="selectStudentBtn bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700" data-id="${s.id}" data-name="${safeName}">
                चुनें
              </button>
              ${s.hasAccount ? `<button type="button" class="resetPasswordBtn bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700" data-id="${s.id}" data-name="${safeName}">पासवर्ड रीसेट</button>` : ''}
              <button type="button" class="deleteStudentBtn bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700" data-id="${s.id}" data-name="${safeName}">
                हटाएं
              </button>
            </div>
          </td>
        </tr>
      `;
      }).join('');
      tbody.querySelectorAll('.selectStudentBtn').forEach(btn => {
        btn.addEventListener('click', () => this.selectStudent(btn.dataset.id, btn.dataset.name));
      });
      tbody.querySelectorAll('.deleteStudentBtn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteStudent(btn.dataset.id, btn.dataset.name));
      });
      tbody.querySelectorAll('.resetPasswordBtn').forEach(btn => {
        btn.addEventListener('click', () => this.resetPassword(btn.dataset.id, btn.dataset.name));
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-red-600">' + this.escape(err.message) + '</td></tr>';
    }
  },

  selectStudent(id, name) {
    this.selectedStudent = { id, name };
    document.getElementById('selectedStudentSection').classList.remove('hidden');
    document.getElementById('selectedStudentTitle').textContent = 'छात्र: ' + name;
    document.getElementById('resultStudentId').value = id;
    document.getElementById('feeStudentId').value = id;
    const subjectsBody = document.getElementById('subjectsTableBody');
    if (subjectsBody) {
      subjectsBody.innerHTML = '';
      this.addSubjectRow();
    }
    this.updateAutoGrade();
    this.loadStudentResults(id);
    this.loadStudentFees(id);
  },

  async loadStudentResults(studentId) {
    const el = document.getElementById('studentResultsList');
    el.innerHTML = 'लोड हो रहा है...';
    try {
      const res = await fetch(`${API_BASE}/student/${studentId}/results`);
      const json = await res.json();
      const list = (json.data || []);
      if (list.length === 0) {
        el.innerHTML = '<p class="text-gray-500">अभी कोई परिणाम नहीं।</p>';
        return;
      }
      el.innerHTML = list.map(r => `
        <div class="border rounded p-2 bg-gray-50 flex justify-between items-center flex-wrap gap-1">
          <span class="font-medium">${this.escape(r.examName)}</span>
          <span>${r.obtainedMarks != null && r.totalMarks != null ? r.obtainedMarks + '/' + r.totalMarks : '-'}</span>
          ${r.percentage != null ? '<span>' + r.percentage + '%</span>' : ''}
          ${r.grade ? '<span class="font-medium">' + this.escape(r.grade) + '</span>' : ''}
          ${r.passFail ? '<span class="' + (r.passFail === 'pass' ? 'text-green-600' : 'text-red-600') + '">' + (r.passFail === 'pass' ? 'Pass' : 'Fail') + '</span>' : ''}
          <button type="button" class="deleteResultBtn text-xs text-red-600 hover:text-red-800" data-id="${r._id}">हटाएं</button>
        </div>
      `).join('');
      el.querySelectorAll('.deleteResultBtn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteResult(btn.dataset.id));
      });
    } catch (e) {
      el.innerHTML = '<p class="text-red-600">लोड नहीं हो सका।</p>';
    }
  },

  async loadStudentFees(studentId) {
    const el = document.getElementById('studentFeesList');
    el.innerHTML = 'लोड हो रहा है...';
    try {
      const res = await fetch(`${API_BASE}/student/${studentId}/fees`);
      const json = await res.json();
      const list = (json.data || []);
      if (list.length === 0) {
        el.innerHTML = '<p class="text-gray-500">अभी कोई फीस रिकॉर्ड नहीं।</p>';
        return;
      }
      let totalAmount = 0;
      let totalPaid = 0;
      el.innerHTML = list.map(f => {
        const amt = f.amount || 0;
        const pd = f.paid || 0;
        totalAmount += amt;
        totalPaid += pd;
        const due = amt - pd;
        const desc = f.description || 'फीस';
        const parts = desc.split(' - ');
        const monthLabel = parts[0];
        const restDesc = parts.slice(1).join(' - ');
        return `
        <div class="border rounded p-2 bg-gray-50 flex flex-col gap-1">
          <div class="flex justify-between items-center flex-wrap gap-2">
            <div>
              <span class="font-medium">${this.escape(monthLabel)}</span>
              ${restDesc ? `<span class="text-xs text-gray-500 ml-1">${this.escape(restDesc)}</span>` : ''}
            </div>
            <span class="ml-2 px-2 py-0.5 rounded text-xs ${f.status === 'paid' ? 'bg-green-100 text-green-800' : f.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">${f.status}</span>
          </div>
          <div class="text-xs text-gray-600">कुल: ₹${amt} | दिया: ₹${pd} | बाकी: ₹${due}</div>
          <div class="mt-1 flex gap-3 text-xs">
            <button type="button" class="editFeeBtn text-blue-600 hover:text-blue-800" data-id="${f._id}">संपादित करें</button>
            <button type="button" class="deleteFeeBtn text-red-600 hover:text-red-800" data-id="${f._id}">हटाएं</button>
          </div>
        </div>
      `;
      }).join('');
      const totalDue = totalAmount - totalPaid;
      el.innerHTML =
        `<div class="mb-2 text-xs font-medium text-gray-700">कुल (सभी महीनों का): ₹${totalAmount} | दिया: ₹${totalPaid} | बाकी: ₹${totalDue}</div>` +
        el.innerHTML;
      el.querySelectorAll('.editFeeBtn').forEach(btn => {
        btn.addEventListener('click', () => this.editFee(btn.dataset.id));
      });
      el.querySelectorAll('.deleteFeeBtn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteFee(btn.dataset.id));
      });
    } catch (e) {
      el.innerHTML = '<p class="text-red-600">लोड नहीं हो सका।</p>';
    }
  },

  async registerStudent() {
    const name = document.getElementById('regName').value;
    const cls = document.getElementById('regClass').value;
    const rollNo = document.getElementById('regRollNo').value.trim();
    const msgEl = document.getElementById('regMessage');
    msgEl.classList.add('hidden');
    if (!name || !cls || !rollNo) {
      msgEl.textContent = 'नाम, कक्षा और रोल नंबर भरें।';
      msgEl.classList.remove('hidden');
      msgEl.classList.add('text-red-600');
      return;
    }
    try {
      const res = await fetch(API_BASE + '/teacher/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, class: cls, rollNo })
      });
      const data = await res.json();
      if (data.success) {
        msgEl.textContent = data.message || 'रजिस्टर हो गया।';
        msgEl.classList.remove('hidden', 'text-red-600');
        msgEl.classList.add('text-green-600');
        document.getElementById('registerStudentForm').reset();
        this.loadStudents();
      } else {
        msgEl.textContent = data.message || 'त्रुटि।';
        msgEl.classList.remove('hidden');
        msgEl.classList.add('text-red-600');
      }
    } catch (err) {
      msgEl.textContent = 'सर्वर से कनेक्ट नहीं हो पाया।';
      msgEl.classList.remove('hidden');
      msgEl.classList.add('text-red-600');
    }
  },

  async addResult() {
    const studentId = document.getElementById('resultStudentId').value;
    const examName = document.getElementById('resultExamName').value.trim();
    const session = document.getElementById('resultSession').value.trim();
    const totalMarks = document.getElementById('resultTotalMarks').value ? parseFloat(document.getElementById('resultTotalMarks').value) : null;
    const obtainedMarks = document.getElementById('resultObtainedMarks').value ? parseFloat(document.getElementById('resultObtainedMarks').value) : null;
    if (!studentId || !examName) {
      alert('परीक्षा का नाम भरें।');
      return;
    }
    // Build subject-wise marks array
    const subjects = [];
    const tbody = document.getElementById('subjectsTableBody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach((row) => {
        const nameEl = row.querySelector('.subName');
        const maxEl = row.querySelector('.subMax');
        const obtEl = row.querySelector('.subObt');
        const subName = nameEl ? nameEl.value.trim() : '';
        const max = maxEl ? parseFloat(maxEl.value) : NaN;
        const obt = obtEl ? parseFloat(obtEl.value) : NaN;
        if (subName && !isNaN(max) && !isNaN(obt)) {
          subjects.push({ name: subName, maxMarks: max, obtainedMarks: obt });
        }
      });
    }
    try {
      const res = await fetch(API_BASE + '/student/add-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, examName, session, totalMarks, obtainedMarks, subjects })
      });
      const data = await res.json();
      if (data.success) {
        alert('परिणाम जोड़ा गया। प्रतिशत व ग्रेड अपने आप लगे।');
        document.getElementById('addResultForm').reset();
        if (tbody) {
          tbody.innerHTML = '';
          this.addSubjectRow();
        }
        document.getElementById('autoPercentage').textContent = '--';
        document.getElementById('autoGrade').textContent = '--';
        document.getElementById('autoPassFail').textContent = '--';
        if (this.selectedStudent) this.loadStudentResults(this.selectedStudent.id);
      } else {
        alert(data.message || 'जोड़ नहीं सका।');
      }
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async addFee() {
    const studentId = document.getElementById('feeStudentId').value;
    const amount = parseFloat(document.getElementById('feeAmount').value) || 0;
    const paid = parseFloat(document.getElementById('feePaid').value) || 0;
    const session = document.getElementById('feeSession').value.trim();
    const month = document.getElementById('feeMonth').value;
    const descInput = document.getElementById('feeDescription').value.trim();
    let description = descInput;
    if (month) {
      description = description ? `${month} - ${description}` : month;
    }
    if (!description) {
      description = 'फीस';
    }
    if (!studentId || amount <= 0) {
      alert('छात्र चुनें और कुल राशि भरें।');
      return;
    }
    try {
      const res = await fetch(API_BASE + '/student/add-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, amount, paid, session, description })
      });
      const data = await res.json();
      if (data.success) {
        alert('फीस रिकॉर्ड जोड़ा गया।');
        document.getElementById('feePaid').value = '0';
        if (this.selectedStudent) this.loadStudentFees(this.selectedStudent.id);
      } else {
        alert(data.message || 'जोड़ नहीं सका।');
      }
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async deleteStudent(id, name) {
    if (!confirm(`क्या आप ${name} को हटाना चाहते हैं? यह छात्र के सभी रिकॉर्ड (परिणाम, फीस) भी हट जाएंगे। यह कार्रवाई पूर्ववत नहीं हो सकती।`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/teacher/delete-student/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('छात्र हटा दिया गया है।');
        this.loadStudents();
        if (this.selectedStudent && this.selectedStudent.id === id) {
          document.getElementById('selectedStudentSection').classList.add('hidden');
          this.selectedStudent = null;
        }
      } else {
        alert(data.message || 'हटाने में त्रुटि।');
      }
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async deleteResult(id) {
    if (!confirm('क्या आप इस परिणाम को हटाना चाहते हैं?')) return;
    try {
      const res = await fetch(`${API_BASE}/student/result/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('परिणाम हटा दिया गया।');
        if (this.selectedStudent) this.loadStudentResults(this.selectedStudent.id);
      } else {
        alert(data.message || 'हटाने में त्रुटि।');
      }
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async deleteFee(id) {
    if (!confirm('क्या आप इस फीस रिकॉर्ड को हटाना चाहते हैं?')) return;
    try {
      const res = await fetch(`${API_BASE}/student/fee/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('फीस रिकॉर्ड हटा दिया गया।');
        if (this.selectedStudent) this.loadStudentFees(this.selectedStudent.id);
      } else {
        alert(data.message || 'हटाने में त्रुटि।');
      }
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async editFee(id) {
    const newAmountStr = prompt('नया कुल amount (₹) डालें (खाली छोड़ें तो पुराना ही रहेगा):');
    const newPaidStr = prompt('नया दिया गया amount (₹) डालें (खाली छोड़ें तो पुराना ही रहेगा):');
    const body = {};
    if (newAmountStr && !isNaN(parseFloat(newAmountStr))) {
      body.amount = parseFloat(newAmountStr);
    }
    if (newPaidStr && !isNaN(parseFloat(newPaidStr))) {
      body.paid = parseFloat(newPaidStr);
    }
    if (!body.amount && !body.paid && body.amount !== 0 && body.paid !== 0) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/student/fee/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        alert('फीस रिकॉर्ड अपडेट हो गया।');
        if (this.selectedStudent) this.loadStudentFees(this.selectedStudent.id);
      } else {
        alert(data.message || 'अपडेट नहीं हो पाया।');
      }
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async resetPassword(id, name) {
    const newPassword = prompt(`${name} का नया पासवर्ड डालें (कम से कम 6 अक्षर):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('पासवर्ड कम से कम 6 अक्षर का होना चाहिए।');
      return;
    }
    const confirmPwd = prompt('पासवर्ड दोबारा डालें:');
    if (newPassword !== confirmPwd) {
      alert('पासवर्ड मेल नहीं खाते।');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/teacher/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('पासवर्ड बदल दिया गया है।');
      } else {
        alert(data.message || 'पासवर्ड बदलने में त्रुटि।');
      }
    } catch (err) {
      alert('त्रुटि: ' + err.message);
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
  document.addEventListener('DOMContentLoaded', () => TeacherPortal.init());
} else {
  TeacherPortal.init();
}