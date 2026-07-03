/* =====================================================
   owner-profile.js — Owner Profile Page Logic
   ===================================================== */

// ===== MOCK PROPERTY DATA =====
let ownerProperties = [];

let currentOwner = null;
let currentFilter = 'all';
let currentOwnerTab = 'properties';

// ===== ON LOAD =====
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard: verify real Supabase session
  if (window.supabaseClient) {
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (!session) {
        localStorage.removeItem('ownerUser');
        showToast('⚠️ Owner access only. Please login first.');
        setTimeout(() => { window.location.href = '/'; }, 1200);
        return;
      }
      // Session valid — refresh owner data from DB
      const user = session.user;
      const { data: docData } = await window.supabaseClient.from('users').select('*').eq('id', user.id).maybeSingle();
      currentOwner = docData || {
        id: user.id,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email,
        phone: user.user_metadata?.phone || '',
        role: 'OWNER',
        address: ''
      };
      localStorage.setItem('ownerUser', JSON.stringify(currentOwner));
    } catch (err) {
      console.error('Profile auth guard error:', err);
      localStorage.removeItem('ownerUser');
      showToast('⚠️ Session invalid. Please login first.');
      setTimeout(() => { window.location.href = '/'; }, 1200);
      return;
    }
  } else {
    // Fallback: localStorage only (dev mode)
    const saved = localStorage.getItem('ownerUser');
    if (!saved) {
      showToast('⚠️ Owner access only. Please login first.');
      setTimeout(() => { window.location.href = '/'; }, 1200);
      return;
    }
    currentOwner = JSON.parse(saved);
  }

  initOwnerProfilePage();
});

