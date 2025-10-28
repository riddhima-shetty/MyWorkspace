import { GoogleGenAI } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBase64Part = (base64Data: string) => {
  return {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data,
    },
  };
};

export async function analyzeImageForObstacles(base64Image: string): Promise<string> {
  const imagePart = getBase64Part(base64Image);
  const textPart = {
    text: "You are an assistant for the visually impaired. Analyze this image for immediate obstacles and dangers at ground level in the direct path of a person walking forward. Be extremely concise and direct. Examples: 'Stairs ahead.', 'Curb down.', 'Watch out for the puddle.' If there are no immediate dangers, say 'Path is clear.'"
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    return response.text.trim();
  } catch (error) {
    console.error('Gemini API error in analyzeImageForObstacles:', error);
    throw new Error('Failed to analyze image for obstacles.');
  }
}

export async function describeSurroundings(base64Image: string): Promise<string> {
  const imagePart = getBase64Part(base64Image);
  const textPart = {
    text: "You are an assistant for the visually impaired. Briefly describe the scene from the perspective of someone standing here. Focus on key objects and layout. Example: 'You are in an office. A desk with a laptop is in front of you. A door is to your right.'"
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    return response.text.trim();
  } catch (error) {
    console.error('Gemini API error in describeSurroundings:', error);
    throw new Error('Failed to describe surroundings.');
  }
}

export async function answerQuestionAboutImage(base64Image: string, question: string): Promise<string> {
  const imagePart = getBase64Part(base64Image);
  const textPart = {
    text: `You are a helpful assistant for the visually impaired. Analyze the image and answer the user's question concisely. Question: "${question}"`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    return response.text.trim();
  } catch (error) {
    console.error('Gemini API error in answerQuestionAboutImage:', error);
    throw new Error('Failed to answer question about the image.');
  }
}
