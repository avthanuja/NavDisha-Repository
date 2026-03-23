import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai';
import { searchPractitioners } from '@/lib/csv-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY is missing');
      return new Response(JSON.stringify({ error: 'API Key not configured' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const lastUserMessage = messages[messages.length - 1].content;
    
    // Improved data search: search for anything relevant in the CSV
    const searchResults = await searchPractitioners(lastUserMessage);
    const dataContext = searchResults.length > 0 
      ? `\n\n[RELEVANT REPOSITORY DATA FOUND]:\n${JSON.stringify(searchResults, null, 2)}`
      : '\n\n[NOTICE]: No exact matches found in the repository for this specific query.';

    const systemMessage = {
      role: 'system',
      content: `You are the Nav-Disha AI Health Assistant. Your primary goal is to help users find information within our healthcare repository (CSV-based).

Data Usage Instructions:
1. USE the [RELEVANT REPOSITORY DATA] provided below to answer the user's question accurately.
2. If data is provided, mention specific details like doctor names, clinic names, cities, and contact info (phone/email).
3. If no specific data is found for a query (indicated by [NOTICE]), provide general healthcare guidance based on common knowledge but invite them to try specific keywords like "Auckland", "General Practitioner", or "Dentist".
4. Format your response clearly using bullet points and markdown for readability.

Tone: Professional, helpful, and concise.

Knowledge Source:
Current Data Snippet (if applicable): ${dataContext}`
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
