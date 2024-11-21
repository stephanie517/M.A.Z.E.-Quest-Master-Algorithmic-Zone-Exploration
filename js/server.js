const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/mydatabase'; // Replace with your MongoDB URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// Define a Schema
const DataSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String
});

// Model
const Data = mongoose.model('Data', DataSchema);

// Routes
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Create data (POST)
app.post('/data', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const newData = new Data({ name, email, message });
        await newData.save();
        res.status(201).json({ message: 'Data saved successfully', data: newData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all data (GET)
app.get('/data', async (req, res) => {
    try {
        const allData = await Data.find();
        res.status(200).json(allData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
