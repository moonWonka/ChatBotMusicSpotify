
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from '@google/genai';

const API_KEY = process.env.API_KEY;

const SYSTEM_INSTRUCTION = `Eres 'Skynet', un amigable y experto chatbot de música de Spotify. 
Tu objetivo es ayudar a los usuarios a descubrir música, artistas, géneros y crear ideas para listas de reproducción. 
Puedes discutir significados de canciones, historia de la música y recomendar pistas basadas en el estado de ánimo o preferencias. 
Interactúa con los usuarios de manera conversacional. 
No sugieras ni intentes reproducir música directamente, ni enlaces a servicios de música externos que no sean proporcionar enlaces informativos si es relevante (por ejemplo, a la página de Wikipedia de un artista si se solicita, con el formato [Texto del enlace](URL)).
Proporciona información textual rica y sugerencias como si tuvieras acceso a una vasta biblioteca musical.
Si te preguntan sobre tus capacidades, explica que puedes hablar sobre música, recomendar canciones/artistas/listas de reproducción, hablar sobre géneros e historia de la música.
Mantén tus respuestas concisas y atractivas. Usa párrafos para facilitar la lectura si las respuestas son más largas.
No puedes acceder a información en tiempo real, reproducir música ni conectarte a las cuentas de Spotify de los usuarios.
`;

export class GeminiService {
  private static ai: GoogleGenAI | null = null;

  private static getAIInstance(): GoogleGenAI {
    if (!this.ai) {
      if (!API_KEY) {
        throw new Error("La API_KEY para Gemini no está configurada.");
      }
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    }
    return this.ai;
  }

  public static startChatSession(): Chat {
    const aiInstance = this.getAIInstance();
    return aiInstance.chats.create({
      model: 'gemini-2.5-flash-preview-04-17',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Using default thinkingConfig for better quality responses.
        // For very low latency needs, one might consider:
        // thinkingConfig: { thinkingBudget: 0 } 
      },
    });
  }

  public static async sendMessageStream(
    chat: Chat,
    message: string,
    onChunk: (chunkText: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const userMessagePart: Part = { text: message };
      const stream = await chat.sendMessageStream({ contents: { parts: [userMessagePart] }});
      
      for await (const chunk of stream) {
        // Check for safety ratings or blocks if necessary
        // if (chunk.candidates && chunk.candidates[0].finishReason === "SAFETY") {
        //   onChunk("No puedo responder a esa consulta debido a las directrices de seguridad. ");
        //   break; 
        // }
        onChunk(chunk.text);
      }
      onComplete();
    } catch (error) {
      console.error("Error de la API Gemini:", error);
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error("Ocurrió un error desconocido al comunicarse con la IA."));
      }
    }
  }
}
