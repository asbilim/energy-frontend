import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

export const maxDuration = 30;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://solarcal.app",
    "X-Title": "SolarCal",
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await generateText({
    model: openrouter.chat(
      process.env.AI_MODEL ?? "mistralai/mistral-small-3.2-24b-instruct:free"
    ),
    messages,
  });

  return Response.json({ text: result.text });
}
