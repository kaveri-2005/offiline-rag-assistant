import { Ollama } from "@langchain/ollama";
import fs from "fs";

/**
 * Uses the Llava vision model to analyze image pixels.
 * Requires: ollama pull llava:7b
 */
export const analyzeImage = async (imagePath, customPrompt) => {
    try {
        const imageData = fs.readFileSync(imagePath).toString('base64');
        const visionModel = new Ollama({ model: "llava" });

        const response = await visionModel.invoke({
            prompt: customPrompt || "Describe this image in detail and identify any text or objects present.",
            images: [imageData]
        });

        return response;
    } catch (error) {
        console.error("Vision Analysis Error:", error);
        if (error.code === 'ECONNREFUSED') {
            throw new Error("Ollama is not running. Please start Ollama.");
        }
        if (error.message.includes("model")) {
             throw new Error("Model 'llava' not found. Run 'ollama pull llava'.");
        }
        throw new Error("Failed to analyze image. Ensure Ollama is running with llava model.");
    }
};