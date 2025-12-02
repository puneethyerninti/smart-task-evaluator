// pages/api/stripe/webhook.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false, // Required for Stripe raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  apiVersion: "2022-11-15",
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Read raw body for webhook verification
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sig = req.headers["stripe-signature"];
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("🔔 Stripe event received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await sbAdmin.from("payments").insert([
        {
          user_id: session.client_reference_id ?? null,
          evaluation_id: session.metadata?.evaluation_id ?? null,
          stripe_session_id: session.id,
          stripe_payment_id: session.payment_intent ?? null,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency,
          status: "completed",
        },
      ]);

      console.log("✅ Payment stored in DB");
    } catch (err) {
      console.error("❌ Failed to insert payment:", err);
    }
  }

  res.json({ received: true });
}
