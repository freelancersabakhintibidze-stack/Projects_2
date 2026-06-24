// create-payment.js
// Netlify Function — called by the frontend when a user clicks "Buy Now"
// It creates a NOWPayments invoice and returns the payment URL.

export default async (req, context) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { productId, productTitle, price, customerEmail } = body;

  if (!productId || !price || !customerEmail) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: productId, price, customerEmail" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    console.error("NOWPAYMENTS_API_KEY is not set");
    return new Response(JSON.stringify({ error: "Payment service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build the base URL for callbacks (Netlify provides the deploy URL)
  const siteUrl =
    process.env.URL || // Set automatically by Netlify in production
    process.env.DEPLOY_URL || // Set automatically by Netlify per deploy
    "https://your-site.netlify.app"; // Fallback — replace with your actual Netlify URL

  // Unique order ID using timestamp + product ID
  const orderId = `${productId}-${Date.now()}`;

  try {
    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: price,
        price_currency: "usd",
        order_id: orderId,
        order_description: productTitle || productId,
        ipn_callback_url: `${siteUrl}/.netlify/functions/ipn-webhook`,
        success_url: `${siteUrl}/success?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}&product=${encodeURIComponent(productId)}`,
        cancel_url: `${siteUrl}/cancel`,
        // Optional: send customer email to NOWPayments for their records
        customer_email: customerEmail,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NOWPayments API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment invoice", details: errorText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const invoice = await response.json();

    // Return the invoice URL for the frontend to redirect to
    return new Response(
      JSON.stringify({
        paymentUrl: invoice.invoice_url,
        orderId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error creating NOWPayments invoice:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/.netlify/functions/create-payment",
};
