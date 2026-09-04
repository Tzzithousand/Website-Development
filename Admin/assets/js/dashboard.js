/**
 * TRES MARIAS CATERING SERVICES - ADMIN DASHBOARD SCRIPT
 * File: assets/js/dashboard.js
 * Synchronized with reservation.js via shared localStorage.
 * Handles revenue bar graph, calendar widget, dynamic package category icons,
 * sidebar toggles, search navigation, and profile actions.
 */

const STORAGE_KEY = 'tres_marias_reservations';
const NOTIFICATIONS_STORAGE_KEY = 'tres_marias_notifications';

const DEFAULT_WEDDING_RESERVATION = [
  {
    id: 'RES-151026-0001',
    code: '#RES - 15/10/26 - 0001',
    name: 'Maria Cristina Santos',
    phone: '0917-889-2341',
    email: 'cristina.santos@email.com',
    guestCount: 150,
    eventDateTime: 'October 15, 2026 • 5:00 PM - 10:00 PM',
    eventDateRaw: '2026-10-15',
    location: 'The Glass Garden Events Venue, Pasig City',
    category: 'Wedding',
    categoryIcon: 'ring',
    selectedPackage: 'Grand Royal Buffet Package (Gold Tier)',
    selectedFoods: 'Beef Roast with Mushroom Truffle Gravy, Honey Glazed Atlantic Salmon, Buttered Vegetable Medley, Fettuccine Alfredo Carbonara, Steamed Pandan Jasmine Rice, Mango Tart & Creme Brulee',
    inclusions: 'Complete presidential & floral centerpiece setup, 3-tiered cake table, welcome signature cocktail drinks, dessert buffet bar, sound system, full waitstaff',
    colors: ['#1E3A8A', '#C5A059', '#F8FAFC'],
    stylingNote: 'Theme: Modern Romantic Elegance with warm ambient fairy lights. Prefer low floral centerpieces for guest tables and cascading floral arrangement for the head table.',
    logistics: {
      tables: true,
      chairs: true,
      plates: true,
      chafing: true,
      glasses: true,
      linens: true,
      sound: true,
      lighting: false,
      host: true,
      clown: false,
      photobooth: false,
      waitstaff: true
    },
    quotation: '₱ 112,500.00',
    quotationRaw: 112500,
    downpayment: '₱ 30,000.00',
    downpaymentRaw: 30000,
    balance: '₱ 82,500.00',
    balanceRaw: 82500,
    status: 'Approved'
  }
];

function loadReservations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Auto-migrate legacy format (#RES - 2026 - 0184) to requested (#RES - 15/10/26 - 0001)
        let migrated = false;
        parsed.forEach((res) => {
          if (!res.code || res.code.includes('2026 - 0184') || res.id === 'RES-2026-0184') {
            res.id = 'RES-151026-0001';
            res.code = '#RES - 15/10/26 - 0001';
            migrated = true;
          }
        });
        if (migrated) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading reservations from localStorage:', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WEDDING_RESERVATION));
  return DEFAULT_WEDDING_RESERVATION;
}

function saveReservations(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving reservations to localStorage:', e);
  }
}

// Global revenue data model
const REVENUE_DATA = {
  month: {
    title: 'Monthly Revenue (2026)',
    total: '₱0.00',
    meta: '0.0% vs last month',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    currentIdx: -1
  },
  week: {
    title: 'Weekly Revenue (Current Week)',
    total: '₱0.00',
    meta: '0.0% vs last week',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [0, 0, 0, 0, 0, 0, 0],
    currentIdx: -1
  },
  day: {
    title: "Today's Hourly Revenue (Sep 04)",
    total: '₱0.00',
    meta: 'No transactions today',
    labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
    values: [0, 0, 0, 0, 0, 0, 0, 0],
    currentIdx: -1
  }
};

let currentPeriod = 'month';
const EVENTS_DATABASE = {};
let currentCalDate = new Date(2026, 8, 4); // September 4, 2026

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  syncDashboardWithReservations();
  initCalendar();
  initProfileDropdown();
  initNotificationsSystem();
  initEventActions();
  initSearch();

  // Cross-page storage event listeners
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      syncDashboardWithReservations();
    }
    if (e.key === NOTIFICATIONS_STORAGE_KEY) {
      updateNotificationUI();
    }
  });
});

