import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateAnswer(prompt: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an academic expert, you always cite your sources and base your responses on the context that you have been provided.",
    },
    { role: "user", content: prompt },
  ] as const;

  console.log("Starting groq request");
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
  });

  console.log("Recieved response from groq");

  return response.choices[0].message.content;
}