// ===== INIT PAGE =====
async function initOwnerProfilePage() {
  if (!currentOwner) return;

  const initial = currentOwner.name.charAt(0).toUpperCase();

  // Avatar & name initials
  setEl('profileAvatarLetter', initial);
  setEl('profileDisplayName', currentOwner.name);
  setEl('profileDisplayEmail', '📞 ' + (currentOwner.phone || 'No phone number'));

  // Navbar
  setEl('ownerNavAvatar', initial);
  setEl('ownerNavName', currentOwner.name.split(' ')[0]);

  // Edit form pre-fill
  const n = document.getElementById('editName');
  const p = document.getElementById('editPhone');
  const e = document.getElementById('editEmail');
  const a = document.getElementById('editAddress');
  if (n) n.value = currentOwner.name || '';
  if (p) p.value = currentOwner.phone || '';
  if (e) e.value = currentOwner.email || '';
  if (a) a.value = currentOwner.address || '';

  // Fetch properties from DB
  if (window.supabaseClient) {
    const { data, error } = await window.supabaseClient
      .from('properties')
      .select('*')
      .eq('owner_id', currentOwner.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      ownerProperties = data;
    }
  }

  // Property counts
  const counts = { Active: 0, Pending: 0, Rented: 0, Expired: 0 };
  ownerProperties.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
  setEl('opActiveCount',  counts.Active);
  setEl('opPendingCount', counts.Pending);
  setEl('opRentedCount',  counts.Rented);
  setEl('opExpiredCount', counts.Expired);
  setEl('propertiesCount', ownerProperties.length);

  // Render default tab
  renderOwnerProperties(currentFilter);

  // Init navbar scroll
  window.addEventListener('scroll', () => {
    const nb = document.getElementById('navbar');
    if (nb) nb.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== TAB SWITCHING =====
function switchOwnerTab(tab) {
  currentOwnerTab = tab;
  const tabs = ['properties', 'liked', 'edit', 'password', 'help'];
  tabs.forEach(t => {
    const btn = document.getElementById(`opMenuBtn-${t}`);
    const sec = document.getElementById(`opTab-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (sec) sec.classList.toggle('hidden', t !== tab);
  });

  // Scroll content into view on mobile
  if (window.innerWidth < 900) {
    document.querySelector('.op-content-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ===== FILTER PROPERTIES =====
function filterOpProperties(status, btn) {
  document.querySelectorAll('.op-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = status;
  renderOwnerProperties(status);
}

function renderOwnerProperties(filter) {
  const list = document.getElementById('opPropertiesList');
  const empty = document.getElementById('propertiesEmptyState');
  if (!list) return;

  const filtered = filter === 'all'
    ? ownerProperties
    : ownerProperties.filter(p => p.status === filter);

  if (filtered.length === 0) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  list.innerHTML = '';

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'op-prop-card';

    const imgSrc = normalizeImageSrc((p.images && p.images.length > 0) ? p.images[0] : 'assets/house_listing_1.png');
    const title = `${escapeHtml(p.title || p.bhk || '')} ${escapeHtml(p.property_type || p.type || 'Property')}`.trim();
    const location = `${escapeHtml(p.area || p.locality || '')}, ${escapeHtml(p.city || '')}`.trim();
    const price = p.rent ? p.rent.toLocaleString('en-IN') : '0';
    const time = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
    const statusLabel = escapeHtml(p.status || 'Unknown');
    const statusClassMap = { Active: 'active', Pending: 'pending', Rented: 'rented', Expired: 'expired' };
    const statusClass = statusClassMap[p.status] || 'unknown';
    const bhkText = escapeHtml(p.bhk || 'N/A');
    const areaText = escapeHtml(p.area_sqft || p.area || 0);
    const furnishingText = escapeHtml(p.furnishing || 'N/A');

    const imgEl = document.createElement('img');
    imgEl.src = imgSrc;
    imgEl.alt = title || 'Property image';
    imgEl.className = 'op-prop-card-img';
    imgEl.onerror = function () {
      this.style.background = 'linear-gradient(135deg,#FCE4EC,#F8BBD9)';
      this.removeAttribute('src');
    };
    card.appendChild(imgEl);

    const info = document.createElement('div');
    info.className = 'op-prop-card-info';

    const titleEl = document.createElement('div');
    titleEl.className = 'op-prop-card-title';
    titleEl.textContent = title;
    info.appendChild(titleEl);

    const locationEl = document.createElement('div');
    locationEl.className = 'op-prop-card-location';
    locationEl.textContent = `📍 ${location}`;
    info.appendChild(locationEl);

    const priceEl = document.createElement('div');
    priceEl.className = 'op-prop-card-price';
    priceEl.innerHTML = `₹${price}<span> / month</span>`;
    info.appendChild(priceEl);

    const meta = document.createElement('div');
    meta.className = 'op-prop-card-meta';
    ['🏠 ' + bhkText, '📐 ' + areaText + ' sq.ft', '🪑 ' + furnishingText, '🕐 ' + time].forEach(text => {
      const span = document.createElement('span');
      span.className = 'op-prop-meta-tag';
      span.textContent = text;
      meta.appendChild(span);
    });
    info.appendChild(meta);
    card.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'op-prop-card-actions';

    const status = document.createElement('span');
    status.className = `op-prop-status-badge ${statusClass}`;
    status.textContent = statusLabel;
    actions.appendChild(status);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'op-prop-action-btns';

    const editBtn = document.createElement('button');
    editBtn.className = 'op-btn-edit-prop';
    editBtn.type = 'button';
    editBtn.textContent = '✏️ Edit';
    editBtn.addEventListener('click', () => showToast('✏️ Edit property coming soon!'));
    btnGroup.appendChild(editBtn);

    if (p.status === 'Expired') {
      const renewBtn = document.createElement('button');
      renewBtn.className = 'op-btn-renew-prop';
      renewBtn.type = 'button';
      renewBtn.textContent = '🔄 Renew';
      renewBtn.addEventListener('click', () => renewProperty(p.id));
      btnGroup.appendChild(renewBtn);
    } else {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'op-btn-edit-prop';
      deleteBtn.type = 'button';
      deleteBtn.textContent = '🗑️ Delete';
      deleteBtn.addEventListener('click', () => deleteProperty(p.id));
      btnGroup.appendChild(deleteBtn);
    }

    actions.appendChild(btnGroup);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

// ===== SAVE PROFILE =====
async function saveOwnerProfile(e) {
  e.preventDefault();
  const name       = document.getElementById('editName')?.value.trim();
  const phone      = document.getElementById('editPhone')?.value.trim();
  const address    = document.getElementById('editAddress')?.value.trim();

  if (!name || !phone) {
    showToast('⚠️ Please fill all required fields');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Saving...';
  btn.disabled = true;

  let dbError = null;
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from('users')
        .update({ name, phone, address })
        .eq('id', currentOwner.id);
      if (error) dbError = error;
    } catch (err) {
      dbError = err;
    }
  }

  // Always update local state and UI optimistically so changes reflect immediately
  currentOwner = { ...currentOwner, name, phone, address };
  localStorage.setItem('ownerUser', JSON.stringify(currentOwner));
  await initOwnerProfilePage();

  if (dbError) {
    console.error('Owner profile DB update error:', dbError);
    showToast('⚠️ Saved locally, but failed to update server');
  } else {
    showToast('💾 Profile saved successfully!');
  }

  btn.innerHTML = originalText;
  btn.disabled = false;
}

// ===== PROPERTY ACTIONS =====
async function deleteProperty(id) {
  if (!confirm('Are you sure you want to delete this property?')) return;
  if (window.supabaseClient && currentOwner) {
    const { error } = await window.supabaseClient.from('properties')
      .delete()
      .eq('id', id)
      .eq('owner_id', currentOwner.id);
    if (error) {
      console.error(error);
      showToast('❌ Error deleting property');
      return;
    }
  }
  showToast('🗑️ Property deleted');
  await initOwnerProfilePage();
}

async function renewProperty(id) {
  if (!confirm('Are you sure you want to renew this property?')) return;
  if (window.supabaseClient && currentOwner) {
    const { error } = await window.supabaseClient.from('properties')
      .update({ status: 'Active' })
      .eq('id', id)
      .eq('owner_id', currentOwner.id);
    if (error) {
      console.error(error);
      showToast('❌ Error renewing property');
      return;
    }
  }
  showToast('🔄 Property renewed successfully!');
  await initOwnerProfilePage();
}

// ===== CHANGE PASSWORD =====
async function saveOwnerPassword(e) {
  e.preventDefault();
  const cur = document.getElementById('currentPassword')?.value;
  const np = document.getElementById('newPassword')?.value;
  const cp = document.getElementById('confirmPassword')?.value;

  if (!cur) { showToast('⚠️ Please enter your current password'); return; }
  if (np !== cp) { showToast('⚠️ Passwords do not match'); return; }
  if (!np || np.length < 6) { showToast('⚠️ Minimum 6 characters required'); return; }

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn ? btn.innerHTML : 'Saving...';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Verifying...';
  }

  if (!window.supabaseClient) {
    showToast('❌ Unable to update password right now.');
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    return;
  }

  // Verify current password by attempting sign-in
  const { data: { user }, error: signInErr } = await window.supabaseClient.auth.signInWithPassword({
    email: currentOwner?.email,
    password: cur
  });

  if (signInErr || !user) {
    showToast('❌ Current password is incorrect');
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    return;
  }

  if (btn) btn.innerHTML = '⏳ Updating...';

  const { error } = await window.supabaseClient.auth.updateUser({ password: np });
  if (error) {
    showToast(getFriendlyError(error));
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    return;
  }

  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  showToast('🔐 Password updated successfully!');

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ===== FAQ ACCORDION =====
function toggleFaqOwner(el) {
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.op-faq-block .faq-item').forEach(f => f.classList.remove('open'));
  if (!isOpen) el.classList.add('open');
}

// ===== SUPPORT FORM =====
function handleOwnerSupportSubmit(e) {
  e.preventDefault();
  const msg = document.getElementById('opSupportMessage');
  if (msg) msg.value = '';
  showToast('📩 Support request sent! We will contact you soon.');
}

// ===== LOGOUT =====
async function ownerProfileLogout() {
  try {
    if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.signOut === 'function') {
      await window.supabaseClient.auth.signOut();
    }
  } catch (err) {
    console.warn('Logout sign-out warning:', err);
  }

  localStorage.removeItem('ownerUser');
  showToast('👋 Logged out successfully');
  setTimeout(() => { window.location.href = '/'; }, 1000);
}

// ===== MOBILE MENU =====
function toggleOwnerMenu() {
  const drawer  = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (!drawer) return;
  drawer.classList.toggle('open');
  overlay?.classList.toggle('visible');
  document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
}

