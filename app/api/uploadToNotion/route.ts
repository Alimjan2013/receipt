import { NextRequest, NextResponse } from "next/server";
import { ResponseMessage } from "@/lib/type";
import { HeaderMapping } from "@/components/ReceiptContext";

export async function POST(request: NextRequest) {
  const {
    items,
    auth,
    headerMapping,
  }: {
    items: ResponseMessage['items'];
    auth: { token: string; database_id: string };
    headerMapping: HeaderMapping;
  } = await request.json();

  try {
    for (const item of items) {
      const notionResponse = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + auth.token,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { type: "database_id", database_id: auth.database_id },
          properties: {
            [headerMapping.item]: {
              type: "title",
              title: [{ type: "text", text: { content: item.item } }],
            },
            [headerMapping.price_eur]: {
              type: "number",
              number: item.price_eur,
            },
            [headerMapping.date]: {
              type: "date",
              date: { start: new Date(item.date).toISOString().split('T')[0] },
            },
          },
        }),
      });

      if (!notionResponse.ok) {
        const errorData = await notionResponse.json();
        throw new Error(`Notion API error: ${JSON.stringify(errorData.message)}`);
      }
    }

    return NextResponse.json({ message: "Items uploaded successfully" });
  } catch (error) {
    console.error("Error uploading to Notion:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 });
  }
}