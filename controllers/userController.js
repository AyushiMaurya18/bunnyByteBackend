const db = require('../config/db');

// GET USER PROFILE
exports.getProfile = (req, res) => {
  const userId = req.params.id;

  const sql = 'SELECT id, username, email, points, created_at FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
};

// UPDATE USER PROFILE
exports.updateProfile = (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;

  const sql = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
  db.query(sql, [username, email, userId], (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully!' });
  });
};