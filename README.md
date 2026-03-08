# OfflineGPT - English Support

A powerful, offline-first AI assistant built with Llama 3.2, React, and Node.js. Optimized for B.Tech Project 2026.

## Supported Languages
- English

## Features
- **Offline RAG**: Chat with your local documents (PDFs).
- **Vision**: Analyze images locally.
- **Voice Support**: Speak to the assistant (English, Hindi, Telugu).
- **YouTube Summarization**: Get summaries of YouTube videos.
- **Privacy First**: Everything runs on your machine using Ollama.

## Quick Setup (Windows)

1. **Download the Zip** or Clone the repo.
2. **Extract** the files if you downloaded a zip.
3. **Double-click `setup.bat`**. This will:
   - Verify Node.js and Ollama installation.
   - Install all required dependencies (`npm install`).
   - Download the Llama 3.2 model (approx 1.3GB).
4. **Start the Application**:
   ```bash
   npm run dev
   ```
   *This starts both the Backend and Frontend.*

## Manual Setup (Other OS)

1. **Install Ollama**: [ollama.com](https://ollama.com/)
2. **Pull the model**:
   ```bash
   ollama pull llama3.2:1b
   ```
3. **Install dependencies**:
   ```bash
   npm install
   cd Backend && npm install
   cd ../Frontend && npm install
   ```
4. **Run**:
   ```bash
   cd ..
   npm run dev
   ```

## Requirements
- **Node.js**: v18+
- **Ollama**: Latest version
- **RAM**: 8GB+ recommended
- **GPU**: Optional (Ollama uses CPU/GPU automatically)
