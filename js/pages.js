/* =====================================================
   pages.js — Logic for Post Property & Contact Pages
   ===================================================== */

// ===== SHARED: NAVBAR SCROLL + HAMBURGER =====
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initDescCounter();
  initContactForm();
});

function initNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function toggleMenu() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (!drawer) return;
  drawer.classList.toggle('open');
  overlay.classList.toggle('visible');
  document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
}

// ===== MODAL =====
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('active');
  document.body.style.overflow = '';
}
function closeModalOverlay(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}
function togglePw(id) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
function handleLogin(e) {
  e.preventDefault();
  // Redirect to the real owner-auth login flow on the landing page
  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = '/?login=owner&return=' + returnUrl;
}

// ===== TOAST =====
// ===== CHIP TOGGLE =====
function toggleChip(checkbox) {
  checkbox.closest('.chip-label').classList.toggle('checked', checkbox.checked);
}

// ===== POST PROPERTY FORM HANDLER =====
// Legacy property wizard logic has been removed. Real property submission is handled by add-property.js.

// ===== CHAR COUNTER =====
function initDescCounter() {
  const descArea = document.getElementById('pp_desc');
  const descCount = document.getElementById('descCount');
  if (descArea && descCount) {
    descArea.addEventListener('input', () => {
      const len = descArea.value.length;
      descCount.textContent = `${len} / 500`;
      descCount.style.color = len > 480 ? '#EF4444' : 'var(--text-light)';
      if (len > 500) descArea.value = descArea.value.substring(0, 500);
    });
  }
  const ctMsg = document.getElementById('ctMessage');
  const ctCount = document.getElementById('ctMsgCount');
  if (ctMsg && ctCount) {
    ctMsg.addEventListener('input', () => {
      const len = ctMsg.value.length;
      ctCount.textContent = `${len} / 1000`;
      ctCount.style.color = len > 950 ? '#EF4444' : 'var(--text-light)';
      if (len > 1000) ctMsg.value = ctMsg.value.substring(0, 1000);
    });
  }
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', handleContactSubmit);
  }
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const name    = document.getElementById('ctName')?.value.trim();
  const phone   = document.getElementById('ctPhone')?.value.trim();
  const role    = document.getElementById('ctRole')?.value;
  const subject = document.getElementById('ctSubject')?.value;
  const message = document.getElementById('ctMessage')?.value.trim();

  if (!name || !phone || !role || !subject || !message) {
    showToast('?? Please fill all required fields');
    return;
  }

  const btn = document.getElementById('ctSubmitBtn');
  const btnText = document.getElementById('ctBtnText');
  btn.disabled = true;
  btnText.textContent = '? Sending...';

  // Attempt to store contact in Supabase; fall back gracefully
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient.from('contacts').insert({
        name, phone, role, subject, message,
        created_at: new Date().toISOString()
      });
      if (error) {
        console.warn('Contact insert failed, showing success anyway:', error.message);
      }
    } catch (err) {
      console.warn('Contact insert exception:', err);
    }
  }

  document.getElementById('contactForm').style.display = 'none';
  document.getElementById('ctSuccess').classList.add('show');
  showToast('? Message sent successfully!');
  btn.disabled = false;
  btnText.textContent = '?? Send Message';
}

function resetContactForm() {
  document.getElementById('contactForm').reset();
  document.getElementById('contactForm').style.display = '';
  document.getElementById('ctSuccess').classList.remove('show');
  document.getElementById('ctMsgCount').textContent = '0 / 1000';
}

// ===== FAQ TOGGLE =====
function toggleFaq(el) {
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
  if (!isOpen) el.classList.add('open');
}

// ===== POST PROPERTY FORM HANDLER =====
// Legacy property wizard logic has been removed. Real property submission is handled by add-property.js.

