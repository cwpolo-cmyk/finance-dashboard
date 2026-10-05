import Anthropic from "@anthropic-ai/sdk";
import { ExtractionSchema, type Extraction } from "@/lib/schemas/extraction";
import fs from "fs";
import path from "path";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Read the extraction prompt
const extractPromptPath = path.join(process.cwd(), "lib/prompts/extract-v1.md");
const extractPrompt = fs.readFileSync(extractPromptPath, "utf-8");

async function extractFromPDF(file: File): Promise<Extraction> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: extractPrompt,
          },
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
        ],
      },
    ],
  });

  return parseExtraction(message);
}

async function extractFromScreenshot(file: File): Promise<Extraction> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  // Map file type to media type
  const mediaTypeMap: Record<string, string> = {
    "image/png": "image/png",
    "image/jpeg": "image/jpeg",
    "image/heic": "image/heic",
    "image/heif": "image/heif",
  };

  const mediaType = mediaTypeMap[file.type] || "image/png";

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: extractPrompt,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/png"
                | "image/jpeg"
                | "image/heic"
                | "image/heif"
                | "image/webp"
                | "image/gif",
              data: base64,
            },
          },
        ],
      },
    ],
  });

  return parseExtraction(message);
}

function parseExtraction(message: Anthropic.Message): Extraction {
  const content = message.content[0];

  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract JSON from the response (Claude might wrap it in markdown)
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate with Zod
  const validated = ExtractionSchema.parse(parsed);

  // Scrub sensitive data: ensure no full account numbers
  scrubSensitiveData(validated);

  return validated;
}

function scrubSensitiveData(extraction: Extraction): void {
  // Ensure account_last_four is only 4 digits
  if (extraction.account_last_four.length > 4) {
    extraction.account_last_four = extraction.account_last_four.slice(-4);
  }

  // Scrub transaction descriptions for full account numbers (regex for common patterns)
  const accountNumberPatterns = [
    /\b\d{16}\b/g, // 16-digit card numbers
    /\b\d{10,15}\b(?!\d{2}-\d{2})/g, // 10-15 digit numbers not in date format
  ];

  extraction.transactions.forEach((txn) => {
    accountNumberPatterns.forEach((pattern) => {
      txn.raw_description = txn.raw_description.replace(pattern, "****");
      txn.merchant_name = txn.merchant_name.replace(pattern, "****");
    });
  });
}

export async function extractTransactions(
  file: File,
  sourceType: string
): Promise<Extraction> {
  try {
    if (sourceType === "pdf") {
      return await extractFromPDF(file);
    } else {
      return await extractFromScreenshot(file);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("JSON")) {
      // Retry once on JSON parse error
      console.warn("JSON parse failed, retrying...");
      if (sourceType === "pdf") {
        return await extractFromPDF(file);
      } else {
        return await extractFromScreenshot(file);
      }
    }
    throw error;
  }
}
