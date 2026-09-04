/**
 * TRES MARIAS CATERING SERVICES - RESERVATION SCRIPT
 * File: assets/js/reservation.js
 * Synchronized with dashboard.js via shared localStorage.
 * Handles view switching (List vs Calendar), Reservation Details view,
 * Inline section editing, logistics checkboxes, billing actions, URL search params, and hash routing.
 */

const STORAGE_KEY = 'tres_marias_reservations';
const NOTIFICATIONS_STORAGE_KEY = 'tres_marias_notifications';

// Helper to format reservation codes as #RES - DD/MM/YY - ####
function formatReservationCode(dateInput, seqNumber = 1) {
  let d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    d = new Date(2026, 9, 15);
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const seq = String(seqNumber).padStart(4, '0');
  return `#RES - ${dd}/${mm}/${yy} - ${seq}`;
}

// Sample mock reservations data (Wedding reservation)
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

// Current State
let currentReservations = loadReservations();
let selectedReservation = currentReservations[0];
let activeView = 'list'; // 'list' | 'calendar' | 'details'
let previousView = 'list';
let calCurrentYear = 2026;
let calCurrentMonth = 9; // 0-indexed (9 = October 2026)

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  currentReservations = loadReservations();
  selectedReservation = currentReservations[0];

  initSidebar();
  initProfileDropdown();
  initNotificationsSystem();
  initViewTabs();
  initStatusFilter();
  initGlobalSearch();
  initCalendarView();
  initDetailsActions();
  initColorWheelModal();
  renderReservationList();

  // Check URL parameters for search query coming from dashboard
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam) {
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.value = searchParam;
      applyFilters();
    }
  }

  // Check URL hash for direct details view (e.g. #details or #RES)
  if (window.location.hash && (window.location.hash.includes('details') || window.location.hash.includes('RES'))) {
    switchView('details');
  }
});

/* ==================== 1. SIDEBAR & PROFILE ==================== */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
}

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

/* ==================== NOTIFICATIONS SYSTEM ==================== */
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

  window.addEventListener('storage', (e) => {
    if (e.key === NOTIFICATIONS_STORAGE_KEY) {
      updateNotificationUI();
    }
  });

  updateNotificationUI();
}

/* ==================== 2. VIEW SWITCHER TABS ==================== */
function initViewTabs() {
  const tabList = document.getElementById('tab-view-list');
  const tabCalendar = document.getElementById('tab-view-calendar');

  if (tabList) {
    tabList.addEventListener('click', () => {
      switchView('list');
    });
  }

  if (tabCalendar) {
    tabCalendar.addEventListener('click', () => {
      switchView('calendar');
    });
  }

  const backBtn = document.getElementById('btn-back-reservation');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      switchView(previousView === 'details' ? 'list' : previousView);
    });
  }
}

