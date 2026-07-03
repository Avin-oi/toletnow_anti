/* =====================================================
   owner-auth.js — Owner Auth Gate Logic
   ===================================================== */

// ===== STATE =====
let ownerUser = null;   // { name, email, phone, address }
let authMode = 'login'; // 'login' | 'signup'
let otpTarget = '';     // email OTP was sent to
let otpCountdownTimer = null;

// ===== BACK-FORWARD CACHE GUARD =====
// When user hits browser back button, the page may be restored from cache
// without re-running DOMContentLoaded. This catches that case.
window.addEventListener('pageshow', async (event) => {
  if (event.persisted) {
    // Page was restored from bfcache — re-check session
    const isProtectedPage = window.location.pathname.includes('profile') || window.location.pathname.includes('add-property');
    const isHomePage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

    if (window.supabaseClient) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session && isProtectedPage) {
          // Logged out but on profile page — kick to login
          window.location.replace('index.html');
        } else if (session && isHomePage) {
          // Logged in but on login page — send to profile
          window.location.replace('owner-profile.html');
        }
      } catch (e) {
        if (isProtectedPage) window.location.replace('index.html');
      }
    }
  }
});

// ===== ON LOAD =====
document.addEventListener('DOMContentLoaded', async () => {
  // ── AUTH GUARD: Verify real Supabase session, not just localStorage ──
  const isProtectedPage = window.location.pathname.includes('profile') || window.location.pathname.includes('add-property');

  if (window.supabaseClient) {
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session && session.user) {
        // Real session exists — fetch or build owner profile
        const user = session.user;
        const { data: docData } = await window.supabaseClient.from('users').select('*').eq('id', user.id).maybeSingle();
        ownerUser = docData || {
          id: user.id,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          email: user.email,
          phone: user.user_metadata?.phone || '',
          role: 'OWNER',
          address: ''
        };
        localStorage.setItem('ownerUser', JSON.stringify(ownerUser));
        activateOwnerSession(false);
      } else {
        // No real session — clear stale localStorage and redirect if on protected page
        localStorage.removeItem('ownerUser');
        ownerUser = null;
        if (isProtectedPage) {
          showToast('⚠️ Owner access only. Redirecting to login…');
          setTimeout(() => { window.location.replace('index.html'); }, 1000);
          return;
        }
      }
    } catch (err) {
      console.error('Auth guard error:', err);
      localStorage.removeItem('ownerUser');
      ownerUser = null;
      if (isProtectedPage) {
        showToast('⚠️ Session invalid. Redirecting to login…');
        setTimeout(() => { window.location.replace('index.html'); }, 1000);
        return;
      }
    }
  } else {
    // No Supabase client — fall back to localStorage check (dev mode)
    const saved = localStorage.getItem('ownerUser');
    if (saved) {
      ownerUser = JSON.parse(saved);
      activateOwnerSession(false);
    } else if (isProtectedPage) {
      showToast('⚠️ Owner access only. Redirecting to login…');
      setTimeout(() => { window.location.replace('index.html'); }, 1000);
      return;
    }
  }

  // Check url search params for action mode
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  if (action === 'signup' || action === 'login') {
    setTimeout(() => {
      scrollToAuthInternal(action);
    }, 150);
  }
  initNavScrollOwner();
});

function initNavScrollOwner() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ===== AUTH STATE HANDLER =====
// Add an auth listener to detect password recovery or email verification for owners
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!window.supabaseClient) return;
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      // PASSWORD RECOVERY — user clicked reset link in email
      if (event === 'PASSWORD_RECOVERY') {
        switchOwnerTab('reset');
        return;
      }

      // SIGNED IN — user verified email and got auto-logged in
      if (event === 'SIGNED_IN' && session && session.user) {
        // Skip if already logged in as same owner
        if (ownerUser && ownerUser.id === session.user.id) return;
        // Skip if tenant session is active
        if (localStorage.getItem('tenantUser')) return;

        const user = session.user;
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        const phone = user.user_metadata?.phone || '';

        // Fetch or build owner details
        window.supabaseClient.from('users').select('*').eq('id', user.id).single().then(({ data }) => {
          ownerUser = data || { id: user.id, name, email: user.email, phone, role: 'OWNER', address: '' };
          localStorage.removeItem('tenantUser');
          localStorage.setItem('ownerUser', JSON.stringify(ownerUser));
          activateOwnerSession(true);
        });
      }
    });
  }, 500);
});

