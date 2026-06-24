// ipn-webhook.js
// Netlify Function — receives NOWPayments IPN (Instant Payment Notification) callbacks.
// Verifies the HMAC-SHA512 signature, then on a "finished" payment sends a
// download link to the customer via Resend.

import crypto from "node:crypto";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 1. Read raw body (needed for HMAC verification) ──────────────────────
  const rawBody = await req.text();

  // ── 2. Verify HMAC-SHA512 signature ──────────────────────────────────────
  // NOWPayments sends the signature in the "x-nowpayments-sig" header.
  // We verify it against the sorted JSON body using our IPN secret.
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.error("NOWPAYMENTS_IPN_SECRET is not set");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const receivedSig = req.headers.get("x-nowpayments-sig");
  if (!receivedSig) {
    return new Response(JSON.stringify({ error: "Missing signature header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // NOWPayments sorts the JSON keys alphabetically before signing
  let parsedBody;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Sort keys recursively and re-serialize for verification
  const sortedBody = JSON.stringify(sortObjectKeys(parsedBody));
  const expectedSig = crypto
    .createHmac("sha512", ipnSecret)
    .update(sortedBody)
    .digest("hex");

  if (expectedSig !== receivedSig) {
    console.warn("IPN signature mismatch — possible spoofed request");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 3. Handle "finished" payment status ──────────────────────────────────
  const { payment_status, order_id, price_amount } = parsedBody;

  if (payment_status !== "finished") {
    // Acknowledge other statuses (waiting, confirming, etc.) without action
    return new Response(
      JSON.stringify({ received: true, action: "none", status: payment_status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract product ID from the order_id format: "<productId>-<timestamp>"
  const productId = order_id ? order_id.split("-").slice(0, -1).join("-") : null;

  // ── 4. Send the download link via Resend ─────────────────────────────────
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set — cannot send download email");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Load products to find the download URL for this product
  // (In a Netlify Function, you can import JSON via URL or embed it here)
  // For simplicity we load from a known relative path — see README for details.
  let downloadUrl = "https://example.com/downloads/your-file.pdf";
  let productTitle = productId;

  try {
    // Dynamic import works in Netlify Functions (Node 18+)
    const products = (await import("../../products.json", { assert: { type: "json" } })).default;
    const product = products.find((p) => p.id === productId);
    if (product) {
      downloadUrl = product.fileUrl;
      productTitle = product.title;
    }
  } catch (err) {
    console.warn("Could not load products.json:", err.message);
  }

  // ── 5. Email the customer their download link ─────────────────────────────
  // The customer email may be stored in the order metadata.
  // NOWPayments passes it back if you sent it when creating the invoice.
  const customerEmail = parsedBody.customer_email || parsedBody.payer_email;

  if (!customerEmail) {
    console.warn("No customer email in IPN payload — cannot send download link");
    return new Response(
      JSON.stringify({ received: true, warning: "No customer email found" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // ── RESEND SETUP ──────────────────────────────────────────────────────
    // Using Resend's free shared sending domain — no custom domain needed.
    // Note: with the shared domain, Resend can only deliver to any email address
    // on the free plan. If you later verify your own domain, replace the
    // "from" address below with: "Your Store <noreply@yourdomain.com>"
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Digital Store <onboarding@resend.dev>", // Resend shared domain — no custom domain needed
        to: [customerEmail],
        subject: `Your download is ready: ${productTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <h1 style="font-size: 24px; color: #111;">Thank you for your purchase!</h1>
            <p style="color: #444; font-size: 16px;">
              Your payment for <strong>${productTitle}</strong> has been confirmed.
              Click the button below to download your file.
            </p>
            <a href="${downloadUrl}"
               style="display: inline-block; margin: 24px 0; padding: 14px 28px;
                      background: #6366f1; color: #fff; text-decoration: none;
                      border-radius: 8px; font-weight: 600; font-size: 16px;">
              Download Now
            </a>
            <p style="color: #888; font-size: 14px;">
              Order ID: ${order_id}<br/>
              Amount paid: $${price_amount} USD
            </p>
            <p style="color: #888; font-size: 13px;">
              If the button doesn't work, copy this link into your browser:<br/>
              <a href="${downloadUrl}" style="color: #6366f1;">${downloadUrl}</a>
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error("Resend API error:", emailResponse.status, errText);
      return new Response(
        JSON.stringify({ received: true, warning: "Email failed to send", detail: errText }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Download email sent to ${customerEmail} for order ${order_id}`);
    return new Response(
      JSON.stringify({ received: true, action: "email_sent", order_id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error sending download email:", err);
    return new Response(JSON.stringify({ received: true, warning: "Email error" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Helper: recursively sort object keys alphabetically (required by NOWPayments HMAC)
function sortObjectKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

export const config = {
  path: "/.netlify/functions/ipn-webhook",
};
