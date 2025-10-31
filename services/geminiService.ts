import { GoogleGenAI, Modality, Type, Part } from '@google/genai';
import { ScriptAnalysisResult, GeneratedShot, ShotDescription } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisModel = 'gemini-2.5-pro';
const imageModel = 'gemini-2.5-flash-image';

// Helper to convert data URL to a Part object for Gemini
const fileToGenerativePart = (dataUrl: string): Part => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid data URL format');
    }
    const mimeType = match[1];
    const data = match[2];

    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};

const getFramingInstruction = (framing: string): string => {
    switch (framing) {
        case 'A bit wider':
            return "Crucial instruction: Frame all shots slightly wider than standard. A medium shot must become a medium-wide shot. A close-up should be looser, showing more of the shoulders.";
        case 'Wide':
            return "Crucial instruction: Prioritize wide shots. Avoid close-ups and medium shots entirely. All shots must establish the environment. Convert any close/medium shot ideas into wide shots.";
        case 'Extra wide':
            return "Crucial instruction: All shots MUST be extra wide or ultra-wide angle. This is a strict mandate. Do not generate any medium or close-up shots, no matter what the script implies. Emphasize the vastness of the environment.";
        default:
            return 'Use standard cinematic framing.';
    }
}

export const generateShotDescriptions = async (script: string, ideaImage: string | null, style: string, framing: string): Promise<ScriptAnalysisResult> => {
    const imageInstruction = ideaImage
      ? "Crucially, first analyze the provided reference image. Derive its visual style, mood, color palette, lighting, and overall aesthetic. This image is the primary visual guide. All generated shot descriptions must align with this aesthetic."
      : "No reference image provided.";
    
    const styleInstruction = `The entire shot list and all descriptions must strictly adhere to a **'${style}'** visual style. This style should influence the camera work, lighting, mood, and composition of every shot.`;

    const framingInstruction = getFramingInstruction(framing);

    const prompt = `
You are a professional cinematographer and script analyst. Your task is to break down a film script into a detailed, cinematic shot list.
Follow these steps and strict rules precisely:

**MANDATORY RULES:**
1.  **Camera Framing:** You MUST strictly follow this framing rule: **${framingInstruction}**. If the rule is to use wide or extra-wide shots, you are forbidden from generating shot types like 'Close-up' or 'Medium Shot'. You must reinterpret the action to fit the mandated framing.
2.  **Visual Style:** ${styleInstruction}
3.  **Image Analysis (if provided):** ${imageInstruction}

**PROCESS:**
1.  Identify all main characters and key products. Create detailed, consistent physical descriptions for each that fit the '${style}' aesthetic. These are CRITICAL for visual consistency.
2.  Generate a sequence of shots based on the script. Every shot you generate MUST adhere to the **MANDATORY RULES** above.
3.  For each shot, provide a detailed description suitable for an AI image generator, referencing the character/product descriptions to maintain 100% consistency.
4.  The final output must be a valid JSON object. Do not output any other text.

Script:
---
${script}
---
`;
    const contents: Part[] = [];
    if (ideaImage) {
        contents.push(fileToGenerativePart(ideaImage));
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: { parts: contents },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    character_descriptions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                             required: ["name", "description"]
                        }
                    },
                    product_descriptions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                             required: ["name", "description"]
                        }
                    },
                    shot_list: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                shot_number: { type: Type.NUMBER },
                                shot_type: { type: Type.STRING },
                                description: { type: Type.STRING },
                                camera_angle: { type: Type.STRING },
                                lens: { type: Type.STRING },
                                movement: { type: Type.STRING }
                            },
                            required: ["shot_number", "shot_type", "description", "camera_angle", "lens", "movement"]
                        }
                    }
                },
                 required: ["character_descriptions", "product_descriptions", "shot_list"]
            }
        }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ScriptAnalysisResult;
};

