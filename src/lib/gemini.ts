import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a helpful assistant for the Smart City Service Platform.
You help citizens report issues, understand the status of their reports, and navigate city services.
Keep responses concise and friendly. If asked about specific issue statuses, explain you cannot access
real-time data but can guide users to check their dashboard.
Issue categories: Pothole, Streetlight, Graffiti, Garbage, Flooding, Traffic Signal, Sidewalk, Park, Noise, Other.`;

export async function chatWithGemini(
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  userMessage: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood! I'm ready to help citizens with city service issues." }] },
      ...history,
    ],
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

export async function categorizeIssue(description: string): Promise<{
  category: string;
  priority: number;
  summary: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Analyze this city issue report and respond with JSON only:
Description: "${description}"
Return: { "category": one of [POTHOLE,STREETLIGHT,GRAFFITI,GARBAGE,FLOODING,TRAFFIC_SIGNAL,SIDEWALK,PARK,NOISE,OTHER], "priority": 1-3 (1=low,2=medium,3=high), "summary": "one sentence summary" }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(text);
}
