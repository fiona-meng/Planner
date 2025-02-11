const express = require('express')
const cors = require('cors')
const app = express()
const connectDB = require('./config/database')
const authRoutes = require('./src/routes/authRoutes');

require('dotenv').config();
// Connect to MongoDB
connectDB()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Routes
app.use('/auth', authRoutes);


app.listen(5001, () => {
    console.log('Server is running on port 5001')
})