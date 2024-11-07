import { NextRequest, NextResponse } from "next/server";
interface Item {
    item: string
    price_eur: number
  }
  
  interface ResponseMessage {
    date: string
    items: Item[]
  }

export async function POST(request: NextRequest) {
  const { table,auth }: { table:ResponseMessage,auth:{token:string,database_id:string} } = await request.json();
  
  for (const item of table.items) {
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + auth.token,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { type: 'database_id', database_id: auth.database_id },
        properties: {
          'title': {
            type: 'title',
            title: [{ type: 'text', text: { content: item.item } }]
          },
          'price': {
            type: 'number',
            number: item.price_eur
          },
          'Date': {
            type: 'date',
            date: { start: table.date }
          }
        }
      })
    });
    console.log(await notionResponse.json());
  }

  return NextResponse.json({ message: 'Items processed' });
}