function switchView(viewName) {
  const listContainer = document.getElementById('reservation-list-view');
  const calContainer = document.getElementById('reservation-calendar-view');
  const detailsContainer = document.getElementById('reservation-details-view');
  const tabList = document.getElementById('tab-view-list');
  const tabCalendar = document.getElementById('tab-view-calendar');
  const tabControlsRight = document.getElementById('view-tabs-right-controls');

  if (activeView !== 'details') {
    previousView = activeView;
  }
  activeView = viewName;

  if (viewName === 'list') {
    currentReservations = loadReservations();
    applyFilters();
    renderReservationList();
    if (listContainer) listContainer.style.display = 'flex';
    if (calContainer) calContainer.style.display = 'none';
    if (detailsContainer) detailsContainer.style.display = 'none';
    if (tabList) tabList.classList.add('active');
    if (tabCalendar) tabCalendar.classList.remove('active');
    if (tabControlsRight) tabControlsRight.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'calendar') {
    currentReservations = loadReservations();
    if (listContainer) listContainer.style.display = 'none';
    if (calContainer) calContainer.style.display = 'flex';
    if (detailsContainer) detailsContainer.style.display = 'none';
    if (tabList) tabList.classList.remove('active');
    if (tabCalendar) tabCalendar.classList.add('active');
    if (tabControlsRight) tabControlsRight.style.display = 'none';
    renderCalendarGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'details') {
    if (listContainer) listContainer.style.display = 'none';
    if (calContainer) calContainer.style.display = 'none';
    if (detailsContainer) detailsContainer.style.display = 'flex';
    if (tabList) tabList.classList.remove('active');
    if (tabCalendar) tabCalendar.classList.remove('active');
    if (tabControlsRight) tabControlsRight.style.display = 'none';
    populateDetailsView(selectedReservation);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ==================== 3. RESERVATION LIST VIEW ==================== */
function renderReservationList() {
  const listContainer = document.getElementById('reservation-list-items');
  const countBadge = document.getElementById('reservation-total-count');
  const tabBadge = document.getElementById('tab-list-badge');

  if (!listContainer) return;

  const count = currentReservations.length;
  if (countBadge) countBadge.textContent = `${count} ${count === 1 ? 'Booking' : 'Bookings'}`;
  if (tabBadge) tabBadge.textContent = count;

  if (currentReservations.length === 0) {
    listContainer.innerHTML = `
      <div class="res-list-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">No reservations found</h3>
        <p style="font-size: 13px;">Try adjusting your search or status filter.</p>
      </div>
    `;
    return;
  }

  let html = '';
  currentReservations.forEach((res) => {
    const statusClass = `status-${res.status.toLowerCase()}`;
    const iconSvg = getCategorySvg();

    html += `
      <div class="reservation-card-item" data-id="${res.id}" role="button" tabindex="0" title="Click to view details for ${escapeHtml(res.name)}">
        <!-- Left Media / Event Category Thumbnail -->
        <div class="res-card-media">
          <div class="res-card-media-icon">${iconSvg}</div>
          <span class="res-card-media-label">${escapeHtml(res.category)}</span>
        </div>

        <!-- Center Details Content -->
        <div class="res-card-info">
          
          <!-- Line 1: Client Name, Code, and Status -->
          <div class="res-card-line-top">
            <div class="res-card-client-title">
              <span class="res-client-name">${escapeHtml(res.name)}</span>
              <span class="res-code-badge">${escapeHtml(res.code)}</span>
            </div>
            <span class="res-status-pill ${statusClass}">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: currentColor; display: inline-block;"></span>
              ${escapeHtml(res.status)}
            </span>
          </div>

          <!-- Line 2: Event Date/Time, Location, and Guest Count -->
          <div class="res-card-line-mid">
            <div class="res-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${escapeHtml(res.eventDateTime)}</span>
            </div>
            <div class="res-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${escapeHtml(res.location)}</span>
            </div>
            <div class="res-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>${res.guestCount} Pax</span>
            </div>
          </div>

          <!-- Line 3: Selected Package & Billing Overview -->
          <div class="res-card-line-bot">
            <span class="res-package-name">${escapeHtml(res.selectedPackage)}</span>
            <div class="res-card-pricing">
              <span class="res-price-quotation">Total: ${escapeHtml(res.quotation)}</span>
              <span class="res-price-balance">Balance: ${escapeHtml(res.balance)}</span>
            </div>
          </div>

        </div>

        <!-- Arrow Right Hint -->
        <div class="res-card-arrow" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = html;

  // Add click listeners to items
  listContainer.querySelectorAll('.reservation-card-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      const allReservations = loadReservations();
      const found = allReservations.find((r) => r.id === id);
      if (found) {
        selectedReservation = found;
        switchView('details');
      }
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
}

function getCategorySvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="7"></circle><path d="M12 7l-2-3h4l-2 3z"></path></svg>`;
}

/* ==================== 4. SEARCH & FILTER ==================== */
function initStatusFilter() {
  const select = document.getElementById('filter-reservation-status');
  if (select) {
    select.addEventListener('change', () => {
      applyFilters();
    });
  }
}

function initGlobalSearch() {
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }
}

function applyFilters() {
  const searchInput = document.getElementById('global-search-input');
  const statusSelect = document.getElementById('filter-reservation-status');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const statusFilter = statusSelect ? statusSelect.value : 'all';

  const allReservations = loadReservations();

  currentReservations = allReservations.filter((res) => {
    const matchStatus = statusFilter === 'all' || res.status.toLowerCase() === statusFilter.toLowerCase();
    const matchQuery =
      !query ||
      res.name.toLowerCase().includes(query) ||
      res.code.toLowerCase().includes(query) ||
      res.selectedPackage.toLowerCase().includes(query) ||
      res.location.toLowerCase().includes(query) ||
      res.eventDateTime.toLowerCase().includes(query);

    return matchStatus && matchQuery;
  });

  renderReservationList();
}

/* ==================== 5. FULL MONTH CALENDAR VIEW ==================== */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function initCalendarView() {
  const prevBtn = document.getElementById('cal-month-prev');
  const nextBtn = document.getElementById('cal-month-next');
  const todayBtn = document.getElementById('cal-month-today');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calCurrentMonth--;
      if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderCalendarGrid();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calCurrentMonth++;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      }
      renderCalendarGrid();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      calCurrentYear = 2026;
      calCurrentMonth = 9; // Oct 2026 (Wedding date)
      renderCalendarGrid();
    });
  }
}

