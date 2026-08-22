let currentEquipment = null;

async function loadBookingPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href='equipment.html'; return; }
  try {
    const data = await apiFetch(`/equipment/${id}`);
    currentEquipment = data;
    renderBookingEquipment(data);
    // Setup calendar with booked dates
    setBookedDates(data.bookings || []);
    // Price per day element
    const priceEl = document.getElementById('pricePerDay');
    if (priceEl) { priceEl.textContent = `₹${data.price_per_day.toLocaleString('en-IN')}`; priceEl.dataset.price = data.price_per_day; }
    // Weather recommendation hook
    setOnDateSelect(async (start, end)=>{
      if (start) {
        const rec = await fetchRecommendation(data.type, start, data.location);
        renderRecommendation(rec, 'bookingWeatherRec');
      }
    });
    // Initial recommendation for today
    const rec = await fetchRecommendation(data.type, new Date().toISOString().split('T')[0], data.location);
    renderRecommendation(rec, 'bookingWeatherRec');
  } catch(e){ showAlert(e.message,'error'); }
}
function renderBookingEquipment(eq) {
  const container = document.getElementById('bookingEquipment');
  if (!container) return;
  container.innerHTML = `
    <div style="display:flex; gap:16px; align-items:start;">
      <img src="${eq.image_url}" alt="${eq.name}" style="width:120px; height:90px; object-fit:cover; border-radius:8px; flex-shrink:0;">
      <div>
        <h3 style="font-size:1.2rem; margin-bottom:4px;">${eq.name}</h3>
        <div class="card-meta"><i class="fa-solid fa-tag"></i> ${eq.type} • ⭐ ${eq.rating}</div>
        <div class="card-meta"><i class="fa-solid fa-location-dot"></i> ${eq.location}</div>
        <div class="card-meta"><i class="fa-solid fa-user"></i> ${eq.owner_name}</div>
      </div>
    </div>
  `;
}
async function handleBookingSubmit(e) {
  e.preventDefault();
  if (!isLoggedIn()) { showAlert('Please login to book','error'); setTimeout(()=> window.location.href='login.html', 1000); return; }
  const { start, end } = getSelectedDates();
  if (!start) { showAlert('Please select rental dates','error'); return; }
  const finalEnd = end || start;
  const days = Math.ceil((parseISO(finalEnd)-parseISO(start))/(1000*60*60*24))+1;
  const total = days * currentEquipment.price_per_day;
  // Frontend double-booking check (already done in calendar) but re-check via API availability
  try {
    const avail = await apiFetch(`/equipment/${currentEquipment.id}/availability?start=${start}&end=${finalEnd}`);
    if (!avail.available) { showAlert('Equipment not available for selected dates','error'); return; }
  } catch(err){ /* ignore */ }
  try {
    const res = await apiFetch('/bookings', {
      method:'POST',
      body: JSON.stringify({ equipment_id: currentEquipment.id, start_date: start, end_date: finalEnd })
    });
    showAlert(`Booking confirmed! Total ₹${total.toLocaleString('en-IN')} for ${days} days`,'success');
    setTimeout(()=> window.location.href=`my-bookings.html`, 1200);
  } catch(err){
    if (err.message.includes('overlapping') || err.message.includes('Already booked')) {
      showAlert(err.message,'error');
    } else {
      showAlert(err.message,'error');
    }
  }
}
document.addEventListener('DOMContentLoaded', ()=>{
  if (document.getElementById('bookingEquipment')) {
    loadBookingPage();
    const form = document.getElementById('bookingForm');
    if (form) form.addEventListener('submit', handleBookingSubmit);
  }
});
