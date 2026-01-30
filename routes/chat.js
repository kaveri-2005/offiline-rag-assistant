// import express from 'express';
// import Thread from "../models/Thread.js";
// import getRAGResponse from "./utils/RAG.js";
// const router=express.Router();

// //test 
// router.post("/test", async(req,res)=>{
//     try{
//         const Thread =new Thread({
//             threadId:"xyz"+Date.now(),
//             title:"Testing New Thread"
//         });
//         const response=await thread.save();
//         res.send(response);
//     }
//     catch(err){
//         console.log(err);
//         res.status(500).json({error:"Failed to save in DB"});
//     }
// });

// //get all threads
// router.get("/thread",async(req,res)=>{
//     try{
//       const threads=await Thread.find({}).sort({updatedAt:-1});
//         res.json(threads);
//     }
//     catch(err){
//            console.log(err);
//         res.status(500).json({error:"Failed to fetch thread"});
//     }
// })

// router.get("/thread/:threadId", async(req,res)=>{
//     const {threadId}=req.params;
//     try{
//         const threadId= await thread.findOne({threadId});
//         if(!threadId){
//             res.status(404).json({error:"Thread not found"});
//         }
//     } 
//     catch(err){
//            console.log(err);
//         res.status(500).json({error:"Failed to fetch thread"});
//     }
// })
// router.delete("/thread/:threadId",async(req,res)=>{
//     const {threadId}=req.params;

//     try{
//        const deletedThread=await Thread.findOneAndDelete({threadId});
//        if(!deletedThread){
//         res.status(404).json({error:"Thread not found"});
//        }
    
//       res.status(300).json({error:"Thread deleted Sucessfully"});
//     }
//     catch(err){
//            console.log(err);
//         res.status(500).json({error:"Failed to fetch thread"});
//     }
    
// })
// router.post("/chat", async(req,res)=>{
//     const {threadId,message}=req.body;
//     if(threadId || message){
//          res.status(404).json({error:"missing the received fields"});
//     }
//     try{
//         const thread=await Thread.findOne({threadId});
//         if(!thread){
//             thread=new Thread({
//                 threadId,
//                 title:message,
//                 message:[{role:"user",content:message}]

//             })
//         }
//         else{
//             thread.messages.push({role:"user",content:message});
//         }
//    const assistantReply= await getRAGResponse(message);
//     thread.messages.push({role:"assistant",content:assistantReply});
//     thread.updatedAt=Date.now();
//     await thread.save();
//     res.json({reply:assistantReply});
//     }
//     catch(err){
//               console.log(err);
//               res.status(500).json({error:"something went wrong"});
//     }
// })

// export default  router;
import express from 'express';
import Thread from "../models/Thread.js"; // Match your actual filename
import { getRAGResponse } from "../utils/RAG.js"; // Use curly braces for named export
const router = express.Router();

// 1. Test Route (Fixed variable name conflict)
router.post("/test", async (req, res) => {
    try {
        const newThread = new Thread({
            threadId: "xyz-" + Date.now(),
            title: "Testing New Thread"
        });
        const savedThread = await newThread.save();
        res.send(savedThread);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save in DB" });
    }
});

// 2. Chat Logic (Fixed logic and variable names)
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;
    
    // Check if fields are MISSING (Fixed the ! check)
    if (!threadId || !message) {
        return res.status(400).json({ error: "Missing threadId or message" });
    }

    try {
        let thread = await Thread.findOne({ threadId });
        
        if (!thread) {
            // Create new thread if not found
            thread = new Thread({
                threadId,
                title: message.substring(0, 30), // Use first 30 chars as title
                messages: [{ role: "user", content: message }]
            });
        } else {
            // Push to existing thread
            thread.messages.push({ role: "user", content: message });
        }

        // Get AI Reply
        const assistantReply = await getRAGResponse(message);
        
        // Push AI Reply
        thread.messages.push({ role: "assistant", content: assistantReply });
        thread.UpdatedAt = Date.now(); // Note: Your schema uses 'UpdatedAt' with capital U
        
        await thread.save();
        res.json({ reply: assistantReply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// 3. Get Thread by ID (Fixed variable collision)
router.get("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    try {
        const foundThread = await Thread.findOne({ threadId });
        if (!foundThread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.json(foundThread);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch thread" });
    }
});

export default router;