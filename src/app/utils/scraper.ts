import { Redis } from "@upstash/redis";
import axios from "axios";
import * as cheerio from "cheerio";
import { Logger } from "./logger";

const logger = new Logger("scraper");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const MAX_CACHE_SIZE = 1024000;
const CACHE_TTL = 60 * 60 * 24; // 1 day

export const urlPattern =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
}

export async function scrapeUrl(url: string) {
  try {
    // Extract just the URL from the regex match if it's an array
    const actualUrl = Array.isArray(url) ? url[0] : url;

    logger.info(`Scraping URL: ${actualUrl}`);
    const cachedContent = await getCachedContent(actualUrl);
    if (cachedContent) {
      logger.info(`Cache hit - Returning cached content for: ${actualUrl}`);
      return cachedContent;
    }
    logger.info(`Cache miss - Scraping URL: ${actualUrl}`);

    const response = await axios.get(actualUrl);
    const $ = cheerio.load(response.data);
    //removes script tags, style tags, and comments
    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("iframe").remove();
    //exctract useful text
    const title = $("title").text();
    const metaDescription = $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const h2 = $("h2")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    //get text from important elements
    const articleText = $("article")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const mainText = $("main")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const contentText = $('.content, #content, [class*="content"]')
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    //get all paragraph text
    const paragraphs = $("p")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    //get list items
    const listItems = $("li")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    //combine all content
    let combinedContent = [
      title,
      metaDescription,
      h1,
      h2,
      articleText,
      mainText,
      contentText,
      paragraphs,
      listItems,
    ].join(" ");
    //clean the text and truncate to 40000 characters
    combinedContent = cleanText(combinedContent).slice(0, 40000);
    const finalResponse = {
      url: actualUrl,
      title: cleanText(title),
      headings: {
        h1: cleanText(h1),
        h2: cleanText(h2),
      },
      metaDescription: cleanText(metaDescription || ""),
      content: combinedContent,
      error: null,
    };

    await cacheContent(actualUrl, finalResponse);

    return finalResponse;
  } catch (error) {
    console.error(`Error scraping ${url}: `, error);
    return {
      url: url,
      title: "",
      headings: {
        h1: "",
        h2: "",
      },
      metaDescription: "",
      content: "error",
      error: error,
    };
  }
}

export interface ScrapedContent {
  url: string;
  title: string;
  headings: {
    h1: string;
    h2: string;
  };
  metaDescription: string;
  content: string;
  error: string | null;
  cachedAt?: number;
}

function isValidScrapedContent(data: unknown): data is ScrapedContent {
  const typedData = data as Partial<ScrapedContent>;
  return (
    typeof data === "object" &&
    data !== null &&
    typeof typedData.url === "string" &&
    typeof typedData.title === "string" &&
    "headings" in data &&
    typeof typedData.headings === "object" &&
    typedData.headings !== null &&
    typeof typedData.headings?.h1 === "string" &&
    typeof typedData.headings?.h2 === "string" &&
    typeof typedData.metaDescription === "string" &&
    typeof typedData.content === "string" &&
    (typedData.error === null || typeof typedData.error === "string")
  );
}

function getCacheKey(url: string) {
  // Encode the URL to handle special characters and ensure valid Redis key
  const encodedUrl = encodeURIComponent(url).substring(0, 200);
  return `scrape:${encodedUrl}`;
}

async function getCachedContent(url: string): Promise<ScrapedContent | null> {
  try {
    const cachedKey = getCacheKey(url);
    logger.info(`Checking cache for ${cachedKey}`);
    const cached = await redis.get(cachedKey);
    if (!cached) {
      logger.info(`Cache miss for ${url}`);
      return null;
    }
    logger.info(`Cache hit - Found cached content for: ${url}`);

    let parsed: unknown;
    if (typeof cached === "string") {
      parsed = JSON.parse(cached);
    } else {
      parsed = cached;
    }
    if (isValidScrapedContent(parsed)) {
      const age = Date.now() - (parsed.cachedAt || 0);
      logger.info(`Cache content age: ${Math.round(age / 1000 / 60)} minutes`);
      return parsed;
    }

    logger.warn(`Invalid cached content format for URL: ${url}`);
    await redis.del(cachedKey);
    return null;
  } catch (error) {
    console.error("Error getting cached content: ", error);
    return null;
  }
}

async function cacheContent(
  url: string,
  content: ScrapedContent
): Promise<void> {
  try {
    const cacheKey = getCacheKey(url);
    content.cachedAt = Date.now();

    //validate content before serializing
    if (!isValidScrapedContent(content)) {
      logger.error(`Invalid content format for URL: ${url}`);
      return;
    }

    const serialized = JSON.stringify(content);

    if (serialized.length > MAX_CACHE_SIZE) {
      logger.warn(
        `Content too large to cache for URL: ${url} (${serialized.length} bytes)`
      );
      return;
    }

    await redis.set(cacheKey, serialized, { ex: CACHE_TTL });
    logger.info(`Cached content for URL: ${url}`);
  } catch (error) {
    logger.error(`Error caching content for URL: ${url}`, error);
  }
}