function renderCalendarGrid() {
  const titleElem = document.getElementById('cal-full-month-title');
  const gridElem = document.getElementById('cal-full-grid-cells');
  const drawerElem = document.getElementById('cal-day-drawer');

  if (!gridElem) return;

  if (titleElem) {
    titleElem.textContent = `${MONTH_NAMES[calCurrentMonth]} ${calCurrentYear}`;
  }

  if (drawerElem) {
    drawerElem.style.display = 'none';
  }

  const allReservations = loadReservations();

  // Calculate days in month
  const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

  let html = '';

  // Previous Month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    html += `
      <div class="cal-cell other-month">
        <div class="cal-cell-header">
          <span class="cal-day-num">${dayNum}</span>
        </div>
      </div>
    `;
  }

  // Current Month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calCurrentYear}-${String(calCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayReservations = allReservations.filter((r) => r.eventDateRaw === dateStr && r.status !== 'Cancelled');
    const count = dayReservations.length;
    const isToday = calCurrentYear === 2026 && calCurrentMonth === 8 && day === 4;

    let eventPillsHtml = '';
    if (count > 0) {
      dayReservations.forEach((r) => {
        eventPillsHtml += `<div class="cal-event-pill-item wedding" title="${escapeHtml(r.name)} - ${escapeHtml(r.selectedPackage)}">${escapeHtml(r.name)}</div>`;
      });
    }

    html += `
      <div class="cal-cell ${isToday ? 'is-today' : ''}" data-date="${dateStr}" data-count="${count}" tabindex="0">
        <div class="cal-cell-header">
          <span class="cal-day-num">${day}</span>
          ${count > 0 ? `<span class="cal-has-event-badge">${count} ${count === 1 ? 'Booking' : 'Bookings'}</span>` : ''}
        </div>
        <div class="cal-event-pills-list">
          ${eventPillsHtml}
        </div>
      </div>
    `;
  }

  // Next Month filler days
  const totalCellsSoFar = firstDayIndex + daysInMonth;
  const nextDays = (7 - (totalCellsSoFar % 7)) % 7;
  for (let j = 1; j <= nextDays; j++) {
    html += `
      <div class="cal-cell other-month">
        <div class="cal-cell-header">
          <span class="cal-day-num">${j}</span>
        </div>
      </div>
    `;
  }

  gridElem.innerHTML = html;

  // Add click to days with events to inspect/open
  gridElem.querySelectorAll('.cal-cell:not(.other-month)').forEach((cell) => {
    cell.addEventListener('click', () => {
      const dateStr = cell.getAttribute('data-date');
      const count = parseInt(cell.getAttribute('data-count'), 10);
      showDayDrawer(dateStr, count);
    });
  });
}

function showDayDrawer(dateStr, count) {
  const drawerElem = document.getElementById('cal-day-drawer');
  const dateElem = document.getElementById('cal-drawer-date-text');
  const descElem = document.getElementById('cal-drawer-desc-text');
  const btnElem = document.getElementById('cal-drawer-action-btn');

  if (!drawerElem) return;

  const allReservations = loadReservations();
  const dayReservations = allReservations.filter((r) => r.eventDateRaw === dateStr && r.status !== 'Cancelled');

  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (dateElem) dateElem.textContent = formattedDate;

  if (count > 0 && dayReservations.length > 0) {
    if (descElem) {
      descElem.innerHTML = dayReservations
        .map((r) => `<strong>${escapeHtml(r.name)}</strong> (${escapeHtml(r.category)}) - ${escapeHtml(r.selectedPackage)} [${r.status}]`)
        .join('<br>');
    }
    if (btnElem) {
      btnElem.style.display = 'inline-flex';
      btnElem.textContent = 'View Reservation Details';
      btnElem.onclick = () => {
        selectedReservation = dayReservations[0];
        switchView('details');
      };
    }
  } else {
    if (descElem) descElem.textContent = 'No catering reservations scheduled for this date.';
    if (btnElem) btnElem.style.display = 'none';
  }

  drawerElem.style.display = 'flex';
  drawerElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ==================== 6. RESERVATION DETAILS VIEW (WIREFRAME 3 & 4) ==================== */
function populateDetailsView(res) {
  if (!res) return;

  // Title and Status
  const titleElem = document.getElementById('details-title-heading');
  const statusSelect = document.getElementById('details-status-select');
  if (titleElem) titleElem.textContent = `Reservation Details: ${res.code}`;
  if (statusSelect) statusSelect.value = res.status;

  // Section 1: Client Name & Event Details
  setVal('input-client-name', res.name);
  setVal('input-contact-number', res.phone);
  setVal('input-email', res.email);
  setVal('input-guest-count', res.guestCount);
  setVal('input-event-datetime', res.eventDateTime);
  setVal('input-event-location', res.location);

  // Section 2: Package & Food Selection
  setVal('input-selected-package', res.selectedPackage);
  setVal('textarea-selected-foods', res.selectedFoods);
  setVal('textarea-inclusions', res.inclusions);

  // Section 3: Theme, Styling & Color Palette
  const swatches = [
    { box: 'color-swatch-1', input: 'color-hex-1', val: (res.colors && res.colors[0]) || '#1E3A8A' },
    { box: 'color-swatch-2', input: 'color-hex-2', val: (res.colors && res.colors[1]) || '#C5A059' },
    { box: 'color-swatch-3', input: 'color-hex-3', val: (res.colors && res.colors[2]) || '#F8FAFC' }
  ];
  swatches.forEach((s) => {
    const boxEl = document.getElementById(s.box);
    const inEl = document.getElementById(s.input);
    if (boxEl) boxEl.style.backgroundColor = s.val;
    if (inEl) inEl.value = s.val;
  });
  setVal('textarea-styling-notes', res.stylingNote || '');

  // Section 4: Logistics Checkboxes
  if (res.logistics) {
    setCheckbox('chk-tables', res.logistics.tables);
    setCheckbox('chk-chairs', res.logistics.chairs);
    setCheckbox('chk-plates', res.logistics.plates);
    setCheckbox('chk-chafing', res.logistics.chafing);
    setCheckbox('chk-glasses', res.logistics.glasses);
    setCheckbox('chk-linens', res.logistics.linens);
    setCheckbox('chk-sound', res.logistics.sound);
    setCheckbox('chk-lighting', res.logistics.lighting);
    setCheckbox('chk-host', res.logistics.host);
    setCheckbox('chk-clown', res.logistics.clown);
    setCheckbox('chk-photobooth', res.logistics.photobooth);
    setCheckbox('chk-waitstaff', res.logistics.waitstaff);
  }

  // Section 5: Billing Figures
  setText('billing-total-val', res.quotation);
  setText('billing-downpayment-val', res.downpayment);
  setText('billing-balance-val', res.balance);

  // Reset any open section editing states
  resetSectionEditingState('sec1-edit-btn', 'sec1-content-card');
  resetSectionEditingState('sec2-edit-btn', 'sec2-content-card');
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setCheckbox(id, isChecked) {
  const el = document.getElementById(id);
  if (el) el.checked = !!isChecked;
}

function resetSectionEditingState(btnId, cardId) {
  const btn = document.getElementById(btnId);
  const card = document.getElementById(cardId);
  if (btn) {
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <span>Edit</span>
    `;
    btn.classList.remove('editing');
  }
  if (card) {
    card.classList.remove('is-editing');
    card.querySelectorAll('.field-input, .field-textarea').forEach((inp) => {
      inp.setAttribute('readonly', 'true');
      inp.classList.remove('editable');
    });
  }
}

