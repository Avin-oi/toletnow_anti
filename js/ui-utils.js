// Shared UI utilities for the app

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function getFriendlyError(error) {
  if (!error || !error.message) return 'Something went wrong. Please try again.';
  const message = error.message;
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (message.includes('already registered')) return 'You already have an account. Please login.';
  if (message.includes('failed to send') || message.includes('Unable to send')) return 'Unable to send the email right now. Please try again later.';
  return 'Something went wrong. Please try again.';
}

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

function normalizeImageSrc(src) {
  if (!src) return 'assets/house_listing_1.png';
  const value = String(src).trim();
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/') || value.startsWith('assets/') || value.startsWith('/')) {
    return value;
  }
  return 'assets/house_listing_1.png';
}
