require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

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

// Nodemailer SMTP Transporter Setup (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'vivekjoshi.53107@gmail.com',
        pass: process.env.EMAIL_PASS // Gmail App Password
    }
});

// REST API: Submit contact form lead and send email
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

    // Save lead in local archive as fallback backup
    const leads = readLeads();
    leads.unshift(newLead);
    writeLeads(leads);

    // Email content configuration
    const mailOptions = {
        from: process.env.EMAIL_USER || 'vivekjoshi.53107@gmail.com',
        to: 'vivekjoshi.53107@gmail.com',
        replyTo: email, // Allows direct reply to client from mail inbox
        subject: `New Lead - ${projectType} from ${name}`,
        text: `You have received a new project lead from The Site Squad website contact form!

Client Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || 'N/A'}
- Business Name: ${businessName || 'N/A'}

Project Requirements:
- Project Type: ${projectType}
- Approximate Budget: ${budget}

Message:
${message}

---------------------------------------------------------
This is an automated notification from The Site Squad server.
`
    };

    // Send email via SMTP if credentials exist
    if (process.env.EMAIL_PASS) {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('\n=================== [NODEMAILER ERROR] ===================');
                console.error('Error sending email:', error);
                console.error('==========================================================\n');
            } else {
                console.log('\n=================== [NODEMAILER SUCCESS] ===================');
                console.log('Email sent successfully:', info.response);
                console.log('============================================================\n');
            }
        });
    } else {
        // Fallback: log warning and output to console (for local development/testing)
        console.log('\n=================== [GMAIL SIMULATOR - NO credentials] ===================');
        console.log(`[WARNING] EMAIL_PASS is not configured in .env file. Email send skipped.`);
        console.log(`To: vivekjoshi.53107@gmail.com`);
        console.log(`Subject: New Lead Generated - ${projectType} from ${name}`);
        console.log(`Body:\n${mailOptions.text}`);
        console.log(`=========================================================================\n`);
    }

    res.status(201).json({ success: true, message: 'Thank you for reaching out! Your message was sent successfully.' });
});

// Fallback to index.html for undefined routes
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
