const db = require('../config/db');

exports.getAllChallenges = (req, res) => {
  db.query('SELECT * FROM challenges', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.createChallenge = (req, res) => {
  const { title, description, difficulty, points } = req.body;
  const sql = 'INSERT INTO challenges (title, description, difficulty, points) VALUES (?, ?, ?, ?)';
  db.query(sql, [title, description, difficulty, points], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Challenge added successfully!' });
  });
};

exports.getChallenge = (req, res) => {
  const challengeId = req.params.id;
  const sql = 'SELECT * FROM challenges WHERE id = ?';
  db.query(sql, [challengeId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Challenge not found' });
    res.json(results[0]);
  });
};

exports.getChallengesByDifficulty = (req, res) => {
  const difficulty = req.params.difficulty;
  const sql = 'SELECT * FROM challenges WHERE difficulty = ?';
  db.query(sql, [difficulty], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
};
