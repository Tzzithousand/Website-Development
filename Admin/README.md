# Tres Marias Admin - Frontend Prototype

Pure HTML at CSS lamang (walang mabibigat na frameworks, malinis at maayos na folder structure).

---

## Folder at File Structure

```text
Admin/
├── assets/
│   ├── css/
│   │   ├── dashboard.css           # Dashboard layout at shared topbar/sidebar styles
│   │   ├── reservation.css         # Dedicated stylesheet para sa Reservation (List, Calendar, Details)
│   │   └── style.css               # Pinagsamang stylesheet para sa logo at login
│   ├── images/
│   │   ├── logo.jpg                # Opisyal na Tres Marias logo
│   │   └── tres-marias-logo.jpg    # Backup logo copy
│   └── js/
│       ├── dashboard.js            # Dashboard chart at event logic
│       └── reservation.js          # Reservation list, calendar, details switching at inline editing
├── pages/
│   ├── dashboard.html              # Admin Dashboard Overview
│   ├── login.html                  # Admin login screen (Pure CSS states)
│   ├── logo.html                   # Logo screen (nagli-link sa login.html)
│   └── reservation.html            # Reservation management (List, Calendar, 5-Section Details)
├── index.html                      # Entry point (auto-redirect sa pages/logo.html)
├── .gitignore                      # Git ignore configuration
└── README.md                       # Gabay at dokumentasyon
```

---

## Mga Pahina

1. **`index.html` (Main Entry Point)**:
   - Naka-place sa root ng `Admin` folder.
   - Kapag binuksan, kusa itong magre-redirect sa `pages/logo.html`.

2. **`pages/logo.html` (Logo Screen)**:
   - Nagpapakita ng opisyal na logo ng **Tres Marias Catering Services** (mula sa `assets/images/logo.jpg`).
   - Naka-frame sa modernong bilog na may gold accent border at soft ambient glow na bumabagay sa madilim ngunit malambot na background.
   - May smooth hover effect: kapag kinlick ang logo, diretso agad sa `login.html`.

3. **`pages/login.html` (Admin Login Screen)**:
   - May circular brand logo sa itaas ng login card na may gold ring at soft ambient glow.
   - Nagpapakita ng modernong elevated card sa gitna ng soft dark-with-light background.
   - **Send OTP Logic (Pure CSS)**: Naka-disabled habang walang laman ang Password. Pag may tinype sa password, magiging active at clickable.
   - **Log In Logic (Pure CSS)**: Naka-disabled habang walang laman ang OTP boxes. Pag napunuan ang 4 na kahon ng OTP, magiging active at clickable.

4. **`pages/dashboard.html` (Admin Dashboard Overview)**:
   - Nagpapakita ng revenue bar graph (Day, Week, Month), net total, customer count, event today, pending approvals, at mini calendar widget.

5. **`pages/reservation.html` (Reservation Management & Details)**:
   - **Cross-Page Notification Sync**: Naka-sync sa `dashboard.html` sa pamamagitan ng shared storage; default na walang badge (0) para sa dummy data, at handa para sa real-time alert updates.
   - **Reservation Code Format**: Sumusunod sa `#RES - DD/MM/YY - ####` format (halimbawa `#RES - 15/10/26 - 0001` para sa kasal ni Maria Cristina Santos noong Oct 15, 2026).
   - **View Switcher Tabs**: Nasa ilalim ng search bar ang **List View** (icon sa kaliwa) at **Calendar View** (icon sa kanan ng buong buwan na may bilang ng nag-reserve kada araw).
   - **Reservation List Style**: Vertical list cards pababa na may larawan, client name, event info, package, status pill badges, at pricing.
   - **Reservation Details View**: 5 seksyon ayon sa wireframes:
     1. Client Name & Event Details (`[Edit]` button)
     2. Package & Food Selection (`[Edit]` button)
     3. Theme, Styling & Color Palette (Interactive color wheel modal na may 10 shade options at catering presets; permanenteng read-only ang client styling notes at photo preview)
     4. LOGISTICS, EQUIPMENT & OUTSOURCE SERVICES (Catering dining ware & Entertainment checkboxes)
     5. ADMIN ACTIONS & BILLING SUMMARY (Persistent status dropdown, quotation, downpayment, balance, at action buttons: `Cancel Reservation`, `Save Changes`, `Approve & Confirm`).

---

## Pinagsamang CSS (`assets/css/style.css`)

Ang lahat ng styles ay pinagsama sa iisang file (`assets/css/style.css`) gamit ang malinis na category headers:
- **GLOBAL / SHARED** — CSS variables (palette, gold glow, shadows) at `body` background.
- **LOGO PAGE (pages/logo.html)** — `.logo-circle` at `.logo-img`.
- **LOGIN PAGE (pages/login.html)** — `.login-container`, `.login-logo`, `.login-box`, form inputs, OTP digits, buttons, at Pure CSS validation logic.

---

## Paano Buksan sa Browser

- I-double click lamang ang **`index.html`** sa root ng `Admin` folder (o ang **`pages/logo.html`**) para buksan ito sa **Brave Browser** o kahit anong web browser.
