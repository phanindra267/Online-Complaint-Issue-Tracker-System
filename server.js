const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path for data persistence
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'complaints.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// In-memory data store with file fallback
let complaints = [];
let nextId = 1;

// Load complaints from file
function loadComplaints() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            complaints = JSON.parse(fileData);
            if (complaints.length > 0) {
                nextId = Math.max(...complaints.map(c => c.id)) + 1;
            }
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
        complaints = [];
    }
}

// Save complaints to file
function saveComplaints() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(complaints, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving complaints:', error);
    }
}

// Initial load
loadComplaints();

// Local NLP / AI Classifier Engine
const CATEGORY_KEYWORDS = {
    Technical: ['bug', 'error', 'crash', 'fail', 'broken', 'issue', 'not working', 'slow', 'loading', 'freeze', 'page', 'site', 'website', 'app', 'application', 'server', 'down', 'connection', 'internet', 'network', 'login', 'access', 'load', 'ui', 'button'],
    Billing: ['refund', 'charge', 'money', 'billing', 'invoice', 'pay', 'payment', 'subscription', 'price', 'cost', 'fee', 'charged', 'card', 'bank', 'credit', 'transaction', 'receipt', 'double'],
    Account: ['password', 'account', 'signin', 'sign-in', 'register', 'signup', 'sign-up', 'email', 'profile', 'username', 'hacked', 'security', 'leak', 'auth', 'verification', 'credentials', 'otp'],
    Feedback: ['suggest', 'improve', 'feature', 'idea', 'like', 'dislike', 'feedback', 'opinion', 'recommend', 'good', 'bad', 'great', 'terrible', 'awesome', 'suggestion']
};

const URGENCY_KEYWORDS = {
    high: ['urgent', 'emergency', 'asap', 'immediately', 'broken', 'hacked', 'leak', 'security', 'critical', 'down', 'crash', 'payment', 'charge', 'money', 'stolen', 'cannot login', 'blocked', 'exploit', 'compromised'],
    medium: ['error', 'slow', 'fail', 'issue', 'refund', 'subscription', 'invoice', 'reset', 'password', 'bug', 'not working']
};

function classifyComplaint(text) {
    const cleanText = (text || '').toLowerCase();
    
    // Category Scoring
    let bestCategory = 'General';
    let maxScore = 0;
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = cleanText.match(regex);
            if (matches) {
                score += matches.length;
            }
        });
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }
    
    // Urgency Score & Priority Calculation
    let priority = 'Low';
    let urgencyScore = 0.1;
    
    let highMatches = 0;
    let mediumMatches = 0;
    
    URGENCY_KEYWORDS.high.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) highMatches += matches.length;
    });
    
    URGENCY_KEYWORDS.medium.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) mediumMatches += matches.length;
    });
    
    if (highMatches > 0) {
        priority = 'High';
        urgencyScore = 0.8 + (highMatches * 0.05);
    } else if (mediumMatches > 0) {
        priority = 'Medium';
        urgencyScore = 0.5 + (mediumMatches * 0.05);
    } else {
        priority = 'Low';
        urgencyScore = 0.2 + (cleanText.length * 0.001);
    }
    
    urgencyScore = Math.min(1.0, urgencyScore);
    
    return {
        category: bestCategory,
        priority: priority,
        urgencyScore: parseFloat(urgencyScore.toFixed(2))
    };
}

// Routes

// POST Admin Login
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'admin-token-12345' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// GET all complaints (Supports search, filtering, and custom sorting)
app.get('/complaints', (req, res) => {
    let result = [...complaints];
    
    // Filtering parameters
    const { search, category, priority, status } = req.query;
    
    if (search) {
        const cleanSearch = search.toLowerCase();
        result = result.filter(c => 
            c.id.toString().includes(cleanSearch) ||
            c.name.toLowerCase().includes(cleanSearch) ||
            c.email.toLowerCase().includes(cleanSearch) ||
            c.text.toLowerCase().includes(cleanSearch)
        );
    }
    
    if (category) {
        result = result.filter(c => c.category === category);
    }
    
    if (priority) {
        result = result.filter(c => c.priority === priority);
    }
    
    if (status) {
        result = result.filter(c => c.status === status);
    }
    
    res.json(result);
});

// GET specific complaint (Supports tracking page search by email or ID)
app.get('/complaints/:id', (req, res) => {
    const idParam = req.params.id;
    
    // Check if finding by ID or finding by Email via tracking query
    let complaint;
    if (isNaN(idParam)) {
        // Find by email (case-insensitive)
        complaint = complaints.find(c => c.email.toLowerCase() === idParam.toLowerCase());
    } else {
        const id = parseInt(idParam);
        complaint = complaints.find(c => c.id === id);
    }
    
    if (complaint) {
        res.json(complaint);
    } else {
        res.status(404).json({ message: 'Complaint not found' });
    }
});

// POST new complaint
app.post('/complaints', (req, res) => {
    const { name, email, text, category, priority } = req.body;
    if (!name || !email || !text) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Run local AI classifier for Category, Priority, Urgency
    const aiTags = classifyComplaint(text);
    
    // Use user-provided tags if available, else fall back to AI suggestions
    const finalCategory = category || aiTags.category;
    const finalPriority = priority || aiTags.priority;
    
    // Calculate final Urgency Score
    // Weight = priority category (Low: 0.2, Medium: 0.5, High: 0.8) + length/keywords
    const priorityWeight = finalPriority === 'High' ? 0.8 : (finalPriority === 'Medium' ? 0.5 : 0.2);
    const calculatedUrgency = parseFloat(((priorityWeight * 0.6) + (aiTags.urgencyScore * 0.4)).toFixed(2));

    const newComplaint = {
        id: nextId++,
        name,
        email,
        text,
        category: finalCategory,
        priority: finalPriority,
        urgencyScore: calculatedUrgency,
        status: 'Pending',
        adminResponse: '',
        timestamp: new Date().toISOString()
    };
    
    complaints.push(newComplaint);
    saveComplaints();
    res.status(201).json(newComplaint);
});

// PUT update complaint status & admin response
app.put('/complaints/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { status, adminResponse } = req.body;
    
    const complaintIndex = complaints.findIndex(c => c.id === id);
    if (complaintIndex !== -1) {
        if (status) {
             complaints[complaintIndex].status = status;
        }
        if (adminResponse !== undefined) {
             complaints[complaintIndex].adminResponse = adminResponse;
        }
        saveComplaints();
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
        saveComplaints();
        res.json({ message: 'Complaint deleted successfully' });
    } else {
        res.status(404).json({ message: 'Complaint not found' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