function initDetailsActions() {
  // Status select change
  const statusSelect = document.getElementById('details-status-select');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      if (selectedReservation) {
        selectedReservation.status = e.target.value;
        const allRes = loadReservations();
        const idx = allRes.findIndex((r) => r.id === selectedReservation.id);
        if (idx !== -1) {
          allRes[idx].status = e.target.value;
          saveReservations(allRes);
        }
        currentReservations = loadReservations();
        applyFilters();
        renderReservationList();
        showToast(`Reservation status changed to ${e.target.value}`, 'success');
      }
    });
  }

  // Section 1: Client Name & Event Details Edit Toggle
  setupSectionEditToggle('sec1-edit-btn', 'sec1-content-card', () => {
    if (selectedReservation) {
      selectedReservation.name = document.getElementById('input-client-name').value;
      selectedReservation.phone = document.getElementById('input-contact-number').value;
      selectedReservation.email = document.getElementById('input-email').value;
      selectedReservation.guestCount = parseInt(document.getElementById('input-guest-count').value, 10) || 0;
      selectedReservation.eventDateTime = document.getElementById('input-event-datetime').value;
      selectedReservation.location = document.getElementById('input-event-location').value;

      const allRes = loadReservations();
      const idx = allRes.findIndex((r) => r.id === selectedReservation.id);
      if (idx !== -1) {
        allRes[idx] = { ...allRes[idx], ...selectedReservation };
        saveReservations(allRes);
      }
      currentReservations = loadReservations();
      applyFilters();
      renderReservationList();
      showToast('Client & Event Details updated!', 'success');
    }
  });

  // Section 2: Package & Food Selection Edit Toggle
  setupSectionEditToggle('sec2-edit-btn', 'sec2-content-card', () => {
    if (selectedReservation) {
      selectedReservation.selectedPackage = document.getElementById('input-selected-package').value;
      selectedReservation.selectedFoods = document.getElementById('textarea-selected-foods').value;
      selectedReservation.inclusions = document.getElementById('textarea-inclusions').value;

      const allRes = loadReservations();
      const idx = allRes.findIndex((r) => r.id === selectedReservation.id);
      if (idx !== -1) {
        allRes[idx] = { ...allRes[idx], ...selectedReservation };
        saveReservations(allRes);
      }
      currentReservations = loadReservations();
      applyFilters();
      renderReservationList();
      showToast('Package & Food Selection updated!', 'success');
    }
  });

  // Section 5 Admin Action Buttons
  const btnSave = document.getElementById('btn-action-save');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      saveAllCurrentDetails();
      showToast('All changes have been successfully saved & synced!', 'success');
    });
  }

  const btnApprove = document.getElementById('btn-action-approve');
  if (btnApprove) {
    btnApprove.addEventListener('click', () => {
      if (selectedReservation) {
        selectedReservation.status = 'Approved';
        const statusSelect = document.getElementById('details-status-select');
        if (statusSelect) statusSelect.value = 'Approved';

        const allRes = loadReservations();
        const idx = allRes.findIndex((r) => r.id === selectedReservation.id);
        if (idx !== -1) {
          allRes[idx].status = 'Approved';
          saveReservations(allRes);
        }
        currentReservations = loadReservations();
        applyFilters();
        renderReservationList();
        showToast(`Reservation ${selectedReservation.code} has been APPROVED & CONFIRMED!`, 'success');
      }
    });
  }

  const btnCancel = document.getElementById('btn-action-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      openCancelModal();
    });
  }

  // Cancel Modal Actions
  const modalBackdrop = document.getElementById('cancel-confirm-modal');
  const modalCancelBtn = document.getElementById('modal-btn-dismiss');
  const modalConfirmBtn = document.getElementById('modal-btn-confirm-cancel');

  if (modalCancelBtn && modalBackdrop) {
    modalCancelBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
    });
  }

  if (modalConfirmBtn && modalBackdrop) {
    modalConfirmBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
      if (selectedReservation) {
        selectedReservation.status = 'Cancelled';
        const statusSelect = document.getElementById('details-status-select');
        if (statusSelect) statusSelect.value = 'Cancelled';

        const allRes = loadReservations();
        const idx = allRes.findIndex((r) => r.id === selectedReservation.id);
        if (idx !== -1) {
          allRes[idx].status = 'Cancelled';
          saveReservations(allRes);
        }
        currentReservations = loadReservations();
        applyFilters();
        renderReservationList();
        showToast(`Reservation ${selectedReservation.code} has been CANCELLED.`, 'error');
      }
    });
  }
}

