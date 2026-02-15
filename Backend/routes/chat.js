import express from 'express';
import Thread from "../models/Thread.js";
import { getRAGResponse } from "../utils/RAG.js";
const router = express.Router();

// Get all threads for the sidebar
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
        // Ensure you are using 'threadId' (your custom UUID) to find the document
        await Thread.deleteOne({ threadId: req.params.threadId });
        res.json({ message: "Thread deleted" });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Post a new message
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

        const assistantReply = await getRAGResponse(message);
        thread.messages.push({ role: "assistant", content: assistantReply });
        thread.updatedAt = Date.now();
        await thread.save();
        
        res.json({ reply: assistantReply });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;