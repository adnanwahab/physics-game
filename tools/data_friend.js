import { GoogleGenAI } from "@google/genai";

// Initializes the client. It automatically picks up your GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI();

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: "Explain how an API works in a few words",
});

console.log(response.text);
