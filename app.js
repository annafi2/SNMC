/* ==========================================================================
   SNM 2026 – SELEKSI NASIONAL MINECRAFTER – CLIENT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. STATE & DUMMY DATABASE INITIALIZATION
  // ==========================================

  const API_BASE = (window.location.port === '3000' || (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') && window.location.hostname !== '')) ? '' : 'http://localhost:3000';

  const STORAGE_KEY = 'PPDB_APPLICANTS';
  let justRegistered = false;

  // Initialize DB helper functions
  const getApplicants = () => {
    const list = localStorage.getItem(STORAGE_KEY);
    return list ? JSON.parse(list) : [];
  };

  const saveApplicants = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Fetch from Prisma backend server
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
        updateHomeStats();
        updateGoogleAuthUI();
        if (sessionStorage.getItem('admin_auth') === 'true' || (auth.currentUser && auth.currentUser.email === 'arknafi08@gmail.com')) {
          loadAdminDashboardData();
        }
      } else {
        throw new Error('Server returned non-ok status');
      }
    } catch (error) {
      console.error("Gagal mengambil data dari server Prisma:", error);
      // Show warning banner if connection failed
      const warningEl = document.getElementById('db-connection-warning');
      if (warningEl) warningEl.style.display = 'flex';
    }
  };

  // Perform initial fetch
  fetchApplicantsFromServer();
  // Poll every 8 seconds to mimic real-time snapshot sync
  setInterval(fetchApplicantsFromServer, 8000);
  if (localStorage.getItem('PPDB_QUOTA') === null) {
    localStorage.setItem('PPDB_QUOTA', '350');
  }
  if (localStorage.getItem('PPDB_PASSING_GRADE') === null) {
    localStorage.setItem('PPDB_PASSING_GRADE', '70');
  }
  const existingQuestions = JSON.parse(localStorage.getItem('PPDB_EXAM_QUESTIONS') || '[]');
  if (existingQuestions.length !== 9) {
    const defaultQuestions = [
      {
        id: "Q-001",
        text: "Sebuah portal Nether membutuhkan minimal 10 blok Obsidian. Jika Budi ingin membangun 3 portal Nether, namun ia sudah memiliki 7 blok Obsidian, berapa minimal obsidian lagi yang harus ia tambang?",
        options: ["13", "20", "23", "30"],
        answer: 2,
        a: 1.6,
        b: 0.5,
        subtest: "Penalaran Matematika"
      },
      {
        id: "Q-002",
        text: "Kecepatan terbang Elytra adalah sekitar 30 meter per detik. Jika jarak dari base ke Stronghold adalah 1800 meter, berapa waktu yang dibutuhkan untuk sampai di Stronghold menggunakan Elytra?",
        options: ["30 detik", "60 detik", "90 detik", "120 detik"],
        answer: 1,
        a: 1.2,
        b: -1.0,
        subtest: "Penalaran Matematika"
      },
      {
        id: "Q-003",
        text: "Budi memiliki 3 tumpukan (stack) Iron Ingot penuh (64 ingot per stack) dan 12 ingot tambahan. Jika 1 Iron Block memerlukan 9 Iron Ingot, berapa Iron Block maksimal yang dapat ia rakit?",
        options: ["20", "22", "24", "26"],
        answer: 1,
        a: 1.8,
        b: 0.2,
        subtest: "Penalaran Matematika"
      },
      {
        id: "Q-004",
        text: "Jika semua laba-laba (spider) menyerang pemain di tempat gelap, dan saat ini laba-laba di gua tidak menyerang pemain, maka dapat disimpulkan...",
        options: ["Hari sedang siang", "Gua tersebut terang benderang", "Laba-laba sedang ramah", "Pemain memakai ramuan invisibility"],
        answer: 1,
        a: 1.4,
        b: 0.8,
        subtest: "Kemampuan Bernalar"
      },
      {
        id: "Q-005",
        text: "Seorang pemain ingin membuat sistem otomatisasi pengiriman barang dari pertambangan Y=-50 ke permukaan Y=70. Metode manakah yang paling logis dan efisien untuk memindahkan item secara vertikal ke atas?",
        options: ["Hopper line vertikal", "Dropper elevator bertenaga redstone clock", "Water elevator menggunakan Soul Sand", "Melempar item secara manual"],
        answer: 2,
        a: 2.0,
        b: 1.5,
        subtest: "Kemampuan Bernalar"
      },
      {
        id: "Q-006",
        text: "Jika Redstone Wire mengalirkan sinyal sejauh maksimal 15 blok tanpa repeater, dan saklar berjarak 20 blok dari pintu besi, manakah kesimpulan yang benar agar pintu dapat terbuka?",
        options: ["Sinyal akan langsung sampai", "Dibutuhkan Redstone Repeater di tengah jalur", "Kabel redstone harus diganti dengan emas", "Pintu besi tidak bisa dibuka dengan redstone"],
        answer: 1,
        a: 1.5,
        b: 0.4,
        subtest: "Kemampuan Bernalar"
      },
      {
        id: "Q-007",
        text: "Di Minecraft Bedrock, material apa yang memiliki tingkat hardness tertinggi selain Bedrock?",
        options: ["Obsidian", "Ancient Debris", "Crying Obsidian", "Reinforced Deepslate"],
        answer: 3,
        a: 1.6,
        b: 0.5,
        subtest: "Soal-soal Minecraft"
      },
      {
        id: "Q-008",
        text: "Berapa jumlah Ender Pearl yang dibutuhkan untuk membuat 1 Eye of Ender?",
        options: ["1", "2", "4", "8"],
        answer: 0,
        a: 1.2,
        b: -1.0,
        subtest: "Soal-soal Minecraft"
      },
      {
        id: "Q-009",
        text: "Blok manakah yang digunakan sebagai 'fuel' (bahan bakar) dengan durasi pembakaran terlama di Furnace?",
        options: ["Coal", "Charcoal", "Lava Bucket", "Blaze Rod"],
        answer: 2,
        a: 1.8,
        b: 0.2,
        subtest: "Soal-soal Minecraft"
      }
    ];
    localStorage.setItem('PPDB_EXAM_QUESTIONS', JSON.stringify(defaultQuestions));
  }

  // ==========================================
  // 2. SPA ROUTING & TABS
  // ==========================================

  const sections = {
    '#home': document.getElementById('home-section'),
    '#daftar': document.getElementById('daftar-section'),
    '#cek-status': document.getElementById('cek-status-section'),
    '#faq': document.getElementById('faq-section')
  };

  const navLinks = document.querySelectorAll('.nav-link');
  const mainNav = document.getElementById('main-nav');
  const menuToggle = document.getElementById('menu-toggle');

  const navigateTo = (hash) => {
    const targetHash = hash || '#home';

    if (targetHash === '#admin') {
      window.location.href = 'admin.html';
      return;
    }

    // Hide all sections, remove active class from links
    Object.values(sections).forEach(section => {
      if (section) section.classList.remove('active');
    });
    navLinks.forEach(link => link.classList.remove('active'));

    // Show active section and highlight link
    if (sections[targetHash]) {
      sections[targetHash].classList.add('active');

      // Match navigation highlight (admin link is styled specially)
      const matchingLink = Array.from(navLinks).find(link => link.getAttribute('href') === targetHash);
      if (matchingLink) matchingLink.classList.add('active');
    }

    // Smooth scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle initializations per page load
    if (targetHash === '#home') {
      updateHomeStats();
    } else if (targetHash === '#admin') {
      checkAdminAuthentication();
    }
  };

  // Handle nav bar click
  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash);
    // Close mobile menu if open
    mainNav.classList.remove('active');
    menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  });

  // Init route
  navigateTo(window.location.hash);

  // ==========================================
  // 1.5. MOCK GOOGLE AUTHENTICATION SYSTEM
  // ==========================================

  function getGoogleUser() {
    const user = localStorage.getItem('PPDB_GOOGLE_USER');
    return user ? JSON.parse(user) : null;
  }

  function saveGoogleUser(user) {
    localStorage.setItem('PPDB_GOOGLE_USER', JSON.stringify(user));
  }

  function clearGoogleUser() {
    localStorage.removeItem('PPDB_GOOGLE_USER');
  }

  function updateGoogleAuthUI() {
    const user = getGoogleUser();

    // Always hide admin nav buttons on the main site (accessible only from the separate admin.html)
    const adminNavBtn = document.querySelectorAll('a[href="admin.html"]');
    adminNavBtn.forEach(btn => {
      const li = btn.closest('li');
      if (li) li.classList.add('hidden');
      else btn.classList.add('hidden');
    });

    const promptCard = document.getElementById('google-login-prompt-card');
    const ppdbForm = document.getElementById('ppdb-form');
    const widget = document.getElementById('google-profile-widget');
    const initialsSpan = document.getElementById('google-profile-initials');
    const dropName = document.getElementById('dropdown-user-name');
    const dropEmail = document.getElementById('dropdown-user-email');
    const bannerEmail = document.getElementById('auth-banner-email');

    const namaInput = document.getElementById('nama-lengkap');
    const emailInput = document.getElementById('email');

    const alreadyCard = document.getElementById('already-registered-card');
    const alreadyDetails = document.getElementById('already-registered-details-box');

    if (user) {
      // Check if email already registered in system
      const applicants = getApplicants();
      const existingApplicant = applicants.find(a => a.email.toLowerCase() === user.email.toLowerCase());

      if (existingApplicant) {
        // Registered already - lock!
        if (promptCard) promptCard.classList.add('hidden');
        if (ppdbForm) ppdbForm.classList.add('hidden');
        if (widget) widget.classList.remove('hidden');

        if (justRegistered) {
          if (alreadyCard) alreadyCard.classList.add('hidden');
          if (successCard) successCard.classList.remove('hidden');
        } else {
          if (successCard) successCard.classList.add('hidden');
          if (alreadyCard) alreadyCard.classList.remove('hidden');
          if (alreadyDetails) {
            const isCbt = existingApplicant.jalur === 'Jalur Seleksi Ujian (CBT)';
            alreadyDetails.innerHTML = `
              <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; margin: 15px 0; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: var(--text-muted); font-size: 12px;">ID Pendaftaran:</span>
                  <strong style="color: var(--text-primary); font-size: 13px;">${existingApplicant.id}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: var(--text-muted); font-size: 12px;">Nama Lengkap:</span>
                  <span style="color: var(--text-primary); font-size: 13px; font-weight: 600;">${existingApplicant.nama}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: var(--text-muted); font-size: 12px;">Jalur Pendaftaran:</span>
                  <span style="color: var(--text-primary); font-size: 13px; font-weight: 600;">${existingApplicant.jalur}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: var(--text-muted); font-size: 12px;">Sekolah Minecraft:</span>
                  <span style="color: var(--text-primary); font-size: 13px; font-weight: 600;">${existingApplicant.sekolahMinecraft || '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: var(--text-muted); font-size: 12px;">Sertifikasi Role:</span>
                  <span style="color: var(--text-primary); font-size: 13px; font-weight: 600;">${existingApplicant.roleMinecraft || '-'}</span>
                </div>
                ${isCbt ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px; margin-top: 8px;">
                  <span style="color: #EA4335; font-size: 12px; font-weight: 700;"><i class="fa-solid fa-laptop-code"></i> Kode Ujian:</span>
                  <strong style="color: #EA4335; font-family: monospace; font-size: 13px;">${existingApplicant.ujianCode || `EXAM-2026-${existingApplicant.id.split('-').pop()}`}</strong>
                </div>
                </div>
                ` : ''}
              </div>
              ${isCbt && (existingApplicant.scoreIRT === null || existingApplicant.scoreIRT === 0) ? `
                <div style="margin-bottom: 15px;">
                  <a href="ujian.html?id=${existingApplicant.id}&code=${existingApplicant.ujianCode || `EXAM-2026-${existingApplicant.id.split('-').pop()}`}" class="btn btn-danger" style="background: #EA4335; border-color: #EA4335; width: 100%; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;"><i class="fa-solid fa-play"></i> Mulai Ujian CBT Online Sekarang</a>
                </div>
              ` : ''}
              ${isCbt && existingApplicant.scoreIRT && existingApplicant.scoreIRT > 0 ? `
                <div style="margin-bottom: 15px;">
                  <button id="btn-print-cbt-cert-already" class="btn btn-success" style="width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;"><i class="fa-solid fa-award"></i> Unduh Sertifikat Skor CBT</button>
                </div>
              ` : ''}
            `;
          }

          // Bind the print card button for already registered
          const btnPrintSlipAlready = document.getElementById('btn-print-slip-already');
          if (btnPrintSlipAlready) {
            // Replace to avoid multiple event handlers stack
            const newBtn = btnPrintSlipAlready.cloneNode(true);
            btnPrintSlipAlready.parentNode.replaceChild(newBtn, btnPrintSlipAlready);
            newBtn.addEventListener('click', () => {
              openPrintSlipModal(existingApplicant.id);
            });
          }

          // Bind the CBT certificate button for already registered
          const btnPrintCbtAlready = document.getElementById('btn-print-cbt-cert-already');
          if (btnPrintCbtAlready) {
            const newCbtBtn = btnPrintCbtAlready.cloneNode(true);
            btnPrintCbtAlready.parentNode.replaceChild(newCbtBtn, btnPrintCbtAlready);
            newCbtBtn.addEventListener('click', () => {
              openPrintCBTModal(existingApplicant.id);
            });
          }
        }

      } else {
        // Normal auth, not yet registered
        if (promptCard) promptCard.classList.add('hidden');
        if (ppdbForm) ppdbForm.classList.remove('hidden');
        if (widget) widget.classList.remove('hidden');
        if (alreadyCard) alreadyCard.classList.add('hidden');
      }

      if (namaInput) namaInput.value = user.name;
      if (emailInput) emailInput.value = user.email;

      if (bannerEmail) bannerEmail.innerText = `${user.name} (${user.email})`;
      if (initialsSpan) initialsSpan.innerText = user.name.charAt(0).toUpperCase();
      if (dropName) dropName.innerText = user.name;
      if (dropEmail) dropEmail.innerText = user.email;
    } else {
      if (promptCard) promptCard.classList.remove('hidden');
      if (ppdbForm) ppdbForm.classList.add('hidden');
      if (widget) widget.classList.add('hidden');
      if (alreadyCard) alreadyCard.classList.add('hidden');

      if (namaInput) namaInput.value = '';
      if (emailInput) emailInput.value = '';
    }
  }

  // Real-time Firebase Authentication state observer
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
  });

  // Real Google Sign-in trigger
  const btnGoogleLogin = document.getElementById('btn-google-login');
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then((result) => {
          showToast(`Berhasil masuk sebagai ${result.user.displayName || 'User'}!`, 'success');
        })
        .catch((error) => {
          console.error("Firebase Auth Error: ", error);
          showToast(`Gagal login Google: ${error.message}`, 'error');
        });
    });
  }

  // Handle toggle dropdown profile info in nav bar
  const profileBadge = document.getElementById('google-profile-badge');
  const profileWidget = document.getElementById('google-profile-widget');
  if (profileBadge && profileWidget) {
    profileBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      profileWidget.classList.toggle('active');
    });
  }

  // Close dropdown on click outside
  document.addEventListener('click', () => {
    if (profileWidget) profileWidget.classList.remove('active');
  });

  // Logouts trigger handlers (Real Firebase Sign Out)
  const logoutAccount = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun Google? Pendaftaran Anda akan terkunci kembali.')) {
      auth.signOut().then(() => {
        resetTrackCards();
        showToast('Berhasil keluar akun Google', 'info');
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

  const btnGoogleSwitch = document.getElementById('btn-google-switch');
  if (btnGoogleSwitch) {
    btnGoogleSwitch.addEventListener('click', logoutAccount);
  }

  // Mobile menu toggle click
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('active');
    menuToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });

  // ==========================================
  // 3. DARK MODE TOGGLER
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
  });

  function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'dark'
      ? '<i class="fa-solid fa-sun text-warning"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }

  // ==========================================
  // 4. TOAST NOTIFICATION ENGINE
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

    // Close toast listener
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // ==========================================
  // 5. HOME STATS ANIMATOR
  // ==========================================

  function updateHomeStats() {
    const applicants = getApplicants();
    const total = applicants.length;
    const accepted = applicants.filter(a => a.status === 'Lolos').length;
    const maxQuota = parseInt(localStorage.getItem('PPDB_QUOTA') || '350', 10);
    const quotaLeft = Math.max(0, maxQuota - accepted);

    animateCounter('stat-total', total);
    animateCounter('stat-accepted', accepted);
    animateCounter('stat-quota', quotaLeft);
    animateCounter('stat-verified', accepted);
  }

  function animateCounter(id, targetValue) {
    const el = document.getElementById(id);
    if (!el) return;

    let start = 0;
    const duration = 1000; // 1s
    const stepTime = Math.abs(Math.floor(duration / targetValue)) || 20;

    if (targetValue === 0) {
      el.innerText = '0';
      return;
    }

    const timer = setInterval(() => {
      start += Math.ceil(targetValue / 30) || 1;
      if (start >= targetValue) {
        el.innerText = targetValue;
        clearInterval(timer);
      } else {
        el.innerText = start;
      }
    }, stepTime);
  }

  // ==========================================
  // 6. IRT (ITEM RESPONSE THEORY) SCORING ENGINE
  // ==========================================  
  const IRT_ITEMS = [
    // High difficulty (highly advanced builder/miner concepts)
    { word: 'mega build', b: 2.2, a: 1.9 },
    { word: 'redstone', b: 2.0, a: 1.8 },
    { word: 'otomatis', b: 1.5, a: 1.6 },
    { word: 'arsitektur', b: 1.6, a: 1.7 },
    { word: 'monumen', b: 1.7, a: 1.8 },
    { word: 'netherite', b: 1.8, a: 1.7 },
    { word: 'mekanisme', b: 1.4, a: 1.5 },
    { word: 'survival world', b: 1.5, a: 1.5 },

    // Medium difficulty (active building, mining, and designs)
    { word: 'builder', b: 0.8, a: 1.4 },
    { word: 'miner', b: 0.7, a: 1.3 },
    { word: 'farm', b: 0.9, a: 1.4 },
    { word: 'desain', b: 0.5, a: 1.2 },
    { word: 'kreatif', b: 0.3, a: 1.1 },
    { word: 'konstruksi', b: 1.0, a: 1.3 },
    { word: 'kolaborasi', b: 0.6, a: 1.2 },
    { word: 'komunitas', b: 0.4, a: 1.1 },

    // Low difficulty (basic play and simple concepts)
    { word: 'membangun', b: -0.8, a: 0.8 },
    { word: 'blok', b: -1.2, a: 0.7 },
    { word: 'dunia', b: -0.5, a: 0.8 },
    { word: 'game', b: -1.0, a: 0.6 }
  ];

  function calculateIRTScore(essayText) {
    const text = essayText.toLowerCase();

    // Determine endorsement pattern (u_i = 1 if keyword present, else 0)
    const responses = IRT_ITEMS.map(item => {
      return text.includes(item.word) ? 1 : 0;
    });

    const totalEndorsed = responses.reduce((sum, val) => sum + val, 0);

    // Handle extreme patterns to avoid likelihood overflow/underflow
    if (totalEndorsed === 0) {
      const lengthBonus = Math.min(10, Math.floor(text.length / 30));
      return 30 + lengthBonus;
    }
    if (totalEndorsed === IRT_ITEMS.length) {
      return 100;
    }

    // Newton-Raphson Maximum Likelihood Solver for latent ability theta
    let theta = 0.0; // Initial guess
    const maxIterations = 12; // Increased iterations for accuracy
    const tolerance = 1e-5;

    for (let iter = 0; iter < maxIterations; iter++) {
      let g = 0; // First derivative of log-likelihood
      let h = 0; // Second derivative of log-likelihood

      for (let i = 0; i < IRT_ITEMS.length; i++) {
        const item = IRT_ITEMS[i];
        const u = responses[i];

        // Probability of endorsement under 2PL model
        const expVal = Math.exp(-item.a * (theta - item.b));
        const p = 1 / (1 + expVal);

        g += item.a * (u - p);
        h -= item.a * item.a * p * (1 - p);
      }

      if (Math.abs(h) < 1e-6) break;

      const delta = g / h;
      const prevTheta = theta;

      theta -= Math.max(-1.0, Math.min(1.0, delta));
      theta = Math.max(-3.5, Math.min(3.5, theta));

      if (Math.abs(theta - prevTheta) < tolerance) {
        break;
      }
    }

    // Map theta [-3.5, 3.5] to score [40, 95] - upgraded range starting at 40
    let score = Math.round(40 + ((theta + 3.5) / 7.0) * 55);

    // Upgrade: Semantic quality & richness check
    // If they have long explanations detailing multiple concepts, reward them
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const uniquenessRatio = new Set(text.split(/\s+/).filter(Boolean)).size / (wordCount || 1);

    let qualityBonus = 0;
    if (wordCount > 100 && uniquenessRatio > 0.4) {
      qualityBonus += 3;
    }
    if (text.includes('redstone') && text.includes('otomatis')) {
      qualityBonus += 2; // technical synergy bonus
    }

    score = Math.min(100, score + qualityBonus);
    return score;
  }

  // IRT Scorer for Stats Minecraft
  function calculateStatsIRTScore(time, mined, placed, diamonds) {
    const items = [
      { check: time > 50, b: -1.5, a: 1.0 },
      { check: time > 200, b: 0.5, a: 1.3 },
      { check: mined > 10000, b: -1.0, a: 1.1 },
      { check: mined > 50000, b: 1.0, a: 1.5 },
      { check: placed > 5000, b: -0.8, a: 1.2 },
      { check: placed > 25000, b: 0.8, a: 1.4 },
      { check: diamonds > 50, b: -0.5, a: 1.0 },
      { check: diamonds > 300, b: 1.5, a: 1.6 }
    ];

    const responses = items.map(item => item.check ? 1 : 0);
    const totalEndorsed = responses.reduce((sum, val) => sum + val, 0);

    if (totalEndorsed === 0) return 30;
    if (totalEndorsed === items.length) return 100;

    let theta = 0.0;
    const maxIterations = 10;
    const tolerance = 1e-4;

    for (let iter = 0; iter < maxIterations; iter++) {
      let g = 0;
      let h = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const u = responses[i];
        const expVal = Math.exp(-item.a * (theta - item.b));
        const p = 1 / (1 + expVal);
        g += item.a * (u - p);
        h -= item.a * item.a * p * (1 - p);
      }

      if (Math.abs(h) < 1e-6) break;
      const delta = g / h;
      const prevTheta = theta;
      theta -= Math.max(-1.0, Math.min(1.0, delta));
      theta = Math.max(-3.5, Math.min(3.5, theta));

      if (Math.abs(theta - prevTheta) < tolerance) break;
    }

    let score = Math.round(30 + ((theta + 3.5) / 7.0) * 70);
    return score;
  }

  // ==========================================
  // 7. FORM REGISTRATION
  // ==========================================

  // ==========================================
  // 7. FORM REGISTRATION & INTERACTIVE TRACK SELECTION
  // ==========================================

  const form = document.getElementById('ppdb-form');
  const successCard = document.getElementById('form-success-card');

  // Track selection card interactive event listeners
  const trackCards = document.querySelectorAll('.track-card');
  const jalurHiddenInput = document.getElementById('jalur-pendaftaran');
  const step2Container = document.getElementById('form-step-2-container');
  const trackError = document.getElementById('track-error-msg');

  trackCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedValue = card.getAttribute('data-value');

      const roleSelect = document.getElementById('role-minecraft');
      if (roleSelect && roleSelect.value === 'PvP Honor' && selectedValue !== 'Jalur Seleksi Ujian (CBT)') {
        showToast('Khusus pemilih role PvP Honor, wajib mengikuti Jalur Seleksi Ujian (CBT)!', 'error');
        return;
      }

      jalurHiddenInput.value = selectedValue;
      trackError.style.display = 'none';

      // Reset card highlights
      trackCards.forEach(c => {
        c.style.borderColor = 'var(--border-color)';
        c.style.background = 'var(--bg-secondary)';
        c.querySelector('.track-check-indicator').style.opacity = '0';
      });

      // Highlight selected card
      card.style.borderColor = 'var(--border-focus)';
      card.style.background = 'var(--bg-tertiary)';
      card.querySelector('.track-check-indicator').style.opacity = '1';

      // Toggle dynamic form fields based on jalur
      const fieldStats = document.getElementById('field-stats-upload');
      const fieldEssay = document.getElementById('field-essay');
      const fieldCbtNote = document.getElementById('field-cbt-note');
      const fieldEssayCbt = document.getElementById('field-essay-cbt');

      // Hide all dynamic fields first
      [fieldStats, fieldEssay, fieldCbtNote, fieldEssayCbt].forEach(f => { if (f) f.style.display = 'none'; });

      if (selectedValue === 'Jalur Stats Minecraft (Bedrock)') {
        if (fieldStats) fieldStats.style.display = 'block';
      } else if (selectedValue === 'Jalur Beasiswa Miner/Builder') {
        if (fieldEssay) fieldEssay.style.display = 'block';
      } else if (selectedValue === 'Jalur Seleksi Ujian (CBT)') {
        if (fieldCbtNote) fieldCbtNote.style.display = 'block';
        if (fieldEssayCbt) fieldEssayCbt.style.display = 'block';
      }

      // Open and slide Step 2 content card
      if (step2Container) {
        step2Container.style.maxHeight = '2000px';
        step2Container.style.opacity = '1';
      }
    });
  });

  const roleSelect = document.getElementById('role-minecraft');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'PvP Honor') {
        const cbtCard = Array.from(trackCards).find(c => c.getAttribute('data-value') === 'Jalur Seleksi Ujian (CBT)');
        if (cbtCard) {
          cbtCard.click();
          showToast('Calon sertifikasi PvP Honor otomatis diarahkan ke Jalur Seleksi Ujian (CBT)!', 'info');
        }
      }
    });
  }

  // File Upload handler for Stats Minecraft track
  const statsUploadInput = document.getElementById('minecraft-stats-upload');
  const uploadDropZone = document.getElementById('upload-drop-zone');
  const uploadPreviewWrapper = document.getElementById('upload-preview-wrapper');
  const uploadPreviewImg = document.getElementById('upload-preview-img');
  const uploadPreviewName = document.getElementById('upload-preview-name');

  if (statsUploadInput) {
    statsUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast('Ukuran file melebihi 5MB. Pilih file yang lebih kecil.', 'error');
          statsUploadInput.value = '';
          return;
        }

        const scanningWrapper = document.getElementById('scanning-wrapper');
        const progressBar = document.getElementById('scanning-progress-bar');
        const logBox = document.getElementById('extracted-stats-log');
        const resultsBox = document.getElementById('stats-extracted-results');
        const uploadPreviewWrapper = document.getElementById('upload-preview-wrapper');
        const uploadPreviewImg = document.getElementById('upload-preview-img');
        const uploadPreviewName = document.getElementById('upload-preview-name');

        if (uploadPreviewWrapper) uploadPreviewWrapper.classList.add('hidden');
        if (resultsBox) resultsBox.classList.add('hidden');
        if (scanningWrapper) scanningWrapper.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '0%';
        if (logBox) logBox.innerHTML = '';

        const logs = [
          { time: 100, text: "[SYSTEM] Memuat modul OCR Vision Minecraft..." },
          { time: 400, text: "[PROCESS] Mengidentifikasi layout GUI Minecraft Bedrock..." },
          { time: 800, text: "[PROCESS] Menemukan blok 'Profil' & 'Statistik Permainan'..." },
          { time: 1200, text: "[OCR] Membaca data 'Time Played'..." },
          { time: 1600, text: "[OCR] Membaca data 'Blocks Mined'..." },
          { time: 1900, text: "[OCR] Membaca data 'Blocks Placed'..." },
          { time: 2200, text: "[OCR] Membaca data 'Diamonds Found'..." },
          { time: 2500, text: "[SYSTEM] Ekstraksi sukses. Menganalisis parameter kemampuan..." }
        ];

        logs.forEach(l => {
          setTimeout(() => {
            const line = document.createElement('div');
            line.textContent = l.text;
            if (logBox) {
              logBox.appendChild(line);
              logBox.scrollTop = logBox.scrollHeight;
            }
          }, l.time);
        });

        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 4;
          if (progressBar) progressBar.style.width = `${Math.min(100, progress)}%`;
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 100);

        setTimeout(() => {
          // Generate Stats (mostly high / above average to reward the player)
          const timeVal = Math.floor(80 + Math.random() * 370); // 80 - 450 hours
          const minedVal = Math.floor(15000 + Math.random() * 105000); // 15k - 120k
          const placedVal = Math.floor(8000 + Math.random() * 82000); // 8k - 90k
          const diamondsVal = Math.floor(40 + Math.random() * 510); // 40 - 550

          document.getElementById('stat-val-time').textContent = `${timeVal}h`;
          document.getElementById('stat-val-mined').textContent = minedVal.toLocaleString();
          document.getElementById('stat-val-placed').textContent = placedVal.toLocaleString();
          document.getElementById('stat-val-diamonds').textContent = diamondsVal.toLocaleString();

          document.getElementById('raw-stat-time').value = timeVal;
          document.getElementById('raw-stat-mined').value = minedVal;
          document.getElementById('raw-stat-placed').value = placedVal;
          document.getElementById('raw-stat-diamonds').value = diamondsVal;

          const irtScore = calculateStatsIRTScore(timeVal, minedVal, placedVal, diamondsVal);

          const statusNote = document.getElementById('stats-irt-status-note');
          if (irtScore >= 75) {
            statusNote.style.color = '#34d399';
            statusNote.innerHTML = `<i class="fa-solid fa-circle-check"></i> Validasi IRT: Performa luar biasa (Skor: ${irtScore}) - Di atas rata-rata!`;
          } else {
            statusNote.style.color = '#f59e0b';
            statusNote.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Validasi IRT: Performa standar (Skor: ${irtScore}) - Rata-rata.`;
          }

          if (scanningWrapper) scanningWrapper.classList.add('hidden');
          if (resultsBox) resultsBox.classList.remove('hidden');

          const reader = new FileReader();
          reader.onload = (ev) => {
            if (uploadPreviewImg) uploadPreviewImg.src = ev.target.result;
            if (uploadPreviewName) uploadPreviewName.textContent = file.name;
            if (uploadPreviewWrapper) uploadPreviewWrapper.classList.remove('hidden');
          };
          reader.readAsDataURL(file);

          showToast('Analisis stats selesai. Performa dievaluasi dengan IRT!', 'success');
        }, 2700);
      }
    });
  }

  function resetTrackCards() {
    jalurHiddenInput.value = '';
    trackCards.forEach(c => {
      c.style.borderColor = 'var(--border-color)';
      c.style.background = 'var(--bg-secondary)';
      c.querySelector('.track-check-indicator').style.opacity = '0';
    });
    if (step2Container) {
      step2Container.style.maxHeight = '0';
      step2Container.style.opacity = '0';
    }
    trackError.style.display = 'none';
    const scanningWrapper = document.getElementById('scanning-wrapper');
    const resultsBox = document.getElementById('stats-extracted-results');
    if (scanningWrapper) scanningWrapper.classList.add('hidden');
    if (resultsBox) resultsBox.classList.add('hidden');
    if (statsUploadInput) statsUploadInput.value = '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validasi data
    const namaInput = document.getElementById('nama-lengkap');
    const emailInput = document.getElementById('email');
    const jalurInput = document.getElementById('jalur-pendaftaran');
    const dobInput = document.getElementById('tanggal-lahir');
    const agree = document.getElementById('pernyataan-setuju');

    let isValid = true;

    // Clear errors
    namaInput.closest('.form-group').classList.remove('has-error');
    emailInput.closest('.form-group').classList.remove('has-error');
    dobInput.closest('.form-group').classList.remove('has-error');
    agree.closest('.agreement-box').classList.remove('has-error');
    trackError.style.display = 'none';
    const essayInput = document.getElementById('essay-diterima'); // Beasiswa track
    const essayCbtInput = document.getElementById('essay-diterima-cbt'); // CBT optional
    const sekolahInput = document.getElementById('sekolah-minecraft');
    const roleInput = document.getElementById('role-minecraft');
    if (essayInput) essayInput.closest('.form-group').classList.remove('has-error');
    if (sekolahInput) sekolahInput.closest('.form-group').classList.remove('has-error');
    if (roleInput) roleInput.closest('.form-group').classList.remove('has-error');

    if (namaInput.value.trim().length < 3) {
      namaInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
      emailInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (!jalurInput.value) {
      trackError.style.display = 'block';
      isValid = false;
    }

    if (!dobInput.value) {
      dobInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (sekolahInput && !sekolahInput.value) {
      sekolahInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (roleInput && !roleInput.value) {
      roleInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    // Jalur-specific validations
    if (jalurInput.value === 'Jalur Stats Minecraft (Bedrock)') {
      const statsFileInput = document.getElementById('minecraft-stats-upload');
      if (!statsFileInput || !statsFileInput.files || statsFileInput.files.length === 0) {
        const errEl = document.getElementById('stats-upload-error');
        if (errEl) errEl.closest('.form-group').classList.add('has-error');
        isValid = false;
      }
    } else if (jalurInput.value === 'Jalur Beasiswa Miner/Builder') {
      if (!essayInput || essayInput.value.trim().length < 30) {
        if (essayInput) essayInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      }
    }
    // CBT track: optional essay, no mandatory file

    if (!agree.checked) {
      agree.closest('.agreement-box').classList.add('has-error');
      isValid = false;
    }

    if (!isValid) {
      showToast('Mohon lengkapi data dengan benar dan setujui pernyataan.', 'error');
      return;
    }

    // Save Applicant Object
    const applicants = getApplicants();

    // Gen unique application ID (seq - year - randomCode)
    const count = applicants.length + 1;
    const seq = String(count).padStart(3, '0');
    const year = new Date().getFullYear();
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomCode = '';
    for (let i = 0; i < 4; i++) {
      randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const newId = `${seq}-${year}-${randomCode}`;

    const formattedToday = new Date().toISOString().split('T')[0];

    // Calculate IRT score depending on jalur
    let score = 0;
    let statsObj = null;
    let essayScoreVal = 0;

    if (jalurInput.value === 'Jalur Beasiswa Miner/Builder') {
      score = calculateIRTScore(essayInput ? essayInput.value : '');
    } else if (jalurInput.value === 'Jalur Stats Minecraft (Bedrock)') {
      const timeVal = parseInt(document.getElementById('raw-stat-time').value, 10) || 0;
      const minedVal = parseInt(document.getElementById('raw-stat-mined').value, 10) || 0;
      const placedVal = parseInt(document.getElementById('raw-stat-placed').value, 10) || 0;
      const diamondsVal = parseInt(document.getElementById('raw-stat-diamonds').value, 10) || 0;
      score = calculateStatsIRTScore(timeVal, minedVal, placedVal, diamondsVal);
      statsObj = { time: timeVal, mined: minedVal, placed: placedVal, diamonds: diamondsVal };
    }
    // CBT: score will be assigned after exam

    const isCbtTrack = (jalurInput.value === 'Jalur Seleksi Ujian (CBT)');
    if (isCbtTrack) {
      const essayCbtVal = essayCbtInput ? essayCbtInput.value.trim() : '';
      if (essayCbtVal.length >= 30) {
        // CBT Essay is a supporting bonus score, scaled to a maximum of 10.0 points
        essayScoreVal = Math.round((calculateIRTScore(essayCbtVal) / 10) * 10) / 10;
      }
    }

    let examCode = '';
    if (isCbtTrack) {
      examCode = `EXAM-${year}-${randomCode}`;
    }

    const essayVal = jalurInput.value === 'Jalur Beasiswa Miner/Builder'
      ? (document.getElementById('essay-diterima') ? document.getElementById('essay-diterima').value.trim() : '')
      : (essayCbtInput ? essayCbtInput.value.trim() : '');
    const newApplicant = {
      id: newId,
      nama: namaInput.value.trim(),
      email: emailInput.value.trim(),
      jalur: jalurInput.value,
      tanggalLahir: dobInput.value,
      sekolahMinecraft: sekolahInput ? sekolahInput.value : '',
      roleMinecraft: roleInput ? roleInput.value : '',
      essay: essayVal,
      scoreIRT: isCbtTrack ? null : score,
      essayScoreIRT: essayScoreVal,
      ujianCode: isCbtTrack ? examCode : '',
      status: 'Dalam Proses', // Default starting status
      tanggalSubmit: formattedToday,
      stats: statsObj
    };

    // Save to Local Storage immediately as local copy
    const localList = getApplicants();
    const existingIndex = localList.findIndex(a => a.id === newApplicant.id);
    if (existingIndex !== -1) {
      localList[existingIndex] = newApplicant;
    } else {
      localList.push(newApplicant);
    }
    saveApplicants(localList);

    // Save to Prisma Postgres via backend API
    fetch(`${API_BASE}/api/applicants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newApplicant)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save to database');
        return res.json();
      })
      .then(() => {
        fetchApplicantsFromServer(); // Refresh local list
      })
      .catch(err => {
        console.error("Gagal menyimpan data ke server Prisma: ", err);
      });

    // Populate Success UI receipt card
    document.getElementById('receipt-id').innerText = newApplicant.id;
    document.getElementById('receipt-nama').innerText = newApplicant.nama;
    document.getElementById('receipt-email').innerText = newApplicant.email;

    // Toggle Exam Card blocks
    const receiptExamRow = document.getElementById('receipt-exam-row');
    const startExamBtn = document.getElementById('btn-start-exam-success');
    if (isCbtTrack) {
      if (receiptExamRow) {
        receiptExamRow.classList.remove('hidden');
        document.getElementById('receipt-exam-code').innerText = examCode;
      }
      if (startExamBtn) {
        startExamBtn.classList.remove('hidden');
        startExamBtn.href = `ujian.html?id=${newApplicant.id}&code=${examCode}`;
      }
      // Save recent CBT credentials for automatic pre-fill fallback
      localStorage.setItem('PPDB_RECENT_ID', newApplicant.id);
      localStorage.setItem('PPDB_RECENT_CODE', examCode);
    } else {
      if (receiptExamRow) receiptExamRow.classList.add('hidden');
      if (startExamBtn) startExamBtn.classList.add('hidden');
    }

    // Formatted Date
    const today = new Date();
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    document.getElementById('receipt-tanggal').innerText = `${today.getDate()} ${monthsShort[today.getMonth()]} ${today.getFullYear()}`;

    // Generate barcode visual values
    document.getElementById('barcode-id-text').innerText = newApplicant.id;

    // Slide screens to success card
    justRegistered = true;
    form.classList.add('hidden');
    successCard.classList.remove('hidden');

    showToast('Pendaftaran SNM 2026 berhasil dikirim! Selamat bergabung!', 'success');
  });

  // Action Button: "Cetak Kartu Pendaftaran"
  document.getElementById('btn-print-slip').addEventListener('click', () => {
    const id = document.getElementById('receipt-id').innerText;
    openPrintSlipModal(id);
  });

  // ==========================================
  // 8. CHECK STATUS KELULUSAN (TRACKER)
  // ==========================================

  const searchForm = document.getElementById('status-search-form');
  const resultBox = document.getElementById('status-result-container');
  const notFoundBox = document.getElementById('status-notfound-container');

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const searchId = document.getElementById('search-id').value.trim().toUpperCase();
    const searchDob = document.getElementById('search-dob').value;

    const applicants = getApplicants();
    const student = applicants.find(a => a.id.toUpperCase() === searchId && a.tanggalLahir === searchDob);

    if (student) {
      notFoundBox.classList.add('hidden');
      resultBox.classList.remove('hidden');
      populateStatusResult(student);
      showToast('Data pendaftaran ditemukan.', 'success');
    } else {
      resultBox.classList.add('hidden');
      notFoundBox.classList.remove('hidden');
      showToast('Data tidak cocok / tidak ditemukan.', 'error');
    }
  });

  function populateStatusResult(student) {
    // Save recent CBT credentials for automatic pre-fill fallback if student is on CBT track
    if (student.jalur === 'Jalur Seleksi Ujian (CBT)') {
      localStorage.setItem('PPDB_RECENT_ID', student.id);
      localStorage.setItem('PPDB_RECENT_CODE', student.ujianCode || `EXAM-2026-${student.id.split('-').pop()}`);
    }

    // Basic labels
    document.getElementById('res-nama-siswa').innerText = student.nama;
    document.getElementById('res-id-siswa').innerText = student.id;
    document.getElementById('res-dob-siswa').innerText = `Tgl Lahir: ${formatDateIndo(student.tanggalLahir)}`;
 
    const qrSection = document.querySelector('.status-qr-section');
 
    // Update Status Badge Class & Text
    const badge = document.getElementById('res-status-badge');
    badge.className = 'status-badge'; // clear old

    // Tracker elements
    const lineFill = document.getElementById('tracker-line-fill');
    const step1 = document.getElementById('tracker-step-1');
    const step2 = document.getElementById('tracker-step-2');
    const step3 = document.getElementById('tracker-step-3');
    const step4 = document.getElementById('tracker-step-4');

    // Reset steps classes
    const allSteps = [step1, step2, step3, step4];
    allSteps.forEach(s => s.className = 'tracker-step');

    // Date Submissions
    document.getElementById('tracker-date-1').innerText = formatDateIndo(student.tanggalSubmit);

    // Dynamic track status logic
    const infoBox = document.getElementById('status-info-box');
    const infoTitle = document.getElementById('status-box-title');
    const infoDesc = document.getElementById('status-box-desc');
    const infoAction = document.getElementById('status-box-action');

    infoBox.className = 'info-box'; // reset colors
    infoAction.innerHTML = ''; // clear SK download button

    // Check if CBT track and haven't taken the exam
    if (student.jalur === 'Jalur Seleksi Ujian (CBT)' && (student.scoreIRT === null || student.scoreIRT === 0)) {
      qrSection.style.display = 'none';
      badge.className = 'status-badge status-pending';
      badge.innerText = 'Belum Ujian';

      lineFill.style.width = '25%';
      step1.classList.add('completed');
      step2.className = 'tracker-step active';
      step3.className = 'tracker-step';
      step4.className = 'tracker-step';

      infoBox.className = 'info-box status-info-pending';
      infoTitle.innerText = 'Ujian Seleksi Belum Ditempuh';
      infoDesc.innerText = `Halo ${student.nama}, Anda terdaftar pada Jalur Seleksi Ujian (CBT). Anda wajib menyelesaikan ujian online terlebih dahulu menggunakan Kode Ujian Anda sebelum hasil seleksi divalidasi.`;

      infoAction.innerHTML = `
        <a href="ujian.html?id=${student.id}&code=${student.ujianCode || ''}" class="btn btn-danger" style="background: #EA4335; border-color: #EA4335; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;"><i class="fa-solid fa-play"></i> Mulai Ujian CBT</a>
      `;
      return;
    }

    if (student.status === 'Lolos') {
      // Show QR verification only when lolos
      qrSection.style.display = 'block';
      const qrContent = `Status Pendaftaran: ${student.status} | ID: ${student.id} | Nama: ${student.nama} | Jalur: ${student.jalur || 'Prestasi'}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}`;
      document.getElementById('res-qr-code').src = qrUrl;
      document.getElementById('res-qr-text').innerText = `VERIFIED: ${student.id} (${student.status.toUpperCase()})`;

      lineFill.style.width = '100%';
      step1.classList.add('completed');
      step2.classList.add('completed');
      step3.classList.add('completed');
      step4.classList.add('completed');

      document.getElementById('tracker-date-2').innerText = 'Terverifikasi';
      document.getElementById('tracker-date-3').innerText = 'Lolos';
      document.getElementById('tracker-date-4').innerText = 'Diterima';

      badge.classList.add('status-accepted');
      badge.innerText = 'Lolos';

      infoBox.classList.add('status-info-accepted');
      infoTitle.innerText = 'Selamat! Anda Dinyatakan Lolos!';
      const sekolahVal = student.sekolahMinecraft || '';
      const showSekolah = sekolahVal.trim() && sekolahVal.toUpperCase() !== 'TIDAK MEMILIH';
      const sekolahLine = showSekolah ? `<strong>Sekolah :</strong> ${sekolahVal.toUpperCase()}<br>` : '';

      infoDesc.innerHTML = `
        Selamat! Anda Dinyatakan Lulus Seleksi pada <strong>${student.jalur || 'Prestasi'}</strong>.<br><br>
        Selamat! Anda Dinyatakan Lolos seleksi di :<br>
        <div style="margin: 8px 0; padding-left: 15px; border-left: 3px solid #10b981; line-height: 1.8;">
          ${sekolahLine}
          <strong>Role :</strong> ${(student.roleMinecraft || '-').toUpperCase()}
        </div><br>
        Silakan cetak Surat Keputusan Kelulusan resmi di samping untuk digunakan sebagai berkas daftar ulang.
      `;

      // Render SK print button and CBT certificate button if they have a CBT score
      const hasCbtScore = student.jalur === 'Jalur Seleksi Ujian (CBT)' && student.scoreIRT !== null && student.scoreIRT > 0;
      let buttonsHtml = `<button id="btn-print-sk" class="btn btn-primary" style="margin-right: 8px;"><i class="fa-solid fa-file-pdf"></i> Cetak SK Kelulusan</button>`;
      if (hasCbtScore) {
        buttonsHtml += `<button id="btn-print-cbt-status" class="btn btn-success"><i class="fa-solid fa-award"></i> Unduh Sertifikat Skor CBT</button>`;
      }
      infoAction.innerHTML = buttonsHtml;

      document.getElementById('btn-print-sk').addEventListener('click', () => {
        openPrintSKModal(student.id);
      });
      if (hasCbtScore) {
        document.getElementById('btn-print-cbt-status').addEventListener('click', () => {
          openPrintCBTModal(student.id);
        });
      }
    }
    else if (student.status === 'Dalam Proses') {
      // Hide QR verification barcode when still pending review
      qrSection.style.display = 'none';

      // Setup tracker flow steps for active selection phase (50% progress)
      lineFill.style.width = '50%';
      step1.classList.add('completed');
      step2.className = 'tracker-step active';
      step3.className = 'tracker-step';
      step4.className = 'tracker-step';

      document.getElementById('tracker-date-2').innerText = 'Ditinjau';
      document.getElementById('tracker-date-3').innerText = 'Menunggu';
      document.getElementById('tracker-date-4').innerText = 'Menunggu';

      badge.className = 'status-badge status-pending';
      badge.innerText = 'Dalam Proses';

      infoBox.classList.add('status-info-pending');
      infoTitle.innerText = 'Berkas Sedang Ditinjau';
      infoDesc.innerText = `Halo ${student.nama}, pendaftaran Anda telah berhasil diserahkan. Saat ini tim administrasi kami sedang memproses dan memverifikasi berkas Anda. Hasil seleksi akan diperbarui setelah periode pendaftaran selesai. Pantau terus halaman ini.`;
    }
    else {
      // Hide QR verification barcode when not lolos
      qrSection.style.display = 'none';

      lineFill.style.width = '100%';
      step1.classList.add('completed');
      step2.classList.add('completed');
      step3.classList.add('completed');
      step4.classList.add('rejected-step');

      // Replace final icon with times
      step4.querySelector('.step-circle').innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';

      document.getElementById('tracker-date-2').innerText = 'Terverifikasi';
      document.getElementById('tracker-date-3').innerText = 'Tidak Lolos';
      document.getElementById('tracker-date-4').innerText = 'Ditolak';

      badge.classList.add('status-rejected');
      badge.innerText = 'Tidak Diterima';

      infoBox.classList.add('status-info-rejected');
      infoTitle.innerText = 'Mohon Maaf, Anda Belum Lolos';
      infoDesc.innerText = `Halo ${student.nama}, kami menghargai minat dan antusiasme Anda. Berdasarkan hasil seleksi persaingan nilai akademik dan kuota bangku yang terbatas, Anda dinyatakan Belum Lolos seleksi saat ini.`;

      // Render CBT certificate button on reject view if they completed the exam
      const hasCbtScore = student.jalur === 'Jalur Seleksi Ujian (CBT)' && student.scoreIRT !== null && student.scoreIRT > 0;
      if (hasCbtScore) {
        infoAction.innerHTML = `
          <button id="btn-print-cbt-status" class="btn btn-success"><i class="fa-solid fa-award"></i> Unduh Sertifikat Skor CBT</button>
        `;
        document.getElementById('btn-print-cbt-status').addEventListener('click', () => {
          openPrintCBTModal(student.id);
        });
      }
    }
  }

  function formatDateIndo(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // ==========================================
  // 11. FAQ INTERACTIVE & ACCORDION SEARCH
  // ==========================================

  const faqItems = document.querySelectorAll('.faq-item');
  const faqSearchInput = document.getElementById('faq-search-input');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach(otherItem => otherItem.classList.remove('active'));

      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Search input live filtering FAQ
  faqSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    faqItems.forEach(item => {
      const qText = item.querySelector('.faq-question h4').innerText.toLowerCase();
      const aText = item.querySelector('.faq-answer p').innerText.toLowerCase();

      if (qText.includes(query) || aText.includes(query)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
        item.classList.remove('active'); // Close filtered out
      }
    });
  });

  // ==========================================
  // 12. ADMIN SIMULATOR DASHBOARD PANEL (MIGRATED TO admin.js)
  // ==========================================

  // ==========================================
  // 13. MODALS LOGICS (PRINT & DIALOGS)
  // ==========================================

  // Close modals listeners
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      document.getElementById(modalId).classList.remove('active');
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

  function openPrintSlipModal(applicantId) {
    const list = getApplicants();
    const student = list.find(a => a.id === applicantId);
    if (!student) return;

    // Fill Modal Data labels
    document.getElementById('print-p-id').innerText = student.id;
    document.getElementById('print-p-nama').innerText = student.nama;
    document.getElementById('print-p-dob').innerText = formatDateLong(student.tanggalLahir);
    document.getElementById('print-p-jalur').innerText = student.jalur || 'Prestasi';
    document.getElementById('print-p-email').innerText = student.email;
    document.getElementById('print-p-tanggal').innerText = formatDateLong(student.tanggalSubmit);
    document.getElementById('print-signature-date').innerText = formatDateLong(student.tanggalSubmit);

    // Set Sekolah and Role
    const sekolahEl = document.getElementById('print-p-sekolah');
    const roleEl = document.getElementById('print-p-role');
    if (sekolahEl) sekolahEl.innerText = student.sekolahMinecraft || '-';
    if (roleEl) roleEl.innerText = student.roleMinecraft || '-';

    // Trigger open
    document.getElementById('print-slip-modal').classList.add('active');
  }

  function openPrintSKModal(applicantId) {
    const list = getApplicants();
    const student = list.find(a => a.id === applicantId);
    if (!student) return;

    // Fill Letter labels
    document.getElementById('letter-p-id').innerText = student.id;
    document.getElementById('letter-p-nama').innerText = student.nama.toUpperCase();
    document.getElementById('letter-p-jalur').innerText = (student.jalur || 'Prestasi').toUpperCase();
    document.getElementById('letter-p-email').innerText = student.email;

    // Set Sekolah and Role
    const sekolahEl = document.getElementById('letter-p-sekolah');
    const roleEl = document.getElementById('letter-p-role');
    if (sekolahEl) sekolahEl.innerText = (student.sekolahMinecraft || '-').toUpperCase();
    if (roleEl) roleEl.innerText = (student.roleMinecraft || '-').toUpperCase();

    // Populate statement text
    const statementSekolah = document.getElementById('letter-statement-sekolah');
    const statementRole = document.getElementById('letter-statement-role');
    if (statementSekolah) statementSekolah.innerText = student.sekolahMinecraft || '-';
    if (statementRole) statementRole.innerText = student.roleMinecraft || '-';

    // Trigger open
    document.getElementById('print-sk-modal').classList.add('active');
  }

  function openPrintCBTModal(applicantId) {
    const list = getApplicants();
    const student = list.find(a => a.id === applicantId);
    if (!student) return;

    // Fill certificate data
    document.getElementById('cbt-cert-id').innerText = student.id;
    document.getElementById('cbt-cert-nama').innerText = student.nama.toUpperCase();
    document.getElementById('cbt-cert-email').innerText = student.email;
    document.getElementById('cbt-cert-jalur').innerText = (student.jalur || '-').toUpperCase();
    document.getElementById('cbt-cert-code').innerText = student.ujianCode || `EXAM-2026-${student.id.split('-').pop()}`;
    document.getElementById('cbt-cert-score').innerText = student.scoreIRT || '0';

    // Set Sekolah and Role
    const sekolahEl = document.getElementById('cbt-cert-sekolah');
    const roleEl = document.getElementById('cbt-cert-role');
    if (sekolahEl) sekolahEl.innerText = (student.sekolahMinecraft || '-').toUpperCase();
    if (roleEl) roleEl.innerText = (student.roleMinecraft || '-').toUpperCase();

    // Set date
    const dateEl = document.getElementById('cbt-cert-date');
    if (dateEl) {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const now = new Date();
      dateEl.innerText = `Jakarta, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Trigger open
    document.getElementById('print-cbt-modal').classList.add('active');
  }

  // Print button triggers standard system printing API dialog
  document.getElementById('btn-do-print-slip').addEventListener('click', () => {
    window.print();
  });
  document.getElementById('btn-do-print-sk').addEventListener('click', () => {
    window.print();
  });
  document.getElementById('btn-do-print-cbt').addEventListener('click', () => {
    window.print();
  });

  // PDF download triggers using html2pdf.js helper function to prevent cutoffs
  function downloadPdfFromElement(elementId, filename, orientation = 'portrait') {
    const original = document.getElementById(elementId);
    if (!original) return;

    // Save scroll position and reset to 0 to prevent html2canvas offset rendering bugs
    const scrollPos = window.scrollY;
    window.scrollTo(0, 0);

    // Save original parent, sibling, and styles
    const parent = original.parentNode;
    const nextSibling = original.nextSibling;
    const originalStyle = original.getAttribute('style') || '';

    // Width based on landscape or portrait
    const widthPx = orientation === 'landscape' ? 1040 : 790;

    // Temporarily format element layout for print rendering
    original.style.position = 'absolute';
    original.style.left = '0';
    original.style.top = '0';
    original.style.width = widthPx + 'px';
    original.style.height = 'auto';
    original.style.maxHeight = 'none';
    original.style.overflow = 'visible';
    original.style.background = '#ffffff';
    original.style.color = '#000000';
    original.style.zIndex = '99999';

    // Append to document.body to escape any limited/clipped parent modals
    document.body.appendChild(original);

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        scrollY: 0,
        scrollX: 0,
        windowWidth: widthPx
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: orientation }
    };

    // Render directly from the body-level element
    html2pdf().set(opt).from(original).save().then(() => {
      // Restore styles and position in DOM
      original.setAttribute('style', originalStyle);
      if (nextSibling) {
        parent.insertBefore(original, nextSibling);
      } else {
        parent.appendChild(original);
      }
      window.scrollTo(0, scrollPos);
    }).catch(err => {
      console.error('Error generating PDF:', err);
      original.setAttribute('style', originalStyle);
      if (nextSibling) {
        parent.insertBefore(original, nextSibling);
      } else {
        parent.appendChild(original);
      }
      window.scrollTo(0, scrollPos);
    });
  }

  document.getElementById('btn-download-slip-pdf').addEventListener('click', () => {
    const id = document.getElementById('print-p-id').innerText || 'slip';
    downloadPdfFromElement('print-slip-area', `Kartu_Peserta_${id}.pdf`, 'portrait');
  });

  document.getElementById('btn-download-cbt-pdf').addEventListener('click', () => {
    const id = document.getElementById('cbt-cert-id').innerText || 'cbt';
    downloadPdfFromElement('print-cbt-area', `Sertifikat_Skor_CBT_${id}.pdf`, 'landscape');
  });

  document.getElementById('btn-download-sk-pdf').addEventListener('click', () => {
    const id = document.getElementById('letter-p-id').innerText || 'sk';
    downloadPdfFromElement('print-sk-area', `Sertifikat_Kelulusan_${id}.pdf`, 'portrait');
  });

  function formatDateLong(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Admin panel link navigates directly to admin.html

  // CBT Admin Question Table (Migrated to admin.js)

  // Auto-search logic from redirect query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchIdParam = urlParams.get('searchId');
  const searchDobParam = urlParams.get('searchDob');
  if (searchIdParam && searchDobParam) {
    // Fill search input fields
    const searchIdInput = document.getElementById('search-id');
    const searchDobInput = document.getElementById('search-dob');
    if (searchIdInput && searchDobInput) {
      searchIdInput.value = searchIdParam;
      searchDobInput.value = searchDobParam;
      // Navigate to search screen
      setTimeout(() => {
        navigateTo('#cek-status');
        const searchForm = document.getElementById('status-search-form');
        if (searchForm) {
          searchForm.dispatchEvent(new Event('submit'));
        }
      }, 300);
    }
  }

  // ==========================================
  // 14. ADMIN PANEL SUB-TABS INTERACTIVITY
  // ==========================================
  // Sub-tabs interactivity (Migrated to admin.js)

  // ==========================================
  // 15. COUNTDOWN & REGISTRATION FIRESTORE SYNC
  // ==========================================
  let countdownInterval = null;

  function updateSystemCountdownUI(active, targetDateStr) {
    const banner = document.getElementById('status-countdown-banner');
    const searchCard = document.querySelector('.status-search-card');
    const resContainer = document.getElementById('status-result-container');
    const notfoundContainer = document.getElementById('status-notfound-container');

    if (active && targetDateStr) {
      banner.classList.remove('hidden');

      if (countdownInterval) clearInterval(countdownInterval);

      const targetTime = new Date(targetDateStr).getTime();

      const updateTimer = () => {
        const now = Date.now();
        const diff = targetTime - now;

        if (diff <= 0) {
          clearInterval(countdownInterval);
          document.getElementById('countdown-days').innerText = "00";
          document.getElementById('countdown-hours').innerText = "00";
          document.getElementById('countdown-minutes').innerText = "00";
          document.getElementById('countdown-seconds').innerText = "00";

          // Countdown reached 0: show the search form
          if (searchCard) searchCard.classList.remove('hidden');
          return;
        }

        // Countdown is active and running: hide the search form and results
        if (searchCard) searchCard.classList.add('hidden');
        if (resContainer) resContainer.classList.add('hidden');
        if (notfoundContainer) notfoundContainer.classList.add('hidden');

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdown-days').innerText = String(days).padStart(2, '0');
        document.getElementById('countdown-hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('countdown-minutes').innerText = String(minutes).padStart(2, '0');
        document.getElementById('countdown-seconds').innerText = String(seconds).padStart(2, '0');
      };

      updateTimer();
      countdownInterval = setInterval(updateTimer, 1000);
    } else {
      banner.classList.add('hidden');
      if (countdownInterval) clearInterval(countdownInterval);

      // Countdown is inactive: show the search form
      if (searchCard) searchCard.classList.remove('hidden');
    }
  }

  function updateSystemRegistrationUI(active) {
    const closedCard = document.getElementById('registration-closed-card');
    const promptCard = document.getElementById('google-login-prompt-card');
    const ppdbForm = document.getElementById('ppdb-form');
    const alreadyCard = document.getElementById('already-registered-card');

    if (!active) {
      if (closedCard) closedCard.classList.remove('hidden');
      if (promptCard) promptCard.classList.add('hidden');
      if (ppdbForm) ppdbForm.classList.add('hidden');
      if (alreadyCard) alreadyCard.classList.add('hidden');
    } else {
      if (closedCard) closedCard.classList.add('hidden');
      // Re-trigger auth UI sync to show correct view based on login state
      updateGoogleAuthUI();
    }
  }

  // syncAdminConfigInputs (Migrated to admin.js)

  // Helper functions to manage system configuration locally
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

  // Sync system config from Prisma backend server
  const syncSystemConfigFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settings/system_config`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          saveSystemConfig(data);
          updateSystemCountdownUI(data.countdownActive, data.countdownTarget);
          updateSystemRegistrationUI(data.registrationActive);
        } else {
          // Seed default configurations
          const defaultConfig = getSystemConfig();
          await saveSystemConfigToServer(defaultConfig);
        }
      }
    } catch (error) {
      console.error("Gagal melakukan sync sistem config, falling back to local storage: ", error);
      const data = getSystemConfig();
      updateSystemCountdownUI(data.countdownActive, data.countdownTarget);
      updateSystemRegistrationUI(data.registrationActive);
    }
  };

  const saveSystemConfigToServer = async (config) => {
    try {
      const response = await fetch(`${API_BASE}/api/settings/system_config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: config })
      });
      if (response.ok) {
        const data = await response.json();
        saveSystemConfig(data);
        return data;
      }
    } catch (error) {
      console.error("Gagal menyimpan config ke server Prisma: ", error);
    }
  };

  // Sync Minecraft Schools and Roles select options from Prisma database
  const syncMinecraftSelectOptions = async () => {
    try {
      const resSchools = await fetch(`${API_BASE}/api/settings/minecraft_schools`);
      if (resSchools.ok) {
        const schools = await resSchools.json();
        const select = document.getElementById('sekolah-minecraft');
        if (select) {
          const currentVal = select.value;
          select.innerHTML = '<option value="" disabled selected>Pilih Sekolah Minecraft...</option>';
          const list = Array.isArray(schools) ? schools : ['SMP Redstone Indonesia', 'Akademi Builder Nusantara', 'Minecraft High School'];
          list.forEach(school => {
            const opt = document.createElement('option');
            opt.value = school;
            opt.innerText = school;
            select.appendChild(opt);
          });
          if (currentVal && list.includes(currentVal)) {
            select.value = currentVal;
          }
        }
      }

      const resRoles = await fetch(`${API_BASE}/api/settings/minecraft_roles`);
      if (resRoles.ok) {
        const roles = await resRoles.json();
        const select = document.getElementById('role-minecraft');
        if (select) {
          const currentVal = select.value;
          select.innerHTML = '<option value="" disabled selected>Pilih Role...</option>';
          const list = Array.isArray(roles) ? roles : ['Builder', 'Farmer', 'Miner', 'PvP Honor'];
          list.forEach(role => {
            const opt = document.createElement('option');
            opt.value = role;
            opt.innerText = role;
            select.appendChild(opt);
          });
          if (currentVal && list.includes(currentVal)) {
            select.value = currentVal;
          }
        }
      }
    } catch (err) {
      console.error("Gagal memuat opsi sekolah/role Minecraft:", err);
    }
  };

  // Perform initial fetch & set polling interval
  syncSystemConfigFromServer();
  syncMinecraftSelectOptions();
  setInterval(syncSystemConfigFromServer, 4000);
  setInterval(syncMinecraftSelectOptions, 4000);

  // Settings save listeners (Migrated to admin.js)

  // Render home stats initially
  updateHomeStats();

});
