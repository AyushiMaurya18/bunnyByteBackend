// controllers/progressController.js
const db = require('../config/db'); // your DB connection

// Analyze code complexity
function analyzeCode(code) {
  if (!code) return { lines: 0, loops: 0, nestedLoops: 0, complexityBonus: 0 };
  
  const lines = code.split('\n').filter(line => line.trim().length > 0).length;
  
  // Count loops (for, while, forEach, map, etc.)
  const loopPatterns = /\b(for|while|forEach|map|filter|reduce)\b/g;
  const loops = (code.match(loopPatterns) || []).length;
  
  // Detect nested loops (simple heuristic)
  const nestedLoops = (code.match(/for[^{]*{[^}]*for/g) || []).length +
                      (code.match(/while[^{]*{[^}]*while/g) || []).length;
  
  // Calculate complexity bonus
  let complexityBonus = 0;
  
  // Reward concise code
  if (lines < 10) complexityBonus += 20;
  else if (lines < 20) complexityBonus += 10;
  
  // Penalize inefficient code (nested loops)
  if (nestedLoops > 0) complexityBonus -= 15 * nestedLoops;
  
  // Reward use of efficient methods
  if (code.includes('.reduce') || code.includes('.map')) complexityBonus += 10;
  
  return { lines, loops, nestedLoops, complexityBonus: Math.max(complexityBonus, -30) };
}

// Create new progress entry
exports.createProgress = (req, res) => {
  const { userId, challengeId, status, score } = req.body;
  const startTime = new Date();
  const sql = 'INSERT INTO progress (user_id, challenge_id, status, score, start_time) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [userId, challengeId, status || 'Not Started', score || 0, startTime], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Progress created successfully!', id: result.insertId });
  });
};

// Get user progress
exports.getProgress = (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT * FROM progress WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
};

// Get fastest completions for a challenge
exports.getFastestCompletions = (req, res) => {
  const challengeId = req.params.challengeId;
  const sql = `
    SELECT u.username, p.score, 
    TIMESTAMPDIFF(SECOND, p.start_time, p.completed_time) as time_taken_seconds
    FROM progress p
    JOIN users u ON p.user_id = u.id
    WHERE p.challenge_id = ? AND p.status = 'Completed' AND p.completed_time IS NOT NULL
    ORDER BY time_taken_seconds ASC
    LIMIT 10
  `;
  db.query(sql, [challengeId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
};

// Update user progress
exports.updateProgress = (req, res) => {
  const { userId, challengeId, status, score, submitted_code } = req.body;
  
  // If status is 'Completed', calculate points and update user
  if (status === 'Completed') {
    const completedTime = new Date();
    
    // First, get challenge points and start time
    db.query('SELECT points FROM challenges WHERE id = ?', [challengeId], (err, challengeResults) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.query('SELECT start_time FROM progress WHERE user_id = ? AND challenge_id = ?', [userId, challengeId], (err, progressResults) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const challengePoints = challengeResults[0]?.points || 0;
        const startTime = progressResults[0]?.start_time;
        
        // Calculate time bonus (faster = more points)
        let timeBonus = 0;
        if (startTime) {
          const timeTaken = (completedTime - new Date(startTime)) / 1000; // seconds
          if (timeTaken < 300) timeBonus = 50; // Under 5 mins
          else if (timeTaken < 600) timeBonus = 30; // Under 10 mins
          else if (timeTaken < 1800) timeBonus = 10; // Under 30 mins
        }
        
        // Analyze code complexity
        const codeAnalysis = analyzeCode(submitted_code);
        
        const totalPoints = challengePoints + timeBonus + codeAnalysis.complexityBonus;
        
        // Update progress
        const sql = 'UPDATE progress SET status = ?, score = ?, submitted_code = ?, completed_time = ? WHERE user_id = ? AND challenge_id = ?';
        db.query(sql, [status, totalPoints, submitted_code, completedTime, userId, challengeId], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          
          // Award points to user and increment jumps
          db.query('UPDATE users SET points = points + ?, jumps = jumps + 1 WHERE id = ?', [totalPoints, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Check if user earned a carrot (every 10 jumps)
            db.query('SELECT jumps, carrots FROM users WHERE id = ?', [userId], (err, userResults) => {
              if (err) return res.status(500).json({ error: err.message });
              
              const currentJumps = userResults[0]?.jumps || 0;
              const carrots = userResults[0]?.carrots || 0;
              let carrotEarned = false;
              
              // Award carrot if jumps is a multiple of 10
              if (currentJumps % 10 === 0 && currentJumps > 0) {
                db.query('UPDATE users SET carrots = carrots + 1 WHERE id = ?', [userId], (err) => {
                  if (err) return res.status(500).json({ error: err.message });
                  carrotEarned = true;
                  
                  res.json({ 
                    message: 'Progress updated successfully!', 
                    pointsEarned: totalPoints,
                    breakdown: { 
                      challengePoints, 
                      timeBonus, 
                      complexityBonus: codeAnalysis.complexityBonus 
                    },
                    codeAnalysis: {
                      lines: codeAnalysis.lines,
                      loops: codeAnalysis.loops,
                      nestedLoops: codeAnalysis.nestedLoops
                    },
                    jumps: currentJumps,
                    carrotEarned: true,
                    totalCarrots: carrots + 1
                  });
                });
              } else {
                res.json({ 
                  message: 'Progress updated successfully!', 
                  pointsEarned: totalPoints,
                  breakdown: { 
                    challengePoints, 
                    timeBonus, 
                    complexityBonus: codeAnalysis.complexityBonus 
                  },
                  codeAnalysis: {
                    lines: codeAnalysis.lines,
                    loops: codeAnalysis.loops,
                    nestedLoops: codeAnalysis.nestedLoops
                  },
                  jumps: currentJumps,
                  carrotEarned: false,
                  jumpsToNextCarrot: 10 - (currentJumps % 10)
                });
              }
            });
          });
        });
      });
    });
  } else {
    // Not completed, just update progress
    const sql = 'UPDATE progress SET status = ?, score = ?, submitted_code = ? WHERE user_id = ? AND challenge_id = ?';
    db.query(sql, [status, score, submitted_code, userId, challengeId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Progress updated successfully!' });
    });
  }
};
