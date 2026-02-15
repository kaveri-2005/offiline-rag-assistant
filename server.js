
import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from 'mongoose';
import chatRoutes from './routes/chat.js';

const app = express();
const port = 8080;

app.use(express.json());
app.use(cors());
app.use("/api/v1", chatRoutes);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with database");
        
        app.listen(port, () => {
            console.log(` Server is running on port ${port}`);
        });
    } catch (err) {
        console.error(" DB Connection Failed:", err.message);
        process.exit(1);
    }
};

connectDB();
