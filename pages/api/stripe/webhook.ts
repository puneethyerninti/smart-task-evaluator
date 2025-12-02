// pages/api/stripe/webhook.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false, // Required for Stripe raw body
  },
};

const stripeSecret = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-11-17.clover",
    })
  : null;


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
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Stripe webhook is not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Webhook signature verification failed:", message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  console.log("🔔 Stripe event received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const reportId = session.metadata?.report_id ?? null;

      // Try to insert payment record (optional - may not exist in this setup)
      try {
        await sbAdmin.from("payments").insert([
          {
            user_id: session.client_reference_id ?? null,
            report_id: reportId,
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent ?? null,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency,
            status: "completed",
          },
        ]);
        console.log("✅ Payment record stored in DB");
      } catch (paymentErr: unknown) {
        console.warn("⚠️ Payments table may not exist, skipping payment record insertion:", paymentErr instanceof Error ? paymentErr.message : String(paymentErr));
      }

      // Always unlock the report
      if (reportId) {
        await sbAdmin
          .from("reports")
          .update({ unlocked: true })
          .eq("id", reportId);
        console.log("✅ Report unlocked:", reportId);
      }
    } catch (err: unknown) {
      console.error("❌ Failed to process payment:", err);
    }
  }

  res.json({ received: true });
}
