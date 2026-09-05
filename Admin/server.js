/**
 * TRES MARIAS ADMIN - BACKEND API SERVER
 * File: server.js
 * Description: Express.js server connecting to MySQL for Admin Login & OTP.  
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname)));

// ==========================================================
// 1. HEALTH CHECK ENDPOINT
// ==========================================================
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'online', database: 'connected', time: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: error.message });
  }
});

// ==========================================================
// 2. SEND OTP ENDPOINT (POST /api/send-otp)
// ==========================================================
app.post('/api/send-otp', async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;

    if (!usernameOrEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter your username or email first.' 
      });
    }

    // Find admin in the database
    const [users] = await db.query(
      `SELECT user_id, full_name, email, phone_number, role 
       FROM users 
       WHERE (email = ? OR full_name = ?) AND role IN ('admin', 'staff')
       LIMIT 1`,
      [usernameOrEmail.trim(), usernameOrEmail.trim()]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        field: 'username',
        message: 'No Admin account found with that username or email.' 
      });
    }

    const admin = users[0];

    // Generate a new 4-digit OTP code (Example: 4821)
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save the new OTP to the MySQL database (valid for 10 minutes)
    await db.query(
      `UPDATE users 
       SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) 
       WHERE user_id = ?`,
      [newOtp, admin.user_id]
    );

    console.log(`[OTP GENERATED] for Admin ${admin.email}: ${newOtp}`);

    return res.json({
      success: true,
      message: `OTP sent to the account of ${admin.full_name}.`,
      // Return generated OTP in demo mode for quick testing without SMS gateway
      demoOtp: newOtp
    });

  } catch (error) {
    console.error('Error in /api/send-otp:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'A database server error occurred: ' + error.message 
    });
  }
});

// ==========================================================
// 3. LOGIN ENDPOINT (POST /api/login)
// ==========================================================
app.post('/api/login', async (req, res) => {
  try {
    const { usernameOrEmail, password, otp } = req.body;

    // Basic input validation
    if (!usernameOrEmail) {
      return res.status(400).json({ 
        success: false, 
        field: 'username', 
        message: 'Username or email is required.' 
      });
    }
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        field: 'password', 
        message: 'Password is required.' 
      });
    }
    if (!otp) {
      return res.status(400).json({ 
        success: false, 
        field: 'otp', 
        message: 'Please enter the 4-digit OTP code.' 
      });
    }

    // 1. Query MySQL database for user
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, password_hash, role, otp_code, otp_expires_at, status 
       FROM users 
       WHERE (email = ? OR full_name = ?) 
       LIMIT 1`,
      [usernameOrEmail.trim(), usernameOrEmail.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        field: 'username', 
        message: 'Invalid username or email.' 
      });
    }

    const user = rows[0];

    // 2. Verify if role is admin
    if (user.role !== 'admin' && user.role !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        field: 'username', 
        message: 'Access denied: This account is not an Admin.' 
      });
    }

    // 3. Verify if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'This account is deactivated. Please contact management.' 
      });
    }

    // 4. Verify Password (supports bcrypt hash and plain match for testing)
    let isPasswordValid = false;
    if (user.password_hash.startsWith('$2y$') || user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      // Convert PHP $2y$ blowfish to $2a$ for bcryptjs compatibility if from phpMyAdmin
      const normalizedHash = user.password_hash.replace('$2y$', '$2a$');
      isPasswordValid = await bcrypt.compare(password, normalizedHash);
    }
    
    if (!isPasswordValid && password === user.password_hash) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        field: 'password', 
        message: 'Incorrect password.' 
      });
    }

    // 5. Verify 4-digit OTP Code
    if (!user.otp_code || user.otp_code.trim() !== otp.trim()) {
      return res.status(401).json({ 
        success: false, 
        field: 'otp', 
        message: 'Invalid OTP code.' 
      });
    }

    // 6. Login successful! Update last_login timestamp in MySQL
    await db.query(
      `UPDATE users SET last_login = NOW() WHERE user_id = ?`,
      [user.user_id]
    );

    console.log(`🎉 [SUCCESSFUL LOGIN] Admin "${user.full_name}" (${user.email}) logged in successfully.`);

    return res.json({
      success: true,
      message: 'Login successful! Redirecting to Dashboard...',
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error in /api/login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'A server error occurred: ' + error.message 
    });
  }
});

// Fallback route for index
app.get('/', (req, res) => {
  res.redirect('/pages/login.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`Tres Marias Admin Server running at: http://localhost:${PORT}`);
  console.log(`Login Page URL: http://localhost:${PORT}/pages/login.html`);
});
