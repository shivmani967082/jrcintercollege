/**
 * Admin Portal JavaScript
 * Manages admission enquiries viewing and status updates
 */
const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') 
  ? 'http://localhost:3000' 
  : "https://jrcintercollege.onrender.com";
const AdminPortal = {
  
  API_URL: `${API_BASE}/api/admissions`,
  NEWS_API_URL: `${API_BASE}/api/news`,
  STUDENT_API_URL: `${API_BASE}/api/student`,
  TEACHERS_API_URL: `${API_BASE}/api/class-teachers`,
  CLASS_TEACHERS_API_URL: `${API_BASE}/api/class-teachers`,
  currentPage: 1,
  currentLimit: 20,
  currentStatus: '',
  currentSearch: '',
  allClasses: [], // Cached classes for multi-select
  selectedAdditionalClasses: [], // Currently selected classes for the teacher form


  init() {
    // Check authentication first
    if (typeof AdminAuth !== 'undefined' && !AdminAuth.requireAuth()) {
      return; // Will redirect to login
    }
    
    this.bindEvents();
    this.loadAdmissions();
    this.loadNews();
    this.loadStudentList();
    this.loadTeachers();
  },

  bindEvents() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadAdmissions();
    });

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', (e) => {
      this.currentStatus = e.target.value;
      this.currentPage = 1;
      this.loadAdmissions();
    });

    // Search input
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.currentSearch = e.target.value;
        this.currentPage = 1;
        this.loadAdmissions();
      }, 500);
    });

    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
      document.getElementById('statusFilter').value = '';
      document.getElementById('searchInput').value = '';
      this.currentStatus = '';
      this.currentSearch = '';
      this.currentPage = 1;
      this.loadAdmissions();
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadAdmissions();
      }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      this.currentPage++;
      this.loadAdmissions();
    });

    // Status modal
    document.getElementById('cancelStatus').addEventListener('click', () => {
      document.getElementById('statusModal').classList.add('hidden');
    });

    document.getElementById('statusForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateStatus();
    });

    const addTeacherBtn = document.getElementById('addTeacherBtn');
    if (addTeacherBtn) {
      addTeacherBtn.addEventListener('click', () => this.openTeacherModal());
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('teacherClassDropdown');
      const button = e.target.closest('button');
      if (dropdown && !dropdown.contains(e.target) && (!button || !button.onclick || !button.onclick.toString().includes('toggleTeacherClassDropdown'))) {
        dropdown.classList.add('hidden');
      }
    });

    const cancelTeacher = document.getElementById('cancelTeacher');
    if (cancelTeacher) {
      cancelTeacher.addEventListener('click', () => this.closeTeacherModal());
    }
    const teacherForm = document.getElementById('teacherForm');
    if (teacherForm) {
      teacherForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTeacher();
      });
    }
    
    // Image preview for teacher form
    const teacherImageInput = document.getElementById('teacherImage');
    if (teacherImageInput) {
      teacherImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('teacherImagePreview');
        const previewImg = document.getElementById('teacherImagePreviewImg');
        const previewText = preview ? preview.querySelector('p') : null;
        
        if (file) {
          // Validate file size (20MB)
          if (file.size > 20 * 1024 * 1024) {
            alert('फाइल का आकार 20MB से अधिक नहीं होना चाहिए।');
            e.target.value = ''; // Clear the input
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (event) => {
            if (preview && previewImg) {
              previewImg.src = event.target.result;
              preview.classList.remove('hidden');
              // Update text to show it's a new file
              if (previewText) previewText.textContent = 'New Image Preview';
            }
          };
          reader.onerror = () => {
            alert('फाइल पढ़ने में त्रुटि।');
            e.target.value = '';
          };
          reader.readAsDataURL(file);
        } else {
          // No file selected - show original image if editing
          const teacherId = document.getElementById('teacherId').value;
          if (teacherId && preview) {
            const originalImage = preview.getAttribute('data-original-image') || '';
            if (originalImage) {
              // Restore original image preview
              let imgUrl = '';
              if (originalImage.startsWith('http')) {
                imgUrl = originalImage;
              } else {
                const cleanPath = originalImage.startsWith('/') ? originalImage.substring(1) : originalImage;
                imgUrl = `https://jrcintercollege.onrender.com/${cleanPath}`;
              }
              if (previewImg) {
                previewImg.src = imgUrl;
                preview.classList.remove('hidden');
                if (previewText) previewText.textContent = 'Current Image (select new file to replace)';
              }
            } else {
              preview.classList.add('hidden');
            }
          } else {
            if (preview) preview.classList.add('hidden');
          }
        }
      });
    }
    
    // Close teacher modal when clicking outside
    const teacherModal = document.getElementById('teacherModal');
    if (teacherModal) {
      teacherModal.addEventListener('click', (e) => {
        if (e.target === teacherModal) {
          this.closeTeacherModal();
        }
      });
    }

    // News
    document.getElementById('addNewsBtn').addEventListener('click', () => this.openNewsModal());
    document.getElementById('cancelNews').addEventListener('click', () => this.closeNewsModal());
    document.getElementById('newsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNews();
    });
    document.getElementById('addResultForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addResult();
    });
    document.getElementById('addFeeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addFee();
    });
  },

  async loadAdmissions() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const tableBody = document.getElementById('admissionsTableBody');
    const noData = document.getElementById('noData');

    loadingIndicator.classList.remove('hidden');
    tableBody.innerHTML = '';
    noData.classList.add('hidden');

    try {
      let url = `${this.API_URL}?page=${this.currentPage}&limit=${this.currentLimit}`;
      if (this.currentStatus) {
        url += `&status=${this.currentStatus}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load admissions');
      }

      loadingIndicator.classList.add('hidden');

      if (result.data && result.data.length > 0) {
        this.renderAdmissions(result.data);
        this.updateStats(result.data);
        this.renderPagination(result.pagination);
      } else {
        noData.classList.remove('hidden');
        noData.textContent = result.message || 'कोई डेटा नहीं मिला';
        this.updateStats([]);
      }
    } catch (error) {
      console.error('Error loading admissions:', error);
      loadingIndicator.classList.add('hidden');
      const isNetworkError = !error.message || error.message === 'Failed to fetch' || error.message.includes('NetworkError');
      const msg = isNetworkError
        ? 'Backend server चल नहीं रहा है। नीचे दिए गए निर्देश देखें।'
        : error.message;
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-4 text-center text-red-600">
            Error: ${this.escapeHtml(msg)}<br>
            <small class="text-gray-600">Backend चलाने के लिए: <code>cd jrcschool/backend</code> फिर <code>npm start</code></small>
          </td>
        </tr>
      `;
    }
  },

  renderAdmissions(admissions) {
    const tableBody = document.getElementById('admissionsTableBody');
    
    // Filter by search if needed
    let filteredAdmissions = admissions;
    if (this.currentSearch) {
      const searchLower = this.currentSearch.toLowerCase();
      filteredAdmissions = admissions.filter(admission => 
        admission.studentName.toLowerCase().includes(searchLower) ||
        admission.parentMobile.includes(searchLower)
      );
    }

    if (filteredAdmissions.length === 0) {
      document.getElementById('noData').classList.remove('hidden');
      return;
    }

    tableBody.innerHTML = filteredAdmissions.map(admission => {
      const date = new Date(admission.submittedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${this.escapeHtml(admission.studentName)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${admission.classApplying}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <a href="tel:${admission.parentMobile}" class="text-blue-600 hover:underline">${admission.parentMobile}</a>
          </td>
          <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${this.escapeHtml(admission.message || '-')}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="status-badge status-${admission.status}">${this.getStatusLabel(admission.status)}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button onclick="AdminPortal.openStatusModal('${admission._id}', '${admission.status}', '${this.escapeHtml(admission.notes || '')}')" 
                    class="text-blue-600 hover:text-blue-900 mr-2">
              Update
            </button>
            <button onclick="AdminPortal.viewDetails('${admission._id}')" 
                    class="text-green-600 hover:text-green-900 mr-2">
              View
            </button>
            <button onclick="AdminPortal.deleteAdmission('${admission._id}')" 
                    class="text-red-600 hover:text-red-900"
                    title="Delete this record">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  updateStats(admissions) {
    const total = admissions.length;
    const pending = admissions.filter(a => a.status === 'pending').length;
    const contacted = admissions.filter(a => a.status === 'contacted').length;
    const admitted = admissions.filter(a => a.status === 'admitted').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('contactedCount').textContent = contacted;
    document.getElementById('admittedCount').textContent = admitted;
  },

  renderPagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    if (pagination.pages <= 1) {
      paginationEl.classList.add('hidden');
      return;
    }

    paginationEl.classList.remove('hidden');
    document.getElementById('pageInfo').textContent = `Page ${pagination.page} of ${pagination.pages}`;
    document.getElementById('prevPage').disabled = pagination.page === 1;
    document.getElementById('nextPage').disabled = pagination.page === pagination.pages;
  },

  openStatusModal(id, currentStatus, currentNotes) {
    document.getElementById('admissionId').value = id;
    document.getElementById('statusSelect').value = currentStatus;
    document.getElementById('statusNotes').value = currentNotes.replace(/&#x27;/g, "'");
    document.getElementById('statusModal').classList.remove('hidden');
    document.getElementById('statusModal').classList.add('flex');
  },

  async updateStatus() {
    const id = document.getElementById('admissionId').value;
    const status = document.getElementById('statusSelect').value;
    const notes = document.getElementById('statusNotes').value;

    try {
      const response = await fetch(`${this.API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update status');
      }

      // Close modal and reload data
      document.getElementById('statusModal').classList.add('hidden');
      document.getElementById('statusModal').classList.remove('flex');
      this.loadAdmissions();

      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error: ' + error.message);
    }
  },

  async deleteAdmission(id) {
    if (!confirm('Are you sure you want to delete this admission record? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${this.API_URL}/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete record');
      }

      this.loadAdmissions();
      alert('Admission record deleted successfully.');
    } catch (error) {
      console.error('Error deleting admission:', error);
      alert('Error: ' + error.message);
    }
  },

  async viewDetails(id) {
    try {
      const response = await fetch(`${this.API_URL}/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load details');
      }

      const admission = result.data;
      const details = `
Admission Details:
==================
Student Name: ${admission.studentName}
Class: ${admission.classApplying}
Mobile: ${admission.parentMobile}
Message: ${admission.message || 'N/A'}
Status: ${this.getStatusLabel(admission.status)}
Submitted: ${new Date(admission.submittedAt).toLocaleString('en-IN')}
${admission.contactedAt ? `Contacted: ${new Date(admission.contactedAt).toLocaleString('en-IN')}` : ''}
${admission.notes ? `Notes: ${admission.notes}` : ''}
      `;

      alert(details);
    } catch (error) {
      console.error('Error loading details:', error);
      alert('Error: ' + error.message);
    }
  },

  getStatusLabel(status) {
    const labels = {
      'pending': 'Pending',
      'contacted': 'Contacted',
      'admitted': 'Admitted',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // ========== सूचनाएं (News) ==========
  async loadNews() {
    const container = document.getElementById('newsListContainer');
    if (!container) return;
    try {
      const res = await fetch(this.NEWS_API_URL + '/all');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'सूचनाएं लोड नहीं हुईं');
      const list = json.data || [];
      const typeLabels = { notice: 'सूचना', holiday: 'छुट्टी', exam: 'परीक्षा', event: 'कार्यक्रम', general: 'सामान्य' };
      if (list.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">अभी कोई सूचना नहीं है। नई सूचना जोड़ें।</p>';
        return;
      }
      container.innerHTML = list.map(n => {
        const d = n.date ? new Date(n.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const typeLabel = typeLabels[n.type] || n.type;
        const active = n.isActive !== false;
        return `<div class="bg-gray-50 rounded-lg p-4 flex flex-wrap items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <span class="text-xs font-medium text-blue-600">${typeLabel}</span>
            <h4 class="font-semibold text-gray-800">${this.escapeHtml(n.title)}</h4>
            <p class="text-sm text-gray-600 truncate">${this.escapeHtml(n.content)}</p>
            <p class="text-xs text-gray-500">${d} ${active ? '' : ' (निष्क्रिय)'}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="editNewsBtn px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700" data-id="${n._id}">संपादित</button>
            <button type="button" class="deleteNewsBtn px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700" data-id="${n._id}">हटाएं</button>
          </div>
        </div>`;
      }).join('');
      container.querySelectorAll('.editNewsBtn').forEach(btn => {
        btn.addEventListener('click', () => this.openNewsModal(btn.dataset.id));
      });
      container.querySelectorAll('.deleteNewsBtn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteNews(btn.dataset.id));
      });
    } catch (err) {
      console.error('News load error:', err);
      container.innerHTML = '<p class="text-red-600 text-center py-4">सूचनाएं लोड नहीं हो सकीं।</p>';
    }
  },

  openNewsModal(id) {
    document.getElementById('newsModalTitle').textContent = id ? 'सूचना संपादित करें' : 'नई सूचना जोड़ें';
    document.getElementById('newsId').value = id || '';
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    document.getElementById('newsType').value = 'notice';
    if (id) {
      fetch(this.NEWS_API_URL + '/all')
        .then(r => r.json())
        .then(json => {
          const n = (json.data || []).find(x => x._id === id);
          if (n) {
            document.getElementById('newsTitle').value = n.title;
            document.getElementById('newsContent').value = n.content;
            document.getElementById('newsType').value = n.type || 'notice';
          }
        })
        .catch(() => {});
    }
    document.getElementById('newsModal').classList.remove('hidden');
    document.getElementById('newsModal').classList.add('flex');
  },

  closeNewsModal() {
    document.getElementById('newsModal').classList.add('hidden');
    document.getElementById('newsModal').classList.remove('flex');
  },

  async saveNews() {
    const id = document.getElementById('newsId').value;
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const type = document.getElementById('newsType').value;
    if (!title || !content) {
      alert('शीर्षक और विषय भरें।');
      return;
    }
    try {
      const url = id ? `${this.NEWS_API_URL}/${id}` : this.NEWS_API_URL;
      const method = id ? 'PATCH' : 'POST';
      const body = id ? { title, content, type } : { title, content, type };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'सेव नहीं हो पाया');
      this.closeNewsModal();
      this.loadNews();
      alert(id ? 'सूचना अपडेट हो गई।' : 'सूचना जोड़ी गई।');
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async deleteNews(id) {
    if (!confirm('क्या आप इस सूचना को हटाना चाहते हैं?')) return;
    try {
      const res = await fetch(`${this.NEWS_API_URL}/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'हटाया नहीं जा सका');
      this.loadNews();
      alert('सूचना हटाई गई।');
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async loadStudentList() {
    const opts = [document.getElementById('resultStudentId'), document.getElementById('feeStudentId')];
    opts.forEach(el => { if (!el) return; while (el.options.length > 1) el.remove(1); });
    try {
      const res = await fetch(this.STUDENT_API_URL + '/list');
      const json = await res.json();
      if (!res.ok || !json.data) return;
      json.data.forEach(s => {
        const label = s.name + ' - कक्षा ' + s.class + ', रोल ' + s.rollNo;
        opts.forEach(sel => {
          if (!sel) return;
          const opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = label;
          sel.appendChild(opt);
        });
      });
    } catch (err) {
      console.warn('Student list load failed:', err);
    }
  },

  async addResult() {
    const studentId = document.getElementById('resultStudentId').value;
    const examName = document.getElementById('resultExamName').value.trim();
    const session = document.getElementById('resultSession').value.trim();
    const totalMarks = document.getElementById('resultTotalMarks').value ? parseInt(document.getElementById('resultTotalMarks').value, 10) : undefined;
    const obtainedMarks = document.getElementById('resultObtainedMarks').value ? parseInt(document.getElementById('resultObtainedMarks').value, 10) : undefined;
    const percentage = document.getElementById('resultPercentage').value ? parseFloat(document.getElementById('resultPercentage').value) : undefined;
    const grade = document.getElementById('resultGrade').value.trim();
    const remarks = document.getElementById('resultRemarks').value.trim();
    if (!studentId || !examName) {
      alert('छात्र और परीक्षा का नाम भरें।');
      return;
    }
    try {
      const res = await fetch(this.STUDENT_API_URL + '/add-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, examName, session, totalMarks, obtainedMarks, percentage, grade, remarks })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'जोड़ नहीं सके');
      alert('परिणाम जोड़ा गया।');
      document.getElementById('addResultForm').reset();
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async addFee() {
    const studentId = document.getElementById('feeStudentId').value;
    const amount = parseFloat(document.getElementById('feeAmount').value) || 0;
    const paid = parseFloat(document.getElementById('feePaid').value) || 0;
    const dueDate = document.getElementById('feeDueDate').value || undefined;
    const session = document.getElementById('feeSession').value.trim();
    const description = document.getElementById('feeDescription').value.trim() || 'फीस';
    if (!studentId || amount <= 0) {
      alert('छात्र चुनें और कुल राशि भरें।');
      return;
    }
    try {
      const res = await fetch(this.STUDENT_API_URL + '/add-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, amount, paid, dueDate, session, description })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'जोड़ नहीं सके');
      alert('फीस रिकॉर्ड जोड़ा गया।');
      document.getElementById('addFeeForm').reset();
      document.getElementById('feePaid').value = '0';
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  // ========== Class Teacher (टीचर पैनल लॉगिन) ==========
  async loadClassTeachers() {
    const container = document.getElementById('classTeachersListContainer');
    if (!container) return;
    try {
      const res = await fetch(this.CLASS_TEACHERS_API_URL);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'सूची लोड नहीं हुई');
      const list = json.data || [];
      if (list.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">अभी कोई Class Teacher नहीं है। ऊपर फॉर्म से रजिस्टर करें।</p>';
        return;
      }
      container.innerHTML = list.map(t => `
        <div class="bg-gray-50 rounded-lg p-4 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full border border-gray-300 overflow-hidden flex-shrink-0">
               ${t.profilePicture ? `<img src="${API_BASE}${t.profilePicture}" alt="avatar" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">?</div>'}
            </div>
            <div>
              <span class="font-semibold text-gray-800">${this.escapeHtml(t.name)}</span>
              <span class="text-sm text-gray-500">(कक्षा: ${this.escapeHtml(t.assignedClass)})</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="resetCtPasswordBtn px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700" data-id="${t._id}" data-name="${this.escapeHtml(t.name)}">पासवर्ड रीसेट</button>
            <button type="button" class="deleteCtBtn px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700" data-id="${t._id}">हटाएं</button>
          </div>
        </div>
      `).join('');
      container.querySelectorAll('.resetCtPasswordBtn').forEach(btn => {
        btn.addEventListener('click', () => this.resetClassTeacherPassword(btn.dataset.id, btn.dataset.name));
      });
      container.querySelectorAll('.deleteCtBtn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteClassTeacher(btn.dataset.id));
      });
    } catch (err) {
      console.error('Class teachers load error:', err);
      container.innerHTML = '<p class="text-red-600 text-center py-4">सूची लोड नहीं हो सकी।</p>';
    }
  },

  async registerClassTeacher() {
    const name = document.getElementById('ctName').value.trim();
    const cls = document.getElementById('ctClass').value;
    const password = document.getElementById('ctPassword').value;
    const subject = document.getElementById('ctSubject').value.trim();
    const qualification = document.getElementById('ctQualification').value.trim();
    const experience = document.getElementById('ctExperience').value.trim();
    const picture = document.getElementById('ctPicture').files[0];

    const msgEl = document.getElementById('ctMessage');
    if (!name || !cls || !password || password.length < 6) {
      if (msgEl) { msgEl.textContent = 'नाम, कक्षा और पासवर्ड (कम से कम 6) भरें।'; msgEl.classList.remove('hidden'); msgEl.classList.add('text-red-600'); }
      return;
    }
    
    // Create FormData for multipart submission
    const formData = new FormData();
    formData.append('name', name);
    formData.append('assignedClass', cls);
    formData.append('password', password);
    formData.append('subject', subject);
    formData.append('qualification', qualification);
    formData.append('experience', experience);
    if(picture) {
      formData.append('profilePicture', picture);
    }

    try {
      // NOTE: Using a relative fetch path if API_URL defaults to production in source
      // If we are testing locally we should ensure base URL works. The file sets `CLASS_TEACHERS_API_URL` directly.
      const res = await fetch(this.CLASS_TEACHERS_API_URL, {
        method: 'POST',
        body: formData // Note: no headers so browser sets multipart boundary
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'रजिस्टर नहीं हो पाया');
      document.getElementById('classTeacherForm').reset();
      if (msgEl) {
        msgEl.textContent = 'रजिस्टर हो गया। शिक्षक इसी नाम + कक्षा + पासवर्ड से लॉगिन कर सकता है।';
        msgEl.classList.remove('text-red-600');
        msgEl.classList.add('text-green-600');
        msgEl.classList.remove('hidden');
      }
      this.loadClassTeachers();
    } catch (err) {
      if (msgEl) { msgEl.textContent = err.message; msgEl.classList.remove('text-green-600'); msgEl.classList.add('text-red-600'); msgEl.classList.remove('hidden'); }
    }
  },

  async deleteClassTeacher(id) {
    if (!confirm('क्या आप इस शिक्षक को हटाना चाहते हैं?')) return;
    try {
      const res = await fetch(`${this.CLASS_TEACHERS_API_URL}/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'हटाया नहीं जा सका');
      this.loadClassTeachers();
      alert('शिक्षक हटा दिया गया।');
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  async resetClassTeacherPassword(id, name) {
    const newPassword = prompt('नया पासवर्ड (कम से कम 6 अक्षर) दर्ज करें:\nशिक्षक: ' + name);
    if (newPassword === null) return;
    if (newPassword.length < 6) {
      alert('पासवर्ड कम से कम 6 अक्षर होना चाहिए।');
      return;
    }
    try {
      const res = await fetch(`${this.CLASS_TEACHERS_API_URL}/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'रीसेट नहीं हो पाया');
      alert('पासवर्ड बदल दिया गया।');
      this.loadClassTeachers();
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  },

  // ========== शिक्षक प्रबंधन (Teacher Management - About Page) ==========
  async loadTeachers() {
    const container = document.getElementById('teachersListContainer');
    if (!container) return;
    try {
      const res = await fetch(this.TEACHERS_API_URL);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'शिक्षक सूची लोड नहीं हुई');
      const list = json.data || [];
      if (list.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">अभी कोई शिक्षक नहीं है। नया शिक्षक जोड़ें।</p>';
        return;
      }
      container.innerHTML = list.map(t => `
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl border-2 border-blue-50 overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner">
               ${t.profilePicture ? `<img src="${API_BASE}${t.profilePicture}" alt="avatar" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">?</div>'}
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-gray-900 truncate">${this.escapeHtml(t.name)}</h4>
              <p class="text-xs font-bold text-blue-600 uppercase tracking-wider">${this.escapeHtml(t.designation || 'Teacher')}</p>
              <p class="text-[11px] text-gray-500 mt-0.5"><span class="font-bold">Class:</span> ${this.escapeHtml(t.assignedClass)}</p>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
            ${t.subject ? `<p class="flex justify-between"><span class="text-gray-500">विषय:</span> <span class="font-bold text-gray-700">${this.escapeHtml(t.subject)}</span></p>` : ''}
            ${t.qualification ? `<p class="flex justify-between"><span class="text-gray-500">योग्यता:</span> <span class="font-bold text-gray-700">${this.escapeHtml(t.qualification)}</span></p>` : ''}
            ${t.experience ? `<p class="flex justify-between"><span class="text-gray-500">अनुभव:</span> <span class="font-bold text-gray-700">${this.escapeHtml(t.experience)}</span></p>` : ''}
            ${t.thought ? `<p class="mt-2 pt-2 border-t border-gray-200 italic text-gray-400 leading-relaxed line-clamp-2">"${this.escapeHtml(t.thought)}"</p>` : ''}
          </div>

          <div class="flex gap-2 mt-auto">
            <button type="button" class="editTeacherBtn flex-1 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-100 transition" data-id="${t._id}">संपादित</button>
            <button type="button" class="deleteTeacherBtn flex-1 py-2 bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-100 transition" data-id="${t._id}">हटाएं</button>
          </div>
        </div>
      `).join('');
      container.querySelectorAll('.editTeacherBtn').forEach(btn => {
        btn.addEventListener('click', () => this.openTeacherModal(btn.dataset.id));
      });
      container.querySelectorAll('.deleteTeacherBtn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteTeacher(btn.dataset.id));
      });
    } catch (err) {
      console.error('Teachers load error:', err);
      container.innerHTML = '<p class="text-red-600 text-center py-4">शिक्षक सूची लोड नहीं हो सकी।</p>';
    }
  },

  async openTeacherModal(id) {
    document.getElementById('teacherModalTitle').textContent = id ? 'शिक्षक संपादित करें (Edit Teacher)' : 'नया शिक्षक जोड़ें (Add New Teacher)';
    document.getElementById('teacherId').value = id || '';
    document.getElementById('teacherForm').reset();
    this.selectedAdditionalClasses = [];
    this.renderTeacherClassTags();
    document.getElementById('teacherImagePreview').classList.add('hidden');
    // Password required only for new teachers
    document.getElementById('teacherPassword').required = !id;

    if (id) {
       try {
         const res = await fetch(`${this.TEACHERS_API_URL}/${id}`);
         const result = await res.json();
         if (res.ok && result.success) {
           const t = result.data;
           document.getElementById('teacherName').value = t.name || '';
           document.getElementById('teacherDesignation').value = t.designation || '';
           document.getElementById('teacherQualification').value = t.qualification || '';
           document.getElementById('teacherExperience').value = t.experience || '';
           document.getElementById('teacherSubject').value = t.subject || '';
           document.getElementById('teacherThought').value = t.thought || '';
           document.getElementById('teacherOrder').value = t.order || 0;
           document.getElementById('teacherAssignedClass').value = t.assignedClass || '';
           
           // Set additional classes for multi-select
           this.selectedAdditionalClasses = t.additionalAccess || [];
           await this.fetchTeacherClasses(); // Ensure classes are loaded
           this.renderTeacherClassCheckboxes();
           this.renderTeacherClassTags();
           
           if (t.profilePicture) {
             const preview = document.getElementById('teacherImagePreview');
             const previewImg = document.getElementById('teacherImagePreviewImg');
             previewImg.src = `${API_BASE}${t.profilePicture}`;
             previewImg.style.display = 'block';
             preview.classList.remove('hidden');
           }
         }
       } catch (err) {
         console.error('Fetch teacher details error:', err);
       }
    }
    document.getElementById('teacherModal').classList.remove('hidden');
    document.getElementById('teacherModal').classList.add('flex');
    // Prevent body scroll when modal is open
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  },

  closeTeacherModal() {
    document.getElementById('teacherModal').classList.add('hidden');
    document.getElementById('teacherModal').classList.remove('flex');
    // Restore body scroll when modal is closed
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  },

  async fetchTeacherClasses() {
    if (this.allClasses.length > 0) return;
    try {
      const res = await fetch(`${this.TEACHERS_API_URL}/classes`);
      const result = await res.json();
      if (res.ok && result.success) {
        this.allClasses = result.data;
      }
    } catch (err) {
      console.error('Fetch classes error:', err);
      // Fallback if API fails
      this.allClasses = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '9-Arts', '9-Home Science', '9-Science', '10', '11-Arts', '11-Commerce', '11-Science', '12-Arts', '12-Commerce', '12-Science'];
    }
  },

  toggleTeacherClassDropdown() {
    const dropdown = document.getElementById('teacherClassDropdown');
    const isHidden = dropdown.classList.contains('hidden');
    
    if (isHidden) {
      this.fetchTeacherClasses().then(() => {
        this.renderTeacherClassCheckboxes();
        dropdown.classList.remove('hidden');
      });
    } else {
      dropdown.classList.add('hidden');
    }
  },

  renderTeacherClassCheckboxes() {
    const container = document.getElementById('teacherClassCheckboxes');
    if (!container) return;
    
    container.innerHTML = this.allClasses.map(cls => `
      <label class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
        <input type="checkbox" value="${cls}" 
          ${this.selectedAdditionalClasses.includes(cls) ? 'checked' : ''}
          onchange="AdminPortal.handleTeacherClassChange(this)"
          class="rounded text-blue-600 focus:ring-blue-500">
        <span class="text-sm">${cls}</span>
      </label>
    `).join('');
  },

  handleTeacherClassChange(checkbox) {
    const cls = checkbox.value;
    if (checkbox.checked) {
      if (!this.selectedAdditionalClasses.includes(cls)) {
        this.selectedAdditionalClasses.push(cls);
      }
    } else {
      this.selectedAdditionalClasses = this.selectedAdditionalClasses.filter(c => c !== cls);
    }
    this.renderTeacherClassTags();
  },

  renderTeacherClassTags() {
    const container = document.getElementById('teacherClassTags');
    const placeholder = document.getElementById('teacherAdditionalAccessPlaceholder');
    if (!container) return;
    
    if (this.selectedAdditionalClasses.length === 0) {
      container.innerHTML = '';
      if (placeholder) placeholder.classList.remove('hidden');
      return;
    }
    
    if (placeholder) placeholder.classList.add('hidden');
    
    container.innerHTML = this.selectedAdditionalClasses.map(cls => `
      <div class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
        <span>${cls}</span>
        <button type="button" onclick="AdminPortal.removeTeacherClassTag('${cls}')" class="hover:text-blue-900 focus:outline-none">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    `).join('');
  },

  removeTeacherClassTag(cls) {
    this.selectedAdditionalClasses = this.selectedAdditionalClasses.filter(c => c !== cls);
    this.renderTeacherClassCheckboxes(); // Update visible checkboxes if dropdown is open
    this.renderTeacherClassTags();
  },

  async saveTeacher() {
    const id = document.getElementById('teacherId').value;
    const name = document.getElementById('teacherName').value.trim();
    const designation = document.getElementById('teacherDesignation').value.trim();
    const qualification = document.getElementById('teacherQualification').value.trim();
    const experience = document.getElementById('teacherExperience').value.trim();
    const subject = document.getElementById('teacherSubject').value.trim();
    const thought = document.getElementById('teacherThought').value.trim();
    const order = parseInt(document.getElementById('teacherOrder').value) || 0;
    const assignedClass = document.getElementById('teacherAssignedClass').value;
    const password = document.getElementById('teacherPassword').value;
    const imageFile = document.getElementById('teacherImage').files[0];
    const additionalAccess = this.selectedAdditionalClasses || [];
    
    if (!name || !assignedClass) {
      alert('नाम और कक्षा भरना अनिवार्य है।');
      return;
    }

    // Duplicate class teacher check
    const warningEl = document.getElementById('duplicateClassWarning');
    if (warningEl) warningEl.classList.add('hidden');
    try {
      const checkUrl = `${this.TEACHERS_API_URL}/check-class?class=${encodeURIComponent(assignedClass)}${id ? '&excludeId=' + id : ''}`;
      const checkRes = await fetch(checkUrl);
      const checkData = await checkRes.json();
      if (checkData.taken) {
        const msg = `कक्षा "${assignedClass}" पहले से "${checkData.teacherName}" को class teacher के रूप में assign है। कृपया कोई अन्य कक्षा चुनें, या इस कक्षा को Additional Access में डालें।`;
        if (warningEl) { warningEl.textContent = msg; warningEl.classList.remove('hidden'); }
        alert(msg);
        return;
      }
    } catch (e) {
      console.error('Duplicate check failed:', e);
    }
    
    try {
      const url = id ? `${this.TEACHERS_API_URL}/${id}` : this.TEACHERS_API_URL;
      const method = id ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('designation', designation);
      formData.append('qualification', qualification);
      formData.append('experience', experience);
      formData.append('subject', subject);
      formData.append('thought', thought);
      formData.append('order', order);
      formData.append('assignedClass', assignedClass);
      formData.append('additionalAccess', JSON.stringify(additionalAccess));
      if (password) formData.append('password', password);
      if (imageFile) formData.append('profilePicture', imageFile);

      console.log('🚀 Sending teacher data to:', url, 'Method:', method);
      const res = await fetch(url, {
        method,
        body: formData
        // Content-Type is set automatically for FormData
      });
      
      const result = await res.json();
      console.log('📥 Response result:', result);
      
      if (!res.ok) {
        throw new Error(result.message || 'त्रुटि: सर्वर से संपर्क नहीं हो सका');
      }

      alert(id ? 'शिक्षक जानकारी अपडेट हो गई!' : 'नया शिक्षक सफलतापूर्वक जुड़ गया!');
      document.getElementById('teacherModal').classList.add('hidden');
      this.loadTeachers();
    } catch (err) {
      console.error('Save teacher error:', err);
      alert('त्रुटि: ' + err.message);
    }
  },

  async deleteTeacher(id) {
    if (!confirm('क्या आप इस शिक्षक को हटाना चाहते हैं? यह about.html से भी हट जाएगा।')) return;
    try {
      const res = await fetch(`${this.TEACHERS_API_URL}/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'हटाया नहीं जा सका');
      this.loadTeachers();
      alert('शिक्षक हटाई गई।');
    } catch (err) {
      alert('त्रुटि: ' + err.message);
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AdminPortal.init());
} else {
  AdminPortal.init();
}

// Export
window.AdminPortal = AdminPortal;