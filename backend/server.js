const express = require('express');
const cors = require('cors'); 
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Only try to load dotenv if we are NOT on Render
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const S_URL = process.env.SUPABASE_URL;
const S_KEY = process.env.SUPABASE_ANON_KEY;
const D_KEY = process.env.DEEPGRAM_API_KEY;

// Add a check to see if variables are missing
if (!S_URL || !S_KEY) {
  console.error("❌ MISSING ERROR: Supabase environment variables are not set!");
}


const app = express();
app.use(cors()); 
app.use(express.json());

const supabase = createClient(S_URL, S_KEY);

// Setup Multer for audio files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

app.get('/', (req, res) => {
  res.send("🚀 Backend Server is Running Successfully!");
});

// --- AUTH ROUTES (Fixes the "Invalid Auth" error on frontend) ---
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.json({ message: "Login successful", user: data.user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- TRANSCRIBE ROUTE (Your original logic, cleaned of duplicates) ---
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

    // Using your exact Deepgram URL and parameters
    const deepgramUrl = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true&diarize=true&punctuate=true';
      const response = await axios.post(
  deepgramUrl,
  req.file.buffer,
  { 
    headers: { 
      'Authorization': `Token ${D_KEY}`, 
      'Content-Type': req.file.mimetype || 'audio/wav' 
    } 
  }
);
  
   

    const transcript = response.data.results.channels[0].alternatives[0].transcript;
    
    if (!transcript || transcript.trim().length === 0) {
      return res.json({ transcript: "AI could not process the voice. Try speaking Loudly." });
    }

    // Saving to your Supabase table
    await supabase.from('transcriptions').insert([{ text: transcript, email: req.body.email }]);
    res.json({ transcript });

  } catch (err) {
    console.error("Deepgram Error:", err.response?.data || err.message);
    res.status(500).json({ transcript: "Connection Error", error: err.message });
  }
});

// --- HISTORY ROUTES (Kept exactly as you had them) ---
app.get('/api/history', async (req, res) => {
  const { email } = req.query; 
  const { data, error } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('email', email) // This filters the data and  tells Supabase: "Only give me rows for this email"
    .order('created_at', { ascending: false }); // Optional: keeps newest on top

  if (error) return res.status(400).json(error);
  res.json(data);
});

    app.delete('/api/history/:id', async (req, res) => {
    const { email } = req.query; // Catch email from frontend
    await supabase
    .from('transcriptions')
    .delete()
    .eq('id', req.params.id)
    .eq('email', email); // Only delete if the owner matches
      res.json({ message: "Deleted" });
      });

      app.delete('/api/history', async (req, res) => {
      const { email } = req.query;
      await supabase
       .from('transcriptions')
       .delete()
       .eq('email', email); // ONLY clear records for this specific email
       res.json({ message: "Cleared" });
      });

  app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));