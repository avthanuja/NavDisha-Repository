import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai';
import { searchPractitionersByService } from '@/lib/csv-utils';

// Read API Key from environment
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the last user message
  const lastUserMessage = messages[messages.length - 1].content;

  // We'll perform a pre-check to see if the user is asking for practitioners.
  // This is a simple implementation. In a more robust one, we'd use function calling.
  // For the sake of this demonstration, we'll implement a direct context injection
  // based on keyword detection in the user's message.
  
  let dataContext = '';
  
  // Keyword pattern for "practitioners for [service name]"
  const serviceQueryPattern = /(?:practitioners? for|who works at|practitioners? at)\s+([\w\s&-]+)/i;
  const match = lastUserMessage.match(serviceQueryPattern);
  
  if (match && match[1]) {
    const serviceName = match[1].trim();
    const practitioners = await searchPractitionersByService(serviceName);
    
    if (practitioners.length > 0) {
      dataContext = `\n\n[USER IS ASKING ABOUT SERVICE: ${serviceName}]\nFound practitioners:\n${JSON.stringify(practitioners, null, 2)}`;
    } else {
      dataContext = `\n\n[USER IS ASKING ABOUT SERVICE: ${serviceName}]\nNo practitioners found for this specific name. Please check for spelling or broader search terms.`;
    }
  } else if (lastUserMessage.toLowerCase().includes('practitioner') || lastUserMessage.toLowerCase().includes('doctor') || lastUserMessage.toLowerCase().includes('dentist')) {
    // If they mention roles generally, maybe they mean a specific place
    // We could either try to extract service name or just search general
    // For now, let's keep it simple.
  }

  const systemMessage = {
    role: 'system',
    content: `You are the NavDisha Healthcare Assistant. You help users find information about healthcare services and practitioners in New Zealand.
    
    Data Source: You have access to a CSV database of NZ health services.
    
    When a user asks for practitioners at a specific clinic, you should format the results clearly.
    
    Current Database Context: ${dataContext || 'No specific search performed yet.'}
    
    Guidelines:
    - Be professional, empathetic, and healthcare-focused.
    - If you find practitioner details, present them in a clean, list-like format.
    - Mention the location (city/region) and contact details (phone/email) if available.
    - If you don't have information, suggest the user refine their search with the specific clinic name.
    - Always provide helpful next steps (e.g., "Would you like me to find the phone number for this clinic?")`
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
}
