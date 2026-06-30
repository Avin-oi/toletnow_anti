/* =====================================================
   pages.js — Logic for Post Property & Contact Pages
   ===================================================== */

// ===== SHARED: NAVBAR SCROLL + HAMBURGER =====
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initDescCounter();
  initListingPreview();
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
  const phone = document.getElementById('loginPhone').value;
  const pw = document.getElementById('loginPassword').value;
  if (!phone || !pw) { showToast('⚠️ Please fill all fields'); return; }
  const btn = document.getElementById('loginSubmitBtn');
  btn.innerHTML = '⏳ Logging in...';
  btn.disabled = true;
  setTimeout(() => {
    closeModal('loginModal');
    btn.innerHTML = 'Login';
    btn.disabled = false;
    showToast('✅ Welcome back!');
    document.querySelectorAll('#loginBtn, [onclick*="loginModal"]').forEach(b => {
      if (b.tagName === 'BUTTON' || b.tagName === 'A') b.style.display = 'none';
    });
  }, 1400);
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ===== CHIP TOGGLE =====
function toggleChip(checkbox) {
  checkbox.closest('.chip-label').classList.toggle('checked', checkbox.checked);
}

// ===== POST PROPERTY MULTI-STEP =====
let currentPPStep = 1;

function ppNextStep(step) {
  if (step > currentPPStep) {
    if (currentPPStep === 1) {
      const type = document.getElementById('pp_type')?.value;
      const bhk  = document.getElementById('pp_bhk')?.value;
      const rent = document.getElementById('pp_rent')?.value;
      if (!type || !bhk || !rent) {
        showToast('⚠️ Please select Property Type, BHK and enter Rent');
        shakeField(!type ? 'pp_type' : !bhk ? 'pp_bhk' : 'pp_rent');
        return;
      }
    }
    if (currentPPStep === 2) {
      const addr     = document.getElementById('pp_address')?.value.trim();
      const locality = document.getElementById('pp_locality')?.value;
      if (!addr || !locality) {
        showToast('⚠️ Please fill Address & Locality');
        if (!addr) shakeField('pp_address');
        if (!locality) shakeField('pp_locality');
        return;
      }
    }
  }

  const pages = [1, 2, 3, 4]; // 4 = success
  pages.forEach(i => {
    const pg = document.getElementById(`ppPage${i}`) || document.getElementById(`ppPageSuccess`);
    if (i <= 3 && document.getElementById(`ppPage${i}`)) {
      document.getElementById(`ppPage${i}`).classList.add('hidden');
    }
  });
  document.getElementById('ppPageSuccess')?.classList.add('hidden');

  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`ppStep${i}`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < step) el.classList.add('done');
  });

  const targetPage = step === 4 ? 'ppPageSuccess' : `ppPage${step}`;
  document.getElementById(targetPage)?.classList.remove('hidden');

  if (step <= 3) {
    document.getElementById(`ppStep${step}`)?.classList.add('active');
  }

  [1, 2].forEach(i => {
    document.getElementById(`ppLine${i}`)?.classList.toggle('done', i < step);
  });

  currentPPStep = step;

  // Update preview card on step 3
  if (step === 3) updateListingPreview();

  // Scroll to top of form
  const card = document.querySelector('.pp-form-card') || document.querySelector('.pp-form-body');
  card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('shake-error');
  el.style.borderColor = '#EF4444';
  setTimeout(() => {
    el.classList.remove('shake-error');
    el.style.borderColor = '';
  }, 600);
}

// ===== PHOTO PREVIEW =====
function previewPhotos(input) {
  const row = document.getElementById('photoPreviewRow');
  if (!row) return;
  row.innerHTML = '';
  const files = Array.from(input.files).slice(0, 8);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'photo-thumb-large';
      img.title = file.name;
      row.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
  const uploadArea = document.getElementById('ppUploadArea');
  if (uploadArea && files.length > 0) {
    uploadArea.innerHTML = `
      <div class="upload-zone-inner">
        <div class="upload-big-icon">✅</div>
        <h3>${files.length} photo${files.length > 1 ? 's' : ''} selected</h3>
        <p>Click to change or add more</p>
        <span class="upload-sub">Up to 8 photos · JPG, PNG</span>
      </div>
    `;
  }
}

