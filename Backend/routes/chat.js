import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Thread from "../models/ThreadLocal.js";
import { getRAGResponse } from "../utils/RAG.js";
import { analyzeImage } from "../utils/vision.js";
import { PDFParse } from 'pdf-parse';
import { generateThreadTitle } from '../utils/titles.js';
import { YoutubeTranscript } from 'youtube-transcript';

const router = express.Router();

router.get("/thread/:threadId", async (req, res) => {
    const thread = await Thread.findOne({ threadId: req.params.threadId });
    if (!thread) return res.status(404).json({ error: "Not found" });
    res.json(thread); // Sending JSON here stops the HTML error!
});
const upload = multer({ dest: 'uploads/' });

// Context is now stored per-thread in the database

// Language instruction removed at user request

// --- 1. UNIFIED UPLOAD ROUTE (Handles PDF & Images) ---
router.post("/upload", upload.single("file"), async (req, res) => {
    console.log("Upload request received");
    const { threadId, message } = req.body;

    try {
        if (!req.file) {
            console.log("No file uploaded");
            return res.status(400).json({ error: "No file uploaded" });
        }
        
        const filePath = req.file.path;
        console.log("File uploaded to:", filePath);
        const fileType = req.file.mimetype;
        console.log("File type:", fileType);

        if (fileType.startsWith("image/")) {
            console.log("Processing image...");
            const imagePrompt = (message || "Analyze this image");
            const summary = await analyzeImage(filePath, imagePrompt); 
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            console.log("Image processed successfully");

            if (threadId) {
                let thread = await Thread.findOne({ threadId });
                if (!thread) {
                    console.log("Thread not found, creating new thread for image upload:", threadId);
                    thread = new Thread({
                        threadId,
                        title: "Image Analysis Chat",
                        messages: []
                    });
                }
                
                thread.messages.push({ role: "user", content: message || "Analyze this image" });
                thread.messages.push({ role: "assistant", content: summary });
                thread.updatedAt = Date.now();
                await thread.save();
            }

            return res.json({ summary, isImage: true });
        } else if (fileType === "application/pdf") {
            console.log("Processing PDF...");
            const dataBuffer = fs.readFileSync(filePath);
            
            // pdf-parse v2.4.5 API: class-based usage
            const parser = new PDFParse({ data: dataBuffer });
            const result = await parser.getText();
            await parser.destroy();
            
            if (!result || !result.text) {
                console.log("PDF parsing failed or returned no text");
                throw new Error("Failed to extract text from PDF");
            }

            if (threadId) {
                let thread = await Thread.findOne({ threadId });
                
                // If thread doesn't exist, create it!
                if (!thread) {
                    console.log("Thread not found, creating new thread for upload:", threadId);
                    thread = new Thread({
                        threadId,
                        title: "Document Chat",
                        messages: []
                    });
                }

                thread.documentContext = result.text.substring(0, 20000); // Store context in thread
                
                let assistantReply = "I have analyzed the document. You can now ask questions about it!";
                if (message) {
                    const finalPrompt = `[DOCUMENT CONTEXT]\n${thread.documentContext.substring(0, 3000)}\n\n[USER QUESTION]\n${message}\n\n[INSTRUCTIONS]\nAnswer strictly using the document context provided above. Be detailed and helpful.`;
                    assistantReply = await getRAGResponse(finalPrompt);
                }

                thread.messages.push({ role: "user", content: message || `Uploaded: ${req.file.originalname}` });
                thread.messages.push({ role: "assistant", content: assistantReply });
                thread.updatedAt = Date.now();
                await thread.save();
                
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
                return res.json({ message: "PDF Analyzed!", isImage: false, reply: assistantReply });
            }
            
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.json({ message: "PDF Parsed, but no thread found to attach context.", isImage: false });
        } else {
            console.log("Invalid file type:", fileType);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ error: "Only PDF and Images allowed" });
        }
    } catch (err) {
        console.error("DETAILED SERVER ERROR:", err);
        // Clean up file if error occurs
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});

// --- 2. THREAD MANAGEMENT ROUTES ---
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({}).sort({ updatedAt: -1 });
        res.json(threads);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    try {
        await Thread.deleteOne({ threadId: req.params.threadId });
        res.json({ message: "Thread deleted" });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Helper function to check if a URL is a YouTube URL
function isYouTubeUrl(url) {
    if (!url) return false;
    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return (url.match(p)) ? true : false;
}

// --- 3. CHAT INTERACTION ROUTE ---
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;
    if (!threadId || !message) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        let thread = await Thread.findOne({ threadId });
        if (!thread) {
            const smartTitle = await generateThreadTitle(message);
            thread = new Thread({
                threadId,
                title: smartTitle,
                messages: [{ role: "user", content: message }]
            });
        } else {
            thread.messages.push({ role: "user", content: message });
        }

        let assistantReply = "";

        // Check if message is a YouTube URL
        if (isYouTubeUrl(message.trim())) {
            try {
                // Backend check for internet connectivity is complex, 
                // we rely on the catch block if the request fails.
                console.log("Fetching YouTube transcript for:", message.trim());
                    const transcriptData = await YoutubeTranscript.fetchTranscript(message.trim());
                    if (transcriptData && transcriptData.length > 0) {
                        const fullTranscript = transcriptData.map(t => t.text).join(' ');
                        const trimmedTranscript = fullTranscript.substring(0, 3000);
                        const ytPrompt = `[YOUTUBE TRANSCRIPT CONTEXT]\n${trimmedTranscript}\n\n[INSTRUCTIONS]\nYou are a professional assistant. Please summarize the YouTube video transcript provided above in English. Highlight the key points.`;
                        assistantReply = await getRAGResponse(ytPrompt);
                    } else {
                        assistantReply = `Could not extract transcript from this video. It might not have closed captions enabled.`;
                    }
            } catch (err) {
                assistantReply = `Failed to process the YouTube link. Make sure the video is public and has closed captions. ${err.message}`;
            }
        } else {
            // Normal Chat Logic
            let finalPrompt = message;
            if (thread.documentContext) {
                finalPrompt = `[DOCUMENT CONTEXT]\n${thread.documentContext.substring(0, 3000)}\n\n[USER QUESTION]\n${message}\n\n[INSTRUCTIONS]\nAnswer using the document context above. If the answer is not in the context, say you don't know.`;
            }
            
            // Get last 5 messages for history (excluding current user message which is already in prompt)
            const history = thread.messages.slice(-6, -1).map(m => ({ role: m.role, content: m.content }));
            assistantReply = await getRAGResponse(finalPrompt, history);
        }
        
        thread.messages.push({ role: "assistant", content: assistantReply });
        thread.updatedAt = Date.now();
        await thread.save();
        
        res.json({ reply: assistantReply });
    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;