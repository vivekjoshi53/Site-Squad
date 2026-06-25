const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read leads (Local Archive)
function readLeads() {
    try {
        if (!fs.existsSync(LEADS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(LEADS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Error reading leads file:', err);
        return [];
    }
}

// Helper to write leads (Local Archive)
function writeLeads(leads) {
    try {
        fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing leads file:', err);
    }
}

// REST API: Submit contact form lead
app.post('/api/contact', (req, res) => {
    const { name, email, phone, businessName, projectType, budget, message } = req.body;

    // Validation
    if (!name || !email || !projectType || !budget || !message) {
        return res.status(400).json({ error: 'Please fill in all required fields (Name, Email, Project Type, Budget, and Message).' });
    }

    const newLead = {
        id: '_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone: phone || 'N/A',
        businessName: businessName || 'N/A',
        projectType,
        budget,
        message,
        timestamp: new Date().toISOString()
    };

    // Save lead in local archive
    const leads = readLeads();
    leads.unshift(newLead);
    writeLeads(leads);

    res.status(201).json({ success: true, message: 'Successfully Sent!' });
});

// Fallback to index.html for undefined routes
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
