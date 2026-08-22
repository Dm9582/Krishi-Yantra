async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    location: form.location.value.trim(),
    preferred_language: form.preferred_language ? form.preferred_language.value : 'en'
  };
  try {
    const res = await fetch(API_BASE + '/auth/register', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    localStorage.setItem('krishi_token', json.token);
    localStorage.setItem('krishi_user', JSON.stringify(json.user));
    showAlert('Registration successful! Redirecting...','success');
    setTimeout(()=> window.location.href='dashboard.html', 1000);
  } catch(err){ showAlert(err.message,'error'); }
}
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    email: form.email.value.trim(),
    password: form.password.value
  };
  // Allow phone login if email field contains digits
  if (/^[6-9]\d{9}$/.test(data.email)) {
    data.phone = data.email;
    delete data.email;
  }
  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    localStorage.setItem('krishi_token', json.token);
    localStorage.setItem('krishi_user', JSON.stringify(json.user));
    if (json.user.preferred_language) setLanguage(json.user.preferred_language);
    showAlert('Login successful!','success');
    setTimeout(()=> window.location.href='dashboard.html', 800);
  } catch(err){ showAlert(err.message,'error'); }
}
async function loadProfile() {
  try {
    const user = await apiFetch('/auth/profile');
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const phoneEl = document.getElementById('profilePhone');
    const locEl = document.getElementById('profileLocation');
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (phoneEl) phoneEl.textContent = user.phone;
    if (locEl) locEl.textContent = user.location || '-';
    // fill form
    const form = document.getElementById('profileForm');
    if (form) {
      form.name.value = user.name;
      form.location.value = user.location || '';
      if (form.preferred_language) form.preferred_language.value = user.preferred_language;
    }
  } catch(e){ console.error(e); if(e.message.includes('token')) window.location.href='login.html'; }
}
document.addEventListener('DOMContentLoaded', ()=>{
  const regForm = document.getElementById('registerForm');
  if (regForm) regForm.addEventListener('submit', handleRegister);
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (document.getElementById('profileName')) loadProfile();
});