/* ==================== 1. SIDEBAR TOGGLE ==================== */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
}

/* ==================== 2. DATA SYNCHRONIZATION WITH RESERVATIONS ==================== */
function syncDashboardWithReservations() {
  const reservations = loadReservations();
  const activeBookings = reservations.filter((r) => r.status !== 'Cancelled');
  const pendingBookings = reservations.filter((r) => r.status && r.status.toLowerCase() === 'pending');

  // 1. Calculate Totals
  let totalRevenue = 0;
  let totalDownpayment = 0;
  activeBookings.forEach((r) => {
    const quoteVal = r.quotationRaw || parseFloat(String(r.quotation).replace(/[^0-9.]/g, '')) || 0;
    const dpVal = r.downpaymentRaw || parseFloat(String(r.downpayment).replace(/[^0-9.]/g, '')) || 0;
    totalRevenue += quoteVal;
    totalDownpayment += dpVal;
  });

  // 2. Update Revenue Chart Data
  REVENUE_DATA.month.values = [0, 0, 0, 0, 0, 0, 0, 0, 0, totalRevenue, 0, 0];
  REVENUE_DATA.month.currentIdx = totalRevenue > 0 ? 9 : -1;
  REVENUE_DATA.month.total = totalRevenue > 0 ? `₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00';
  REVENUE_DATA.month.meta = totalRevenue > 0
    ? `₱${totalDownpayment.toLocaleString('en-US', { minimumFractionDigits: 2 })} downpayment received`
    : '0.0% vs last month';

  initRevenueChart();

  // 3. Update Net Total Card
  const netTotalEl = document.getElementById('stat-net-total');
  const netTotalMetaEl = document.getElementById('stat-net-total-meta');
  if (netTotalEl) {
    netTotalEl.textContent = totalRevenue > 0 ? `₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00';
  }
  if (netTotalMetaEl) {
    netTotalMetaEl.textContent = activeBookings.length > 0
      ? `${activeBookings.length} Active Booking • ₱${totalDownpayment.toLocaleString('en-US')} DP Received`
      : '0.0% Net Margin • No active bookings';
  }

  // 4. Update Customers Card
  const customersCountEl = document.getElementById('stat-customers-count');
  const customersMetaEl = document.getElementById('stat-customers-meta');
  if (customersCountEl) {
    customersCountEl.textContent = activeBookings.length;
  }
  if (customersMetaEl) {
    if (activeBookings.length > 0) {
      customersMetaEl.textContent = `${activeBookings[0].name} (${activeBookings[0].status})`;
    } else {
      customersMetaEl.textContent = '0 Registered Customers';
    }
  }

  // 5. Update Upcoming Event Card
  const upcomingValEl = document.getElementById('stat-upcoming-event-val');
  const upcomingMetaEl = document.getElementById('stat-upcoming-event-meta');
  const upcomingCard = document.getElementById('stat-card-upcoming-event');

  if (activeBookings.length > 0) {
    const nextEvent = activeBookings[0];
    if (upcomingValEl) {
      upcomingValEl.textContent = nextEvent.name;
      upcomingValEl.classList.remove('empty-val');
    }
    if (upcomingMetaEl) {
      upcomingMetaEl.textContent = `${nextEvent.eventDateTime.split('•')[0].trim()} • ${nextEvent.category}`;
    }
    if (upcomingCard) {
      upcomingCard.style.cursor = 'pointer';
      upcomingCard.title = 'Click to view reservation in Reservations page';
      upcomingCard.onclick = () => {
        window.location.href = 'reservation.html';
      };
    }
  } else {
    if (upcomingValEl) {
      upcomingValEl.textContent = 'No upcoming events';
      upcomingValEl.classList.add('empty-val');
    }
    if (upcomingMetaEl) {
      upcomingMetaEl.textContent = 'No scheduled events';
    }
    if (upcomingCard) {
      upcomingCard.onclick = null;
    }
  }

  // 6. Update Pending Approvals Card
  if (pendingBookings.length > 0) {
    renderPendingApprovals(pendingBookings.map((b) => ({
      id: b.id,
      name: b.name,
      date: b.eventDateTime,
      location: b.location
    })));
  } else {
    renderPendingApprovals([]);
  }

  // 7. Update Event Today (Sep 4 has 0 events)
  renderTodayEvent(null);

  // 8. Update Calendar events database
  for (const key in EVENTS_DATABASE) {
    delete EVENTS_DATABASE[key];
  }
  activeBookings.forEach((r) => {
    EVENTS_DATABASE[r.eventDateRaw] = {
      title: `${r.category}: ${r.name}`,
      time: r.eventDateTime,
      location: r.location,
      guestCount: r.guestCount,
      id: r.id
    };
  });
}

