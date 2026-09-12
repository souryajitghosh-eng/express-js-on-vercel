/**
 * VoyaPulse Application Controller
 * Handles user interactions, dual-mode switcher, dynamic rendering, modals & toasts
 */

document.addEventListener('DOMContentLoaded', () => {
  initDualMode();
  renderSynergyBundles();
  renderDestinations('all');
  initItineraryGenerator();
  initRevPARSimulator();
  initModals();
  initDestinationFilters();
});

// Toast system
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✓' : 'ℹ';
  toast.innerHTML = `<span style="color: var(--accent-emerald); font-weight: bold;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// 1. Dual Mode Switcher (Travelers vs Hoteliers)
function initDualMode() {
  const travelerBtn = document.getElementById('mode-traveler-btn');
  const hotelierBtn = document.getElementById('mode-hotelier-btn');
  const travelerSections = document.querySelectorAll('.traveler-view');
  const hotelierSections = document.querySelectorAll('.hotelier-view');

  if (!travelerBtn || !hotelierBtn) return;

  function setMode(mode) {
    if (mode === 'traveler') {
      travelerBtn.classList.add('active');
      hotelierBtn.classList.remove('active', 'b2b-active');
      travelerSections.forEach(s => s.style.display = 'block');
      hotelierSections.forEach(s => s.style.display = 'none');
      showToast('Switched to Traveler Mode: Discover off-peak perks & AI itineraries.');
    } else {
      hotelierBtn.classList.add('active', 'b2b-active');
      travelerBtn.classList.remove('active');
      travelerSections.forEach(s => s.style.display = 'none');
      hotelierSections.forEach(s => s.style.display = 'block');
      showToast('Switched to Hotelier & Partner Mode: Calculate RevPAR & empty room yield.');
      // Recalculate simulator when switching
      if (window.updateSimOutputs) window.updateSimOutputs();
    }
  }

  travelerBtn.addEventListener('click', () => setMode('traveler'));
  hotelierBtn.addEventListener('click', () => setMode('hotelier'));
}

// 2. Render Synergy Bundles
function renderSynergyBundles() {
  const container = document.getElementById('bundles-container');
  if (!container || !window.VoyaData) return;

  const bundles = window.VoyaData.synergyBundles;

  container.innerHTML = bundles.map(bundle => {
    return `
      <div class="bundle-card">
        <div class="bundle-media">
          <img src="${getDestinationImage(bundle.destinationId)}" alt="${bundle.title}" class="bundle-image" loading="lazy">
          <div class="bundle-pill-badge">${bundle.badge}</div>
          <div class="bundle-savings-tag">Save $${bundle.totalSavings}</div>
        </div>
        <div class="bundle-body">
          <div class="bundle-destination">${bundle.destinationName}</div>
          <h3 class="bundle-title">${bundle.title}</h3>

          <ul class="bundle-breakdown-list">
            <li class="bundle-breakdown-item">
              <span class="breakdown-label">🏨 ${bundle.hotelName} (${bundle.nights} Nights)</span>
              <span class="breakdown-price">$${bundle.hotelPricePerNight * bundle.nights}</span>
            </li>
            <li class="bundle-breakdown-item">
              <span class="breakdown-label">🎨 ${bundle.includedExperience}</span>
              <span class="breakdown-price">$${bundle.experiencePrice}</span>
            </li>
            <li class="bundle-breakdown-item">
              <span class="breakdown-label">🚆 ${bundle.includedTransport}</span>
              <span class="breakdown-price">$${bundle.transportPrice}</span>
            </li>
            <li class="bundle-breakdown-item" style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px;">
              <span class="breakdown-label" style="color: var(--text-highlight);">🌱 Impact: ${bundle.co2Score}</span>
              <span class="breakdown-price" style="color: var(--accent-amber);">${bundle.hotelNetProfitBoost}</span>
            </li>
          </ul>

          <div class="bundle-pricing-footer">
            <div class="price-box">
              <span class="unbundled-was">Regular: $${bundle.totalUnbundledPrice}</span>
              <div class="bundle-final-price">$${bundle.synergyBundlePrice} <span>/ total package</span></div>
            </div>
            <button class="btn btn-primary book-bundle-btn" data-bundle-id="${bundle.id}">
              Book Pass ➔
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to Book Pass buttons
  document.querySelectorAll('.book-bundle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bundleId = e.currentTarget.getAttribute('data-bundle-id');
      const bundle = window.VoyaData.synergyBundles.find(b => b.id === bundleId);
      if (bundle) {
        openUnifiedPassModal({
          title: bundle.title,
          destination: bundle.destinationName,
          hotel: bundle.hotelName,
          experience: bundle.includedExperience,
          transport: bundle.includedTransport,
          price: bundle.synergyBundlePrice,
          savings: bundle.totalSavings,
          nights: bundle.nights
        });
      }
    });
  });
}