function setupSectionEditToggle(btnId, cardId, onSaveCallback) {
  const btn = document.getElementById(btnId);
  const card = document.getElementById(cardId);
  if (!btn || !card) return;

  btn.addEventListener('click', () => {
    const isCurrentlyEditing = card.classList.contains('is-editing');
    if (isCurrentlyEditing) {
      // Save Mode
      card.classList.remove('is-editing');
      card.querySelectorAll('.field-input, .field-textarea').forEach((inp) => {
        inp.setAttribute('readonly', 'true');
        inp.classList.remove('editable');
      });
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span>Edit</span>
      `;
      btn.classList.remove('editing');
      if (typeof onSaveCallback === 'function') onSaveCallback();
    } else {
      // Edit Mode
      card.classList.add('is-editing');
      card.querySelectorAll('.field-input, .field-textarea').forEach((inp) => {
        inp.removeAttribute('readonly');
        inp.classList.add('editable');
      });
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Done</span>
      `;
      btn.classList.add('editing');
      const firstInput = card.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    }
  });
}

function saveAllCurrentDetails() {
  if (!selectedReservation) return;

  selectedReservation.name = document.getElementById('input-client-name').value;
  selectedReservation.phone = document.getElementById('input-contact-number').value;
  selectedReservation.email = document.getElementById('input-email').value;
  selectedReservation.guestCount = parseInt(document.getElementById('input-guest-count').value, 10) || 0;
  selectedReservation.eventDateTime = document.getElementById('input-event-datetime').value;
  selectedReservation.location = document.getElementById('input-event-location').value;

  selectedReservation.selectedPackage = document.getElementById('input-selected-package').value;
  selectedReservation.selectedFoods = document.getElementById('textarea-selected-foods').value;
  selectedReservation.inclusions = document.getElementById('textarea-inclusions').value;

  // Status dropdown synchronization (Fix for status loss on Save)
  const statusSelect = document.getElementById('details-status-select');
  if (statusSelect) {
    selectedReservation.status = statusSelect.value;
  }

  selectedReservation.colors = [
    document.getElementById('color-hex-1').value || '#1E3A8A',
    document.getElementById('color-hex-2').value || '#C5A059',
    document.getElementById('color-hex-3').value || '#F8FAFC'
  ];
  selectedReservation.stylingNote = document.getElementById('textarea-styling-notes').value;

  selectedReservation.logistics = {
    tables: document.getElementById('chk-tables').checked,
    chairs: document.getElementById('chk-chairs').checked,
    plates: document.getElementById('chk-plates').checked,
    chafing: document.getElementById('chk-chafing').checked,
    glasses: document.getElementById('chk-glasses').checked,
    linens: document.getElementById('chk-linens').checked,
    sound: document.getElementById('chk-sound').checked,
    lighting: document.getElementById('chk-lighting').checked,
    host: document.getElementById('chk-host').checked,
    clown: document.getElementById('chk-clown').checked,
    photobooth: document.getElementById('chk-photobooth').checked,
    waitstaff: document.getElementById('chk-waitstaff').checked
  };

  // Persist to master localStorage array
  const allRes = loadReservations();
  const idx = allRes.findIndex((r) => r.id === selectedReservation.id);
  if (idx !== -1) {
    allRes[idx] = { ...selectedReservation };
    saveReservations(allRes);
  } else {
    allRes.push({ ...selectedReservation });
    saveReservations(allRes);
  }

  currentReservations = loadReservations();
  applyFilters();
  renderReservationList();
}

