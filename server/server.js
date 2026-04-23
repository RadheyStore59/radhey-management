const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// Load env from server/ even when cwd is repo root (Render, `node server/server.js`)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/radhey-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/gst', require('./routes/gst'));
app.use('/api/courier', require('./routes/courier'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/form-configs', require('./routes/formConfigs'));
app.use('/api/stock-items', require('./routes/stockItems'));

// Health route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Radhey Management API is running...' });
});

// Serve React build for single-service deployment
const buildDir = path.join(__dirname, '../build');
app.use(express.static(buildDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.sendFile(path.join(buildDir, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
