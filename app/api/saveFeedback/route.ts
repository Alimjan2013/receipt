import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { image_url, ocr_result, processed_data, user_comment,  } = await request.json();

    const { data, error } = await supabase
      .from('bad_receipts_feedback')
      .insert([
        {
          image_url,
          ocr_result,
          processed_data,
          user_comment,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}