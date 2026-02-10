const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store
let complaints = [];
let nextId = 1;

// Routes

// GET all complaints
app.get('/complaints', (req, res) => {
    res.json(complaints);
});

// GET specific complaint
app.get('/complaints/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const complaint = complaints.find(c => c.id === id);
    if (complaint) {
        res.json(complaint);
    } else {
        res.status(404).json({ message: 'Complaint not found' });
    }
});

// POST new complaint
app.post('/complaints', (req, res) => {
    const { name, email, text } = req.body;
    if (!name || !email || !text) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const newComplaint = {
        id: nextId++,
        name,
        email,
        text,
        status: 'Pending',
        timestamp: new Date()
    };
    complaints.push(newComplaint);
    res.status(201).json(newComplaint);
});

// PUT update complaint status
app.put('/complaints/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    const complaintIndex = complaints.findIndex(c => c.id === id);
    if (complaintIndex !== -1) {
        if (status) {
             complaints[complaintIndex].status = status;
        }
        res.json(complaints[complaintIndex]);
    } else {
        res.status(404).json({ message: 'Complaint not found' });
    }
});

// DELETE complaint
app.delete('/complaints/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = complaints.length;
    complaints = complaints.filter(c => c.id !== id);
    
    if (complaints.length < initialLength) {
        res.json({ message: 'Complaint deleted successfully' });
    } else {
        res.status(404).json({ message: 'Complaint not found' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
