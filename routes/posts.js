const express = require('express');
const router = express.Router();
const db = require('../server');

// GET all posts
router.get('/', (req, res) => {
     const query = `SELECT posts.id, posts.title, posts.content, users.username AS author
                   FROM posts
                   JOIN users ON posts.author = users.id`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, posts: results });
    });
});

// POST create post
router.post('/', (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author)
        return res.status(400).json({ success: false, message: 'Title, content, and author are required' });
     const query = 'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)';
    
    db.query(query, [title, content, author], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: `Post "${title}" created successfully`, postId: result.insertId });
    });
});

module.exports = router;