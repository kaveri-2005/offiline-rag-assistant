import ollama from "ollama";

export const getRAGResponse = async (message) => {
  try {
    const response = await ollama.chat({
      model: "llama3.2:1b",  
      keep_alive:"10m",
      messages: [{ role: "user", content: message }]
    });

    return response?.message?.content || "No response generated";
  } catch (err) {
    console.error("Ollama error:", err);
    return "Error generating response";
  }
};