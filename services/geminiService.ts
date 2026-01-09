
import { GoogleGenAI, Type } from "@google/genai";
import type { Towel, OverstockSuggestion, ParsedEmailResult, StorageRecommendation } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const analyzeOverstock = async (towels: Towel[]): Promise<OverstockSuggestion[]> => {
  const inventoryData = towels.map(({ name, stock }) => ({ name, stock }));
  const prompt = `Analiza estos datos de inventario para una empresa de toallas. Identifica los artículos que parecen tener exceso de stock (cantidad alta en relación con otros). Para cada artículo identificado, proporciona una estrategia de negocio concisa y procesable para reducir el excedente. Presenta la salida como un arreglo JSON de objetos.
  
  Datos:
  ${JSON.stringify(inventoryData, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                currentStock: { type: Type.NUMBER },
                suggestion: { type: Type.STRING },
              },
              required: ["productName", "currentStock", "suggestion"]
            }
          }
        },
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error analyzing overstock:", error);
    return [];
  }
};

export const getStorageAdvice = async (shelf: any, item: any): Promise<StorageRecommendation> => {
    const prompt = `Como experto en logística de almacenes para Toallas La Josefina, calcula cuántas unidades caben en un espacio de ${shelf.w}x${shelf.h}x${shelf.d} cm, si cada unidad mide ${item.w}x${item.h}x${item.d} cm. 
    Además de la matemática, sugiere el mejor método de doblado o estibado para maximizar el espacio y facilitar el picking. 
    Responde en formato JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalUnits: { type: Type.NUMBER },
                        arrangement: { type: Type.STRING },
                        efficiency: { type: Type.STRING }
                    },
                    required: ["totalUnits", "arrangement", "efficiency"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error storage advice:", error);
        return { totalUnits: 0, arrangement: "Error en cálculo", efficiency: "0%" };
    }
};

export const optimizeRoute = async (addresses: string[]): Promise<string[]> => {
    if (addresses.length === 0) return [];
    const prompt = `Dada la siguiente lista de direcciones de entrega, determina el orden más eficiente para visitarlas, comenzando desde la primera dirección que es el almacén. Solo proporciona la lista ordenada de direcciones.

    Direcciones:
    ${addresses.join('\n')}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        return response.text.trim().split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    } catch (error) {
        return addresses;
    }
};

export const parseEmailForUpdate = async (emailBody: string): Promise<ParsedEmailResult> => {
    const prompt = `Analiza el siguiente correo electrónico para identificar si hay una solicitud de cambio de dirección de entrega. Responde en formato JSON.
    "${emailBody}"`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hasChange: { type: Type.BOOLEAN },
                        provider: { type: Type.STRING, nullable: true },
                        newAddress: { type: Type.STRING, nullable: true }
                    },
                    required: ["hasChange"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        return { hasChange: false, provider: null, newAddress: null, orderId: null, instructionType: null };
    }
};