// ===== TAB SWITCH =====
function switchOwnerTab(mode) {
  authMode = mode;
  document.getElementById('oaLoginWrap')?.classList.add('hidden');
  document.getElementById('oaSignupWrap')?.classList.add('hidden');
  document.getElementById('oaForgotWrap')?.classList.add('hidden');
  document.getElementById('oaForgotSentWrap')?.classList.add('hidden');
  document.getElementById('oaSignupVerifyWrap')?.classList.add('hidden');
  document.getElementById('oaResetWrap')?.classList.add('hidden');
  document.getElementById('oaResetSuccessWrap')?.classList.add('hidden');

  const tabs = document.getElementById('oaTabs');

  if (mode === 'login' || mode === 'signup') {
    if (tabs) tabs.style.display = 'flex';
    document.getElementById(mode === 'login' ? 'oaLoginWrap' : 'oaSignupWrap')?.classList.remove('hidden');
    document.getElementById('tabLogin')?.classList.toggle('active', mode === 'login');
    document.getElementById('tabSignup')?.classList.toggle('active', mode === 'signup');
  } else {
    if (tabs) tabs.style.display = 'none';
    if (mode === 'forgot') document.getElementById('oaForgotWrap')?.classList.remove('hidden');
    else if (mode === 'forgotSent') document.getElementById('oaForgotSentWrap')?.classList.remove('hidden');
    else if (mode === 'signupVerify') document.getElementById('oaSignupVerifyWrap')?.classList.remove('hidden');
    else if (mode === 'reset') document.getElementById('oaResetWrap')?.classList.remove('hidden');
    else if (mode === 'resetSuccess') document.getElementById('oaResetSuccessWrap')?.classList.remove('hidden');
  }
}

