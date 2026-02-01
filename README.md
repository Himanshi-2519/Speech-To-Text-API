〔 Ⱨ 〕 Speech-to-Text AI Lab
 "Capturing the Rhythm of your words. Real-time AI transcription with a beautiful neon interface and secure cloud history.🌟"


A professional MERN stack application (using Supabase for PostgreSQL) that converts live audio and uploaded files into high-accuracy text. This project is specifically designed to handle **English, Hindi, and Gujarati** voices using AI-driven language detection.

## 🌟 Key Features
- **Multilingual Transcription**: Automatic detection and script generation for Hindi (Devanagari), Gujarati, and English.
- **Live Voice Recording**: Capture audio directly in the browser with real-time waveform visualization.
- **File Upload Support**: Upload existing recordings (MP3, WAV, WebM) for instant transcription.
- **Secure Authentication**: User signup and login systems powered by Supabase Auth.
- **Transcription History**: Persistent card-based history grid with options to delete or "Clear All" entries.
- **Responsive Deep-Dark UI**: Optimized for focus and high contrast using Tailwind CSS.

## 🛠️ Technical Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: Supabase (PostgreSQL).
- **AI Engine**: Deepgram Nova-2 (via API).
- **File Handling**: Multer (Memory Storage).

## 🚀 Setup & Installation

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your system.

### 2. Backend Setup
1. Navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
