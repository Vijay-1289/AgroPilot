import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve directories for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support larger base64 photo uploads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: "healthy", timestamp: new Date(), service: "AgroPilot Engine" });
});

// API Routes
app.use('/api', apiRouter);

// Serve Static Frontend Assets in Production
if (process.env.NODE_ENV === 'production') {
  console.log("🚀 Production mode detected. Serving static client assets from dist/");
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send("🌱 AgroPilot backend running in DEVELOPMENT mode. Port 3000 proxies requests here.");
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.stack);
  res.status(500).json({
    error: "InternalServerError",
    message: err.message || "An unexpected error occurred on the server.",
  });
});

app.listen(PORT, () => {
  console.log(`📡 AgroPilot Express Server listening on http://localhost:${PORT}`);
});
