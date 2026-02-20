
import express from "express";
import "dotenv/config";
import cors from "cors";
import chatRoutes from './routes/chat.js';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use("/api/v1", chatRoutes);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Start server with graceful error handling
const server = app.listen(port, () => {
    console.log(` Server is running on port ${port} (Offline Mode)`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${port} is already in use!`);
        console.error(`   Run this command to fix it:\n`);
        console.error(`   npx kill-port ${port}\n`);
        console.error(`   Then restart with: node server.js\n`);
        process.exit(1);
    } else {
        throw err;
    }
});
