// Setup Supabase Edge Function type definitions
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DOWNLOAD_BASE_URL = Deno.env.get('DOWNLOAD_BASE_URL') ?? "https://silkyroad.vercel.app/download";
const SELLER_PAYOUT_PERCENT = Number(Deno.env.get('SELLER_PAYOUT_PERCENT') ?? "85");
const REFUND_WINDOW_DAYS = Number(Deno.env.get('REFUND_WINDOW_DAYS') ?? "3");

/*
This Edge Function does the following when receiving a PayPal webhook PAYMENT.CAPTURE.COMPLETED:
1. Inserts a purchase record into Supabase 'purchases' table with status 'on_hold' and refund_window_expires set to now + 3 days.
2. Sends a download + refund policy email via Resend.
Note: This function expects the following environment variables set in Supabase:
- RESEND_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- DOWNLOAD_BASE_URL (optional)
*/

Deno.serve(async (req) => {
  try {
    const event = await req.json();

    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      return new Response(JSON.stringify({ message: "Event ignored" }), { status: 200 });
    }

    // Extract payment info from PayPal webhook
    const payerEmail = event.resource?.payer?.email_address;
    const orderId = event.resource?.id;
    const amount = event.resource?.amount?.value ?? null;
    const currency = event.resource?.amount?.currency_code ?? "USD";
    // seller_id should be supplied in your order metadata; for demo we set null
    const seller_id = event.resource?.custom_id ?? null;

    if (!payerEmail || !orderId) {
      return new Response(JSON.stringify({ error: "Missing payerEmail or orderId in webhook resource" }), { status: 400 });
    }

    // Calculate expiry timestamp and iso string
    const expires = Date.now() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const refund_window_expires = new Date(expires).toISOString();

    // Create a purchase record in Supabase via REST
    const purchasePayload = {
      id: orderId,
      email: payerEmail,
      file_path: `files/${orderId}.zip`,
      seller_id: seller_id,
      amount_cents: amount ? Math.round(Number(amount) * 100) : null,
      currency: currency,
      payment_provider: "paypal",
      payment_provider_id: orderId,
      status: "on_hold",
      purchase_at: new Date().toISOString(),
      refund_window_expires: refund_window_expires,
      download_token: cryptoRandomToken(),
      download_token_expires: refund_window_expires
    };

    // Insert into purchases table
    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(purchasePayload)
    });

    if (!insertResp.ok) {
      const txt = await insertResp.text();
      console.error("Supabase insert failed:", insertResp.status, txt);
      // continue: still attempt to send email so user gets the link
    }

    const downloadLink = `${DOWNLOAD_BASE_URL}/${orderId}?expires=${expires}`;

    // Compose email HTML
    const html = `
      <h2>Thank you for your purchase!</h2>
      <p>Your download link (expires in ${REFUND_WINDOW_DAYS} days):</p>
      <p><a href="${downloadLink}">${downloadLink}</a></p>
      <hr/>
      <h3>3-Day Refund Policy</h3>
      <p>You have <strong>${REFUND_WINDOW_DAYS} days</strong> from the time of purchase to request a full refund if the file is fake, corrupted, or does not match the seller's description.</p>
      <p>If you believe you are eligible for a refund, click the button below to submit a refund request and upload evidence (screenshot):</p>
      <p><a href="${DOWNLOAD_BASE_URL.replace('/download','')}/refund?email=${encodeURIComponent(payerEmail)}&order=${orderId}" style="padding:10px 16px;background:#d33;color:#fff;border-radius:6px;text-decoration:none;">Request Full Refund</a></p>
      <p>After ${REFUND_WINDOW_DAYS} days the download link expires and refund requests will be closed.</p>
      <p>SilkyRoad will review disputes and has final decision authority on refunds.</p>
    `;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "silkyroad@resend.dev",
        to: payerEmail,
        subject: "Your SilkyRoad Purchase - Download & 3-Day Refund Policy",
        html
      })
    });

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, email: data }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

function cryptoRandomToken() {
  // simple random token for download link; not crypto-strong in Deno scripting context
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
}
