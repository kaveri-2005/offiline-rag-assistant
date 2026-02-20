import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Thread from "../models/ThreadLocal.js";
import { getRAGResponse } from "../utils/RAG.js";
import { analyzeImage } from "../utils/vision.js";
import { PDFParse } from 'pdf-parse';
import { generateThreadTitle } from '../utils/titles.js';
const router = express.Router();

router.get("/thread/:threadId", async (req, res) => {
    const thread = await Thread.findOne({ threadId: req.params.threadId });
    if (!thread) return res.status(404).json({ error: "Not found" });
    res.json(thread); // Sending JSON here stops the HTML error!
});
const upload = multer({ dest: 'uploads/' });

// Global variable for simple session-based PDF context
let documentContext = ""; 

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
            const summary = await analyzeImage(filePath, message); // Pass custom prompt
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            console.log("Image processed successfully");

            if (threadId) {
                let thread = await Thread.findOne({ threadId });
                if (thread) {
                    thread.messages.push({ role: "user", content: message || "Analyze this image" });
                    thread.messages.push({ role: "assistant", content: summary });
                    thread.updatedAt = Date.now();
                    await thread.save();
                }
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

            documentContext = result.text.substring(0, 20000); // Limit context size 
            console.log("PDF Text extracted, length:", documentContext.length);
            
            let assistantReply = "I have analyzed the document. You can now ask questions about it!";
            
            if (message) {
                const finalPrompt = `
                    Context from Document: ${documentContext.substring(0, 3000)}
                    ---
                    User Question: ${message}
                    ---
                    Instructions: Answer using the context provided above.
                `;
                assistantReply = await getRAGResponse(finalPrompt);
            }

            if (threadId) {
                let thread = await Thread.findOne({ threadId });
                if (thread) {
                    thread.messages.push({ role: "user", content: message || `Uploaded: ${req.file.originalname}` });
                    thread.messages.push({ role: "assistant", content: assistantReply });
                    thread.updatedAt = Date.now();
                    await thread.save();
                }
            }

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.json({ message: "PDF Analyzed!", isImage: false, reply: assistantReply });
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