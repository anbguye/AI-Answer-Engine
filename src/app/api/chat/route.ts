// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer
import { NextResponse } from "next/server";
import { generateAnswer } from "@/app/utils/groqClient";
import { urlPattern, scrapeUrl } from "@/app/utils/scraper";

export async function POST(req: Request) {
  try {
    const { message, messages } = await req.json();

    console.log("message recieved: ", message);
    console.log("messages recieved: ", messages);

    let scrapedContent = "";
    const url = message.match(urlPattern);
    if (url) {
      console.log("url found: ", url);
      const scaperResponse = await scrapeUrl(url);
      console.log("Scraped content: ", scaperResponse);
      if (scaperResponse) {
        scrapedContent = scaperResponse.content;
      }
    }

    const userQuery = message.replace(url ? url[0] : "", "").trim();

    const userPrompt = `
    Answer my question: "${userQuery}"
    
    Based on the following content:
    <content>
    ${scrapedContent}
    </content>

    If content provided is blank, just answer the question and dont mention the content that wasnt provided.
    `;
    const llmMessages = [
      ...messages,
      {
        role: "user",
        content: userPrompt,
      },
    ];

    console.log("Prompt: ", llmMessages);
    const response = await generateAnswer(llmMessages);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" });
  }
}

