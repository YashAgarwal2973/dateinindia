export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_SECRET_KEY;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'Razorpay credentials not configured' },
      { status: 503 }
    );
  }

  try {
    const { amount, currency = 'INR', user_id, tier } = await req.json();

    if (!amount || !user_id || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call Razorpay REST API directly — the razorpay npm SDK uses Node.js
    // crypto/http which are unavailable in the Edge Runtime.
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        receipt: `dii_${user_id.slice(0, 8)}_${Date.now()}`,
        notes: { user_id, tier },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[create-order] Razorpay error:', res.status, errText);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const order = await res.json();
    return NextResponse.json({ order });
  } catch (err) {
    console.error('[create-order]', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
