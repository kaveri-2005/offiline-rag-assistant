import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Thread from "../models/Thread.js";
import { getRAGResponse } from "../utils/RAG.js";
import { analyzeImage } from "../utils/vision.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const router = express.Router();router.get("/thread/:threadId", async (req, res) => {
    const thread = await Thread.findOne({ threadId: req.params.threadId });
    if (!thread) return res.status(404).json({ error: "Not found" });
    res.json(thread); // Sending JSON here stops the HTML error!
});
const upload = multer({ dest: 'uploads/' });

// Global variable for simple session-based PDF context
let documentContext = ""; 

// --- 1. UNIFIED UPLOAD ROUTE (Handles PDF & Images) ---
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const filePath = req.file.path;
        const fileType = req.file.mimetype;

        if (fileType.startsWith("image/")) {
            const summary = await analyzeImage(filePath); // Ensure 'llava' is running!
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.json({ summary, isImage: true });
        } else if (fileType === "application/pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            documentContext = data.text; 
            
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.json({ message: "PDF Analyzed!", isImage: false });
        } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ error: "Only PDF and Images allowed" });
        }
    } catch (err) {
        console.error("DETAILED SERVER ERROR:", err); // Look at your terminal!
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

// --- 3. CHAT INTERACTION ROUTE ---
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;
    if (!threadId || !message) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        let thread = await Thread.findOne({ threadId });
        if (!thread) {
            thread = new Thread({
                threadId,
                title: message.substring(0, 30),
                messages: [{ role: "user", content: message }]
            });
        } else {
            thread.messages.push({ role: "user", content: message });
        }

        // Apply Prompt Augmentation if PDF context exists
        let finalPrompt = message;
        if (documentContext) {
            finalPrompt = `
                Context from Document: ${documentContext.substring(0, 3000)}
                ---
                User Question: ${message}
                ---
                Instructions: Answer using the context provided above. If the answer is not in the context, say you don't know.
            `;
        }

        const assistantReply = await getRAGResponse(finalPrompt);
        
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