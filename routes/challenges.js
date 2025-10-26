const express = require('express');
const router = express.Router();
const { getAllChallenges, getChallenge, createChallenge, getChallengesByDifficulty } = require('../controllers/challengeController');

router.get('/', getAllChallenges);
router.post('/', createChallenge);
router.get('/difficulty/:difficulty', getChallengesByDifficulty);
router.get('/:id', getChallenge);

module.exports = router;