// ===== SCROLL TO AUTH =====
window.showAuthSection = function (mode) { scrollToAuthInternal(mode); };
window.scrollToAuth = function (mode) {
  scrollToAuthInternal(mode);
};
function scrollToAuthInternal(mode) {
  if (ownerUser) {
    window.location.href = 'owner-profile.html';
    return;
  }
  const authSection = document.getElementById('ownerAuthSection');
  if (authSection) { authSection.classList.remove('hidden'); authSection.style.display = 'block'; }
  const formSection = document.getElementById('ownerFormSection');
  if (formSection) { formSection.classList.add('hidden'); formSection.style.display = 'none'; }
  switchOwnerTab(mode);
  const section = document.getElementById('ownerAuthSection');
  if (section) {
    // Add a small delay to ensure display:block has taken effect before scrolling
    setTimeout(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}

function showAuthSection(mode) {
  if (ownerUser) {
    // Already logged in — redirect straight to form page
    window.location.href = 'owner-profile.html';
    return;
  }
  scrollToAuthInternal(mode);
}

// ===== LOGIN =====
function handleOwnerLogin(e) {
  e.preventDefault();
  if (!window.supabaseClient) {
    showToast('⚠️ Connection issue. Please refresh and try again.');
    return;
  }

  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPassword').value;
  if (!isValidEmail(email)) { shakeInputById('loginEmail'); showToast('⚠️ Please enter a valid email address'); return; }
  if (!pw) { showToast('⚠️ Please enter your password'); return; }

  const btn = document.getElementById('loginSubmitBtn');
  const txt = document.getElementById('loginBtnText');
  btn.disabled = true;
  txt.textContent = '⏳ Logging in…';

  window.supabaseClient.auth.signInWithPassword({ email, password: pw })
    .then(async ({ data, error }) => {
      btn.disabled = false;
      txt.textContent = 'Login';
      if (error) {
        const message = error.message.toLowerCase();
        if (message.includes('invalid login credentials')) {
          showToast('⚠️ Invalid email or password. Please try again.');
        } else if (message.includes('confirm') || message.includes('not confirmed') || message.includes('email not confirmed')) {
          showToast('⚠️ Please verify your email first. Check your inbox and spam.');
        } else {
          showToast(getFriendlyError(error));
        }
        return;
      }
      const user = data.user;
      if (!user) {
        showToast('⚠️ Login failed. Please try again or reset your password.');
        return;
      }
      window.supabaseClient.from('users').select('*').eq('id', user.id).single().then(({ data: docData }) => {
        ownerUser = docData || { id: user.id, name: user.user_metadata?.full_name || 'Verified Owner', email: email, phone: '', address: '', role: 'OWNER' };
        localStorage.removeItem('tenantUser');
        localStorage.setItem('ownerUser', JSON.stringify(ownerUser));
        activateOwnerSession(true);
      });
    });
}

function showOwnerForgotPassword() {
  switchOwnerTab('forgot');
}

// ===== FORGOT PASSWORD =====
async function handleOwnerForgotPassword(e) {
  e.preventDefault();
  if (!window.supabaseClient) {
    showToast('⚠️ Connection issue. Please refresh and try again.');
    return;
  }

  const email = document.getElementById('forgotEmail').value.trim();
  if (!isValidEmail(email)) { shakeInputById('forgotEmail'); showToast('⚠️ Please enter a valid email address'); return; }

  const btn = document.getElementById('forgotSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Sending...';

  // Check if user exists using our RPC function
  try {
    const { data: exists, error: rpcError } = await window.supabaseClient.rpc('check_user_exists', { lookup_email: email });
    
    // If the RPC ran successfully and returned false, the user doesn't exist
    if (!rpcError && exists === false) {
      btn.disabled = false;
      btn.innerHTML = '<span>✉️ Send Reset Link</span>';
      shakeInputById('forgotEmail');
      showToast('⚠️ No account found with this email address.');
      return;
    }
  } catch (err) {
    console.warn('RPC check_user_exists failed, proceeding with fallback', err);
  }

  window.supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/'
  }).then(({ error }) => {
    btn.disabled = false;
    btn.innerHTML = '<span>✉️ Send Reset Link</span>';
    if (error) {
      showToast(getFriendlyError(error));
      return;
    }
    document.getElementById('forgotEmailDisplay').textContent = email;
    switchOwnerTab('forgotSent');
  });
}

// ===== SIGNUP =====
function handleOwnerSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const address = document.getElementById('signupAddress').value.trim();
  const pw = document.getElementById('signupPassword').value;
  const terms = document.getElementById('signupTerms').checked;

  if (!name) { shakeInputById('signupName'); showToast('⚠️ Please enter your name'); return; }
  if (!phone || phone.length < 10) { shakeInputById('signupPhone'); showToast('⚠️ Enter a valid phone number'); return; }
  if (!isValidEmail(email)) { shakeInputById('signupEmail'); showToast('⚠️ Enter a valid email address'); return; }
  if (!pw || pw.length < 6) { shakeInputById('signupPassword'); showToast('⚠️ Password must be at least 6 chars'); return; }
  if (!address) { shakeInputById('signupAddress'); showToast('⚠️ Please enter your address'); return; }
  if (!terms) { showToast('⚠️ Please agree to Terms & Conditions'); return; }

  const btn = document.getElementById('signupSubmitBtn');
  const txt = document.getElementById('signupBtnText');
  btn.disabled = true;
  txt.textContent = '⏳ Creating Account…';

  if (!window.supabaseClient) {
    showToast('⚠️ Connection issue. Please refresh and try again.');
    btn.disabled = false;
    txt.textContent = 'Create Account';
    return;
  }

  window.supabaseClient.auth.signUp({
    email,
    password: pw,
    options: {
      data: { full_name: name, phone, role: 'OWNER' },
      emailRedirectTo: window.location.origin + '/'
    }
  }).then(async ({ data, error }) => {
    btn.disabled = false;
    txt.textContent = 'Create Account';
    if (error) {
      if (error.message.includes('already registered')) {
        showToast('⚠️ You already have an account. Please login.');
        switchOwnerTab('login');
        const liEmail = document.getElementById('loginEmail');
        if(liEmail) liEmail.value = email;
      } else {
        showToast(getFriendlyError(error));
      }
      return;
    }
    const user = data.user;
    const userData = { id: user?.id || null, name, email, phone, address, role: 'OWNER' };
    if (userData.id) {
      try {
        const { error: profileError } = await window.supabaseClient.from('users').upsert(userData, { onConflict: 'id' });
        if (profileError) {
          console.warn('Profile sync failed; continuing with local fallback.', profileError);
          localStorage.setItem('ownerUser', JSON.stringify({ ...userData, profilePending: true }));
        } else {
          localStorage.setItem('ownerUser', JSON.stringify(userData));
        }
      } catch (profileError) {
        console.warn('Profile sync failed; continuing with local fallback.', profileError);
        localStorage.setItem('ownerUser', JSON.stringify({ ...userData, profilePending: true }));
      }
    } else {
      localStorage.setItem('ownerUser', JSON.stringify({ ...userData, profilePending: true }));
    }
    document.getElementById('signupEmailDisplay').textContent = email;
    switchOwnerTab('signupVerify');
  });
}