/* ==================== 3. REVENUE BAR GRAPH ==================== */
function initRevenueChart() {
  const chartSvg = document.getElementById('revenue-chart-svg');
  const totalDisplay = document.getElementById('chart-total-revenue');
  const comparisonDisplay = document.getElementById('chart-comparison-rate');
  const tooltip = document.getElementById('chart-tooltip');
  const tabButtons = document.querySelectorAll('.filter-tab');

  if (!chartSvg) return;

  function renderChart(period) {
    currentPeriod = period;
    const data = REVENUE_DATA[period];

    if (totalDisplay) totalDisplay.textContent = data.total;
    if (comparisonDisplay) comparisonDisplay.textContent = data.meta;

    const width = 680;
    const height = 200;
    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    const dataMax = Math.max(...data.values);
    const maxVal = dataMax > 0 ? dataMax * 1.15 : 100000;
    const barCount = data.values.length;
    const barGap = 12;
    const barWidth = Math.max(16, (chartWidth - (barCount - 1) * barGap) / barCount);

    let svgHtml = `
      <defs>
        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dfba73" />
          <stop offset="100%" stop-color="#c5a059" />
        </linearGradient>
      </defs>
    `;

    // Horizontal grid lines
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (chartHeight / 3) * i;
      const val = Math.round(maxVal - (maxVal / 3) * i);
      svgHtml += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" class="chart-grid-line" />
        <text x="${padLeft - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-text">₱${(val / 1000).toFixed(0)}k</text>
      `;
    }

    // Render bars
    data.values.forEach((val, index) => {
      const barH = dataMax > 0 ? (val / maxVal) * chartHeight : 0;
      const x = padLeft + index * (barWidth + barGap);
      const y = padTop + (chartHeight - barH);
      const label = data.labels[index];
      const isCurrent = index === data.currentIdx;

      svgHtml += `
        <g class="chart-bar-group" data-label="${label}" data-value="₱${val.toLocaleString()}">
          <rect 
            x="${x}" 
            y="${y}" 
            width="${barWidth}" 
            height="${barH}" 
            fill="url(#goldGradient)"
            rx="4"
            class="chart-bar"
            style="${isCurrent ? 'stroke: #ffffff; stroke-width: 1.5px; filter: drop-shadow(0 0 6px rgba(197, 160, 89, 0.5));' : ''}"
          />
          <text 
            x="${x + barWidth / 2}" 
            y="${height - 8}" 
            text-anchor="middle" 
            class="chart-axis-text"
            style="${isCurrent ? 'font-weight: 700; fill: #ffffff;' : ''}"
          >${label}</text>
        </g>
      `;
    });

    chartSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chartSvg.innerHTML = svgHtml;

    // Attach hover tooltip listeners
    const barGroups = chartSvg.querySelectorAll('.chart-bar-group');
    barGroups.forEach((group) => {
      group.addEventListener('mouseenter', () => {
        if (!tooltip) return;
        const label = group.getAttribute('data-label');
        const val = group.getAttribute('data-value');
        tooltip.innerHTML = `<strong>${label}</strong>: ${val}`;
        tooltip.style.opacity = '1';

        const rect = group.querySelector('rect').getBoundingClientRect();
        const containerRect = chartSvg.parentElement.getBoundingClientRect();
        const left = rect.left - containerRect.left + rect.width / 2;
        const top = rect.top - containerRect.top;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      });

      group.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.style.opacity = '0';
      });
    });
  }

  // Filter Tab Switching
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const period = btn.getAttribute('data-period');
      renderChart(period);
    });
  });

  renderChart(currentPeriod);
}

/* ==================== 4. DASHBOARD CALENDAR WIDGET ==================== */
function initCalendar() {
  const monthYearLabel = document.getElementById('cal-month-year');
  const daysGrid = document.getElementById('cal-days-grid');
  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  const previewText = document.getElementById('cal-event-text');

  if (!daysGrid) return;

  function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (monthYearLabel) {
      monthYearLabel.textContent = `${monthNames[month]} ${year}`;
    }

    daysGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Days from previous month
    for (let i = firstDayIndex; i > 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.textContent = prevMonthDays - i + 1;
      daysGrid.appendChild(cell);
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      cell.textContent = d;

      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Is today (Sep 4, 2026)?
      if (year === 2026 && month === 8 && d === 4) {
        cell.classList.add('today');
      }

      // Has event from synced reservations?
      if (EVENTS_DATABASE[dateKey]) {
        cell.classList.add('has-event');
        cell.title = EVENTS_DATABASE[dateKey].title;
      }

      cell.addEventListener('click', () => {
        document.querySelectorAll('.cal-day-cell').forEach((c) => (c.style.outline = 'none'));
        cell.style.outline = '2px solid #c5a059';

        if (EVENTS_DATABASE[dateKey]) {
          const ev = EVENTS_DATABASE[dateKey];
          previewText.innerHTML = `
            <strong>${d} ${monthNames[month]}:</strong> ${ev.title}<br>
            <span style="color:#64748b">${ev.time} • ${ev.location}</span><br>
            <a href="reservation.html" style="display:inline-block; margin-top:6px; color:#c5a059; font-weight:700; text-decoration:underline;">Open in Reservations &rarr;</a>
          `;
        } else {
          previewText.textContent = `${d} ${monthNames[month]} ${year}: No scheduled events.`;
        }
      });

      daysGrid.appendChild(cell);
    }

    // Trailing days
    const totalCells = firstDayIndex + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let j = 1; j <= remaining; j++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.textContent = j;
      daysGrid.appendChild(cell);
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentCalDate.setMonth(currentCalDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentCalDate.setMonth(currentCalDate.getMonth() + 1);
      renderCalendar();
    });
  }

  renderCalendar();
}

/* ==================== 5. PACKAGE CATEGORY ICONS & DYNAMIC RENDERING ==================== */
const PACKAGE_CATEGORY_ICONS = {
  wedding: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" title="Wedding Package">
      <circle cx="12" cy="14" r="7"></circle>
      <path d="M12 7l-2-3h4l-2 3z"></path>
    </svg>
  `
};

function renderTodayEvent(eventData = null) {
  const emptyBox = document.getElementById('event-today-empty-state');
  const infoList = document.getElementById('event-today-info-list');
  const iconBox = document.getElementById('event-today-category-icon');
  const tag = document.getElementById('tag-event-today');

  if (!eventData) {
    if (emptyBox) emptyBox.style.display = 'flex';
    if (infoList) infoList.style.display = 'none';
    if (iconBox) {
      iconBox.style.display = 'none';
      iconBox.innerHTML = '';
      iconBox.className = 'event-category-icon-box';
    }
    if (tag) {
      tag.textContent = '0 Events';
      tag.className = 'event-tag empty-tag';
    }
    return;
  }

  if (emptyBox) emptyBox.style.display = 'none';
  if (infoList) infoList.style.display = 'flex';

  const nameEl = document.getElementById('today-event-name');
  const dateEl = document.getElementById('today-event-date');
  const locEl = document.getElementById('today-event-location');

  if (nameEl) nameEl.textContent = eventData.name || '--';
  if (dateEl) dateEl.textContent = eventData.date || '--';
  if (locEl) locEl.textContent = eventData.location || '--';

  if (iconBox) {
    iconBox.style.display = 'flex';
    iconBox.className = 'event-category-icon-box category-wedding';
    iconBox.innerHTML = PACKAGE_CATEGORY_ICONS.wedding;
    iconBox.setAttribute('title', 'Wedding Package');
  }

  if (tag) {
    tag.textContent = 'Scheduled Today';
    tag.className = 'event-tag today';
  }
}

function renderPendingApprovals(pendingList = []) {
  const emptyBox = document.getElementById('pending-empty-state');
  const infoList = document.getElementById('pending-info-list');
  const actionsBox = document.getElementById('pending-actions');
  const tag = document.getElementById('tag-pending-approval');

  if (!pendingList || pendingList.length === 0) {
    if (emptyBox) emptyBox.style.display = 'flex';
    if (infoList) infoList.style.display = 'none';
    if (actionsBox) actionsBox.style.display = 'none';
    if (tag) {
      tag.textContent = '0 Pending';
      tag.className = 'event-tag empty-tag';
    }
    return;
  }

  const item = pendingList[0];
  if (emptyBox) emptyBox.style.display = 'none';
  if (infoList) infoList.style.display = 'flex';
  if (actionsBox) actionsBox.style.display = 'flex';

  const nameEl = document.getElementById('pending-event-name');
  const dateEl = document.getElementById('pending-event-date');
  const locEl = document.getElementById('pending-event-location');

  if (nameEl) nameEl.textContent = item.name || '--';
  if (dateEl) dateEl.textContent = item.date || '--';
  if (locEl) locEl.textContent = item.location || '--';

  if (tag) {
    tag.textContent = `${pendingList.length} For Verification`;
    tag.className = 'event-tag pending';
  }
}

/* ==================== 6. PROFILE DROPDOWN ==================== */
function initProfileDropdown() {
  const profileBtn = document.getElementById('profile-menu-btn');
  const dropdown = document.getElementById('profile-dropdown');

  if (profileBtn && dropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = dropdown.classList.toggle('show');
      profileBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });

    document.addEventListener('click', () => {
      if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        profileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        profileBtn.setAttribute('aria-expanded', 'false');
        profileBtn.focus();
      }
    });
  }
}

