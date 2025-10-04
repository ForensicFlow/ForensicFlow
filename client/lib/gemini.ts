import { GoogleGenAI } from "@google/genai";
import { EvidenceSnippet } from '../types';

let ai: GoogleGenAI | null = null;

const initializeGenAI = () => {
    if (process.env.API_KEY) {
        if (!ai) {
             ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        return ai;
    }
    return null;
}

export const getAISummary = async (evidence: EvidenceSnippet[], query: string): Promise<string> => {
    const genAI = initializeGenAI();
    if (!genAI) {
        console.warn("API_KEY not found. Returning mock summary.");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `Based on the search for "${query}", several key items were found. The evidence includes conversations about cryptocurrency transfers, specifically mentioning a BTC wallet. Additionally, location data points to 'Pier 4', and a codeword 'Zephyr' was identified, suggesting a coordinated effort.`;
    }

    const model = 'gemini-2.5-flash';

    const evidenceContent = evidence.map(e => `- ${e.content}`).join('\n');

    const prompt = `
        You are a world-class AI assistant for a digital forensics investigator. Your task is to provide a brief, insightful summary of evidence snippets based on a user's search query.

        - Be concise (2-3 sentences).
        - Highlight the most critical entities, connections, or potential leads.
        - Do not invent information not present in the evidence.
        - Frame the summary as an initial finding for an investigator.

        Search Query: "${query}"

        Relevant Evidence Snippets Found:
        ${evidenceContent}

        Summary:
    `;

    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Failed to generate summary from AI.');
    }
};