function openCancelModal() {
  const modalBackdrop = document.getElementById('cancel-confirm-modal');
  const codeSpan = document.getElementById('modal-cancel-res-code');
  if (codeSpan && selectedReservation) {
    codeSpan.textContent = selectedReservation.code;
  }
  if (modalBackdrop) {
    modalBackdrop.classList.add('open');
  }
}

/* ==================== COLOR WHEEL & SHADES POPUP CONTROLLER ==================== */
let activeSwatchIndex = 0; // 0, 1, or 2
let currentHue = 220;
let currentSat = 80;
let currentLightness = 35;
let isDraggingWheel = false;

const SWATCH_TITLES = ['Primary Theme', 'Accent', 'Neutral Base'];

const CATERING_PRESET_COLORS = [
  { name: 'Royal Navy', hex: '#1E3A8A' },
  { name: 'Royal Gold', hex: '#C5A059' },
  { name: 'Champagne Gold', hex: '#E6CA85' },
  { name: 'Pearl Ivory', hex: '#F8FAFC' },
  { name: 'Rose Blush', hex: '#E8A598' },
  { name: 'Emerald Forest', hex: '#1B4D3E' },
  { name: 'Burgundy Wine', hex: '#6A1A24' },
  { name: 'Dusty Blue', hex: '#7A9AAB' },
  { name: 'Terracotta Rust', hex: '#C86D51' },
  { name: 'Sage Olive', hex: '#8A9A7B' }
];

