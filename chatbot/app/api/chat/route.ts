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
      content: `You are the NavDisha Healthcare Assistant. You help users find information about healthcare services and practitioners in NZ.
      
      When a user asks for practitioners at a specific clinic, you should format the results clearly.
      
      Current Database Context: ${dataContext || 'Generic search.'}
      
      Guidelines:
      - Be professional and empathetic.
      - Present practitioner details in a clean, list-like format.
      - Include location and contact details if available.`
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
