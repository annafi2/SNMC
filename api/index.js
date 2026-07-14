require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Endpoints

// 1. Get all applicants
app.get('/api/applicants', async (req, res) => {
  try {
    const applicants = await prisma.applicant.findMany();
    res.json(applicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ 
      error: 'Failed to fetch applicants',
      message: error.message,
      env_exists: !!process.env.DATABASE_URL
    });
  }
});

// 2. Get a single applicant by ID
app.get('/api/applicants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id }
    });
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }
    res.json(applicant);
  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ error: 'Failed to fetch applicant' });
  }
});

// 3. Create or update an applicant (Upsert)
app.post('/api/applicants', async (req, res) => {
  const applicantData = req.body;
  
  if (!applicantData.id || !applicantData.nama || !applicantData.email) {
    return res.status(400).json({ error: 'Missing required applicant fields' });
  }

  try {
    const { id, nama, email, jalur, tanggalLahir, sekolahMinecraft, roleMinecraft, essay, scoreIRT, essayScoreIRT, ujianCode, status, tanggalSubmit, stats } = applicantData;

    // Convert scores to float or null safely
    const parsedScoreIRT = scoreIRT !== undefined && scoreIRT !== null ? parseFloat(scoreIRT) : null;
    const parsedEssayScoreIRT = essayScoreIRT !== undefined && essayScoreIRT !== null ? parseFloat(essayScoreIRT) : null;

    const applicant = await prisma.applicant.upsert({
      where: { id },
      update: {
        nama,
        email,
        jalur,
        tanggalLahir,
        sekolahMinecraft,
        roleMinecraft,
        essay,
        scoreIRT: parsedScoreIRT,
        essayScoreIRT: parsedEssayScoreIRT,
        ujianCode,
        status,
        tanggalSubmit,
        stats: stats || undefined
      },
      create: {
        id,
        nama,
        email,
        jalur,
        tanggalLahir,
        sekolahMinecraft,
        roleMinecraft,
        essay,
        scoreIRT: parsedScoreIRT,
        essayScoreIRT: parsedEssayScoreIRT,
        ujianCode,
        status: status || 'Dalam Proses',
        tanggalSubmit,
        stats: stats || undefined
      }
    });

    res.json(applicant);
  } catch (error) {
    console.error('Error saving applicant:', error);
    res.status(500).json({ error: 'Failed to save applicant data' });
  }
});

// 4. Update specific fields (PATCH)
app.patch('/api/applicants/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Sanitize and format data if score/essay fields are updated
    if (updateData.scoreIRT !== undefined && updateData.scoreIRT !== null) {
      updateData.scoreIRT = parseFloat(updateData.scoreIRT);
    }
    if (updateData.essayScoreIRT !== undefined && updateData.essayScoreIRT !== null) {
      updateData.essayScoreIRT = parseFloat(updateData.essayScoreIRT);
    }

    const updated = await prisma.applicant.update({
      where: { id },
      data: updateData
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating applicant:', error);
    res.status(500).json({ error: 'Failed to update applicant data' });
  }
});

// 5. Delete an applicant by ID
app.delete('/api/applicants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.applicant.delete({
      where: { id }
    });
    res.json({ success: true, message: `Applicant ${id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting applicant:', error);
    res.status(500).json({ error: 'Failed to delete applicant' });
  }
});

// 6. Batch update applicant statuses
app.post('/api/applicants/batch', async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'updates must be an array' });
  }

  try {
    const transactions = updates.map(update => 
      prisma.applicant.update({
        where: { id: update.id },
        data: { status: update.status }
      })
    );
    await prisma.$transaction(transactions);
    res.json({ success: true, message: 'Batch update successful' });
  } catch (error) {
    console.error('Error in batch update:', error);
    res.status(500).json({ error: 'Batch update failed' });
  }
});

// 6b. Block a CBT applicant (set cbtBlocked = true)
app.post('/api/applicants/:id/block', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.applicant.update({
      where: { id },
      data: { cbtBlocked: true }
    });
    res.json({ success: true, applicant: updated });
  } catch (error) {
    console.error('Error blocking applicant:', error);
    res.status(500).json({ error: 'Failed to block applicant' });
  }
});

// 6c. Unblock a CBT applicant (set cbtBlocked = false, reset violations)
app.post('/api/applicants/:id/unblock', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.applicant.update({
      where: { id },
      data: { cbtBlocked: false, cbtViolations: 0 }
    });
    res.json({ success: true, applicant: updated });
  } catch (error) {
    console.error('Error unblocking applicant:', error);
    res.status(500).json({ error: 'Failed to unblock applicant' });
  }
});

// 7. Reset all applicants
app.post('/api/applicants/reset', async (req, res) => {
  try {
    await prisma.applicant.deleteMany();
    res.json({ success: true, message: 'All applicants deleted' });
  } catch (error) {
    console.error('Error resetting applicants:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// 8. Get system configuration setting
app.get('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const setting = await prisma.setting.findUnique({
      where: { key }
    });
    if (!setting) {
      return res.json(null);
    }
    res.json(setting.value);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// 9. Upsert system configuration setting
app.post('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(setting.value);
  } catch (error) {
    console.error('Error saving setting:', error);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

// Serve static frontend files first (looking one directory level up)
app.use(express.static(path.join(__dirname, '..')));

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin.html'));
});

app.get('/ujian.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ujian.html'));
});

// SPA routing fallback (Redirect non-API routes to index.html)
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
