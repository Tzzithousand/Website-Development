/**
 * TRES MARIAS ADMIN - LOGIN & AUTHENTICATION SCRIPT
 * File: assets/js/login.js
 * Description: Client-side validation, OTP auto-advance, and backend authentication via MySQL.
 */

// Dynamic API Base: Works when opened via file:/// or other local ports, falls back to http://localhost:3000
const API_BASE = (window.location.protocol === 'file:' || !window.location.origin.includes(':3000'))
  ? 'http://localhost:3000'
  : '';

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const btnSendOtp = document.getElementById('btn-send-otp');
const btnLogin = document.getElementById('btn-login');
const alertBox = document.getElementById('login-alert');
const alertIcon = document.getElementById('alert-icon');
const alertText = document.getElementById('alert-text');
const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');
const otpError = document.getElementById('otp-error');

// 4 OTP Input Boxes
const otpBoxes = [
  document.getElementById('otp1'),
  document.getElementById('otp2'),
  document.getElementById('otp3'),
  document.getElementById('otp4')
];

// Helper functions for alerts and errors
function showAlert(message, type = 'error') {
  if (!alertBox || !alertIcon || !alertText) return;
  alertBox.className = `login-alert visible login-alert-${type}`;
  alertIcon.textContent = type === 'error' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️');
  alertText.textContent = message;
}

function clearAlert() {
  if (alertBox && alertText) {
    alertBox.className = 'login-alert';
    alertText.textContent = '';
  }
  if (usernameError) usernameError.classList.remove('visible');
  if (passwordError) passwordError.classList.remove('visible');
  if (otpError) otpError.classList.remove('visible');
  if (usernameInput) usernameInput.classList.remove('has-error');
  if (passwordInput) passwordInput.classList.remove('has-error');
  otpBoxes.forEach(b => {
    if (b) b.classList.remove('has-error');
  });
}

function triggerShake() {
  if (!loginForm) return;
  loginForm.classList.remove('shake');
  void loginForm.offsetWidth; // trigger reflow
  loginForm.classList.add('shake');
}

// Auto-advance through OTP input boxes
otpBoxes.forEach((box, index) => {
  if (!box) return;

  box.addEventListener('focus', () => {
    box.select();
    box.classList.remove('has-error');
    if (otpError) otpError.classList.remove('visible');
  });

  box.addEventListener('click', () => box.select());

  // 1. Move to next box when a digit is entered
  box.addEventListener('input', () => {
    box.classList.remove('has-error');
    if (/^[0-9]$/.test(box.value) && index < otpBoxes.length - 1) {
      otpBoxes[index + 1].focus();
    }
  });

  // 2. Backspace navigation
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && box.value === '' && index > 0) {
      otpBoxes[index - 1].focus();
    }
  });

  // 3. Paste support for 4 digits
  box.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').trim();
    if (/^[0-9]{4}$/.test(text)) {
      otpBoxes.forEach((b, i) => { 
        if (b) {
          b.value = text[i]; 
          b.classList.remove('has-error');
        }
      });
      if (otpBoxes[3]) otpBoxes[3].focus();
    }
  });
});

// Clear error highlights on user input
if (usernameInput) {
  usernameInput.addEventListener('input', () => {
    usernameInput.classList.remove('has-error');
    if (usernameError) usernameError.classList.remove('visible');
  });
}

if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('has-error');
    if (passwordError) passwordError.classList.remove('visible');
  });
}

