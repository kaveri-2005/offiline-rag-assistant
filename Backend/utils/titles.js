import { Ollama } from "@langchain/ollama";

export const generateThreadTitle = async (message) => {
    try {
        const model = new Ollama({ model: "llama3.2:1b" });
        const prompt = `Summarize the following user request into a very short, meaningful chat title (3-5 words maximum). Do not use any punctuation or prefix like "Title:". Just the title itself.\n\nUser Request: ${message}`;
        
        const response = await model.invoke(prompt);
        return response.trim().replace(/['"]+/g, ''); // Remove quotes if model adds them
    } catch (error) {
        console.error("Error generating title:", error);
        return message.substring(0, 30); // Fallback
    }
};
