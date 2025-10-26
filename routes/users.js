const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { getProfile, updateProfile } = require('../controllers/userController');


// GET all users
router.get('/', (req, res) => {
    db.query('SELECT id, username FROM users',(err, results) => {
        if (err) return res.status(500).json({success: false, error: err });
        res.json({ success: true, users: results });
    });
});

// GET leaderboard
router.get('/leaderboard', (req, res) => {
    db.query('SELECT username, points FROM users ORDER BY points DESC LIMIT 10', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/:id', getProfile);
router.put('/:id', updateProfile);



// SIGNUP
router.post('/signup', async (req, res) => {
    try{
        const { username, password, email } = req.body;
        if (!username || !password || !email)
            return res.status(400).json({ success: false, message: 'Username, password, and email required' });

        // Check if username exists
         db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err });
            if (results.length > 0) return res.status(400).json({ success: false, message: 'Username already taken' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        db.query('INSERT INTO users(username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err });
            res.json({ success: true, message: `User ${username} signed up successfully`, userId: result.insertId });
        });
    });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});

// LOGIN
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ success: false, message: 'Username and password required' });

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        if (results.length === 0) return res.status(401).json({ success: false, message: 'Invalid username or password' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) return res.status(401).json({ success: false, message: 'Invalid username or password' });

        res.json({ success: true, message: `User ${username} logged in successfully`, userId: user.id });
    });
});

module.exports = router;