// ===== RESET PASSWORD =====
function handleOwnerResetPassword(e) {
  e.preventDefault();
  if (!window.supabaseClient) {
    showToast('⚠️ Connection issue. Please refresh and try again.');
    return;
  }

  const newPw = document.getElementById('resetNewPassword').value;
  const confirmPw = document.getElementById('resetConfirmPassword').value;

  if (newPw.length < 6) { shakeInputById('resetNewPassword'); showToast('⚠️ Password must be at least 6 characters'); return; }
  if (newPw !== confirmPw) { shakeInputById('resetConfirmPassword'); showToast('⚠️ Passwords do not match!'); return; }

  const btn = document.getElementById('resetSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Updating...</span>';

  window.supabaseClient.auth.updateUser({ password: newPw })
    .then(({ error }) => {
      btn.disabled = false;
      btn.innerHTML = '<span>🔒 Update Password</span>';
      if (error) {
        showToast(getFriendlyError(error));
        return;
      }
      switchOwnerTab('resetSuccess');
    });
}

// ===== ACTIVATE SESSION =====
function activateOwnerSession(animate) {
  if (!ownerUser) return;

  const initial = ownerUser.name.charAt(0).toUpperCase();

  // Update navbar
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navSignupBtn = document.getElementById('navSignupBtn');
  const ownerNavInfo = document.getElementById('ownerNavInfo');
  const ownerNavAvatar = document.getElementById('ownerNavAvatar');
  const ownerNavName = document.getElementById('ownerNavName');

  if (navLoginBtn) navLoginBtn.style.display = 'none';
  if (navSignupBtn) navSignupBtn.style.display = 'none';
  if (ownerNavInfo) {
    ownerNavInfo.style.display = 'flex';
    ownerNavInfo.style.cursor = 'pointer';
    ownerNavInfo.title = 'View Owner Profile';
    ownerNavInfo.onclick = (e) => {
      // Don't navigate if logout button clicked
      if (!e.target.closest('button')) {
        window.location.href = 'owner-profile.html';
      }
    };
  }
  if (ownerNavAvatar) ownerNavAvatar.textContent = initial;
  if (ownerNavName) ownerNavName.textContent = ownerUser.name.split(' ')[0];

  // Update welcome card / sidebar card
  const avatarEl = document.getElementById('sidebarAvatar');
  const nameEl = document.getElementById('sidebarName');
  const emailEl = document.getElementById('sidebarEmail');
  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = ownerUser.name;
  if (emailEl) emailEl.textContent = ownerUser.email;

  // Redirect to profile if on index/home page and session exists
  const currentPath = window.location.pathname;
  if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
    window.location.replace('owner-profile.html');
    return;
  }
  const authSection = document.getElementById('ownerAuthSection');
  if (authSection) authSection.style.display = 'none';

  const welcomeSection = document.getElementById('ownerFormSection');
  if (welcomeSection) {
    welcomeSection.classList.remove('hidden');
    welcomeSection.style.display = 'block';
  }
}

