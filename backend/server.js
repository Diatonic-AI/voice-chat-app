const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Store conversation history
let conversationHistory = [];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Voice Chat API is running' });
});

// Text-to-Speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'alloy' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Speech-to-Text endpoint
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      response_format: 'text'
    });

    // Clean up uploaded file
    await fs.remove(req.file.path);

    res.json({ 
      transcription: transcription.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('STT Error:', error);
    if (req.file) {
      await fs.remove(req.file.path);
    }
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, resetHistory = false } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (resetHistory) {
      conversationHistory = [];
    }

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Keep conversation history manageable (last 20 messages)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful voice assistant. Keep your responses conversational and concise, as they will be converted to speech.'
        },
        ...conversationHistory
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Add assistant response to history
    conversationHistory.push({
      role: 'assistant',
      content: response
    });

    res.json({
      response: response,
      timestamp: new Date().toISOString(),
      conversationLength: conversationHistory.length
    });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Get conversation history
app.get('/api/history', (req, res) => {
  res.json({
    history: conversationHistory,
    length: conversationHistory.length
  });
});

// Clear conversation history
app.delete('/api/history', (req, res) => {
  conversationHistory = [];
  res.json({ message: 'Conversation history cleared' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Voice Chat Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