// ==========================================================
// Send OTP Button: Retrieves actual OTP from MySQL via API
// ==========================================================
if (btnSendOtp) {
  btnSendOtp.addEventListener('click', async () => {
    clearAlert();
    const enteredUsername = usernameInput ? usernameInput.value.trim() : '';
    
    if (!enteredUsername) {
      if (usernameInput) usernameInput.classList.add('has-error');
      if (usernameError) {
        usernameError.textContent = 'Please enter your username or email first.';
        usernameError.classList.add('visible');
      }
      showAlert('Please enter your username or email before requesting an OTP.', 'error');
      if (usernameInput) usernameInput.focus();
      return;
    }

    btnSendOtp.disabled = true;
    btnSendOtp.textContent = 'Sending...';

    try {
      const response = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: enteredUsername })
      });

      const result = await response.json();

      if (result.success) {
        showAlert(`${result.message} (Demo OTP: ${result.demoOtp})`, 'info');
        if (otpBoxes[0]) otpBoxes[0].focus();
      } else {
        showAlert(result.message || 'Unable to send OTP.', 'error');
        if (result.field === 'username' && usernameInput && usernameError) {
          usernameInput.classList.add('has-error');
          usernameError.textContent = result.message;
          usernameError.classList.add('visible');
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showAlert('Unable to connect to backend server. Please make sure server.js is running on port 3000.', 'error');
    } finally {
      btnSendOtp.disabled = false;
      btnSendOtp.textContent = 'Send OTP';
    }
  });
}

// ==========================================================
// Form Submission: Validates credentials against MySQL Database
// ==========================================================
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const userVal = usernameInput ? usernameInput.value.trim() : '';
    const passVal = passwordInput ? passwordInput.value : '';
    const otpVal = otpBoxes.map(b => (b ? b.value : '')).join('');

    let hasError = false;

    // 1. Basic Frontend Check
    if (!userVal) {
      if (usernameInput) usernameInput.classList.add('has-error');
      if (usernameError) {
        usernameError.textContent = 'Username or email is required.';
        usernameError.classList.add('visible');
      }
      hasError = true;
    }

    if (!passVal) {
      if (passwordInput) passwordInput.classList.add('has-error');
      if (passwordError) {
        passwordError.textContent = 'Password is required.';
        passwordError.classList.add('visible');
      }
      hasError = true;
    }

    if (otpVal.length < 4) {
      otpBoxes.forEach(b => { 
        if (b && !b.value) b.classList.add('has-error'); 
      });
      if (otpError) {
        otpError.textContent = 'Please enter the complete 4-digit OTP code.';
        otpError.classList.add('visible');
      }
      hasError = true;
    }

    if (hasError) {
      showAlert('Access denied. Please check the highlighted fields.', 'error');
      triggerShake();
      return;
    }

    // 2. Send to MySQL Backend API for verification
    if (btnLogin) {
      btnLogin.disabled = true;
      btnLogin.textContent = 'Verifying with Database...';
    }

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: userVal,
          password: passVal,
          otp: otpVal
        })
      });

      const result = await response.json();

      if (result.success) {
        // Login successful!
        showAlert(result.message, 'success');
        if (btnLogin) {
          btnLogin.textContent = 'Redirecting...';
          btnLogin.style.opacity = '0.8';
        }

        // Save Admin session in browser
        sessionStorage.setItem('tres_marias_admin_logged_in', 'true');
        sessionStorage.setItem('tres_marias_admin_user', JSON.stringify(result.user));

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 600);
      } else {
        // Invalid input according to MySQL check
        if (btnLogin) {
          btnLogin.disabled = false;
          btnLogin.textContent = 'Log In';
        }
        showAlert(result.message, 'error');
        triggerShake();

        if (result.field === 'username' && usernameInput && usernameError) {
          usernameInput.classList.add('has-error');
          usernameError.textContent = result.message;
          usernameError.classList.add('visible');
          usernameInput.focus();
        } else if (result.field === 'password' && passwordInput && passwordError) {
          passwordInput.classList.add('has-error');
          passwordError.textContent = result.message;
          passwordError.classList.add('visible');
          passwordInput.focus();
        } else if (result.field === 'otp' && otpError) {
          otpBoxes.forEach(b => { if (b) b.classList.add('has-error'); });
          otpError.textContent = result.message;
          otpError.classList.add('visible');
          if (otpBoxes[0]) otpBoxes[0].focus();
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Log In';
      }
      showAlert('Unable to connect to MySQL Backend Server on port 3000. Please ensure the server is running.', 'error');
      triggerShake();
    }
  });
}
