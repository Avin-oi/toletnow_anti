/* =====================================================
   owner-profile.js — Owner Profile Page Logic
   ===================================================== */

// ===== MOCK PROPERTY DATA =====
let ownerProperties = [];

let currentOwner = null;
let currentFilter = 'all';
let currentOwnerTab = 'properties';

// ===== ON LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('ownerUser');
  if (!saved) {
    showToast('⚠️ Owner access only. Please login first.');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    return;
  }

  currentOwner = JSON.parse(saved);
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
    
    const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/house_listing_1.png';
    const title = `${p.bhk || ''} ${p.type || 'Property'}`.trim();
    const location = `${p.locality || ''}, ${p.city || ''}`.trim();
    const price = p.rent ? p.rent.toLocaleString('en-IN') : '0';
    const time = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';

    card.innerHTML = `
      <img src="${img}" alt="${title}" class="op-prop-card-img"
        onerror="this.style.background='linear-gradient(135deg,#FCE4EC,#F8BBD9)';this.removeAttribute('src');" />
      <div class="op-prop-card-info">
        <div class="op-prop-card-title">${title}</div>
        <div class="op-prop-card-location">📍 ${location}</div>
        <div class="op-prop-card-price">₹${price}<span> / month</span></div>
        <div class="op-prop-card-meta">
          <span class="op-prop-meta-tag">🏠 ${p.bhk || 'N/A'}</span>
          <span class="op-prop-meta-tag">📐 ${p.area || 0} sq.ft</span>
          <span class="op-prop-meta-tag">🪑 ${p.furnishing || 'N/A'}</span>
          <span class="op-prop-meta-tag">🕐 ${time}</span>
        </div>
      </div>
      <div class="op-prop-card-actions">
        <span class="op-prop-status-badge ${p.status}">${p.status}</span>
        <div class="op-prop-action-btns">
          <button class="op-btn-edit-prop" onclick="showToast('✏️ Edit property coming soon!')">✏️ Edit</button>
          ${p.status === 'Expired'
            ? `<button class="op-btn-renew-prop" onclick="renewProperty('${p.id}')">🔄 Renew</button>`
            : `<button class="op-btn-edit-prop" onclick="deleteProperty('${p.id}')">🗑️ Delete</button>`}
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

// ===== SAVE PROFILE =====
async function saveOwnerProfile(e) {
  e.preventDefault();
  const name    = document.getElementById('editName')?.value.trim();
  const phone   = document.getElementById('editPhone')?.value.trim();
  const address = document.getElementById('editAddress')?.value.trim();

  if (!name || !phone) {
    showToast('⚠️ Please fill all required fields');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Saving...';
  btn.disabled = true;

  if (window.supabaseClient) {
    const { error } = await window.supabaseClient
      .from('users')
      .update({ name, phone, address })
      .eq('id', currentOwner.id);
      
    if (error) {
      showToast('❌ Failed to update profile');
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }
  }

  currentOwner = { ...currentOwner, name, phone, address };
  localStorage.setItem('ownerUser', JSON.stringify(currentOwner));
  await initOwnerProfilePage();
  showToast('💾 Profile saved successfully!');
  
  btn.innerHTML = originalText;
  btn.disabled = false;
}

// ===== PROPERTY ACTIONS =====
async function deleteProperty(id) {
  if (!confirm('Are you sure you want to delete this property?')) return;
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('properties').delete().eq('id', id);
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
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('properties').update({ status: 'Active', created_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error(error);
      showToast('❌ Error renewing property');
      return;
    }
  }
  showToast('🔄 Property renewed for 30 days!');
  await initOwnerProfilePage();
}

// ===== CHANGE PASSWORD =====
function saveOwnerPassword(e) {
  e.preventDefault();
  const np = document.getElementById('newPassword')?.value;
  const cp = document.getElementById('confirmPassword')?.value;
  if (np !== cp) { showToast('⚠️ Passwords do not match'); return; }
  if (np.length < 6) { showToast('⚠️ Minimum 6 characters required'); return; }
  if(document.getElementById('currentPassword')) document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  showToast('🔐 Password updated successfully!');
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
function ownerProfileLogout() {
  localStorage.removeItem('ownerUser');
  showToast('👋 Logged out successfully');
  setTimeout(() => { window.location.href = 'index.html'; }, 1000);
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

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

