export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[verify-payment proxy]', err);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
