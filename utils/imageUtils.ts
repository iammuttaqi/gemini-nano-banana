
import { Part } from "@google/genai";

/**
 * Converts a File object to a GoogleGenerativeAI.Part object.
 * This involves reading the file as a base64 string.
 * @param file - The image file to convert.
 * @returns A promise that resolves to a Part object.
 */
export const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result includes the data URL prefix, so we split and take the second part.
      resolve((reader.result as string).split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  const base64Data = await base64EncodedDataPromise;

  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};
