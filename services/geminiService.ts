
import { GoogleGenAI, Modality, Part } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash-image-preview";

interface EditResult {
  image: string | null;
  text: string | null;
}

/**
 * Sends an image and a text prompt to the Gemini model for editing.
 * @param imagePart - The image data as a Generative Part.
 * @param textPrompt - The text prompt describing the desired edits.
 * @returns An object containing the base64-encoded edited image URL and any accompanying text.
 */
export const editImageWithPrompt = async (
  imagePart: Part,
  textPrompt: string
): Promise<EditResult> => {
  try {
    const textPart = { text: textPrompt };

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        // Must include both Modality.IMAGE and Modality.TEXT for this model
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    let editedImage: string | null = null;
    let responseText: string | null = null;

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          editedImage = `data:${mimeType};base64,${base64ImageBytes}`;
        } else if (part.text) {
          responseText = part.text;
        }
      }
    }
    
    if(!editedImage && !responseText) {
        throw new Error("Invalid response from the API. No image or text was returned.");
    }

    return { image: editedImage, text: responseText };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Propagate a more user-friendly error message
    if (error instanceof Error && error.message.includes('permission')) {
        throw new Error("API key is invalid or missing required permissions.");
    }
    throw new Error("Failed to process image with the AI model. Please try again later.");
  }
};