/* ==================== 7. QUICK ACTIONS (APPROVE / REVIEW) ==================== */
function initEventActions() {
  const approveBtn = document.getElementById('btn-approve-pending');
  const reviewBtn = document.getElementById('btn-review-pending');

  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      const reservations = loadReservations();
      const pendingRes = reservations.find((r) => r.status === 'Pending');
      if (pendingRes) {
        pendingRes.status = 'Approved';
        saveReservations(reservations);
      }
      approveBtn.textContent = 'Approved ✓';
      approveBtn.style.backgroundColor = '#10b981';
      approveBtn.style.color = '#ffffff';
      approveBtn.disabled = true;

      const tag = document.getElementById('tag-pending-approval');
      if (tag) {
        tag.textContent = 'Approved';
        tag.className = 'event-tag today';
      }

      setTimeout(() => {
        syncDashboardWithReservations();
      }, 500);
    });
  }

  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      window.location.href = 'reservation.html';
    });
  }
}

/* ==================== 8. SEARCH BAR INTERACTION ==================== */
function initSearch() {
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `reservation.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

/* ==================== 9. NOTIFICATIONS SYSTEM ==================== */
function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading notifications:', e);
  }
  return [];
}

function saveNotifications(items) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

function updateNotificationUI() {
  const notifs = loadNotifications();
  const unreadCount = notifs.filter((n) => !n.read).length;
  const badge = document.getElementById('notification-badge');
  const container = document.getElementById('notification-list-container');

  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  if (container) {
    if (notifs.length === 0) {
      container.innerHTML = `
        <div class="notification-empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <p>No new notifications</p>
          <span>Reservation alerts and system updates will appear here once online.</span>
        </div>
      `;
    } else {
      container.innerHTML = notifs
        .map(
          (n) => `
        <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${escapeHtml(n.id || '')}">
          <div class="notif-dot"></div>
          <div class="notif-info">
            <div class="notif-title">${escapeHtml(n.title)}</div>
            <div class="notif-desc">${escapeHtml(n.message || '')}</div>
            <div class="notif-time">${escapeHtml(n.time || '')}</div>
          </div>
        </div>
      `
        )
        .join('');
    }
  }
}

function initNotificationsSystem() {
  const btn = document.getElementById('btn-notifications');
  const dropdown = document.getElementById('notification-dropdown');
  const markAllBtn = document.getElementById('btn-mark-all-read');

  if (btn && dropdown) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const profileMenu = document.getElementById('profile-dropdown');
      if (profileMenu) profileMenu.classList.remove('show');

      dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', dropdown.classList.contains('open') ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const notifs = loadNotifications();
      notifs.forEach((n) => {
        n.read = true;
      });
      saveNotifications(notifs);
      updateNotificationUI();
    });
  }

  updateNotificationUI();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
