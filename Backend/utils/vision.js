import ollama from "ollama";
import fs from "fs";

/**
 * Uses the Llava vision model to analyze images.
 * Unloads the text model first to free RAM before loading LLaVA.
 * Has a 120-second timeout to prevent hanging forever.
 */
export const analyzeImage = async (imagePath, customPrompt) => {
    // Helper: wrap a promise with a timeout
    const withTimeout = (promise, ms, label) => {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
        );
        return Promise.race([promise, timeout]);
    };

    try {
        // Step 1: Free up RAM by unloading the text model from memory
        console.log("Unloading text model to free RAM...");
        try {
            await withTimeout(
                ollama.chat({
                    model: process.env.MODEL_NAME || "llama3.2:1b",
                    keep_alive: 0,
                    messages: [{ role: "user", content: "" }]
                }),
                10000, // 10s timeout for unload
                "Model unload"
            );
        } catch (_) {
            // Ignore — model may already be unloaded or not loaded
        }

        // Step 2: Read and encode image
        if (!fs.existsSync(imagePath)) {
            throw new Error("Image file not found at path: " + imagePath);
        }
        const imageData = fs.readFileSync(imagePath).toString("base64");

        const userPrompt =
            customPrompt ||
            "Please analyze this image in detail. Describe everything you see including objects, text, colors, and any important details.";

        // Step 3: Run LLaVA with freed RAM + low memory options
        console.log("Loading LLaVA for image analysis (low-memory mode)...");
        const response = await withTimeout(
            ollama.chat({
                model: process.env.VISION_MODEL_NAME || "llava:latest",
                keep_alive: 0, // Unload after use so text model can reload
                options: {
                    num_ctx: 512,     // Tiny context = much less RAM
                    num_predict: 300, // Limit response length = less RAM
                    num_gpu: 0,       // Force CPU only = avoids GPU VRAM issues
                    num_thread: 4,    // Limit CPU threads
                },
                messages: [
                    {
                        role: "system",
                        content:
                            "You are an image analysis assistant. Describe what you see in the image concisely.",
                    },
                    {
                        role: "user",
                        content: userPrompt,
                        images: [imageData],
                    },
                ],
            }),
            120000, // 2-minute timeout for LLaVA
            "LLaVA image analysis"
        );

        return response?.message?.content || "Could not analyze the image.";
    } catch (error) {
        console.error("Vision Analysis Error:", error);

        if (error.message && error.message.includes("timed out")) {
            throw new Error(
                "Image analysis timed out (>2 min). LLaVA may need more RAM. Close other apps and retry."
            );
        }
        if (error.message && error.message.includes("system memory")) {
            throw new Error(
                "Not enough RAM to run LLaVA. Please close other apps and try again."
            );
        }
        if (error.code === "ECONNREFUSED") {
            throw new Error("Ollama is not running. Please start Ollama first.");
        }
        if (error.message && error.message.includes("not found")) {
            throw new Error("LLaVA model not found. Run: ollama pull llava");
        }
        throw new Error(
            "Image analysis failed: " + (error.message || "Unknown error")
        );
    }
};
