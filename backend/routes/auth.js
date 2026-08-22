const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAsync, runAsync } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

// Validation helper
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, phone, email, password, location, preferred_language } = req.body;
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ error: 'Name, phone, email, password are required' });
        }
        if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
        if (!validatePhone(phone)) return res.status(400).json({ error: 'Invalid phone (10 digits, start 6-9)' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        // Check existing
        const existingEmail = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) return res.status(409).json({ error: 'Email already registered' });
        const existingPhone = await getAsync('SELECT id FROM users WHERE phone = ?', [phone]);
        if (existingPhone) return res.status(409).json({ error: 'Phone already registered' });

        const hash = await bcrypt.hash(password, 10);
        const lang = (preferred_language === 'hi' ? 'hi' : 'en');
        const result = await runAsync(
            'INSERT INTO users (name, phone, email, password_hash, location, preferred_language) VALUES (?,?,?,?,?,?)',
            [name, phone, email, hash, location || '', lang]
        );
        const user = await getAsync('SELECT id, name, phone, email, location, preferred_language, created_at FROM users WHERE id = ?', [result.id]);
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ message: 'Registration successful', user, token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        if (!password || (!email && !phone)) {
            return res.status(400).json({ error: 'Email/phone and password required' });
        }
        let user;
        if (email) user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
        else user = await getAsync('SELECT * FROM users WHERE phone = ?', [phone]);

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const safeUser = { id: user.id, name: user.name, phone: user.phone, email: user.email, location: user.location, preferred_language: user.preferred_language, created_at: user.created_at };
        const token = jwt.sign({ id: safeUser.id, email: safeUser.email, name: safeUser.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', user: safeUser, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// GET /api/auth/profile (protected)
router.get('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const user = await getAsync('SELECT id, name, phone, email, location, preferred_language, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const { name, location, preferred_language } = req.body;
        await runAsync('UPDATE users SET name = COALESCE(?, name), location = COALESCE(?, location), preferred_language = COALESCE(?, preferred_language) WHERE id = ?', [name, location, preferred_language, req.user.id]);
        const updated = await getAsync('SELECT id, name, phone, email, location, preferred_language, created_at FROM users WHERE id = ?', [req.user.id]);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
