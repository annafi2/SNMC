/**
 * Custom Dialog System for SNM 2026
 * Replaces native alert() and confirm() with premium, centered, and interactive modals.
 * Self-initializing and theme-aware.
 */

(function () {
  // Inject modal styles dynamically
  const injectStyles = () => {
    if (document.getElementById('custom-dialog-styles')) return;

    const style = document.createElement('style');
    style.id = 'custom-dialog-styles';
    style.textContent = `
      .custom-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 10, 10, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .custom-modal-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      
      .custom-modal-box {
        background: var(--bg-secondary, #121212);
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
        border-radius: var(--radius-md, 16px);
        box-shadow: var(--card-shadow-hover, 0 25px 50px -12px rgba(0, 0, 0, 0.5));
        width: 90%;
        max-width: 420px;
        padding: 32px;
        transform: scale(0.9) translateY(15px);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center;
        color: var(--text-main, #ffffff);
        font-family: var(--font-family, 'Plus Jakarta Sans', sans-serif);
      }
      
      .custom-modal-overlay.active .custom-modal-box {
        transform: scale(1) translateY(0);
      }
      
      .custom-modal-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .custom-modal-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        margin-bottom: 4px;
        transition: transform 0.3s ease;
      }
      
      .custom-modal-box:hover .custom-modal-icon {
        transform: scale(1.1) rotate(5deg);
      }
      
      /* Theme accents */
      .custom-modal-icon.info {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.2);
        color: #3b82f6;
      }
      
      .custom-modal-icon.warning {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }
      
      .custom-modal-icon.danger {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      
      .custom-modal-icon.success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: #10b981;
      }
      
      .custom-modal-title {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin: 0;
        font-family: var(--font-family, 'Plus Jakarta Sans', sans-serif);
      }
      
      .custom-modal-message {
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-muted, #a0a0a0);
        margin: 0 0 28px 0;
        white-space: pre-line;
        word-break: break-word;
      }
      
      .custom-modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      .custom-modal-btn {
        flex: 1;
        min-width: 100px;
        height: 42px;
        font-size: 14px;
        font-weight: 700;
        border-radius: var(--radius-sm, 8px);
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: var(--font-family, 'Plus Jakarta Sans', sans-serif);
      }
      
      .custom-modal-btn:hover {
        transform: translateY(-2px);
      }
      
      .custom-modal-btn:active {
        transform: translateY(0);
      }
      
      .custom-modal-btn.btn-cancel {
        background: var(--bg-tertiary, #1c1c1c);
        color: var(--text-main, #ffffff);
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      }
      
      .custom-modal-btn.btn-cancel:hover {
        background: var(--border-color, rgba(255, 255, 255, 0.15));
      }
      
      .custom-modal-btn.btn-ok {
        background: var(--primary-color, #ffffff);
        color: var(--bg-secondary, #121212);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.08);
      }
      
      .custom-modal-btn.btn-ok:hover {
        background: var(--primary-hover, #e5e5e5);
        box-shadow: 0 6px 16px rgba(255, 255, 255, 0.12);
      }

      /* Light Theme overrides when parent or body has light attributes if needed, 
         but using CSS variables handles most of it. We provide clean fallbacks. */
      
      /* Specific danger theme for destructive actions */
      .custom-modal-btn.btn-danger {
        background: #ef4444 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
      }
      .custom-modal-btn.btn-danger:hover {
        background: #dc2626 !important;
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35) !important;
      }
      
      /* Specific success theme */
      .custom-modal-btn.btn-success {
        background: #10b981 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25) !important;
      }
      .custom-modal-btn.btn-success:hover {
        background: #059669 !important;
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35) !important;
      }
      
      .hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  };

  // Helper to get FontAwesome icon class and color class based on type
  const getIconConfig = (type) => {
    switch (type) {
      case 'success':
        return { icon: 'fa-solid fa-circle-check', colorClass: 'success' };
      case 'error':
      case 'danger':
        return { icon: 'fa-solid fa-circle-exclamation', colorClass: 'danger' };
      case 'warning':
        return { icon: 'fa-solid fa-triangle-exclamation', colorClass: 'warning' };
      case 'info':
      default:
        return { icon: 'fa-solid fa-circle-info', colorClass: 'info' };
    }
  };

  // Core modal trigger
  const createModal = (message, title, type, isConfirm = false) => {
    injectStyles();

    return new Promise((resolve) => {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'custom-modal-overlay';
      
      const iconConfig = getIconConfig(type);

      // Determine the button OK color/class
      let btnOkClass = 'btn-ok';
      if (type === 'danger') btnOkClass = 'btn-ok btn-danger';
      else if (type === 'success') btnOkClass = 'btn-ok btn-success';

      overlay.innerHTML = `
        <div class="custom-modal-box">
          <div class="custom-modal-header">
            <div class="custom-modal-icon ${iconConfig.colorClass}">
              <i class="${iconConfig.icon}"></i>
            </div>
            <h3 class="custom-modal-title">${title}</h3>
          </div>
          <div class="custom-modal-content">
            <p class="custom-modal-message">${message}</p>
          </div>
          <div class="custom-modal-actions">
            <button class="custom-modal-btn btn-cancel ${isConfirm ? '' : 'hidden'}">Batal</button>
            <button class="custom-modal-btn ${btnOkClass}">OK</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Trigger scale-in transition
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });

      const btnCancel = overlay.querySelector('.btn-cancel');
      const btnOk = overlay.querySelector('.btn-ok');

      const cleanup = () => {
        overlay.classList.remove('active');
        // Wait for animation to finish before removing from DOM
        setTimeout(() => {
          overlay.remove();
        }, 300);
      };

      btnOk.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      if (isConfirm && btnCancel) {
        btnCancel.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });
      }

      // Close on ESC key
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          document.removeEventListener('keydown', handleEsc);
          resolve(false);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  };

  // Assign to window object
  window.customAlert = function (message, title = 'Pemberitahuan', type = 'info') {
    return createModal(message, title, type, false);
  };

  window.customConfirm = function (message, title = 'Konfirmasi', type = 'warning') {
    return createModal(message, title, type, true);
  };
})();
