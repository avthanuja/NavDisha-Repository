import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai';
import { searchPractitionersByService } from '@/lib/csv-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY is missing');
      return new Response(JSON.stringify({ error: 'API Key not configured in Vercel' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const lastUserMessage = messages[messages.length - 1].content;
    
    let dataContext = '';
    
    // Keyword detection for service search
    const serviceQueryPattern = /(?:practitioners? for|who works at|practitioners? at)\s+([\w\s&-]+)/i;
    const match = lastUserMessage.match(serviceQueryPattern);
    
    if (match && match[1]) {
      const serviceName = match[1].trim();
      const practitioners = await searchPractitionersByService(serviceName);
      
      if (practitioners.length > 0) {
        dataContext = `\n\n[USER IS ASKING ABOUT SERVICE: ${serviceName}]\nFound practitioners:\n${JSON.stringify(practitioners, null, 2)}`;
      } else {
        dataContext = `\n\n[USER IS ASKING ABOUT SERVICE: ${serviceName}]\nNo practitioners found for this specific name.`;
      }
    }

    const systemMessage = {
      role: 'system',
      content: `You are the Nav-Disha AI Assistant. Your role is to help users explore and understand the Nav-Disha knowledge repository.

Guidelines:
- Answer questions clearly and simply.
- If the user asks about a topic, explain it in a structured way:
  1. Short definition
  2. Key points
  3. Example (if applicable)
- If the user is unsure, guide them by suggesting relevant topics.
- If the question is vague, ask a clarifying question before answering.
- Keep responses concise but helpful.

Repository Awareness:
- Treat all questions as related to a knowledge repository of structured topics, documents, and guidance.
- If you don’t have exact data, provide a best-effort explanation instead of saying "I don’t know".
- Do NOT mention that you are an AI model.

Tone:
- Friendly, helpful, and professional.
- Not too long, not too short.

Extra Behavior:
- If the user says “show topics”, suggest categories.
- If the user asks “where do I start”, give beginner guidance.
- If the user asks something unrelated, gently steer them back to repository-related help.

Knowledge Source:
You have access to a repository of healthcare practitioners and services.
Current Data Snippet (if applicable): ${dataContext || 'No specific search performed yet.'}`
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemMessage.content }],
        },
        ...history
      ],
    });

    const result = await chat.sendMessageStream(lastUserMessage);
    const stream = GoogleGenerativeAIStream(result);
    
    return new StreamingTextResponse(stream);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
