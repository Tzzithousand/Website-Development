# Tres Marias Admin - Frontend Prototype

Pure HTML at CSS lamang (walang mabibigat na frameworks, malinis at maayos na folder structure).

---

## Folder at File Structure

```text
Admin/
├── assets/
│   ├── css/
│   │   └── style.css            # Pinagsamang stylesheet (may malinaw na labels para sa logo at login)
│   └── images/
│       ├── logo.jpg             # Opisyal na Tres Marias logo
│       └── tres-marias-logo.jpg # Backup logo copy
├── pages/
│   ├── logo.html                # Logo screen (nagli-link sa login.html)
│   └── login.html               # Admin login screen (Pure CSS states)
├── index.html                   # Entry point (auto-redirect sa pages/logo.html)
├── .gitignore                   # Git ignore configuration
└── README.md                    # Gabay at dokumentasyon
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

---

## Pinagsamang CSS (`assets/css/style.css`)

Ang lahat ng styles ay pinagsama sa iisang file (`assets/css/style.css`) gamit ang malinis na category headers:
- **GLOBAL / SHARED** — CSS variables (palette, gold glow, shadows) at `body` background.
- **LOGO PAGE (pages/logo.html)** — `.logo-circle` at `.logo-img`.
- **LOGIN PAGE (pages/login.html)** — `.login-container`, `.login-logo`, `.login-box`, form inputs, OTP digits, buttons, at Pure CSS validation logic.

---

## Paano Buksan sa Browser

- I-double click lamang ang **`index.html`** sa root ng `Admin` folder (o ang **`pages/logo.html`**) para buksan ito sa **Brave Browser** o kahit anong web browser.
