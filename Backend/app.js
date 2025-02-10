const express = require('express')
const cors = require('cors')
const app = express()
const connectDB = require('./config/database')
const taskRoutes = require('./src/routes/taskRoutes');
const authRoutes = require('./src/routes/authRoutes');
const plannerRoutes = require('./src/routes/plannerRoutes');

require('dotenv').config();
// Connect to MongoDB
connectDB()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Routes
app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);
app.use('/planner', plannerRoutes);

app.listen(5001, () => {
    console.log('Server is running on port 5001')
})