// ===== LISTING PREVIEW (Step 3) =====
function initListingPreview() {}
function updateListingPreview() {
  const type     = document.getElementById('pp_type')?.value || '–';
  const bhk      = document.getElementById('pp_bhk')?.value  || '–';
  const rent     = document.getElementById('pp_rent')?.value;
  const locality = document.getElementById('pp_locality')?.value || 'Salem';
  const furnish  = document.querySelector('input[name="furnish"]:checked')?.value || 'Unfurnished';

  const previewType  = document.getElementById('previewType');
  const previewTitle = document.getElementById('previewTitle');
  const previewLoc   = document.getElementById('previewLocation');
  const previewPrice = document.getElementById('previewPrice');
  const previewTags  = document.getElementById('previewTags');

  if (previewType)  previewType.textContent  = type;
  if (previewTitle) previewTitle.textContent = `${bhk} ${type}`;
  if (previewLoc)   previewLoc.textContent   = `📍 ${locality}, Salem`;
  if (previewPrice) previewPrice.textContent = rent ? `₹${Number(rent).toLocaleString('en-IN')} / month` : '₹ –';
  if (previewTags)  previewTags.innerHTML    = [bhk, furnish].map(t =>
    `<span class="preview-tag">${t}</span>`).join('');
}

// ===== POST PROPERTY SUBMIT =====
function handlePagePostProperty(e) {
  e.preventDefault();
  const terms = document.getElementById('ppTerms')?.checked;
  if (!terms) {
    showToast('⚠️ Please agree to Terms & Conditions');
    return;
  }
  // Show success step
  ppNextStep(4);
  showToast('🏠 Property listed successfully!');
}

function resetPagePPForm() {
  document.getElementById('postPropertyPageForm')?.reset();
  document.querySelectorAll('.chip-label').forEach(l => l.classList.remove('checked'));
  const row = document.getElementById('photoPreviewRow');
  if (row) row.innerHTML = '';
  const uploadArea = document.getElementById('ppUploadArea');
  if (uploadArea) {
    uploadArea.innerHTML = `
      <div class="upload-zone-inner">
        <div class="upload-big-icon">📷</div>
        <h3>Upload Property Photos</h3>
        <p>Click to browse or drag & drop your images here</p>
        <span class="upload-sub">JPG, PNG · Up to 8 photos · Max 5MB each</span>
        <button type="button" class="btn-outline upload-btn-inner" style="pointer-events:none;">Browse Photos</button>
      </div>
    `;
  }
  currentPPStep = 1;
  ppNextStep(1);
}

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
function initContactForm() {}

function handleContactSubmit(e) {
  e.preventDefault();
  const name    = document.getElementById('ctName')?.value.trim();
  const phone   = document.getElementById('ctPhone')?.value.trim();
  const role    = document.getElementById('ctRole')?.value;
  const subject = document.getElementById('ctSubject')?.value;
  const message = document.getElementById('ctMessage')?.value.trim();

  if (!name || !phone || !role || !subject || !message) {
    showToast('⚠️ Please fill all required fields');
    return;
  }

  const btn = document.getElementById('ctSubmitBtn');
  const btnText = document.getElementById('ctBtnText');
  btn.disabled = true;
  btnText.textContent = '⏳ Sending...';

  setTimeout(() => {
    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('ctSuccess').classList.add('show');
    showToast('✅ Message sent successfully!');
    btn.disabled = false;
    btnText.textContent = '📩 Send Message';
  }, 1600);
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
function handlePostPropertyForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }
  setTimeout(() => {
    showToast('?? Property Posted Successfully!');
    if (btn) { btn.disabled = false; btn.textContent = 'Post Property'; }
    e.target.reset();
    setTimeout(() => { window.location.href = 'owner-profile.html'; }, 1500);
  }, 1000);
}

// ===== STEP LOGIC =====
function goToStep(step) {
  document.getElementById('ppPage1').style.display = 'none';
  document.getElementById('ppPage2').style.display = 'none';
  document.getElementById('ppPage3').style.display = 'none';
  document.getElementById('ppPage' + step).style.display = 'block';

  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById('stepIndicator' + i);
    if (!ind) continue;
    const circle = ind.querySelector('.step-circle');
    const text = ind.querySelector('span');
    if (i === step) {
      ind.classList.add('active');
      if (circle) { circle.style.background = 'var(--primary)'; circle.style.color = 'white'; }
      if (text) { text.style.color = 'var(--primary)'; }
    } else if (i < step) {
      ind.classList.remove('active');
      if (circle) { circle.style.background = 'var(--primary)'; circle.style.color = 'white'; circle.innerHTML = '?'; }
      if (text) { text.style.color = 'var(--primary)'; }
    } else {
      ind.classList.remove('active');
      if (circle) { circle.style.background = '#e2e8f0'; circle.style.color = '#64748b'; circle.innerHTML = i; }
      if (text) { text.style.color = '#64748b'; }
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function submitProperty(e) {
  e.preventDefault();
  const btn = document.getElementById('finalSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }
  setTimeout(() => {
    showToast('?? Property Posted Successfully!');
    if (btn) { btn.disabled = false; btn.textContent = 'Post Property Now'; }
    e.target.reset();
    goToStep(1);
    setTimeout(() => { window.location.href = 'owner-profile.html'; }, 1500);
  }, 1000);
}

