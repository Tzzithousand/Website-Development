# Tres Marias Admin - Management Portal & Backend

Clean, organized frontend architecture paired with an Express.js and MySQL backend for secure admin authentication and reservation operations.

---

## Folder and File Structure

```text
Admin/
├── assets/
│   ├── css/
│   │   ├── dashboard.css           # Dashboard layout and shared topbar/sidebar styles
│   │   ├── reservation.css         # Dedicated stylesheet for Reservation (List, Calendar, Details)
│   │   └── style.css               # Combined stylesheet for logo and login
│   ├── images/
│   │   └── logo.jpg                # Official Tres Marias brand logo
│   └── js/
│       ├── dashboard.js            # Dashboard chart, analytics, and event logic
│       ├── login.js                # Frontend authentication, OTP auto-advance, and API calls
│       └── reservation.js          # Reservation list, calendar, details switching and inline editing
├── database/
│   ├── db.js                       # MySQL database connection pool (mysql2/promise)
│   └── schema.sql                  # Database schema (users table, seed admin credentials)
├── pages/
│   ├── dashboard.html              # Admin Dashboard Overview
│   ├── login.html                  # Admin Login Screen with OTP verification
│   ├── logo.html                   # Logo Splash Screen (links to login.html)
│   └── reservation.html            # Reservation Management (List, Calendar, 5-Section Details)
├── .gitignore                      # Git ignore rules (node_modules, logs, etc.)
├── GEMINI.md                       # Project language rules
├── index.html                      # Entry point (auto-redirect to pages/logo.html)
├── package.json                    # Node dependencies and scripts
├── package-lock.json               # Locked dependency tree
├── README.md                       # Guide and documentation
└── server.js                       # Express.js REST API server & static file host
```

---

## Getting Started & Running the Project

### 1. Database Setup (MySQL)
1. Ensure your MySQL server is running on `localhost:3306`.
2. Import `database/schema.sql` into your MySQL instance:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. The seed credentials for the admin account:
   - **Email / Username**: `admin@email.com`
   - **Password**: `Password123`
   - **Default OTP**: `1234`

### 2. Backend Server (Express.js)
1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. The server starts at `http://localhost:3000` and serves both the API endpoints (`/api/login`, `/api/send-otp`, `/api/health`) and static frontend pages.

### 3. Frontend Static Pages
- You can access the application through the running server at `http://localhost:3000/pages/login.html` (or `http://localhost:3000`).
- Alternatively, you can open `index.html` or `pages/logo.html` directly in any modern browser.

---

## Pages Overview

1. **`index.html` (Main Entry Point)**:
   - Located at the root of the `Admin` directory.
   - Automatically redirects to `pages/logo.html`.

2. **`pages/logo.html` (Logo Splash Screen)**:
   - Displays the official logo of **Tres Marias Catering Services** (`assets/images/logo.jpg`).
   - Framed in a modern circle with a gold accent border and soft ambient glow.
   - Clicking the logo navigates to `login.html`.

3. **`pages/login.html` (Admin Login Screen)**:
   - Modern elevated card with gold accents and ambient glow.
   - Connected to `assets/js/login.js` for clean client-side validation and OTP auto-advancing.
   - Requests real-time OTP from the MySQL database via the Express API (`/api/send-otp`) and verifies credentials via (`/api/login`).

4. **`pages/dashboard.html` (Admin Dashboard Overview)**:
   - Displays a revenue bar graph (Day, Week, Month), net total, customer count, events today, pending approvals, and an interactive mini calendar widget.

5. **`pages/reservation.html` (Reservation Management & Details)**:
   - **Cross-Page Notification Sync**: Synchronized with `dashboard.html` via shared storage.
   - **Reservation Code Format**: Adheres to `#RES - DD/MM/YY - ####`.
   - **View Switcher Tabs**: Seamless toggle between **List View** and **Calendar View**.
   - **Reservation List**: Vertical cards with event details, package info, status pill badges, and pricing.
   - **Reservation Details**: 5 structured sections (Client Details, Package & Food, Styling & Theme with Color Wheel Modal, Logistics & Dining Ware, and Admin Actions & Billing Summary).
