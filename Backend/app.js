const express = require('express')
const cors = require('cors')
const app = express()
const connectDB = require('./config/database')
const authRoutes = require('./src/routes/authRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const todoRoutes = require('./src/routes/todoRoutes');

require('dotenv').config();
// Connect to MongoDB
connectDB()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/todos', todoRoutes);

app.listen(5001, () => {
    console.log('Server is running on port 5001')
})