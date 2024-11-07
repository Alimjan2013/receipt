import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY1,
});

export async function POST(request: NextRequest) {
  const { text }: { text: string } = await request.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: 'Translate and organize Finnish receipt items into a structured table format.\n\n# Constraints\n- Translate items from Finnish to English, focusing on clarity.\n- Avoid brand names; describe the type of item instead.\n- Include discounts using "-" formatting.\n  \n# Output Format\nProvide output in JSON format with the following structure:\n```json\n{\n  "date": "YYYY-MM-DD",\n  "items": [\n    {\n      "item": "Example Item",\n      "price_eur": 5.95\n    },\n    {\n      "item": "Another Item",\n      "price_eur": 12.50\n    }\n  ]\n}\n```\n\n# Notes\n- Only translate receipt items and prices.\n- Keep translations accurate and clear for non-Finnish speakers.\n',
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      },
    ],
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: "text",
    },
  });

  return NextResponse.json(response.choices[0].message.content);
}
