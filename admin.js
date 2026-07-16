/* ==========================================================================
   SNM 2026 – SELEKSI NASIONAL MINECRAFTER – ADMIN PANEL LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. STATE & UTILITY CONFIGURATIONS
  // ==========================================
  
  const API_BASE = (window.location.port === '3000' || (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') && window.location.hostname !== '')) ? '' : 'http://localhost:3000';
  const STORAGE_KEY = 'PPDB_APPLICANTS';
  
  const getApplicants = () => {
    const list = localStorage.getItem(STORAGE_KEY);
    return list ? JSON.parse(list) : [];
  };

  const saveApplicants = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Fetch all applicants from the Prisma backend API
  const fetchApplicantsFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/applicants`);
      if (response.ok) {
        // Hide warning if successful
        const warningEl = document.getElementById('db-connection-warning');
        if (warningEl) warningEl.style.display = 'none';

        const data = await response.json();
        saveApplicants(data);
        
        // Update UIs dynamically
        loadAdminDashboardData();
      } else {
        throw new Error('Server returned non-ok status');
      }
    } catch (error) {
      console.error("Gagal mengambil data dari server Prisma:", error);
      // Show warning banner if connection failed
      const warningEl = document.getElementById('db-connection-warning');
      if (warningEl) {
        const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') || window.location.hostname === '';
        if (!isLocal) {
          const span = warningEl.querySelector('span');
          if (span) {
            span.innerHTML = 'Gagal terhubung ke database server. Harap muat ulang halaman atau coba beberapa saat lagi.';
          }
        }
        warningEl.style.display = 'flex';
      }
    }
  };

  // Perform initial fetch and poll every 30 seconds
  fetchApplicantsFromServer();
  setInterval(fetchApplicantsFromServer, 30000);

  function formatDateIndo(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // ==========================================
  // 2. GOOGLE AUTH & USER STATUS
  // ==========================================
  
  const getGoogleUser = () => {
    const user = localStorage.getItem('PPDB_GOOGLE_USER');
    return user ? JSON.parse(user) : null;
  };

  const saveGoogleUser = (user) => {
    localStorage.setItem('PPDB_GOOGLE_USER', JSON.stringify(user));
  };

  const clearGoogleUser = () => {
    localStorage.removeItem('PPDB_GOOGLE_USER');
  };

  function updateGoogleAuthUI() {
    const user = getGoogleUser();
    const widget = document.getElementById('google-profile-widget');
    const initialsSpan = document.getElementById('google-profile-initials');
    const dropName = document.getElementById('dropdown-user-name');
    const dropEmail = document.getElementById('dropdown-user-email');

    if (user) {
      if (widget) widget.classList.remove('hidden');
      if (initialsSpan) initialsSpan.innerText = user.name.charAt(0).toUpperCase();
      if (dropName) dropName.innerText = user.name;
      if (dropEmail) dropEmail.innerText = user.email;
    } else {
      if (widget) widget.classList.add('hidden');
    }
  }

  // Auth observer
  auth.onAuthStateChanged((user) => {
    if (user) {
      const googleUserObj = {
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL
      };
      saveGoogleUser(googleUserObj);
    } else {
      clearGoogleUser();
    }
    updateGoogleAuthUI();
    checkAdminAuthentication();
  });

  // Logout actions
  const logoutAccount = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun Google?')) {
      auth.signOut().then(() => {
        window.location.reload();
      }).catch((error) => {
        showToast('Gagal keluar akun: ' + error.message, 'error');
      });
    }
  };

  const btnLogoutHeader = document.getElementById('btn-google-logout');
  if (btnLogoutHeader) {
    btnLogoutHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      logoutAccount();
    });
  }

  // Profile widget click dropdown
  const profileBadge = document.getElementById('google-profile-badge');
  const profileWidget = document.getElementById('google-profile-widget');
  if (profileBadge && profileWidget) {
    profileBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      profileWidget.classList.toggle('active');
    });
  }
  document.addEventListener('click', () => {
    if (profileWidget) profileWidget.classList.remove('active');
  });

  // ==========================================
  // 3. TOAST NOTIFICATION ENGINE
  // ==========================================
  
  window.showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    
    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <div class="toast-message">${message}</div>
      <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // ==========================================
  // 4. DARK MODE TOGGLER
  // ==========================================
  
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Mode ${newTheme === 'dark' ? 'Gelap' : 'Terang'} diaktifkan`, 'info');

    // Redraw charts with darkmode colors
    const list = getApplicants();
    renderAdminCharts(list);
  });

  function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun text-warning"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  }

  // ==========================================
  // 5. ADMIN AUTHENTICATION VALIDATION
  // ==========================================
  
  const adminLoginCard = document.getElementById('admin-login-card');
  const adminDashboard = document.getElementById('admin-dashboard-container');
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminPassInput = document.getElementById('admin-password');
  const adminLogoutBtn = document.getElementById('btn-admin-logout');

  let chartStatusInstance = null;
  let chartTrenInstance = null;

  function checkAdminAuthentication() {
    const user = auth.currentUser;
    const isBypassed = sessionStorage.getItem('PPDB_ADMIN_BYPASS') === 'true';
    
    if (isBypassed || (user && user.email === 'arknafi08@gmail.com')) {
      adminLoginCard.classList.add('hidden');
      adminDashboard.classList.remove('hidden');
      loadAdminDashboardData();
    } else {
      adminLoginCard.classList.remove('hidden');
      adminDashboard.classList.add('hidden');
      
      const h2 = adminLoginCard.querySelector('h2');
      const p = adminLoginCard.querySelector('p');
      const form = document.getElementById('admin-login-form');
      const hint = adminLoginCard.querySelector('.passcode-hint');
      
      if (form) form.classList.remove('hidden');
      if (hint) hint.classList.remove('hidden');
      
      if (!user) {
        h2.innerText = "Akses Dashboard Simulator Admin";
        p.innerHTML = "Gunakan password simulasi atau masuk dengan akun Google Admin Anda:";
        
        let btnGoogleAdmin = document.getElementById('btn-google-admin-login');
        if (!btnGoogleAdmin) {
          btnGoogleAdmin = document.createElement('button');
          btnGoogleAdmin.id = 'btn-google-admin-login';
          btnGoogleAdmin.className = 'btn btn-gradient btn-block';
          btnGoogleAdmin.innerHTML = '<i class="fa-brands fa-google"></i> Masuk dengan Google';
          btnGoogleAdmin.style.marginTop = '15px';
          btnGoogleAdmin.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(() => {
              window.location.reload();
            });
          });
          adminLoginCard.appendChild(btnGoogleAdmin);
        } else {
          btnGoogleAdmin.classList.remove('hidden');
        }
        
        const btnSwitchAdmin = document.getElementById('btn-switch-admin-login');
        if (btnSwitchAdmin) btnSwitchAdmin.classList.add('hidden');
      } else {
        h2.innerText = "Akses Terbatas Admin";
        p.innerHTML = `Akun Google saat ini: <strong>${user.email}</strong> (Non-Admin).<br>Silakan masuk menggunakan password simulasi di bawah untuk mengelola data:`;
        
        const btnGoogleAdmin = document.getElementById('btn-google-admin-login');
        if (btnGoogleAdmin) btnGoogleAdmin.classList.add('hidden');
        
        let btnSwitchAdmin = document.getElementById('btn-switch-admin-login');
        if (!btnSwitchAdmin) {
          btnSwitchAdmin = document.createElement('button');
          btnSwitchAdmin.id = 'btn-switch-admin-login';
          btnSwitchAdmin.className = 'btn btn-outline btn-block';
          btnSwitchAdmin.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Keluar & Ganti Akun';
          btnSwitchAdmin.style.marginTop = '15px';
          btnSwitchAdmin.addEventListener('click', () => {
            auth.signOut().then(() => {
              window.location.reload();
            });
          });
          adminLoginCard.appendChild(btnSwitchAdmin);
        } else {
          btnSwitchAdmin.classList.remove('hidden');
        }
      }
    }
  }

  // Handle local passcode submission
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = adminPassInput.value.trim();
      if (password === 'admin123') {
        sessionStorage.setItem('PPDB_ADMIN_BYPASS', 'true');
        checkAdminAuthentication();
        showToast('Login Admin berhasil menggunakan password simulasi!', 'success');
      } else {
        showToast('Password salah!', 'error');
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('PPDB_ADMIN_BYPASS');
      auth.signOut().then(() => {
        window.location.reload();
      });
    });
  }

  // ==========================================
  // 6. ADMIN TABLE & METRICS RENDERING
  // ==========================================
  
  const tableSearch = document.getElementById('admin-table-search');
  const filterStatus = document.getElementById('admin-filter-status');
  const applicantsTableBody = document.getElementById('applicants-table-body');

  function loadAdminDashboardData() {
    const applicants = getApplicants();
    
    // Sync quota inputs
    const savedQuota = localStorage.getItem('PPDB_QUOTA') || '350';
    const quotaInput = document.getElementById('admin-quota-input');
    if (quotaInput) quotaInput.value = savedQuota;

    const savedPassingGrade = localStorage.getItem('PPDB_PASSING_GRADE') || '70';
    const passingGradeInput = document.getElementById('admin-passing-grade-input');
    if (passingGradeInput) passingGradeInput.value = savedPassingGrade;
    
    // Stats Count
    const total = applicants.length;
    const accepted = applicants.filter(a => a.status === 'Lolos').length;
    const rejected = applicants.filter(a => a.status === 'Tidak Diterima').length;

    document.getElementById('astat-total').innerText = total;
    document.getElementById('astat-accepted').innerText = accepted;
    document.getElementById('astat-rejected').innerText = rejected;

    renderAdminCharts(applicants);
    renderApplicantsTable(applicants);
    loadAdminQuestionsTable();
  }

  function renderAdminCharts(applicants) {
    const ctxStatus = document.getElementById('chart-status')?.getContext('2d');
    const ctxTren = document.getElementById('chart-tren')?.getContext('2d');
    if (!ctxStatus || !ctxTren) return;

    if (chartStatusInstance) chartStatusInstance.destroy();
    if (chartTrenInstance) chartTrenInstance.destroy();

    const statusCounts = { Lolos: 0, Rejected: 0 };
    applicants.forEach(a => {
      if (a.status === 'Lolos') statusCounts.Lolos++;
      else statusCounts.Rejected++;
    });

    const dateCounts = {};
    applicants.forEach(a => {
      const dLabel = formatDateIndo(a.tanggalSubmit);
      dateCounts[dLabel] = (dateCounts[dLabel] || 0) + 1;
    });

    const sortedLabels = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
    const trenData = sortedLabels.map(lbl => dateCounts[lbl]);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textThemeColor = isDark ? '#ffffff' : '#000000';
    const gridThemeColor = isDark ? '#222222' : '#e0e0e0';

    chartStatusInstance = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Lolos', 'Tidak Diterima'],
        datasets: [{
          data: [statusCounts.Lolos, statusCounts.Rejected],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: isDark ? 2 : 1,
          borderColor: isDark ? '#121212' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textThemeColor, font: { family: 'Plus Jakarta Sans', weight: '600', size: 10 } } }
        }
      }
    });

    chartTrenInstance = new Chart(ctxTren, {
      type: 'bar',
      data: {
        labels: sortedLabels,
        datasets: [{
          label: 'Jumlah Pendaftar',
          data: trenData,
          backgroundColor: isDark ? '#ffffff' : '#000000',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: gridThemeColor }, ticks: { color: textThemeColor, font: { family: 'Plus Jakarta Sans' } } },
          y: { grid: { color: gridThemeColor }, ticks: { precision: 0, color: textThemeColor, font: { family: 'Plus Jakarta Sans' } } }
        }
      }
    });
  }

  function renderApplicantsTable(applicants) {
    if (!applicantsTableBody) return;
    applicantsTableBody.innerHTML = '';
    
    const searchVal = tableSearch?.value.toLowerCase().trim() || '';
    const statusVal = filterStatus?.value || '';

    const sorted = [...applicants].sort((a, b) => (b.scoreIRT || 0) - (a.scoreIRT || 0));

    const filtered = sorted.filter(a => {
      const matchesSearch = a.nama.toLowerCase().includes(searchVal) || a.id.toLowerCase().includes(searchVal);
      const matchesStatus = statusVal === '' || a.status === statusVal;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      applicantsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">Data pendaftar tidak ditemukan dengan filter saat ini.</td>
        </tr>
      `;
      return;
    }

    filtered.forEach(applicant => {
      const tr = document.createElement('tr');
      let badgeClass = 'status-rejected';
      if (applicant.status === 'Lolos') {
        badgeClass = 'status-accepted';
      } else if (applicant.status === 'Dalam Proses') {
        badgeClass = 'status-pending';
      }
      const scoreText = applicant.scoreIRT !== null ? `${applicant.scoreIRT} Poin` : '<span style="color:#ef4444; font-weight: 600;">Belum Ujian</span>';

      tr.innerHTML = `
        <td><strong>${applicant.id}</strong></td>
        <td>${applicant.nama}</td>
        <td>${formatDateIndo(applicant.tanggalLahir)}</td>
        <td><span class="badge badge-secondary-soft" style="font-weight: 700;">${scoreText}</span></td>
        <td><span class="status-badge ${badgeClass}">${applicant.status}</span></td>
        <td>
          <div class="admin-actions-cell">
            <button class="btn-view-essay btn btn-outline btn-sm" data-id="${applicant.id}" title="Lihat Essay" style="padding: 4px 8px; font-size: 11px; margin-right: 8px; border-radius: var(--radius-sm);"><i class="fa-solid fa-file-lines"></i> Detail</button>
            <button class="btn-delete-row" data-id="${applicant.id}" title="Hapus Data"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      `;
      applicantsTableBody.appendChild(tr);
    });

    // Detail button clicks
    document.querySelectorAll('.btn-view-essay').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const student = getApplicants().find(a => a.id === id);
        if (student) {
          openApplicantDetailModal(student);
        }
      });
    });

    function openApplicantDetailModal(student) {
      const titleEl = document.getElementById('modal-detail-title-text');
      const contentEl = document.getElementById('modal-detail-content');
      
      if (!titleEl || !contentEl) return;
      
      titleEl.innerHTML = `<i class="fa-solid fa-user-gear text-primary" style="margin-right: 8px;"></i> Detail Calon Peserta – ${student.nama}`;
      
      let html = `
        <div class="applicant-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 20px;">
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">ID Pendaftaran</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 4px; font-family: monospace; font-size: 13px;">${student.id}</div>
          </div>
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Jalur Seleksi</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 4px; font-size: 13px;">${student.jalur}</div>
          </div>
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Email Calon Peserta</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 4px; font-size: 13px;">${student.email}</div>
          </div>
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Tanggal Lahir</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 4px; font-size: 13px;">${formatDateIndo(student.tanggalLahir)}</div>
          </div>
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Sekolah Minecraft</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 4px; font-size: 13px;">${student.sekolahMinecraft || '-'}</div>
          </div>
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Role Minecraft</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 4px; font-size: 13px;">${student.roleMinecraft || '-'}</div>
          </div>
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Status Kelulusan</div>
            <div style="font-weight: 700; color: ${student.status === 'Lolos' ? '#10b981' : student.status === 'Tidak Diterima' ? '#ef4444' : '#f59e0b'}; margin-top: 4px; font-size: 13px;">${student.status}</div>
          </div>
          <div class="detail-item" style="background: var(--bg-tertiary); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Evaluasi CBT (IRT)</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 4px; font-size: 13px;">${student.scoreIRT !== null ? student.scoreIRT + ' Poin' : 'Belum Ujian'}</div>
          </div>
        </div>
      `;

      if (student.jalur === 'Jalur Stats Minecraft (Bedrock)' && student.stats) {
        html += `
          <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;"><i class="fa-solid fa-chart-simple text-primary"></i> Data Hasil Scan Stats Bedrock</h4>
          <div class="bedrock-stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 8px;">
            <div style="background: rgba(66, 133, 244, 0.06); padding: 12px; border: 1px solid rgba(66, 133, 244, 0.15); border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 11px; color: var(--text-muted);">Waktu Bermain (Time Played)</div>
              <div style="font-size: 18px; font-weight: 800; color: #4285F4; margin-top: 4px;">${student.stats.time} <span style="font-size: 11px; font-weight: 500;">Jam</span></div>
            </div>
            <div style="background: rgba(52, 168, 83, 0.06); padding: 12px; border: 1px solid rgba(52, 168, 83, 0.15); border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 11px; color: var(--text-muted);">Blok Ditambang (Mined)</div>
              <div style="font-size: 18px; font-weight: 800; color: #34A853; margin-top: 4px;">${student.stats.mined.toLocaleString()}</div>
            </div>
            <div style="background: rgba(251, 188, 5, 0.06); padding: 12px; border: 1px solid rgba(251, 188, 5, 0.15); border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 11px; color: var(--text-muted);">Blok Diletakkan (Placed)</div>
              <div style="font-size: 18px; font-weight: 800; color: #FBBC05; margin-top: 4px;">${student.stats.placed.toLocaleString()}</div>
            </div>
            <div style="background: rgba(234, 67, 53, 0.06); padding: 12px; border: 1px solid rgba(234, 67, 53, 0.15); border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 11px; color: var(--text-muted);">Diamond Ditemukan</div>
              <div style="font-size: 18px; font-weight: 800; color: #EA4335; margin-top: 4px;">${student.stats.diamonds.toLocaleString()}</div>
            </div>
          </div>
        `;
      } else {
        html += `
          <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;"><i class="fa-solid fa-pen-nib text-primary"></i> Dokumen Essay Motivasi</h4>
          <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; max-height: 200px; overflow-y: auto; font-style: italic; white-space: pre-wrap; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
            ${student.essay ? `"${student.essay}"` : '<em>Calon peserta tidak diwajibkan menulis essay untuk jalur ini.</em>'}
          </div>
        `;
      }

      contentEl.innerHTML = html;
      document.getElementById('applicant-detail-modal').classList.add('active');
    }

    // Delete actions
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Apakah Anda yakin ingin menghapus data calon pendaftar dengan ID: ${id}?`)) {
          deleteRecord(id);
        }
      });
    });
  }

  function deleteRecord(id) {
    let localList = getApplicants().filter(a => a.id !== id);
    saveApplicants(localList);
    loadAdminDashboardData();

    fetch(`${API_BASE}/api/applicants/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete applicant');
        return res.json();
      })
      .then(() => {
        showToast(`Data ID ${id} berhasil dihapus`, 'success');
        fetchApplicantsFromServer();
      })
      .catch(err => console.error("Gagal menghapus data di server Prisma: ", err));
  }

  if (tableSearch) tableSearch.addEventListener('input', loadAdminDashboardData);
  if (filterStatus) filterStatus.addEventListener('change', loadAdminDashboardData);

  // ==========================================
  // 7. BATCH OPERATIONAL ACTIONS (QUOTA / PASSING GRADE / RESET)
  // ==========================================
  
  const quotaApplyBtn = document.getElementById('btn-apply-quota');
  if (quotaApplyBtn) {
    quotaApplyBtn.addEventListener('click', () => {
      const quotaVal = parseInt(document.getElementById('admin-quota-input').value, 10);
      if (isNaN(quotaVal) || quotaVal < 1) {
        showToast('Kuota pendaftaran tidak valid!', 'error');
        return;
      }

      let list = getApplicants();
      list.sort((a, b) => (b.scoreIRT || 0) - (a.scoreIRT || 0));

      list.forEach((applicant, index) => {
        applicant.status = index < quotaVal ? 'Lolos' : 'Tidak Diterima';
      });
      saveApplicants(list);
      localStorage.setItem('PPDB_QUOTA', quotaVal);
      loadAdminDashboardData();
      showToast(`Berhasil menerapkan status seleksi untuk kuota ${quotaVal} orang!`, 'success');

      const updates = list.map(applicant => ({ id: applicant.id, status: applicant.status }));
      fetch(`${API_BASE}/api/applicants/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      .then(res => {
        if (!res.ok) throw new Error('Batch update failed');
        return res.json();
      })
      .then(() => fetchApplicantsFromServer())
      .catch(err => console.error("Gagal menerapkan kuota di server Prisma: ", err));
    });
  }

  const passingGradeApplyBtn = document.getElementById('btn-apply-passing-grade');
  if (passingGradeApplyBtn) {
    passingGradeApplyBtn.addEventListener('click', () => {
      const inputs = document.querySelectorAll('.path-pg-input');
      let isValid = true;
      inputs.forEach(input => {
        const comboKey = input.getAttribute('data-combo');
        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 0 || val > 100) {
          showToast(`Passing Grade untuk "${comboKey}" tidak valid (0-100)!`, 'error');
          isValid = false;
        } else {
          activePassingGrades[comboKey] = val;
        }
      });
      if (!isValid) return;

      savePassingGradesToServer(activePassingGrades);

      let list = getApplicants();
      list.forEach((applicant) => {
        const comboKey = `${applicant.jalur} - ${applicant.roleMinecraft}`;
        const pgLimit = activePassingGrades[comboKey] !== undefined ? activePassingGrades[comboKey] : 70;
        applicant.status = (applicant.scoreIRT || 0) >= pgLimit ? 'Lolos' : 'Tidak Diterima';
      });
      saveApplicants(list);
      loadAdminDashboardData();
      showToast('Berhasil menerapkan kelulusan sesuai Passing Grade per Kombinasi Jalur & Role!', 'success');

      const updates = list.map(applicant => ({ id: applicant.id, status: applicant.status }));
      fetch(`${API_BASE}/api/applicants/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      .then(res => {
        if (!res.ok) throw new Error('Batch update failed');
        return res.json();
      })
      .then(() => fetchApplicantsFromServer())
      .catch(err => console.error("Gagal menerapkan passing grade di server Prisma: ", err));
    });
  }

  const addPathBtn = document.getElementById('btn-add-new-path');
  const newPathInput = document.getElementById('admin-new-path-name');
  if (addPathBtn && newPathInput) {
    addPathBtn.addEventListener('click', () => {
      const newName = newPathInput.value.trim();
      if (!newName) {
        showToast('Nama jalur baru tidak boleh kosong!', 'error');
        return;
      }
      if (activeJalurList.includes(newName)) {
        showToast('Jalur tersebut sudah terdaftar!', 'error');
        return;
      }
      activeJalurList.push(newName);
      newPathInput.value = '';
      
      const roles = currentRolesList && currentRolesList.length > 0 
        ? currentRolesList 
        : ['Builder', 'Farmer', 'Miner', 'PvP Honor'];
      roles.forEach(role => {
        activePassingGrades[`${newName} - ${role}`] = 70;
      });

      saveActiveJalurListToServer(activeJalurList);
      savePassingGradesToServer(activePassingGrades);
      renderPassingGradeTable();
      showToast(`Jalur baru "${newName}" berhasil ditambahkan!`, 'success');
    });
  }

  const resetDataBtn = document.getElementById('btn-admin-reset-data');
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin me-reset seluruh database simulator? Data pendaftaran baru buatan Anda akan terhapus.')) {
        saveApplicants([]);
        loadAdminDashboardData();

        fetch(`${API_BASE}/api/applicants/reset`, { method: 'POST' })
          .then(res => {
            if (!res.ok) throw new Error('Failed to reset');
            return res.json();
          })
          .then(() => {
            showToast('Database cloud berhasil di-reset', 'info');
            fetchApplicantsFromServer();
          })
          .catch(err => console.error("Gagal me-reset database cloud di server Prisma: ", err));
      }
    });
  }

  // ==========================================
  // 8. CBT EXAM QUESTION BANK CRUD
  // ==========================================
  
  function loadAdminQuestionsTable() {
    const questions = JSON.parse(localStorage.getItem('PPDB_EXAM_QUESTIONS') || '[]');
    const tbody = document.getElementById('exam-questions-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (questions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Belum ada soal ujian. Silakan tambah di atas.</td></tr>`;
      return;
    }
    
    const keys = ['A', 'B', 'C', 'D'];
    questions.forEach((q, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 10px; text-align: left; vertical-align: middle;"><strong>${idx + 1}.</strong> ${q.text}</td>
        <td style="padding: 10px; text-align: center; vertical-align: middle; font-weight: 600;">${q.subtest || 'Soal-soal Minecraft'}</td>
        <td style="padding: 10px; text-align: center; vertical-align: middle;"><span class="badge badge-secondary-soft" style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 12px; background: rgba(255,255,255,0.06);">Pilihan ${keys[q.answer]}</span></td>
        <td style="padding: 10px; text-align: center; vertical-align: middle; font-weight: 600;">${q.b.toFixed(1)}</td>
        <td style="padding: 10px; text-align: center; vertical-align: middle; font-weight: 600;">${q.a.toFixed(1)}</td>
        <td style="padding: 10px; text-align: center; vertical-align: middle;">
          <button class="btn btn-outline btn-xs btn-delete-question" data-id="${q.id}" style="padding: 4px 8px; font-size: 10px; color: var(--accent-red); border-color: rgba(239, 68, 68, 0.2); border-radius: 4px; height: auto;"><i class="fa-solid fa-trash-can"></i> Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll('.btn-delete-question').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const qId = btn.getAttribute('data-id');
        if (confirm('Apakah Anda yakin ingin menghapus soal ini dari ujian?')) {
          deleteQuestion(qId);
        }
      });
    });
  }
  
  function deleteQuestion(id) {
    let questions = JSON.parse(localStorage.getItem('PPDB_EXAM_QUESTIONS') || '[]');
    questions = questions.filter(q => q.id !== id);
    localStorage.setItem('PPDB_EXAM_QUESTIONS', JSON.stringify(questions));
    loadAdminQuestionsTable();
    showToast('Soal berhasil dihapus', 'info');
  }

  const addQuestionForm = document.getElementById('admin-add-question-form');
  if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = document.getElementById('q-text').value.trim();
      const optA = document.getElementById('q-opt-a').value.trim();
      const optB = document.getElementById('q-opt-b').value.trim();
      const optC = document.getElementById('q-opt-c').value.trim();
      const optD = document.getElementById('q-opt-d').value.trim();
      const answer = parseInt(document.getElementById('q-answer').value, 10);
      const b = parseFloat(document.getElementById('q-param-b').value);
      const a = parseFloat(document.getElementById('q-param-a').value);
      const subtest = document.getElementById('q-subtest').value;
      
      const questions = JSON.parse(localStorage.getItem('PPDB_EXAM_QUESTIONS') || '[]');
      const newQ = {
        id: 'Q-' + Date.now(),
        text,
        options: [optA, optB, optC, optD],
        answer,
        a,
        b,
        subtest
      };
      
      questions.push(newQ);
      localStorage.setItem('PPDB_EXAM_QUESTIONS', JSON.stringify(questions));
      addQuestionForm.reset();
      loadAdminQuestionsTable();
      showToast('Soal baru berhasil ditambahkan!', 'success');
    });
  }

  // ==========================================
  // 9. CONFIGURATION LOAD / SYNC FROM SERVER
  // ==========================================
  
  function syncAdminConfigInputs(data) {
    const countdownActiveCheckbox = document.getElementById('admin-countdown-active');
    const countdownTargetInput = document.getElementById('admin-countdown-target');
    const regActiveCheckbox = document.getElementById('admin-reg-active');
    
    if (countdownActiveCheckbox) countdownActiveCheckbox.checked = data.countdownActive || false;
    if (countdownTargetInput && data.countdownTarget) {
      countdownTargetInput.value = data.countdownTarget.slice(0, 16);
    }
    if (regActiveCheckbox) regActiveCheckbox.checked = data.registrationActive !== false;
  }

  const getSystemConfig = () => {
    const data = localStorage.getItem('PPDB_SYSTEM_CONFIG');
    return data ? JSON.parse(data) : {
      countdownActive: false,
      countdownTarget: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      registrationActive: true
    };
  };

  const saveSystemConfig = (config) => {
    localStorage.setItem('PPDB_SYSTEM_CONFIG', JSON.stringify(config));
  };

  const syncSystemConfigFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settings/system_config`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          saveSystemConfig(data);
          syncAdminConfigInputs(data);
        } else {
          const defaultConfig = getSystemConfig();
          await saveSystemConfigToServer(defaultConfig);
        }
      }
    } catch (error) {
      console.error("Gagal melakukan sync sistem config, falling back to local storage: ", error);
      const data = getSystemConfig();
      syncAdminConfigInputs(data);
    }
  };

  const saveSystemConfigToServer = async (config) => {
    try {
      const response = await fetch(`${API_BASE}/api/settings/system_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: config })
      });
      if (response.ok) {
        const data = await response.json();
        saveSystemConfig(data);
        return data;
      }
    } catch (error) {
      console.error("Gagal menyimpan config ke server: ", error);
    }
  };

  let activeJalurList = [
    "Jalur Stats Minecraft (Bedrock)",
    "Jalur Beasiswa Miner/Builder",
    "Jalur Seleksi Ujian (CBT)"
  ];

  let activePassingGrades = {};

  const syncPassingGradesFromServer = async () => {
    try {
      const resJalur = await fetch(`${API_BASE}/api/settings/active_jalur_list`);
      if (resJalur.ok) {
        const jalurData = await resJalur.json();
        if (jalurData && Array.isArray(jalurData)) {
          activeJalurList = jalurData;
        }
      }

      const resPG = await fetch(`${API_BASE}/api/settings/passing_grades`);
      if (resPG.ok) {
        const pgData = await resPG.json();
        if (pgData && typeof pgData === 'object') {
          activePassingGrades = pgData;
        }
      }

      ensurePassingGradeCombinations();
      renderPassingGradeTable();
    } catch (error) {
      console.error("Gagal melakukan sync passing grades: ", error);
      renderPassingGradeTable();
    }
  };

  const ensurePassingGradeCombinations = () => {
    const roles = currentRolesList && currentRolesList.length > 0 
      ? currentRolesList 
      : ['Builder', 'Farmer', 'Miner', 'PvP Honor'];

    let modified = false;
    activeJalurList.forEach(jalur => {
      roles.forEach(role => {
        const key = `${jalur} - ${role}`;
        if (activePassingGrades[key] === undefined) {
          activePassingGrades[key] = 70;
          modified = true;
        }
      });
    });

    if (modified) {
      savePassingGradesToServer(activePassingGrades);
    }
  };

  const savePassingGradesToServer = async (grades) => {
    try {
      await fetch(`${API_BASE}/api/settings/passing_grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: grades })
      });
    } catch (error) {
      console.error("Gagal menyimpan passing grades ke server: ", error);
    }
  };

  const saveActiveJalurListToServer = async (list) => {
    try {
      await fetch(`${API_BASE}/api/settings/active_jalur_list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: list })
      });
    } catch (error) {
      console.error("Gagal menyimpan daftar jalur ke server: ", error);
    }
  };

  function renderPassingGradeTable() {
    const tbody = document.getElementById('admin-passing-grade-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const corePaths = [
      "Jalur Stats Minecraft (Bedrock)",
      "Jalur Beasiswa Miner/Builder",
      "Jalur Seleksi Ujian (CBT)"
    ];

    const roles = currentRolesList && currentRolesList.length > 0 
      ? currentRolesList 
      : ['Builder', 'Farmer', 'Miner', 'PvP Honor'];

    activeJalurList.forEach(jalurName => {
      const isCore = corePaths.includes(jalurName);
      
      roles.forEach(roleName => {
        const comboKey = `${jalurName} - ${roleName}`;
        const pgVal = activePassingGrades[comboKey] !== undefined ? activePassingGrades[comboKey] : 70;
        
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        tr.innerHTML = `
          <td style="padding: 6px; font-weight: 500;">
            <div style="font-weight: 700; color: var(--text-primary);">${jalurName}</div>
            <div style="font-size: 11px; color: var(--text-muted);"><i class="fa-solid fa-id-card-clip"></i> ${roleName}</div>
          </td>
          <td style="padding: 6px; text-align: center; vertical-align: middle;">
            <input type="number" class="path-pg-input form-control" data-combo="${comboKey}" value="${pgVal}" min="0" max="100" style="height: 28px; font-size: 11px; padding: 2px 6px; text-align: center; width: 70px; display: inline-block;">
          </td>
          <td style="padding: 6px; text-align: center; vertical-align: middle;">
            ${isCore 
              ? `<span style="color: var(--text-muted); font-size: 10px; font-weight: 600;">Core</span>` 
              : `<button type="button" class="btn-delete-path" data-path="${jalurName}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 12px; padding: 2px;"><i class="fa-solid fa-trash-can"></i> Hapus</button>`
            }
          </td>
        `;
        tbody.appendChild(tr);
      });
    });

    // Attach delete path events
    document.querySelectorAll('.btn-delete-path').forEach(btn => {
      btn.addEventListener('click', () => {
        const pathName = btn.getAttribute('data-path');
        if (confirm(`Apakah Anda yakin ingin menghapus Jalur "${pathName}"? Ini akan menghapus semua konfigurasi passing grade untuk semua role di jalur ini.`)) {
          activeJalurList = activeJalurList.filter(j => j !== pathName);
          Object.keys(activePassingGrades).forEach(key => {
            if (key.startsWith(pathName + " - ")) {
              delete activePassingGrades[key];
            }
          });
          saveActiveJalurListToServer(activeJalurList);
          savePassingGradesToServer(activePassingGrades);
          renderPassingGradeTable();
          showToast(`Jalur "${pathName}" berhasil dihapus.`, 'success');
        }
      });
    });
  }

  // ==========================================
  // Maintenance Mode Logic
  // ==========================================
  const syncMaintenanceModeFromServer = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/maintenance_mode`);
      if (res.ok) {
        const isActive = await res.json();
        const checkbox = document.getElementById('admin-maintenance-active');
        if (checkbox) {
          checkbox.checked = isActive === true;
        }
      }
    } catch (err) {
      console.error("Gagal sinkronisasi maintenance mode:", err);
    }
  };

  const saveMaintenanceModeBtn = document.getElementById('btn-save-maintenance');
  if (saveMaintenanceModeBtn) {
    saveMaintenanceModeBtn.addEventListener('click', async () => {
      const checkbox = document.getElementById('admin-maintenance-active');
      const val = checkbox ? checkbox.checked : false;
      try {
        const res = await fetch(`${API_BASE}/api/settings/maintenance_mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: val })
        });
        if (res.ok) {
          showToast(`Mode Pemeliharaan berhasil ${val ? 'Diaktifkan' : 'Dinonaktifkan'}!`, 'success');
        } else {
          throw new Error('Save failed');
        }
      } catch (err) {
        console.error("Gagal menyimpan mode pemeliharaan:", err);
        showToast('Gagal menyimpan status mode pemeliharaan!', 'error');
      }
    });
  }

  let currentSchoolsList = [];
  let currentRolesList = [];

  const renderSchoolsList = () => {
    const container = document.getElementById('admin-schools-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (currentSchoolsList.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 10px 0;">Belum ada sekolah. Tambah di atas.</div>`;
      return;
    }

    currentSchoolsList.forEach((school, index) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '8px 12px';
      item.style.background = 'rgba(255,255,255,0.03)';
      item.style.border = '1px solid var(--border-color)';
      item.style.borderRadius = 'var(--radius-xs)';
      item.style.fontSize = '13px';
      
      item.innerHTML = `
        <span style="color: var(--text-primary); font-weight: 600;">${school}</span>
        <button class="btn-delete-school-item" data-index="${index}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; font-size: 14px;"><i class="fa-solid fa-trash-can"></i></button>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.btn-delete-school-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        currentSchoolsList.splice(idx, 1);
        renderSchoolsList();
      });
    });
  };

  const renderRolesList = () => {
    const container = document.getElementById('admin-roles-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (currentRolesList.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 10px 0;">Belum ada role. Tambah di atas.</div>`;
      return;
    }

    currentRolesList.forEach((role, index) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '8px 12px';
      item.style.background = 'rgba(255,255,255,0.03)';
      item.style.border = '1px solid var(--border-color)';
      item.style.borderRadius = 'var(--radius-xs)';
      item.style.fontSize = '13px';

      item.innerHTML = `
        <span style="color: var(--text-primary); font-weight: 600;">${role}</span>
        <button class="btn-delete-role-item" data-index="${index}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; font-size: 14px;"><i class="fa-solid fa-trash-can"></i></button>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.btn-delete-role-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        currentRolesList.splice(idx, 1);
        renderRolesList();
      });
    });
  };

  const syncMinecraftSettings = async () => {
    try {
      const resSchools = await fetch(`${API_BASE}/api/settings/minecraft_schools`);
      if (resSchools.ok) {
        const schools = await resSchools.json();
        currentSchoolsList = (schools && Array.isArray(schools)) 
          ? schools 
          : ['SMP Redstone Indonesia', 'Akademi Builder Nusantara', 'Minecraft High School'];
        renderSchoolsList();
      }

      const resRoles = await fetch(`${API_BASE}/api/settings/minecraft_roles`);
      if (resRoles.ok) {
        const roles = await resRoles.json();
        currentRolesList = (roles && Array.isArray(roles)) 
          ? roles 
          : ['Builder', 'Farmer', 'Miner', 'PvP Honor'];
        renderRolesList();
      }

      const resCbt = await fetch(`${API_BASE}/api/settings/cbt_duration`);
      if (resCbt.ok) {
        const duration = await resCbt.json();
        const input = document.getElementById('admin-cbt-duration-input');
        if (input && duration) {
          input.value = duration;
        }
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data sekolah/role/CBT Minecraft:", err);
    }
  };

  syncSystemConfigFromServer();
  syncMinecraftSettings();
  syncPassingGradesFromServer();
  syncMaintenanceModeFromServer();
  setInterval(syncSystemConfigFromServer, 30000);
  setInterval(syncMaintenanceModeFromServer, 30000);

  // Add school item button listener
  const addSchoolBtn = document.getElementById('btn-add-school-item');
  if (addSchoolBtn) {
    addSchoolBtn.addEventListener('click', () => {
      const input = document.getElementById('admin-school-add-input');
      const val = input.value.trim();
      if (val) {
        if (currentSchoolsList.includes(val)) {
          showToast("Nama sekolah sudah terdaftar di list!", "error");
          return;
        }
        currentSchoolsList.push(val);
        input.value = '';
        renderSchoolsList();
      }
    });
  }

  // Add role item button listener
  const addRoleBtn = document.getElementById('btn-add-role-item');
  if (addRoleBtn) {
    addRoleBtn.addEventListener('click', () => {
      const input = document.getElementById('admin-role-add-input');
      const val = input.value.trim();
      if (val) {
        if (currentRolesList.includes(val)) {
          showToast("Role sudah terdaftar di list!", "error");
          return;
        }
        currentRolesList.push(val);
        input.value = '';
        renderRolesList();
      }
    });
  }

  // Settings save buttons
  const saveCountdownBtn = document.getElementById('btn-save-countdown');
  if (saveCountdownBtn) {
    saveCountdownBtn.addEventListener('click', async () => {
      const active = document.getElementById('admin-countdown-active').checked;
      const target = document.getElementById('admin-countdown-target').value;
      
      if (active && !target) {
        showToast("Wajib menentukan waktu target hitung mundur!", "error");
        return;
      }
      
      const config = getSystemConfig();
      config.countdownActive = active;
      config.countdownTarget = target;
      saveSystemConfig(config);
      showToast("Konfigurasi countdown berhasil disimpan!", "success");

      await saveSystemConfigToServer(config);
    });
  }

  const saveRegStatusBtn = document.getElementById('btn-save-reg-status');
  if (saveRegStatusBtn) {
    saveRegStatusBtn.addEventListener('click', async () => {
      const active = document.getElementById('admin-reg-active').checked;
      
      const config = getSystemConfig();
      config.registrationActive = active;
      saveSystemConfig(config);
      showToast(`Status pendaftaran berhasil diubah menjadi: ${active ? 'DIBUKA' : 'DITUTUP'}`, "success");

      await saveSystemConfigToServer(config);
    });
  }

  const saveSchoolsBtn = document.getElementById('btn-save-schools');
  if (saveSchoolsBtn) {
    saveSchoolsBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings/minecraft_schools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: currentSchoolsList })
        });
        if (response.ok) {
          showToast("Daftar Sekolah Minecraft berhasil disimpan!", "success");
        } else {
          throw new Error();
        }
      } catch (err) {
        showToast("Gagal menyimpan daftar sekolah", "error");
      }
    });
  }

  const saveRolesBtn = document.getElementById('btn-save-roles');
  if (saveRolesBtn) {
    saveRolesBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings/minecraft_roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: currentRolesList })
        });
        if (response.ok) {
          showToast("Daftar Role Minecraft berhasil disimpan!", "success");
        } else {
          throw new Error();
        }
      } catch (err) {
        showToast("Gagal menyimpan daftar role", "error");
      }
    });
  }

  const saveCbtDurationBtn = document.getElementById('btn-save-cbt-duration');
  if (saveCbtDurationBtn) {
    saveCbtDurationBtn.addEventListener('click', async () => {
      const durationVal = parseInt(document.getElementById('admin-cbt-duration-input').value, 10);
      if (isNaN(durationVal) || durationVal < 1 || durationVal > 180) {
        showToast("Durasi ujian tidak valid! Harus antara 1 s/d 180 menit.", "error");
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE}/api/settings/cbt_duration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: durationVal })
        });
        if (response.ok) {
          showToast("Durasi ujian CBT berhasil disimpan!", "success");
        } else {
          throw new Error();
        }
      } catch (err) {
        showToast("Gagal menyimpan durasi ujian CBT", "error");
      }
    });
  }

  // ==========================================
  // CBT MONITOR TABLE
  // ==========================================

  async function loadCbtMonitorTable() {
    const tbody = document.getElementById('cbt-monitor-table-body');
    const summary = document.getElementById('cbt-monitor-summary');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat...</td></tr>`;

    try {
      const res = await fetch(`${API_BASE}/api/applicants`);
      const all = await res.json();
      const cbtApplicants = all.filter(a => a.jalur === 'Jalur Seleksi Ujian (CBT)');

      saveApplicants(all);

      if (summary) {
        const blockedCount = cbtApplicants.filter(a => a.cbtBlocked).length;
        summary.textContent = `Total peserta CBT: ${cbtApplicants.length} | Diblokir: ${blockedCount}`;
      }

      if (cbtApplicants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">Belum ada peserta jalur CBT.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      cbtApplicants.forEach(a => {
        const isBlocked = !!a.cbtBlocked;
        const violations = a.cbtViolations || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="padding: 8px; font-family: monospace;">${a.id}</td>
          <td style="padding: 8px;">${a.nama}</td>
          <td style="padding: 8px; text-align: center;">
            <span style="background: ${violations > 0 ? 'rgba(239,68,68,0.12)' : 'var(--bg-tertiary)'}; color: ${violations > 0 ? '#ef4444' : 'var(--text-muted)'}; border-radius: 20px; padding: 2px 10px; font-weight: 700; font-size: 12px;">
              ${violations} / 3
            </span>
          </td>
          <td style="padding: 8px; text-align: center;">
            <span style="background: ${isBlocked ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.10)'}; color: ${isBlocked ? '#ef4444' : '#10b981'}; border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 700;">
              ${isBlocked ? '🔒 DIBLOKIR' : '✅ Aktif'}
            </span>
          </td>
          <td style="padding: 8px; text-align: center;">
            ${isBlocked
              ? `<button class="btn btn-sm" style="height: 28px; background: #10b981; color: white; border: none; font-size: 11px; font-weight: 700; padding: 0 10px; border-radius: 4px; cursor: pointer;" onclick="adminUnblockCbt('${a.id}', this)"><i class="fa-solid fa-lock-open"></i> Buka Blokir</button>`
              : `<button class="btn btn-sm" style="height: 28px; background: #ef4444; color: white; border: none; font-size: 11px; font-weight: 700; padding: 0 10px; border-radius: 4px; cursor: pointer;" onclick="adminBlockCbt('${a.id}', this)"><i class="fa-solid fa-ban"></i> Blokir</button>`
            }
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error loading CBT monitor:', err);
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #ef4444;">Gagal memuat data. Pastikan server berjalan.</td></tr>`;
    }
  }

  // Expose block/unblock functions to global scope for inline onclick handlers
  window.adminBlockCbt = async (id, btn) => {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
      const res = await fetch(`${API_BASE}/api/applicants/${id}/block`, { method: 'POST' });
      if (res.ok) {
        showToast(`Peserta ${id} berhasil diblokir dari ujian CBT.`, 'success');
        await loadCbtMonitorTable();
      } else throw new Error();
    } catch {
      showToast(`Gagal memblokir peserta ${id}.`, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-ban"></i> Blokir';
    }
  };

  window.adminUnblockCbt = async (id, btn) => {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
      const res = await fetch(`${API_BASE}/api/applicants/${id}/unblock`, { method: 'POST' });
      if (res.ok) {
        showToast(`Blokir peserta ${id} berhasil dibuka. Pelanggaran direset ke 0.`, 'success');
        await loadCbtMonitorTable();
      } else throw new Error();
    } catch {
      showToast(`Gagal membuka blokir peserta ${id}.`, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Buka Blokir';
    }
  };

  // Refresh button
  const refreshCbtBtn = document.getElementById('btn-refresh-cbt-monitor');
  if (refreshCbtBtn) {
    refreshCbtBtn.addEventListener('click', () => loadCbtMonitorTable());
  }

  // ==========================================
  // 10. SUB-TABS INTERACTIVE VIEW TOGGLERS
  // ==========================================
  
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetClass = btn.getAttribute('data-target') + '-el';
      
      document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('btn-gradient');
        b.classList.add('btn-outline');
      });
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-gradient');

      document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.classList.add('hidden');
      });
      document.querySelectorAll('.' + targetClass).forEach(el => {
        el.classList.remove('hidden');
      });

      if (btn.getAttribute('data-target') === 'admin-tab-overview') {
        const list = getApplicants();
        renderAdminCharts(list);
      }

      // Load CBT monitor table when switching to exams tab
      if (btn.getAttribute('data-target') === 'admin-tab-exams') {
        loadCbtMonitorTable();
      }

      // Live chat toggles
      if (btn.getAttribute('data-target') === 'admin-tab-chat') {
        startAdminChatPolling();
      } else {
        stopAdminChatPolling();
      }
    });
  });

  // Mobile menu toggle click
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('active');
      menuToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // Close modals listeners
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    });
  });

  // Close modals when clicking overlay bg outside content card
  document.querySelectorAll('.modal-wrapper').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // ==========================================
  // 11. ADMIN CUSTOMER SERVICE CHAT LOGIC
  // ==========================================
  let activeChatSessionId = null;
  let adminChatSessionsInterval = null;
  let adminChatMessagesInterval = null;
  let sessionLastMsgCount = {}; // { sessionId: msgCount }

  const startAdminChatPolling = () => {
    loadChatSessions();
    if (adminChatSessionsInterval) clearInterval(adminChatSessionsInterval);
    adminChatSessionsInterval = setInterval(loadChatSessions, 4000);
  };

  const stopAdminChatPolling = () => {
    if (adminChatSessionsInterval) clearInterval(adminChatSessionsInterval);
    if (adminChatMessagesInterval) clearInterval(adminChatMessagesInterval);
  };

  const loadChatSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/sessions`);
      if (response.ok) {
        const sessions = await response.json();
        renderChatSessions(sessions);
        updateAdminUnreadBadge(sessions);
      }
    } catch (error) {
      console.error("Gagal memuat sesi chat:", error);
    }
  };

  const updateAdminUnreadBadge = (sessions) => {
    let unreadTotal = 0;
    sessions.forEach(s => {
      const msgs = s.messages || [];
      const currentCount = msgs.length;
      const prevCount = sessionLastMsgCount[s.sessionId] || 0;
      
      // If messages increased and the last message is from user, treat it as unread
      if (currentCount > prevCount) {
        const lastMsg = msgs[currentCount - 1];
        if (lastMsg && lastMsg.sender === 'user' && s.sessionId !== activeChatSessionId) {
          unreadTotal++;
        }
      }
    });

    const badge = document.getElementById('admin-chat-total-badge');
    if (badge) {
      if (unreadTotal > 0) {
        badge.innerText = unreadTotal;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  };

  const renderChatSessions = (sessions) => {
    const listContainer = document.getElementById('admin-chat-sessions-list');
    if (!listContainer) return;

    if (sessions.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 30px 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
          Tidak ada sesi chat aktif saat ini.
        </div>
      `;
      return;
    }

    let html = '';
    sessions.forEach(session => {
      const isSelected = session.sessionId === activeChatSessionId;
      const lastMsg = session.lastMessage || 'Belum ada pesan';
      const sender = session.lastSender || 'User';
      const timeStr = new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Check if this session is unread
      const msgs = session.messages || [];
      const currentCount = msgs.length;
      const prevCount = sessionLastMsgCount[session.sessionId] || 0;
      let hasUnread = false;
      if (currentCount > prevCount) {
        const lastMsgObj = msgs[currentCount - 1];
        if (lastMsgObj && lastMsgObj.sender === 'user' && !isSelected) {
          hasUnread = true;
        }
      }

      // Name beautification
      let displayName = session.sessionId;
      if (session.sessionId.startsWith('google-')) {
        displayName = session.sessionId.replace('google-', '').replace(/_/g, '.');
      } else if (session.sessionId.startsWith('guest-')) {
        displayName = `Guest (${session.sessionId.replace('guest-', '').toUpperCase()})`;
      }

      html += `
        <div class="admin-chat-session-item" data-session-id="${session.sessionId}" style="padding: 14px 18px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s; background: ${isSelected ? 'rgba(66, 133, 244, 0.15)' : 'transparent'}; display: flex; flex-direction: column; gap: 4px; border-left: 3px solid ${hasUnread ? '#ef4444' : 'transparent'};">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <strong style="font-size: 13px; color: ${hasUnread ? 'var(--text-main)' : 'var(--text-primary)'}; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 200px;">${displayName}</strong>
            <span style="font-size: 10px; color: var(--text-muted);">${timeStr}</span>
          </div>
          <div style="font-size: 12px; color: ${hasUnread ? 'var(--text-primary)' : 'var(--text-muted)'}; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; font-weight: ${hasUnread ? '700' : '400'};">
            ${sender === 'Panitia SNM' ? 'Anda: ' : ''}${lastMsg}
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Add click listeners to session items
    listContainer.querySelectorAll('.admin-chat-session-item').forEach(item => {
      item.addEventListener('click', () => {
        const sessionId = item.getAttribute('data-session-id');
        selectChatSession(sessionId);
      });
    });
  };

  const selectChatSession = (sessionId) => {
    activeChatSessionId = sessionId;
    
    // Add active state class to container for mobile responsive views
    const container = document.querySelector('.admin-tab-chat-el');
    if (container) container.classList.add('session-active');
    
    // UI toggles
    document.getElementById('admin-chat-window-placeholder').style.display = 'none';
    document.getElementById('admin-chat-window-header').style.display = 'block';
    document.getElementById('admin-chat-messages-container').style.display = 'flex';
    document.getElementById('admin-chat-window-footer').style.display = 'flex';

    // Set Header titles
    let displayName = sessionId;
    if (sessionId.startsWith('google-')) {
      displayName = sessionId.replace('google-', '').replace(/_/g, '.');
    } else if (sessionId.startsWith('guest-')) {
      displayName = `Guest User (${sessionId.replace('guest-', '').toUpperCase()})`;
    }
    document.getElementById('admin-chat-active-name').innerText = displayName;
    document.getElementById('admin-chat-active-session-id').innerText = `ID: ${sessionId}`;

    // Mark messages count as seen
    const activeSessionItem = document.querySelector(`.admin-chat-session-item[data-session-id="${sessionId}"]`);
    if (activeSessionItem) {
      activeSessionItem.style.background = 'rgba(66, 133, 244, 0.15)';
    }

    // Load active conversation immediately and poll every 3 seconds
    loadActiveConversationMessages();
    if (adminChatMessagesInterval) clearInterval(adminChatMessagesInterval);
    adminChatMessagesInterval = setInterval(loadActiveConversationMessages, 3000);
  };

  const loadActiveConversationMessages = async () => {
    if (!activeChatSessionId) return;
    try {
      const response = await fetch(`${API_BASE}/api/chat/${activeChatSessionId}`);
      if (response.ok) {
        const messages = await response.json();
        
        // Save current messages count to avoid notification badge on this active chat
        sessionLastMsgCount[activeChatSessionId] = messages.length;
        
        renderActiveConversationMessages(messages);
      }
    } catch (error) {
      console.error("Gagal sinkronisasi pesan chat:", error);
    }
  };

  const renderActiveConversationMessages = (messages) => {
    const messagesContainer = document.getElementById('admin-chat-messages-container');
    if (!messagesContainer) return;

    let html = '';
    messages.forEach(msg => {
      const isAdmin = msg.sender === 'admin';
      html += `
        <div class="cs-chat-bubble-msg ${isAdmin ? 'user' : 'admin'}" style="align-self: ${isAdmin ? 'flex-end' : 'flex-start'}; background: ${isAdmin ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-secondary)'}; color: ${isAdmin ? 'white' : 'var(--text-primary)'}; border: ${isAdmin ? 'none' : '1px solid var(--border-color)'};">
          <div style="font-size: 10px; color: ${isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'}; margin-bottom: 2px; font-weight: 700;">
            ${msg.senderName}
          </div>
          <div>${msg.message}</div>
        </div>
      `;
    });

    const scrollHeightBefore = messagesContainer.scrollHeight;
    messagesContainer.innerHTML = html;

    // Scroll to bottom
    if (messagesContainer.scrollHeight > scrollHeightBefore) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const sendAdminChatMessage = async () => {
    const input = document.getElementById('admin-chat-input');
    const sendBtn = document.getElementById('admin-chat-send-btn');
    if (!input || !sendBtn || !activeChatSessionId) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    sendBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/api/chat/${activeChatSessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'admin',
          senderName: 'Panitia SNM',
          message: message
        })
      });
      if (response.ok) {
        const messages = await response.json();
        sessionLastMsgCount[activeChatSessionId] = messages.length;
        renderActiveConversationMessages(messages);
        
        // Refresh session list last message
        loadChatSessions();
      }
    } catch (error) {
      console.error("Gagal mengirim balasan chat:", error);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  };

  // Bind admin inputs
  const adminInput = document.getElementById('admin-chat-input');
  const adminSendBtn = document.getElementById('admin-chat-send-btn');
  const refreshBtn = document.getElementById('btn-refresh-admin-chats');

  if (adminInput) {
    adminInput.addEventListener('input', () => {
      adminSendBtn.disabled = !adminInput.value.trim();
    });
    adminInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !adminSendBtn.disabled) {
        sendAdminChatMessage();
      }
    });
  }

  if (adminSendBtn) {
    adminSendBtn.addEventListener('click', sendAdminChatMessage);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadChatSessions);
  }

  // Bind back button for mobile views
  const backBtn = document.getElementById('admin-chat-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      activeChatSessionId = null;
      const container = document.querySelector('.admin-tab-chat-el');
      if (container) container.classList.remove('session-active');
      
      // Stop active chat messages polling
      if (adminChatMessagesInterval) clearInterval(adminChatMessagesInterval);
      
      // Hide active chat view, show placeholder
      document.getElementById('admin-chat-window-placeholder').style.display = 'flex';
      document.getElementById('admin-chat-window-header').style.display = 'none';
      document.getElementById('admin-chat-messages-container').style.display = 'none';
      document.getElementById('admin-chat-window-footer').style.display = 'none';
      
      // Refresh session list
      loadChatSessions();
    });
  }

  // Periodic slow checks for incoming messages globally to update the main CS tab badge
  const checkIncomingChatsGlobally = async () => {
    // Only fetch globally if we are NOT currently focused on the chat tab
    const chatTabBtn = document.querySelector('.admin-tab-btn[data-target="admin-tab-chat"]');
    if (chatTabBtn && !chatTabBtn.classList.contains('btn-gradient')) {
      try {
        const response = await fetch(`${API_BASE}/api/chat/sessions`);
        if (response.ok) {
          const sessions = await response.json();
          updateAdminUnreadBadge(sessions);
        }
      } catch (e) {}
    }
  };
  setInterval(checkIncomingChatsGlobally, 12000);

});
