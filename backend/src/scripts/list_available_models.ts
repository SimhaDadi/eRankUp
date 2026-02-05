import axios from 'axios';
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function listModelsFromAPI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        let output = "Available Models:\n";
        response.data.models.forEach((m: any) => {
            output += `- ${m.name} (${m.supportedGenerationMethods.join(', ')})\n`;
        });
        fs.writeFileSync("available_models_full.txt", output);
        console.log("Written full model list to available_models_full.txt");
    } catch (e: any) {
        console.error("REST API failed:", e.response?.data || e.message);
    }
}

listModelsFromAPI();
