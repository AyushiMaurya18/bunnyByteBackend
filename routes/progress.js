const express = require('express');
const router = express.Router();
const { createProgress, updateProgress, getProgress, getFastestCompletions } = require('../controllers/progressController');

router.post('/create', createProgress);
router.post('/', updateProgress);
router.get('/:userId', getProgress);
router.get('/fastest/:challengeId', getFastestCompletions);

module.exports = router;