/**
 * NADEED — نضيد
 * Shared JavaScript · v5.0
 * Single source of truth for interactive behaviour
 */

/* ─── DYNAMIC YEAR ─── */
document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ─── MOBILE NAV DRAWER ─── */
(function initNav() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  if (!toggle || !drawer) return;

  let open = false;
  const spans = toggle.querySelectorAll('span');

  function openNav() {
    open = true;
    drawer.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
    spans[1].style.opacity  = '0';
    spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
  }

  function closeNav() {
    open = false;
    drawer.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    spans[0].style.transform = '';
    spans[1].style.opacity  = '';
    spans[2].style.transform = '';
  }

  toggle.addEventListener('click', () => open ? closeNav() : openNav());
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) closeNav();
  });
})();

/* ─── ACTIVE NAV LINK ─── */
(function markActiveLink() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-link, .drawer-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const norm = href.replace(/\/$/, '') || '/';
    // Exact match OR: current path starts with this segment (for detail pages)
    // e.g. /articles/riwaya activates /articles link
    const isExact   = norm === path;
    const isParent  = norm !== '/' && path.startsWith(norm + '/');
    if (isExact || isParent) {
      link.classList.add('active');
      link.setAttribute('aria-current', isExact ? 'page' : 'true');
    }
  });
})();

/* ─── SCROLL REVEAL (subtle, no motion if prefers-reduced-motion) ─── */
(function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll('[data-reveal]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity  = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

  targets.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    obs.observe(el);
  });
})();

/* ─── FORM VALIDATION UTILITIES ─── */
window.NADEED = window.NADEED || {};

/**
 * validateField(input) → { valid: bool, message: string }
 * Works for: text, email, number, select, textarea, file, checkbox
 */
NADEED.validateField = function(input) {
  const val = input.value.trim();
  const type = input.type;

  if (input.required && (type === 'checkbox' ? !input.checked : val === '')) {
    return { valid: false, message: 'هذا الحقل مطلوب' };
  }

  if (type === 'email' && val) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!ok) return { valid: false, message: 'البريد الإلكتروني غير صحيح' };
  }

  if (type === 'file' && input.files && input.files.length > 0) {
    const file  = input.files[0];
    const maxMB = Number(input.dataset.maxMb || 20);
    const allowed = (input.dataset.allowed || '').split(',').map(s => s.trim().toLowerCase());

    if (file.size > maxMB * 1024 * 1024) {
      return { valid: false, message: `حجم الملف يتجاوز الحد الأقصى (${maxMB} ميغابايت)` };
    }

    if (allowed.length && allowed[0] !== '') {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowed.includes(ext)) {
        return { valid: false, message: `نوع الملف غير مقبول. المقبول: ${allowed.join('، ')}` };
      }
    }
  }

  if (type === 'number' && val) {
    const n = Number(val);
    const min = Number(input.min || 0);
    if (n < min) return { valid: false, message: `أدخل رقمًا أكبر من ${min}` };
  }

  return { valid: true, message: '' };
};

/**
 * showFieldError(input, message) / clearFieldError(input)
 */
NADEED.showFieldError = function(input, message) {
  input.setAttribute('aria-invalid', 'true');
  const err = input.closest('.form-group')?.querySelector('.form-error');
  if (err) { err.textContent = message; err.classList.add('visible'); }
};

NADEED.clearFieldError = function(input) {
  input.removeAttribute('aria-invalid');
  const err = input.closest('.form-group')?.querySelector('.form-error');
  if (err) { err.textContent = ''; err.classList.remove('visible'); }
};

/**
 * validateForm(form) → bool
 * Validates all required fields, shows inline errors, focuses first error
 */
NADEED.validateForm = function(form) {
  let firstError = null;
  let allValid   = true;

  form.querySelectorAll('[required], [data-validate]').forEach(input => {
    NADEED.clearFieldError(input);
    const { valid, message } = NADEED.validateField(input);
    if (!valid) {
      NADEED.showFieldError(input, message);
      if (!firstError) firstError = input;
      allValid = false;
    }
  });

  if (firstError) firstError.focus();
  return allValid;
};

/**
 * showFormStatus(form, type, message)
 * type: 'error' | 'warning'
 */
NADEED.showFormStatus = function(form, type, message) {
  const el = form.querySelector('.form-status');
  if (!el) return;
  el.className = `form-status ${type} visible`;
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.focus?.();
};

NADEED.hideFormStatus = function(form) {
  const el = form.querySelector('.form-status');
  if (el) { el.className = 'form-status'; el.textContent = ''; }
};

/* ─── REAL-TIME FIELD VALIDATION ─── */
document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
  input.addEventListener('blur', () => {
    if (!input.required && input.value.trim() === '') return;
    const { valid, message } = NADEED.validateField(input);
    if (!valid) NADEED.showFieldError(input, message);
    else        NADEED.clearFieldError(input);
  });

  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') {
      const { valid } = NADEED.validateField(input);
      if (valid) NADEED.clearFieldError(input);
    }
  });
});

/* ─── FILE INPUT LABEL UPDATE ─── */
document.querySelectorAll('.form-file-input').forEach(input => {
  input.addEventListener('change', function() {
    const label = document.querySelector(`label[for="${this.id}"] span`);
    if (!label) return;

    if (this.files && this.files.length > 0) {
      const file  = this.files[0];
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      const { valid, message } = NADEED.validateField(this);
      if (!valid) {
        NADEED.showFieldError(this, message);
        label.textContent = 'الملف غير صالح — اختر ملفًا آخر';
      } else {
        NADEED.clearFieldError(this);
        label.textContent = `✓ ${file.name} · ${sizeMB} MB`;
      }
    } else {
      label.textContent = 'انقر لرفع الملف';
    }
  });
});
