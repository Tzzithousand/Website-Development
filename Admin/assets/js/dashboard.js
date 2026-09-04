/**
 * TRES MARIAS CATERING SERVICES - ADMIN DASHBOARD SCRIPT
 * Handles revenue bar graph, calendar widget, sidebar toggles, and profile actions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initRevenueChart();
  initCalendar();
  initProfileDropdown();
  initEventActions();
  initSearch();
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

/* ==================== 2. REVENUE BAR GRAPH ==================== */
const REVENUE_DATA = {
  month: {
    title: 'Monthly Revenue (2026)',
    total: '₱185,450.00',
    meta: '+18.4% vs last month',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [68000, 82000, 94000, 88000, 120000, 138000, 152000, 164000, 185450, 142000, 168000, 198000],
    currentIdx: 8 // September
  },
  week: {
    title: 'Weekly Revenue (Current Week)',
    total: '₱296,500.00',
    meta: '+12.6% vs last week',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [22000, 28500, 36000, 31000, 56000, 78000, 45000],
    currentIdx: 4 // Friday
  },
  day: {
    title: "Today's Hourly Revenue (Sep 04)",
    total: '₱56,800.00',
    meta: 'Real-time billing updates',
    labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
    values: [4800, 11200, 24000, 16500, 32000, 42000, 28000, 14000],
    currentIdx: 4 // 4 PM
  }
};

let currentPeriod = 'month';

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
    if (comparisonDisplay) comparisonDisplay.textContent = `↑ ${data.meta}`;

    // SVG coordinate space
    const width = 680;
    const height = 200;
    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    const maxVal = Math.max(...data.values) * 1.15;
    const barCount = data.values.length;
    const barGap = 12;
    const barWidth = Math.max(16, (chartWidth - (barCount - 1) * barGap) / barCount);

    let svgHtml = `
      <defs>
        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dfba73" />
          <stop offset="100%" stop-color="#c5a059" />
        </linearGradient>
        <linearGradient id="activeBarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
    `;

    // Horizontal grid lines (4 steps)
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
      const barH = (val / maxVal) * chartHeight;
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
            fill="${isCurrent ? '#0f172a' : 'url(#goldGradient)'}"
            rx="4"
            class="chart-bar"
            style="${isCurrent ? 'stroke: #c5a059; stroke-width: 1.5px;' : ''}"
          />
          <text 
            x="${x + barWidth / 2}" 
            y="${height - 8}" 
            text-anchor="middle" 
            class="chart-axis-text"
            style="${isCurrent ? 'font-weight: 700; fill: #0f172a;' : ''}"
          >${label}</text>
        </g>
      `;
    });

    chartSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chartSvg.innerHTML = svgHtml;

    // Attach hover listeners to bars for tooltip
    const barGroups = chartSvg.querySelectorAll('.chart-bar-group');
    barGroups.forEach(group => {
      group.addEventListener('mouseenter', (e) => {
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
        tooltip.style.opacity = '0';
      });
    });
  }

  // Filter Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const period = btn.getAttribute('data-period');
      renderChart(period);
    });
  });

  // Initial render
  renderChart('month');
}

/* ==================== 3. INTERACTIVE CALENDAR ==================== */
const EVENTS_DATABASE = {
  '2026-09-04': { title: 'Santos - Reyes Wedding Banquet', time: '4:00 PM', location: 'Manila Hotel' },
  '2026-09-12': { title: 'Logistics Prep & Silverware Inventory', time: '9:00 AM', location: 'Central Warehouse' },
  '2026-09-18': { title: 'De Leon Debut Reception (Pending)', time: '6:00 PM', location: 'Fernwood Gardens' },
  '2026-09-24': { title: 'Ayala Corp Annual Appreciation Gala', time: '7:00 PM', location: 'BGC Taguig' }
};

let currentCalDate = new Date(2026, 8, 4); // September 4, 2026

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

      // Has event?
      if (EVENTS_DATABASE[dateKey]) {
        cell.classList.add('has-event');
        cell.title = EVENTS_DATABASE[dateKey].title;
      }

      cell.addEventListener('click', () => {
        document.querySelectorAll('.cal-day-cell').forEach(c => c.style.outline = 'none');
        cell.style.outline = '2px solid #c5a059';

        if (EVENTS_DATABASE[dateKey]) {
          const ev = EVENTS_DATABASE[dateKey];
          previewText.innerHTML = `<strong>${d} ${monthNames[month]}</strong>: ${ev.title} <br><span style="color:#64748b">${ev.time} • ${ev.location}</span>`;
        } else {
          previewText.textContent = `${d} ${monthNames[month]} ${year}: Walang naka-iskedyul na event.`;
        }
      });

      daysGrid.appendChild(cell);
    }

    // Trailing days to fill the 7x5 or 7x6 grid
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

/* ==================== 4. PROFILE DROPDOWN ==================== */
function initProfileDropdown() {
  const profileBtn = document.getElementById('profile-menu-btn');
  const dropdown = document.getElementById('profile-dropdown');

  if (profileBtn && dropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  }
}

/* ==================== 5. QUICK ACTIONS (APPROVE / REVIEW) ==================== */
function initEventActions() {
  const approveBtn = document.getElementById('btn-approve-pending');
  const reviewBtn = document.getElementById('btn-review-pending');

  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      approveBtn.textContent = 'Approved ✓';
      approveBtn.style.backgroundColor = '#10b981';
      approveBtn.style.color = '#ffffff';
      approveBtn.disabled = true;

      const tag = document.querySelector('.event-tag.pending');
      if (tag) {
        tag.textContent = 'Approved';
        tag.className = 'event-tag today';
      }
    });
  }

  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      alert('Event Details:\nClient: De Leon Family\nOccasion: 18th Birthday Debut\nGuests: 150 Pax\nPackage: Royal Elegance Buffet\nStatus: Pending Final Admin Sign-off');
    });
  }
}

/* ==================== 6. SEARCH BAR INTERACTION ==================== */
function initSearch() {
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          alert(`Naghahanap para sa: "${query}"...`);
        }
      }
    });
  }
}
