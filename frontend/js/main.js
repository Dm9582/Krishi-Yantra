const API_BASE = window.location.origin + '/api';

function getToken() { return localStorage.getItem('krishi_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('krishi_user')); } catch { return null; } }
function isLoggedIn() { return !!getToken(); }
function logout() {
  localStorage.removeItem('krishi_token');
  localStorage.removeItem('krishi_user');
  window.location.href = 'login.html';
}
function formatPrice(price) { return `₹${price.toLocaleString('en-IN')} <span data-i18n="price_per_day">/ day</span>`; }
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function showAlert(message, type='info', containerId='alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) { alert(message); return; }
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(()=> container.innerHTML='', 4000);
}
function updateNav() {
  const user = getUser();
  const loginLink = document.getElementById('navLogin');
  const profileLink = document.getElementById('navProfile');
  const logoutBtn = document.getElementById('navLogout');
  if (user) {
    if (loginLink) loginLink.classList.add('hidden');
    if (profileLink) { profileLink.classList.remove('hidden'); profileLink.querySelector('span') ? profileLink.querySelector('span').textContent = user.name.split(' ')[0] : null; }
    if (logoutBtn) logoutBtn.classList.remove('hidden');
  } else {
    if (loginLink) loginLink.classList.remove('hidden');
    if (profileLink) profileLink.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }
  // Highlight active
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path==='' && href==='index.html')) a.classList.add('active');
    else a.classList.remove('active');
  });
}
async function apiFetch(url, options={}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  options.headers = headers;
  const res = await fetch(API_BASE + url, options);
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}
function setupHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');
  if (btn && nav) {
    btn.addEventListener('click', ()=> nav.classList.toggle('open'));
  }
}
document.addEventListener('DOMContentLoaded', ()=>{
  updateNav();
  setupHamburger();
  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn) logoutBtn.addEventListener('click', (e)=>{ e.preventDefault(); logout(); });
});
