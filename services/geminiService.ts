
import { GoogleGenAI, Type } from "@google/genai";
import type { InitialFormData, Place, PublicInfo } from '../types';

// The API key is sourced from the environment variable `process.env.API_KEY`.
// It is assumed to be pre-configured and accessible in the execution environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const regionsDescription = `The administrative/travel region in Jeju. Must be one of: 제주시 동(洞) 지역, 애월읍, 한림읍, 한경면, 대정읍, 조천읍, 구좌읍, 성산읍, 우도면, 서귀포시 동(洞) 지역, 안덕면, 남원읍, 표선면.`;

const placeSchema = {
    type: Type.OBJECT,
    properties: {
        place_id: { type: Type.STRING, description: "Unique ID for the place, format: P_YYYYMMDD_HHMMSS_XX" },
        place_name: { type: Type.STRING, description: "Name of the spot." },
        categories: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "An array of categories for the spot."
        },
        address: { type: Type.STRING, description: "The full address of the spot." },
        region: { type: Type.STRING, description: regionsDescription, nullable: true },
        location: {
            type: Type.OBJECT,
            properties: {
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
            },
            description: "Geographical coordinates."
        },
        public_info: {
            type: Type.OBJECT,
            properties: {
                operating_hours: { type: Type.STRING, nullable: true },
                phone_number: { type: Type.STRING, nullable: true },
                website_url: { type: Type.STRING, nullable: true },
            },
            description: "Publicly available information like business hours and contact."
        },
        tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            nullable: true,
            description: "A list of relevant tags or keywords for the spot."
        },
        attributes: {
            type: Type.OBJECT,
            properties: {
                targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedSeasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                withKids: { type: Type.STRING },
                withPets: { type: Type.STRING },
                parkingDifficulty: { type: Type.STRING },
                admissionFee: { type: Type.STRING },
            },
            description: "Core attributes of the spot."
        },
        category_specific_info: {
            type: Type.OBJECT,
            properties: {
                signatureMenu: { type: Type.STRING, nullable: true },
                priceRange: { type: Type.STRING, nullable: true },
                difficulty: { type: Type.STRING, nullable: true },
            },
            description: "Additional information specific to certain categories."
        },
        expert_tip_raw: { type: Type.STRING, description: "The original tip provided by the expert." },
        expert_tip_final: { type: Type.STRING, description: "The refined, user-friendly version of the expert's tip." },
        comments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    content: { type: Type.STRING },
                },
            },
            description: "Structured comments derived from the detailed description."
        },
        linked_spots: {
          type: Type.ARRAY,
          nullable: true,
          items: {
            type: Type.OBJECT,
            properties: {
                link_type: { type: Type.STRING },
                place_id: { type: Type.STRING },
                place_name: { type: Type.STRING },
            }
          }
        },
        created_at: {
            type: Type.OBJECT,
            properties: {
                seconds: { type: Type.INTEGER },
                nanoseconds: { type: Type.INTEGER },
            }
        },
        updated_at: {
            type: Type.OBJECT,
            properties: {
                seconds: { type: Type.INTEGER },
                nanoseconds: { type: Type.INTEGER },
            }
        },
    },
    required: ["place_id", "place_name", "categories", "address", "location", "attributes", "expert_tip_raw", "expert_tip_final", "comments", "created_at", "updated_at"]
};

const importSchema = {
    type: Type.OBJECT,
    properties: {
        place_name: { type: Type.STRING },
        address: { type: Type.STRING },
        region: { type: Type.STRING, description: regionsDescription, nullable: true },
        public_info: {
            type: Type.OBJECT,
            properties: {
                operating_hours: { type: Type.STRING, nullable: true },
                phone_number: { type: Type.STRING, nullable: true },
                website_url: { type: Type.STRING, nullable: true },
            },
        },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true }
    },
    required: ['place_name', 'address']
};

export const importDataFromUrl = async (url: string): Promise<Partial<Place>> => {
    const prompt = `
# ROLE & GOAL
You are a specialized data extraction AI. Your goal is to act as if you have visited the provided URL from visitjeju.net and extract key information into a structured JSON format.

# INSTRUCTION
1.  Analyze the content of the following URL: ${url}
2.  Extract the following specific pieces of information:
    *   The main name of the place ('place_name').
    *   The full address ('address').
    *   From the address, determine the region ('region'). The region must be one of the following: "제주시 동(洞) 지역", "애월읍", "한림읍", "한경면", "대정읍", "조천읍", "구좌읍", "성산읍", "우도면", "서귀포시 동(洞) 지역", "안덕면", "남원읍", "표선면".
    *   Public information ('public_info') including operating hours ('operating_hours'), phone number ('phone_number'), and official website URL ('website_url'). If a piece of information is not available, omit the key or set it to null.
    *   Relevant keywords or tags ('tags').
3.  Return ONLY a single JSON object containing the extracted data, conforming to the provided schema. Do not include any other text or explanation. If the URL seems invalid or not a Jeju tourism spot, return a JSON object with empty strings for the values.
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: importSchema,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("API returned an empty response from URL import.");
        }
        
        return JSON.parse(jsonText) as Partial<Place>;

    } catch (error) {
        console.error("Error importing data from URL:", error);
        throw new Error("Failed to import data from URL. Please check the console for details.");
    }
};