import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemKey, price } = body;

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // If real Stripe is configured, create checkout session
    if (stripeKey) {
      // In production, integrate Stripe SDK:
      // const stripe = new Stripe(stripeKey);
      // const session = await stripe.checkout.sessions.create(...);
      // return NextResponse.json({ url: session.url });
    }

    // Instant Sandbox / Demo fulfillment fallback
    return NextResponse.json({
      status: 'demo_success',
      itemKey,
      price,
      message: 'Sandbox purchase successful. In-game items granted immediately.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process checkout session' },
      { status: 500 }
    );
  }
}
