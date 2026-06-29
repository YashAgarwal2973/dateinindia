import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

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

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: `dii_${user_id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id, tier },
    });

    return NextResponse.json({ order });
  } catch (err) {
    console.error('[create-order]', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
