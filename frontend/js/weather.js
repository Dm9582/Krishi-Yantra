async function fetchWeather(location='Sehore') {
  try {
    const data = await apiFetch(`/weather?location=${encodeURIComponent(location)}`);
    return data;
  } catch(e){
    // fallback mock
    return { location, temperature:28, humidity:65, rainProbability:20, condition:'Sunny', forecast:[] };
  }
}
async function fetchRecommendation(equipmentType, date, location) {
  try {
    const params = new URLSearchParams({ equipmentType, location: location||'Sehore' });
    if (date) params.append('date', date);
    return await apiFetch(`/weather/recommendation?${params.toString()}`);
  } catch(e){ return null; }
}
function renderWeatherSummary(weather, containerId='weatherSummary') {
  const container = document.getElementById(containerId);
  if (!container || !weather) return;
  container.innerHTML = `
    <div class="weather-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; opacity:0.9;"><i class="fa-solid fa-location-dot"></i> ${weather.location}</div>
          <div class="weather-temp">${weather.temperature}°C</div>
          <div>${weather.condition} • ${weather.humidity}% Humidity</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.1rem; font-weight:700;">${weather.rainProbability}% <span data-i18n="rain_probability">Rain Probability</span></div>
          <div><i class="fa-solid fa-wind"></i> ${weather.windSpeed} km/h</div>
        </div>
      </div>
      ${weather.forecast ? `<div style="display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-top:16px; text-align:center; font-size:0.85rem;">
        ${weather.forecast.slice(0,5).map(f=>`<div style="background:rgba(255,255,255,0.2); padding:8px; border-radius:8px;"><div>${f.day}</div><div style="font-weight:700;">${f.temp}°C</div><div>${f.rainProbability}%</div></div>`).join('')}
      </div>`:''}
    </div>
  `;
  applyTranslations();
}
function renderRecommendation(rec, containerId='weatherRecommendation') {
  const container = document.getElementById(containerId);
  if (!container || !rec) { if(container) container.innerHTML=''; return; }
  const cls = rec.recommendation.recommended ? (rec.recommendation.icon==='⚠️'?'warn':'good') : 'bad';
  container.innerHTML = `
    <div class="recommendation ${cls}">
      <div style="font-size:1.1rem; margin-bottom:6px;"><i class="fa-solid fa-cloud-sun"></i> 🌦️ Weather Recommendation</div>
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <span><strong>${rec.date}</strong> • ${rec.weather.temperature}°C • ${rec.weather.rainProbability}% <span data-i18n="rain_probability">Rain Probability</span></span>
      </div>
      <div style="margin-top:8px; font-size:1.05rem;">${rec.recommendation.icon} ${rec.recommendation.message}</div>
    </div>
  `;
}
async function loadWeatherForHome() {
  const loc = getUser()?.location || 'Sehore, Madhya Pradesh';
  const w = await fetchWeather(loc);
  renderWeatherSummary(w, 'weatherSummary');
  // also for dashboard
  renderWeatherSummary(w, 'dashboardWeather');
}
document.addEventListener('DOMContentLoaded', ()=>{
  if (document.getElementById('weatherSummary') || document.getElementById('dashboardWeather')) {
    loadWeatherForHome();
  }
});
