import { NextRequest, NextResponse } from "next/server";
import { ResponseMessage } from "@/lib/type";
import { HeaderMapping } from "@/components/ReceiptContext";

export async function POST(request: NextRequest) {
  const {
    table,
    auth,
    headerMapping,
  }: {
    table: ResponseMessage;
    auth: { token: string; database_id: string };
    headerMapping: HeaderMapping;
  } = await request.json();

  for (const item of table.items) {
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
            date: { start: item.date },
          },
        },
      }),
    });
    console.log(await notionResponse.json());
  }

  return NextResponse.json({ message: "Items processed" });
}