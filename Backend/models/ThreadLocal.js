import * as db from '../utils/jsonDB.js';

class ThreadLocal {
    constructor(data) {
        this.threadId = data.threadId;
        this.title = data.title || "New chat";
        this.messages = data.messages || [];
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static async findOne(query) {
  
        if (query.threadId) {
            const data = db.findThreadById(query.threadId);
            return data ? new ThreadLocal(data) : null;
        }
        return null;
    }

    static async find(query) {

        const threads = db.getThreads();
        return threads.map(t => new ThreadLocal(t));
    }

    static async deleteOne(query) {
        if (query.threadId) {
            return db.deleteThread(query.threadId);
        }
        return false;
    }

    sort(criteria) {
     
        return this;
    }

    // Redefining find to return a "Query-like" object to support .sort()
    static find(query) {
        const threads = db.getThreads();
        const threadObjects = threads.map(t => new ThreadLocal(t));
        
        return {
            sort: (criteria) => {
                if (criteria.updatedAt === -1) {
                    return threadObjects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                }
                return threadObjects;
            }
        };
    }

    async save() {
        this.updatedAt = new Date();
        db.saveThread(this);
        return this;
    }
}

export default ThreadLocal;