const generateImageForShot = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && firstPart.inlineData) {
        const base64ImageBytes: string = firstPart.inlineData.data;
        const mimeType = firstPart.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
    }

    throw new Error('Image generation failed or returned no data.');
};

export const generateImageForShotDescription = async (
    shot: ShotDescription,
    analysisResult: ScriptAnalysisResult,
    style: string,
    framing: string
): Promise<GeneratedShot> => {
    const { character_descriptions, product_descriptions } = analysisResult;
    
    const consistencyPrompt = `
    - **Consistency:** Maintain strict visual consistency for the following:
      ${character_descriptions.map(c => `[CHARACTER: ${c.name} - ${c.description}]`).join('\n      ')}
      ${product_descriptions.map(p => `[PRODUCT: ${p.name} - ${p.description}]`).join('\n      ')}
    `;
    
    const framingInstruction = getFramingInstruction(framing);

    const imagePrompt = `
**Primary Mandate: The camera framing MUST be '${framing}'.** This instruction overrides the 'shot_type' if there's a conflict. For example, if framing is 'Extra wide' but shot_type is 'Close-up', you MUST generate an Extra Wide shot that focuses on the subject.

**Style:** **${style}**.

**Scene Details:**
- **Shot Type:** ${shot.shot_type}.
- **Action:** ${shot.description}.
- **Angle & Lens:** ${shot.camera_angle}, ${shot.lens} lens.
${consistencyPrompt}

**Final Image Properties:**
Cinematic film still, professional color grading, dramatic lighting, 8k, ultra-realistic, film grain. Aspect ratio 9:16.
`;
        
    const imageUrl = await generateImageForShot(imagePrompt);

    return {
        ...shot,
        imageUrl,
    };
};

export const generateNextShotDescription = async (
    script: string,
    ideaImage: string | null,
    analysisResult: ScriptAnalysisResult,
    existingShots: GeneratedShot[],
    style: string,
    framing: string
): Promise<ShotDescription> => {
    const imageInstruction = ideaImage ? "The visual style must match the reference image provided initially." : "";
    const contextPrompt = existingShots.map(s => `Shot ${s.shot_number} (${s.shot_type}): ${s.description}`).join('\n');
    const nextShotNumber = (existingShots[existingShots.length - 1]?.shot_number ?? 0) + 1;
    const framingInstruction = getFramingInstruction(framing);


    const prompt = `
You are a professional cinematographer continuing a shot list. Your task is to generate the *next logical shot*.

**MANDATORY RULES:**
1.  **Camera Framing:** You MUST strictly follow this framing rule: **${framingInstruction}**. If the rule is to use wide or extra-wide shots, you are forbidden from generating shot types like 'Close-up' or 'Medium Shot'.
2.  **Visual Style:** The style MUST be **'${style}'**.
3.  **Consistency:** Maintain 100% consistency with the established characters and visual style.
4.  **Shot Number:** The new shot number must be ${nextShotNumber}.

Based on the rules above and the context below, generate a single JSON object for the next shot. Do not output any other text.

Original Script:
---
${script}
---

Established Characters:
---
${analysisResult.character_descriptions.map(c => `${c.name}: ${c.description}`).join('\n')}
---

Established Products:
---
${analysisResult.product_descriptions.map(p => `${p.name}: ${p.description}`).join('\n')}
---

Previous Shots:
---
${contextPrompt}
---

${imageInstruction}
`;
    const contents: Part[] = [{ text: prompt }];

    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: { parts: contents },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    shot_number: { type: Type.NUMBER },
                    shot_type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    camera_angle: { type: Type.STRING },
                    lens: { type: Type.STRING },
                    movement: { type: Type.STRING }
                },
                required: ["shot_number", "shot_type", "description", "camera_angle", "lens", "movement"]
            }
        }
    });
    const jsonText = response.text.trim();
    const parsedShot = JSON.parse(jsonText) as ShotDescription;
    // Ensure the shot number is correct to maintain sequence
    parsedShot.shot_number = nextShotNumber; 
    return parsedShot;
};