// ===== LOGOUT =====
function ownerLogout() {
  if (window.supabaseClient) {
    window.supabaseClient.auth.signOut().then(() => {
      ownerUser = null;
      localStorage.removeItem('ownerUser');
      _completeOwnerLogout();
    });
  } else {
    ownerUser = null;
    localStorage.removeItem('ownerUser');
    _completeOwnerLogout();
  }
}

function _completeOwnerLogout() {
  // If on a protected page, redirect to index
  const currentPath = window.location.pathname;
  if (currentPath.includes('profile') || currentPath.includes('add-property')) {
    window.location.replace('index.html');
    return;
  }

  // Restore nav
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navSignupBtn = document.getElementById('navSignupBtn');
  const ownerNavInfo = document.getElementById('ownerNavInfo');

  if (navLoginBtn) navLoginBtn.style.display = '';
  if (navSignupBtn) navSignupBtn.style.display = '';
  if (ownerNavInfo) ownerNavInfo.style.display = 'none';

  // Show auth section again, hide welcome
  const authSection = document.getElementById('ownerAuthSection');
  if (authSection) authSection.style.display = '';

  const welcomeSection = document.getElementById('ownerFormSection');
  if (welcomeSection) welcomeSection.classList.add('hidden');

  // Reset auth forms
  const otpWrap = document.getElementById('oaOtpWrap');
  if (otpWrap) otpWrap.classList.add('hidden');

  const tabs = document.getElementById('oaTabs');
  if (tabs) tabs.style.display = '';

  switchOwnerTab('login');
  document.getElementById('ownerLoginForm')?.reset();
  document.getElementById('ownerSignupForm')?.reset();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('👋 Logged out successfully');
}

// ===== OTP COUNTDOWN =====
let countdownSec = 59;
function startOtpCountdown() {
  countdownSec = 59;
  const countdownEl = document.getElementById('otpCountdown');
  const timerRow = document.getElementById('otpTimerDisplay');
  const resendBtn = document.getElementById('otpResendBtn');

  if (resendBtn) resendBtn.classList.add('hidden');
  if (timerRow) timerRow.style.display = 'block';

  if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  otpCountdownTimer = setInterval(() => {
    countdownSec--;
    if (countdownEl) {
      countdownEl.textContent = `00:${String(countdownSec).padStart(2, '0')}`;
    }
    if (countdownSec <= 0) {
      clearInterval(otpCountdownTimer);
      if (timerRow) timerRow.style.display = 'none';
      if (resendBtn) resendBtn.classList.remove('hidden');
    }
  }, 1000);
}

function resendOtp() {
  const resendBtn = document.getElementById('otpResendBtn');
  if (resendBtn) resendBtn.classList.add('hidden');
  ['oa_otp1', 'oa_otp2', 'oa_otp3', 'oa_otp4', 'oa_otp5', 'oa_otp6'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('filled'); }
  });
  startOtpCountdown();
  showToast(`📧 OTP resent to ${otpTarget}`);
  document.getElementById('oa_otp1')?.focus();
}

// ===== HELPERS =====
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shakeInputById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('shake-error');
  void el.offsetWidth; // reflow
  el.classList.add('shake-error');
  el.style.borderColor = '#EF4444';
  setTimeout(() => {
    el.classList.remove('shake-error');
    el.style.borderColor = '';
  }, 500);
}

function shakeOtpBoxes() {
  document.querySelectorAll('.oa-otp-box').forEach(box => {
    box.classList.remove('shake-error');
    void box.offsetWidth;
    box.classList.add('shake-error');
    box.style.borderColor = '#EF4444';
    setTimeout(() => { box.classList.remove('shake-error'); box.style.borderColor = ''; }, 500);
  });
}

function togglePw(id) {
  const inp = document.getElementById(id);
  if (inp) {
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }
}