function getDestinationImage(destId) {
  const dest = window.VoyaData.destinations.find(d => d.id === destId);
  return dest ? dest.image : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
}

// 3. Render Destinations & Hidden Gem Explorer
function renderDestinations(filterVibe = 'all') {
  const container = document.getElementById('destinations-container');
  if (!container || !window.VoyaData) return;

  const filtered = window.VoyaData.destinations.filter(d => {
    if (filterVibe === 'all') return true;
    return d.vibe.some(v => v.toLowerCase() === filterVibe.toLowerCase());
  });

  container.innerHTML = filtered.map(dest => {
    return `
      <div class="dest-card">
        <div class="dest-media">
          <img src="${dest.image}" alt="${dest.name}" class="dest-img" loading="lazy">
          <div class="alternative-badge">Alternative to ${dest.alternativeTo}</div>
        </div>
        <div class="dest-body">
          <div style="font-size: 0.8rem; color: var(--text-highlight); font-weight: 700; margin-bottom: 4px;">${dest.badge}</div>
          <h3 class="dest-title">${dest.name}, ${dest.country}</h3>
          <p class="dest-desc">${dest.description}</p>
          <div class="dest-stats-bar">
            <span class="eco-score-tag">🌿 Eco Score: ${dest.ecoScore}/100</span>
            <span style="color: var(--text-muted); font-weight: 600;">${dest.localEconRetention} Retained Locally</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initDestinationFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      renderDestinations(filter);
    });
  });
}

// 4. Interactive AI Itinerary Generator
function initItineraryGenerator() {
  const vibeSelect = document.getElementById('itinerary-vibe');
  const durationSelect = document.getElementById('itinerary-duration');
  const styleSelect = document.getElementById('itinerary-style');
  const generateBtn = document.getElementById('generate-itinerary-btn');
  const resultArea = document.getElementById('itinerary-result-area');

  if (!generateBtn || !resultArea) return;

  function runGeneration() {
    const vibe = vibeSelect.value;
    const duration = parseInt(durationSelect.value, 10);
    const style = styleSelect.value;

    const plan = window.ItineraryEngine.generate({ vibe, duration, style });
    if (!plan) return;

    resultArea.innerHTML = `
      <div class="itinerary-result-card">
        <div class="itinerary-header-banner">
          <div class="itinerary-destination-info">
            <div style="color: var(--accent-teal); font-weight: 700; font-size: 0.85rem; text-transform: uppercase;">
              AI Smart Dispersal Match
            </div>
            <h3>${plan.durationDays}-Day ${plan.destination.name} Synergy Retreat</h3>
            <p style="color: var(--text-muted);">${plan.destination.tagline}</p>
          </div>
          <div class="itinerary-badges">
            <span class="badge-tag accent">🌿 Eco-Score: ${plan.destination.ecoScore}/100</span>
            <span class="badge-tag">🏨 ${plan.hotel.name}</span>
            <span class="badge-tag">🎨 ${plan.experience.badge}</span>
          </div>
        </div>

        <div class="itinerary-timeline">
          ${plan.days.map(d => `
            <div class="timeline-day">
              <div class="timeline-node">${d.day}</div>
              <h4 class="day-title">Day ${d.day}: ${d.title}</h4>
              <div class="day-details-grid">
                <div class="detail-item">
                  <span>🏨 <strong>Stay:</strong> ${d.hotelAction}</span>
                </div>
                <div class="detail-item">
                  <span>🎨 <strong>Experience:</strong> ${d.experienceAction}</span>
                </div>
                <div class="detail-item">
                  <span>🚆 <strong>Transit:</strong> ${d.mobility}</span>
                </div>
                <div class="detail-item">
                  <span>💚 <strong>Community Impact:</strong> ${d.localImpact}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="itinerary-financial-summary">
          <div class="financial-metric-group">
            <div class="fin-metric">
              <div class="lbl">Unbundled OTA Total</div>
              <div class="val" style="text-decoration: line-through; color: var(--text-dim);">$${plan.pricing.totalUnbundled}</div>
            </div>
            <div class="fin-metric">
              <div class="lbl">Synergy Bundle Price</div>
              <div class="val highlight">$${plan.pricing.synergyTotal}</div>
            </div>
            <div class="fin-metric">
              <div class="lbl">Your Savings</div>
              <div class="val" style="color: var(--accent-amber);">$${plan.pricing.totalSaved} (${plan.pricing.percentageSaved}%)</div>
            </div>
            <div class="fin-metric">
              <div class="lbl">Local Retention</div>
              <div class="val" style="font-size: 0.95rem; color: var(--text-highlight);">${plan.pricing.localEconomyContribution}</div>
            </div>
          </div>
          <button class="btn btn-primary" id="claim-itinerary-btn">
            Claim This Unified Pass ➔
          </button>
        </div>
      </div>
    `;

    document.getElementById('claim-itinerary-btn').addEventListener('click', () => {
      openUnifiedPassModal({
        title: `${plan.durationDays}-Day ${plan.destination.name} Synergy Pass`,
        destination: plan.destination.name,
        hotel: plan.hotel.name,
        experience: plan.experience.title,
        transport: "Regional Green Transit & E-Bikes",
        price: plan.pricing.synergyTotal,
        savings: plan.pricing.totalSaved,
        nights: plan.nights
      });
    });

    showToast('AI Smart Dispersal Itinerary generated!');
  }

  generateBtn.addEventListener('click', runGeneration);
  // Run on initial load
  runGeneration();
}

// 5. B2B Hotelier RevPAR & Occupancy Simulator
function initRevPARSimulator() {
  const roomsInput = document.getElementById('sim-rooms');
  const adrInput = document.getElementById('sim-adr');
  const occInput = document.getElementById('sim-occ');
  const otaInput = document.getElementById('sim-ota');

  const roomsVal = document.getElementById('val-rooms');
  const adrVal = document.getElementById('val-adr');
  const occVal = document.getElementById('val-occ');
  const otaVal = document.getElementById('val-ota');

  const outTotalUplift = document.getElementById('out-total-uplift');
  const outNewOcc = document.getElementById('out-new-occ');
  const outRecoveredNights = document.getElementById('out-recovered-nights');
  const outCommissionSaved = document.getElementById('out-commission-saved');
  const outRevPARGrowth = document.getElementById('out-revpar-growth');

  if (!roomsInput || !adrInput || !occInput || !otaInput) return;

  function update() {
    const totalRooms = parseInt(roomsInput.value, 10);
    const averageDailyRate = parseInt(adrInput.value, 10);
    const currentOccupancy = parseInt(occInput.value, 10);
    const otaCommissionRate = parseInt(otaInput.value, 10);

    roomsVal.textContent = totalRooms;
    adrVal.textContent = `$${averageDailyRate}`;
    occVal.textContent = `${currentOccupancy}%`;
    otaVal.textContent = `${otaCommissionRate}%`;

    const sim = window.OccupancySimulator.calculate({
      totalRooms,
      averageDailyRate,
      currentOccupancy,
      otaCommissionRate
    });

    const res = sim.results;

    outTotalUplift.textContent = `+$${res.totalAnnualProfitUplift.toLocaleString()}`;
    outNewOcc.textContent = `${res.newOccupancyRate}% (+${res.occupancyLiftPercentage}%)`;
    outRecoveredNights.textContent = `${res.recoveredEmptyNights.toLocaleString()} room nights`;
    outCommissionSaved.textContent = `$${res.commissionSavedOnShift.toLocaleString()}`;
    outRevPARGrowth.textContent = `+${res.revParGrowth}% ($${res.baselineRevPAR} → $${res.newRevPAR})`;
  }

  roomsInput.addEventListener('input', update);
  adrInput.addEventListener('input', update);
  occInput.addEventListener('input', update);
  otaInput.addEventListener('input', update);

  window.updateSimOutputs = update;
  update();
}

// 6. Unified Tourism Pass Modal (Digital Pass)
function initModals() {
  const passModal = document.getElementById('pass-modal');
  const partnerModal = document.getElementById('partner-modal');
  const closeButtons = document.querySelectorAll('.modal-close-btn');

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (passModal) passModal.classList.remove('active');
      if (partnerModal) partnerModal.classList.remove('active');
    });
  });

  // Close when clicking backdrop
  [passModal, partnerModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  // Partner Onboarding Form
  const partnerForm = document.getElementById('partner-onboarding-form');
  if (partnerForm) {
    partnerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      partnerModal.classList.remove('active');
      showToast('Application received! A VoyaPulse regional coordinator will contact you within 24 hours.', 'success');
      partnerForm.reset();
    });
  }

  // Open Partner Modal buttons
  document.querySelectorAll('.open-partner-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (partnerModal) partnerModal.classList.add('active');
    });
  });
}

