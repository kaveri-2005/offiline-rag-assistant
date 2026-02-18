import { Ollama } from "@langchain/ollama";
import fs from "fs";

/**
 * Uses the Llava vision model to analyze image pixels.
 * Requires: ollama pull llava:7b
 */
export const analyzeImage = async (imagePath) => {
    try {
        const imageData = fs.readFileSync(imagePath).toString('base64');
        const visionModel = new Ollama({ model: "llava" });

        const response = await visionModel.invoke({
            prompt: "Describe this image in detail and identify any text or objects present.",
            images: [imageData]
        });

        return response;
    } catch (error) {
        console.error("Vision Analysis Error:", error);
        throw error;
    }
};