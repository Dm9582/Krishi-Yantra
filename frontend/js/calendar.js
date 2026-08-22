let currentMonth = new Date();
let selectedStart = null;
let selectedEnd = null;
let bookedDatesSet = new Set();
let onDateSelectCallback = null;

function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function parseISO(str) {
  const [y,m,d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}
function addDays(dateStr, days) {
  const d = parseISO(dateStr);
  d.setDate(d.getDate()+days);
  return formatISO(d);
}
function loadBookedDates(bookings) {
  bookedDatesSet.clear();
  if (!bookings) return;
  bookings.forEach(b => {
    if (b.status==='cancelled' || b.status==='completed') return;
    let cur = b.start_date;
    const end = b.end_date;
    // Inclusive
    while (cur <= end) {
      bookedDatesSet.add(cur);
      // next day
      const d = parseISO(cur);
      d.setDate(d.getDate()+1);
      cur = formatISO(d);
    }
  });
}
function isBooked(dateStr) { return bookedDatesSet.has(dateStr); }
function isPast(dateStr) {
  const today = formatISO(new Date());
  return dateStr < today;
}
function renderCalendar() {
  const container = document.getElementById('calendar');
  if (!container) return;
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  const startWeekDay = firstDay.getDay(); // 0 Sun
  const monthName = firstDay.toLocaleDateString('en-IN', { month:'long', year:'numeric' });
  let html = `
    <div class="cal-header">
      <button id="prevMonth"><i class="fa-solid fa-chevron-left"></i></button>
      <h3 style="font-size:1.2rem;">${monthName}</h3>
      <button id="nextMonth"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
    <div class="cal-grid">
      <div class="cal-day-name">Sun</div><div class="cal-day-name">Mon</div><div class="cal-day-name">Tue</div><div class="cal-day-name">Wed</div><div class="cal-day-name">Thu</div><div class="cal-day-name">Fri</div><div class="cal-day-name">Sat</div>
  `;
  for (let i=0;i<startWeekDay;i++) html+= `<div class="cal-day" style="visibility:hidden;"></div>`;
  const todayStr = formatISO(new Date());
  for (let d=1; d<=lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const iso = formatISO(date);
    let cls = 'cal-day';
    if (iso===todayStr) cls+=' today';
    if (isBooked(iso)) cls+=' booked';
    else if (selectedStart && selectedEnd && iso>=selectedStart && iso<=selectedEnd) cls+=' selected';
    else if (selectedStart && iso===selectedStart) cls+=' selected';
    else if (!isPast(iso) && !isBooked(iso)) cls+=' available';
    // past but not booked -> available? but disable past selection
    const disabled = isBooked(iso) || isPast(iso);
    html+= `<div class="${cls}" data-date="${iso}" ${disabled?'data-disabled="true"':''}>${d}</div>`;
  }
  html+= `</div>
    <div class="legend">
      <span><i class="dot dot-available"></i> <span data-i18n="available">Available</span></span>
      <span><i class="dot dot-booked"></i> <span data-i18n="booked">Booked</span></span>
      <span><i class="dot dot-selected"></i> <span data-i18n="selected">Selected</span></span>
    </div>
  `;
  container.innerHTML = html;
  applyTranslations();
  document.getElementById('prevMonth').addEventListener('click', ()=>{ currentMonth.setMonth(currentMonth.getMonth()-1); renderCalendar(); attachDayHandlers(); });
  document.getElementById('nextMonth').addEventListener('click', ()=>{ currentMonth.setMonth(currentMonth.getMonth()+1); renderCalendar(); attachDayHandlers(); });
  attachDayHandlers();
}
function attachDayHandlers() {
  document.querySelectorAll('.cal-day[data-date]').forEach(el=>{
    if (el.dataset.disabled==='true') return;
    el.addEventListener('click', ()=>{
      const date = el.dataset.date;
      if (!selectedStart || (selectedStart && selectedEnd)) {
        selectedStart = date;
        selectedEnd = null;
      } else {
        if (date < selectedStart) {
          selectedEnd = selectedStart;
          selectedStart = date;
        } else {
          selectedEnd = date;
        }
        // Validate no booked dates in range
        let cur = selectedStart;
        while (cur <= selectedEnd) {
          if (isBooked(cur)) {
            showAlert(`Selected range includes booked date ${cur}. Please choose different dates.`,'error');
            selectedStart = date;
            selectedEnd = null;
            renderCalendar();
            updateBookingSummary();
            return;
          }
          const d = parseISO(cur); d.setDate(d.getDate()+1); cur = formatISO(d);
        }
      }
      renderCalendar();
      updateBookingSummary();
      if (onDateSelectCallback) onDateSelectCallback(selectedStart, selectedEnd);
    });
  });
}
function updateBookingSummary() {
  const startEl = document.getElementById('selectedStart');
  const endEl = document.getElementById('selectedEnd');
  const durationEl = document.getElementById('selectedDuration');
  const totalEl = document.getElementById('selectedTotal');
  if (startEl) startEl.textContent = selectedStart ? formatDate(selectedStart) : '-';
  if (endEl) endEl.textContent = selectedEnd ? formatDate(selectedEnd) : (selectedStart ? formatDate(selectedStart) : '-');
  if (durationEl && totalEl) {
    if (selectedStart) {
      const end = selectedEnd || selectedStart;
      const days = Math.ceil((parseISO(end)-parseISO(selectedStart))/(1000*60*60*24))+1;
      durationEl.textContent = `${days} ${t('days')}`;
      const pricePerDayEl = document.getElementById('pricePerDay');
      const price = pricePerDayEl ? parseInt(pricePerDayEl.dataset.price||0) : 0;
      totalEl.textContent = `₹${(days*price).toLocaleString('en-IN')}`;
      // Store for booking
      const form = document.getElementById('bookingForm');
      if (form) {
        form.dataset.start = selectedStart;
        form.dataset.end = end;
        form.dataset.days = days;
        form.dataset.total = days*price;
      }
    } else {
      durationEl.textContent = '-';
      totalEl.textContent = '-';
    }
  }
}
function getSelectedDates() { return { start: selectedStart, end: selectedEnd || selectedStart }; }
function setBookedDates(bookings) { loadBookedDates(bookings); renderCalendar(); }
function setOnDateSelect(cb) { onDateSelectCallback = cb; }
function resetCalendar() { selectedStart=null; selectedEnd=null; renderCalendar(); updateBookingSummary(); }

document.addEventListener('DOMContentLoaded', ()=>{
  if (document.getElementById('calendar')) {
    renderCalendar();
    updateBookingSummary();
  }
});
