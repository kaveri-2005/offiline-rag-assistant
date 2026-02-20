import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data');
const dbFile = path.join(dbPath, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
}

// Ensure db file exists with initial empty threads array
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ threads: [] }, null, 2));
}

const readDB = () => {
    try {
        const data = fs.readFileSync(dbFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading DB:", error);
        return { threads: [] };
    }
};

const writeDB = (data) => {
    try {
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing DB:", error);
    }
};

export const getThreads = () => {
    const db = readDB();
    return db.threads;
};

export const saveThread = (threadData) => {
    const db = readDB();
    const index = db.threads.findIndex(t => t.threadId === threadData.threadId);
    
    if (index !== -1) {
        db.threads[index] = threadData;
    } else {
        db.threads.push(threadData);
    }
    
    writeDB(db);
    return threadData;
};

export const deleteThread = (threadId) => {
    const db = readDB();
    const initialLength = db.threads.length;
    db.threads = db.threads.filter(t => t.threadId !== threadId);
    writeDB(db);
    return db.threads.length < initialLength;
};

export const findThreadById = (threadId) => {
    const db = readDB();
    return db.threads.find(t => t.threadId === threadId) || null;
};