function openUnifiedPassModal({ title, destination, hotel, experience, transport, price, savings, nights }) {
  const modal = document.getElementById('pass-modal');
  const passContent = document.getElementById('pass-modal-content');
  if (!modal || !passContent) return;

  const passCode = 'VP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const roomPin = Math.floor(1000 + Math.random() * 9000);

  passContent.innerHTML = `
    <div class="digital-pass">
      <div class="pass-header">
        <div class="pass-header-brand">
          <div class="brand-icon" style="width: 32px; height: 32px; font-size: 1rem;">✈</div>
          <span>VoyaPulse Unified Pass</span>
        </div>
        <div class="pass-type-badge">All-in-One Synergy Voucher</div>
      </div>

      <div class="pass-ticket-body">
        <div class="pass-row">
          <div class="pass-field">
            <div class="label">Pass Holder</div>
            <div class="val">Alex Morgan (Verified)</div>
          </div>
          <div class="pass-field">
            <div class="label">Destination</div>
            <div class="val">${destination}</div>
          </div>
          <div class="pass-field">
            <div class="label">Pass ID</div>
            <div class="val" style="color: var(--accent-amber);">${passCode}</div>
          </div>
        </div>

        <div class="pass-row">
          <div class="pass-field">
            <div class="label">Boutique Lodging</div>
            <div class="val">${hotel}</div>
            <div style="font-size: 0.78rem; color: var(--text-highlight);">Keyless Smart PIN: #${roomPin}</div>
          </div>
          <div class="pass-field">
            <div class="label">Host Experience</div>
            <div class="val">${experience}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Direct Artisan Guild Pass</div>
          </div>
          <div class="pass-field">
            <div class="label">Green Mobility</div>
            <div class="val">${transport}</div>
            <div style="font-size: 0.78rem; color: var(--accent-teal);">Active for ${nights} days</div>
          </div>
        </div>

        <div class="pass-qr-section">
          <div class="mock-qr-code">
            <svg viewBox="0 0 100 100" fill="#090d16">
              <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM40 40h20v20H40zM70 40h10v10H70zM80 50h20v10H80zM40 70h10v20H40zM60 70h10v10H60zM80 80h20v20H80zM60 90h10v10H60z" />
            </svg>
          </div>
          <div class="qr-instructions">
            <strong>Scan at Hotel, Guide Check-in & Artisan Shops</strong>
            <p>This single cryptographic pass verifies your check-in, unlocks your room PIN, and entitles you to 10% off at 28 certified local village craft shops.</p>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-dim);">Total Bundle Paid:</span>
          <span style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-left: 6px;">$${price}</span>
          <span style="color: var(--accent-emerald); font-weight: 700; font-size: 0.85rem; margin-left: 8px;">(Saved $${savings})</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="alert('Digital pass link copied to clipboard!')">Copy Link</button>
          <button class="btn btn-primary" onclick="showToast('Apple Wallet & PDF Pass saved!', 'success'); document.getElementById('pass-modal').classList.remove('active');">
            Add to Apple Wallet / PDF
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}