function initColorWheelModal() {
  // Bind click on interactive swatches
  document.querySelectorAll('.swatch-group.interactive-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const idx = parseInt(swatch.getAttribute('data-color-index'), 10) || 0;
      openColorWheelModal(idx);
    });

    swatch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        swatch.click();
      }
    });
  });

  // Modal close buttons
  const modal = document.getElementById('color-wheel-modal');
  const closeBtn = document.getElementById('btn-close-color-wheel');
  const cancelBtn = document.getElementById('btn-cancel-wheel');
  const applyBtn = document.getElementById('btn-apply-wheel');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  }

  // Lightness Slider
  const slider = document.getElementById('color-lightness-slider');
  const sliderValLabel = document.getElementById('slider-lightness-val');
  if (slider) {
    slider.addEventListener('input', (e) => {
      currentLightness = parseInt(e.target.value, 10);
      if (sliderValLabel) sliderValLabel.textContent = `${currentLightness}%`;
      renderColorWheelCanvas(currentLightness);
      updateColorPreview();
      updateShadeOptions(currentHue, currentSat);
    });
  }

  // Hex Input Two-way sync
  const hexInput = document.getElementById('wheel-hex-input');
  if (hexInput) {
    hexInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
      if (val.length === 6) {
        selectColorFromHex('#' + val, false);
      }
    });
  }

  // Canvas interaction
  const canvas = document.getElementById('color-wheel-canvas');
  if (canvas) {
    const onWheelInteract = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const x = clientX - rect.left - cx;
      const y = clientY - rect.top - cy;
      const radius = rect.width / 2;

      const dist = Math.min(radius, Math.sqrt(x * x + y * y));
      let angle = (Math.atan2(y, x) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      currentHue = Math.round(angle);
      currentSat = Math.round((dist / radius) * 100);

      updateHandlePosition();
      updateColorPreview();
      updateShadeOptions(currentHue, currentSat);
    };

    canvas.addEventListener('mousedown', (e) => {
      isDraggingWheel = true;
      onWheelInteract(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingWheel) {
        onWheelInteract(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      isDraggingWheel = false;
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        isDraggingWheel = true;
        onWheelInteract(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isDraggingWheel && e.touches.length > 0) {
        onWheelInteract(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDraggingWheel = false;
    });
  }

  // Apply button
  if (applyBtn && modal) {
    applyBtn.addEventListener('click', () => {
      const chosenHex = hslToHex(currentHue, currentSat, currentLightness);
      applyChosenColorToSwatch(activeSwatchIndex, chosenHex);
      modal.classList.remove('open');
      showToast(`Color ${SWATCH_TITLES[activeSwatchIndex]} updated to ${chosenHex}!`, 'success');
    });
  }

  // Render presets
  renderPresetColors();
}

function openColorWheelModal(swatchIdx) {
  activeSwatchIndex = swatchIdx;
  const modal = document.getElementById('color-wheel-modal');
  const targetLabel = document.getElementById('color-wheel-target-label');
  const compareCurr = document.getElementById('compare-current-color');

  if (targetLabel) {
    targetLabel.textContent = `Editing: ${SWATCH_TITLES[swatchIdx] || 'Swatch ' + (swatchIdx + 1)}`;
  }

  const existingHexInput = document.getElementById(`color-hex-${swatchIdx + 1}`);
  let startHex = existingHexInput ? existingHexInput.value.trim() : '#1E3A8A';
  if (!startHex.startsWith('#')) startHex = '#' + startHex;

  if (compareCurr) {
    compareCurr.style.backgroundColor = startHex;
  }

  selectColorFromHex(startHex, true);

  if (modal) {
    modal.classList.add('open');
  }
}

function selectColorFromHex(hex, updateHexInput = true) {
  const { h, s, l } = hexToHsl(hex);
  currentHue = h;
  currentSat = s;
  currentLightness = l;

  const slider = document.getElementById('color-lightness-slider');
  const sliderVal = document.getElementById('slider-lightness-val');
  if (slider) slider.value = currentLightness;
  if (sliderVal) sliderVal.textContent = `${currentLightness}%`;

  renderColorWheelCanvas(currentLightness);
  updateHandlePosition();
  updateColorPreview(updateHexInput);
  updateShadeOptions(currentHue, currentSat);
}

function updateHandlePosition() {
  const handle = document.getElementById('wheel-handle');
  if (!handle) return;

  const radius = 100; // 220px canvas, 10px margin
  const rad = (currentHue * Math.PI) / 180;
  const dist = (currentSat / 100) * radius;

  const x = 110 + dist * Math.cos(rad);
  const y = 110 + dist * Math.sin(rad);

  handle.style.left = `${x}px`;
  handle.style.top = `${y}px`;
}

function updateColorPreview(updateHexField = true) {
  const hex = hslToHex(currentHue, currentSat, currentLightness);
  const compareNew = document.getElementById('compare-new-color');
  const hexInput = document.getElementById('wheel-hex-input');

  if (compareNew) compareNew.style.backgroundColor = hex;
  if (hexInput && updateHexField) hexInput.value = hex.replace('#', '');
}

function renderColorWheelCanvas(lightness) {
  const canvas = document.getElementById('color-wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = cx - 10;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * width + x) * 4;

      if (dist <= radius) {
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;

        const sat = (dist / radius) * 100;
        const [r, g, b] = hslToRgb(angle, sat, lightness);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      } else {
        data[idx + 3] = 0; // Transparent outside radius
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function updateShadeOptions(hue, sat) {
  const container = document.getElementById('shade-options-grid');
  if (!container) return;

  // 10 distinct lightness levels from very light to deep rich shades
  const lightnessLevels = [92, 83, 74, 65, 55, 45, 36, 27, 18, 10];
  container.innerHTML = '';

  lightnessLevels.forEach((lvl) => {
    const chipHex = hslToHex(hue, sat, lvl);
    const chip = document.createElement('div');
    chip.className = `shade-chip ${Math.abs(lvl - currentLightness) <= 5 ? 'active' : ''}`;
    chip.style.backgroundColor = chipHex;
    chip.title = `${lvl}% Lightness (${chipHex})`;

    chip.addEventListener('click', () => {
      currentLightness = lvl;
      const slider = document.getElementById('color-lightness-slider');
      const sliderVal = document.getElementById('slider-lightness-val');
      if (slider) slider.value = currentLightness;
      if (sliderVal) sliderVal.textContent = `${currentLightness}%`;

      renderColorWheelCanvas(currentLightness);
      updateColorPreview();

      container.querySelectorAll('.shade-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });

    container.appendChild(chip);
  });
}

function renderPresetColors() {
  const container = document.getElementById('preset-colors-grid');
  if (!container) return;
  container.innerHTML = '';

  CATERING_PRESET_COLORS.forEach((preset) => {
    const chip = document.createElement('div');
    chip.className = 'preset-chip';
    chip.style.backgroundColor = preset.hex;
    chip.title = `${preset.name} (${preset.hex})`;

    chip.addEventListener('click', () => {
      selectColorFromHex(preset.hex, true);
    });

    container.appendChild(chip);
  });
}

function applyChosenColorToSwatch(idx, hex) {
  const swatchBox = document.getElementById(`color-swatch-${idx + 1}`);
  const hexInput = document.getElementById(`color-hex-${idx + 1}`);

  if (swatchBox) swatchBox.style.backgroundColor = hex;
  if (hexInput) hexInput.value = hex;

  if (selectedReservation) {
    if (!Array.isArray(selectedReservation.colors)) {
      selectedReservation.colors = ['#1E3A8A', '#C5A059', '#F8FAFC'];
    }
    selectedReservation.colors[idx] = hex;

    // Update master array in localStorage
    const allRes = loadReservations();
    const targetIdx = allRes.findIndex((r) => r.id === selectedReservation.id);
    if (targetIdx !== -1) {
      allRes[targetIdx].colors = [...selectedReservation.colors];
      saveReservations(allRes);
    }
  }
}

/* Color Math Utilities */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hslToHex(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((char) => char + char).join('');
  const r = parseInt(c.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(c.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(c.substring(4, 6), 16) / 255 || 0;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/* ==================== 7. TOAST FEEDBACK NOTIFICATION ==================== */
let toastTimeout;
function showToast(message, type = 'success') {
  const toast = document.getElementById('reservation-toast');
  const text = document.getElementById('toast-text');
  if (!toast || !text) return;

  clearTimeout(toastTimeout);

  text.textContent = message;
  toast.className = `res-toast show ${type}`;

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/* Helper to prevent XSS in dynamic templates */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
