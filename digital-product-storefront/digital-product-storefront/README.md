# Digital Product Storefront

A React-based digital product storefront that accepts crypto payments via NOWPayments and delivers download links via email using Resend. Deployable on Netlify with zero server management.

---

## Step 1 — Sign up at NOWPayments and get your API key

1. Go to [https://nowpayments.io](https://nowpayments.io) and create a free account.
2. After logging in, open **Store Settings** (top-right menu).
3. Copy your **API Key** — you'll add this to Netlify as `NOWPAYMENTS_API_KEY`.
4. Scroll down to the **IPN Settings** section. Enter your Netlify webhook URL:
   ```
   https://your-site.netlify.app/.netlify/functions/ipn-webhook
   ```
   Replace `your-site` with your actual Netlify subdomain.
5. Copy the **IPN Secret** — add this to Netlify as `NOWPAYMENTS_IPN_SECRET`.

---

## Step 2 — Set your USDT (TRC20) payout address in NOWPayments

1. In the NOWPayments dashboard, go to **Store Settings > Payout Settings**.
2. Under **Payout Currency**, select **USDT**.
3. Under **Payout Network**, select **TRC20** (TRON network).
4. Paste your Trust Wallet USDT (TRC20) address in the **Payout Address** field.
5. Click **Save**. NOWPayments will automatically convert incoming payments and send USDT to your wallet.

> **Tip:** Open Trust Wallet, tap the USDT (TRC20) token, tap **Receive**, and copy the address shown. Make sure the network says TRC20/TRON, NOT ERC20/Ethereum.

---

## Step 3 — Sign up at Resend and get an API key

1. Go to [https://resend.com](https://resend.com) and create a free account.
2. In your Resend dashboard, go to **API Keys** and click **Create API Key**.
3. Copy the key — add it to Netlify as `RESEND_API_KEY`.
4. Go to **Domains** and click **Add Domain**. Enter the domain you'll send from (e.g. `yourdomain.com`).
5. Follow Resend's instructions to add the DNS records. Once verified, you can send from addresses like `noreply@yourdomain.com`.
6. Open `netlify/functions/ipn-webhook.js` and update this line with your verified sender:
   ```js
   from: "Your Store <noreply@yourdomain.com>",
   ```

> **Free tier:** Resend's free plan allows 3,000 emails/month and 100/day — plenty for most stores.

---

## Step 4 — Set environment variables in Netlify

1. Go to your Netlify site dashboard.
2. Navigate to **Site configuration > Environment variables**.
3. Click **Add a variable** and add the following three:

| Key | Value |
|-----|-------|
| `NOWPAYMENTS_API_KEY` | Your NOWPayments API key |
| `NOWPAYMENTS_IPN_SECRET` | Your NOWPayments IPN secret |
| `RESEND_API_KEY` | Your Resend API key |

4. Click **Save**. These are securely stored and never exposed to the browser.

---

## Step 5 — Edit your products

Open `products.json` in the root of this project. Each product has:

```json
{
  "id": "unique-id",
  "title": "Product Name",
  "description": "Short description shown on the store.",
  "price": 29,
  "image": "https://link-to-product-image.jpg",
  "fileUrl": "https://your-download-link.com/file.pdf",
  "category": "eBook"
}
```

- **`id`** — Must be unique. Used to identify orders.
- **`price`** — In USD (whole numbers recommended).
- **`fileUrl`** — The direct link customers receive after payment. Use a private link from Google Drive, Dropbox, or your own CDN.
- **`image`** — Any image URL, or place image files in `public/` and use `/your-image.jpg`.

---

## Step 6 — Deploy to Netlify

### Option A: Drag & drop (simplest)

1. Run the build locally:
   ```bash
   npm install
   npm run build
   ```
2. Go to [https://app.netlify.com](https://app.netlify.com).
3. Drag the `dist/` folder onto the Netlify deploy area.
4. Your site is live instantly.

### Option B: GitHub + auto-deploy (recommended for ongoing updates)

1. Push this project to a GitHub repository.
2. Go to [https://app.netlify.com](https://app.netlify.com) and click **Add new site > Import an existing project**.
3. Connect your GitHub account and select your repository.
4. Netlify auto-detects the build settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Click **Deploy site**.
6. Every `git push` to `main` triggers a new deploy automatically.

---

## Local development

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. Netlify Functions don't run locally unless you install [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
netlify dev
```

This starts both the React frontend and Functions at `http://localhost:8888`.

Create a `.env` file (copy from `.env.example`) and fill in your real keys for local testing.

---

## Project structure

```
/
├── netlify/
│   └── functions/
│       ├── create-payment.js   ← Creates NOWPayments invoice
│       └── ipn-webhook.js      ← Handles payment confirmation + sends email
├── public/                     ← Static assets (images, favicon)
├── src/                        ← React frontend source
│   ├── pages/
│   │   ├── Home.tsx            ← Product listing page
│   │   ├── Success.tsx         ← Shown after payment confirmed
│   │   └── Cancel.tsx          ← Shown if payment is cancelled
│   └── components/
├── products.json               ← Edit this to change your products
├── netlify.toml                ← Netlify build + function settings
├── .env.example                ← Template for environment variables
└── README.md                   ← This file
```

---

## Security notes

- API keys are stored as Netlify environment variables and never sent to the browser.
- The IPN webhook verifies the HMAC-SHA512 signature on every request — fake requests are rejected.
- Download links are only sent after payment status is `"finished"` (fully confirmed).
