import { Ollama } from "ollama";

const ollamaInstance = new Ollama({
  host: 'http://127.0.0.1:11434',
});

export const getRAGResponse = async (message, history = []) => {
  try {
    const messages = [
      { 
        role: "system", 
        content: "You are a professional assistant. You MUST respond in English for all queries. Keep your answers concise and accurate." 
      },
      ...history,
      { role: "user", content: message }
    ];

    console.log(`[Ollama] Generating response with model: ${process.env.MODEL_NAME || "llama3.2:1b"}...`);
    const startTime = Date.now();
    
    const response = await ollamaInstance.chat({
      model: process.env.MODEL_NAME || "llama3.2:1b",  
      keep_alive: "10m",
      messages: messages
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Ollama] Generation complete in ${duration}s`);

    return response?.message?.content || "No response generated";
  } catch (err) {
    console.error("Ollama error:", err);
    return "Error generating response";
  }
};