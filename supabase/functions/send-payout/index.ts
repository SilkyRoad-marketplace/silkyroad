
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req) => {
  const { sellerEmail, amount, saleId } = await req.json();
  const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET")!;
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { "Authorization":"Basic "+btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`), "Content-Type":"application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const { access_token } = await tokenRes.json();
  const payoutRes = await fetch("https://api-m.paypal.com/v1/payments/payouts", {
    method: "POST",
    headers: { "Authorization": `Bearer ${access_token}`, "Content-Type":"application/json" },
    body: JSON.stringify({ sender_batch_header:{ sender_batch_id:`batch_${saleId}`, email_subject:"Your Silky Road Payout"}, items:[{ recipient_type:"EMAIL", amount:{ value: amount.toFixed(2), currency:"USD"}, receiver: sellerEmail, note:"Thank you for selling on Silky Road!" }] })
  });
  const payoutData = await payoutRes.json();
  return new Response(JSON.stringify(payoutData), { headers: { "Content-Type": "application/json" } });
});
