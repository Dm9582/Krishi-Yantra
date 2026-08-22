async function fetchEquipment(filters={}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.type && filters.type!=='all') params.append('type', filters.type);
  if (filters.location) params.append('location', filters.location);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  if (filters.availability) params.append('availability', filters.availability);
  if (filters.sort) params.append('sort', filters.sort);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiFetch(`/equipment${query}`);
}
function renderEquipmentCards(equipmentList, containerId='equipmentGrid') {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!equipmentList || equipmentList.length===0) {
    container.innerHTML = `<p class="text-center" style="grid-column:1/-1; padding:40px;"><span data-i18n="no_equipment">No equipment found</span></p>`;
    applyTranslations();
    return;
  }
  container.innerHTML = equipmentList.map(eq => `
    <div class="card">
      <div class="card-img">
        <img src="${eq.image_url || 'https://via.placeholder.com/400x300?text='+encodeURIComponent(eq.name)}" alt="${eq.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Krishi+Yantra'">
      </div>
      <div class="card-body">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <h3 class="card-title">${eq.name}</h3>
          <span class="badge ${eq.availability_status==='available'?'badge-available':'badge-rented'}">${eq.availability_status==='available'?t('available'):eq.availability_status}</span>
        </div>
        <div class="card-meta"><i class="fa-solid fa-tag"></i> ${eq.type} • ⭐ ${eq.rating}</div>
        <div class="card-meta"><i class="fa-solid fa-user"></i> ${eq.owner_name || 'Owner'}</div>
        <div class="card-meta"><i class="fa-solid fa-location-dot"></i> ${eq.location}</div>
        <div class="card-price">₹${eq.price_per_day.toLocaleString('en-IN')} <span>/ day</span></div>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <a href="equipment-details.html?id=${eq.id}" class="btn btn-outline" style="flex:1; padding:10px; font-size:0.95rem;"><i class="fa-solid fa-eye"></i> <span data-i18n="view_details">View Details</span></a>
          <a href="booking.html?id=${eq.id}" class="btn btn-primary" style="flex:1; padding:10px; font-size:0.95rem;"><i class="fa-solid fa-calendar-check"></i> <span data-i18n="book_now">Book Now</span></a>
        </div>
      </div>
    </div>
  `).join('');
  applyTranslations();
}
async function loadAndRenderPopular() {
  try {
    const data = await fetchEquipment({});
    const popular = data.slice(0,6);
    renderEquipmentCards(popular, 'popularGrid');
  } catch(e){ console.error(e); }
}
function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const locationFilter = document.getElementById('locationFilter');
  const priceFilter = document.getElementById('priceFilter');
  const sortFilter = document.getElementById('sortFilter');
  const searchBtn = document.getElementById('searchBtn');
  async function apply() {
    const filters = {
      search: searchInput ? searchInput.value.trim() : '',
      type: typeFilter ? typeFilter.value : 'all',
      location: locationFilter ? locationFilter.value.trim() : '',
      sort: sortFilter ? sortFilter.value : ''
    };
    if (priceFilter && priceFilter.value) {
      const [min, max] = priceFilter.value.split('-');
      if (min) filters.minPrice = min;
      if (max && max!=='10000') filters.maxPrice = max;
    }
    try {
      const data = await fetchEquipment(filters);
      renderEquipmentCards(data, 'equipmentGrid');
    } catch(e){ showAlert(e.message,'error'); }
  }
  if (searchBtn) searchBtn.addEventListener('click', apply);
  if (searchInput) searchInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') apply(); });
  if (typeFilter) typeFilter.addEventListener('change', apply);
  if (locationFilter) locationFilter.addEventListener('input', ()=>{ clearTimeout(window._locTimeout); window._locTimeout=setTimeout(apply,500); });
  if (priceFilter) priceFilter.addEventListener('change', apply);
  if (sortFilter) sortFilter.addEventListener('change', apply);
}
