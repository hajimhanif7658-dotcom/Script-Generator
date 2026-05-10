import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface VideoTitle {
  title: string;
  hook: string;
}

export interface VideoScript {
  title: string;
  scriptType: string;
  outline: string[];
  content: string;
}

export interface ImagePrompt {
  scene: string;
  prompt: string;
}

export async function generateTitles(subject: string): Promise<VideoTitle[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 10 relevant and engaging YouTube video titles for the subject: "${subject}". 
    For each title, also provide a short "hook" or description of why it's engaging.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
          },
          required: ["title", "hook"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse titles JSON", e);
    return [];
  }
}

export async function generateScript(
  title: string,
  subject: string,
  scriptType: string,
  targetWordCount: string
): Promise<VideoScript> {
  const systemInstruction = `You are an expert YouTube scriptwriter. Write a compelling, engaging script for a video titled "${title}" in the "${subject}" niche.
  The script style should be: "${scriptType}".
  The target word count for the script should be approximately: "${targetWordCount}".
  
  Format the script with clear sections:
  - Intro (The Hook)
  - Content Body (Key points)
  - Call to Action
  - Outro
  
  Use professional script formatting (e.g., [NARRATOR], [VISUALS], [ON SCREEN]).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Write the full script now.",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          scriptType: { type: Type.STRING },
          outline: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          content: { type: Type.STRING, description: "The full script text including markers for visuals and audio." },
        },
        required: ["title", "scriptType", "outline", "content"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse script JSON", e);
    throw new Error("Failed to generate script");
  }
}

export async function generateImagePrompts(scriptContent: string): Promise<ImagePrompt[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this YouTube script, generate detailed image/visual prompts for each major scene or section. 
    Script:
    """
    ${scriptContent}
    """`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.STRING, description: "The name or number of the scene" },
            prompt: { type: Type.STRING, description: "The detailed prompt for an image generator" },
          },
          required: ["scene", "prompt"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse image prompts JSON", e);
    return [];
  }
}

export async function reviseScript(
  currentScript: VideoScript,
  feedback: string
): Promise<VideoScript> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert YouTube scriptwriter. Revise the following script based on this feedback: "${feedback}".
    
    Current Script:
    """
    ${currentScript.content}
    """
    
    Maintain the same JSON structure and keep the title and scriptType consistent unless the feedback specifically asks to change them.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          scriptType: { type: Type.STRING },
          outline: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          content: { type: Type.STRING },
        },
        required: ["title", "scriptType", "outline", "content"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse revised script JSON", e);
    throw new Error("Failed to revise script");
  }
}
