const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get('/', (req, res) => {
  res.send('bunnyByte is working!');
});

// IMPORT ROUTES
const userRoutes = require('./routes/users');
const challengeRoutes = require('./routes/challenges');
const progressRoutes = require('./routes/progress');

// USE ROUTES
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/progress', progressRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
