import { useState } from "react";
import { ShoppingBag, Download, Shield, Star, Zap, ChevronRight, X } from "lucide-react";
import products from "../../products.json";

type Product = (typeof products)[number];

export default function Home() {
  const [selected, setSelected] = useState<Product | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = (product: Product) => {
    setSelected(product);
    setEmail("");
    setError("");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected.id,
          productTitle: selected.title,
          price: selected.price,
          customerEmail: email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-40 bg-[#0a0a0f]/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <ShoppingBag className="w-5 h-5 text-violet-400" />
            <span>DigitalDrop</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Secure payments
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Instant delivery
            </span>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          Crypto payments · Instant download links
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
          Premium digital
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            products
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Pay with crypto, get your download link instantly via email. No account required.
        </p>
      </section>

      {/* ── Products ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product) => (
            <article
              key={product.id}
              className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden bg-white/5">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <h2 className="font-semibold text-lg leading-snug mb-2 text-white/90">
                  {product.title}
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">${product.price}</span>
                    <span className="text-white/30 text-sm ml-1">USD</span>
                  </div>
                  <button
                    onClick={() => handleBuy(product)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                  >
                    Buy Now
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────────── */}
      <section className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-10 text-white/30 text-sm">
          {[
            { icon: Shield, label: "HMAC-verified payments" },
            { icon: Download, label: "Instant email delivery" },
            { icon: Zap, label: "Bitcoin · ETH · USDT · 50+ coins" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-violet-400" />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Checkout modal ──────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !loading && setSelected(null)}
        >
          <div
            className="w-full max-w-md bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !loading && setSelected(null)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-semibold text-lg text-white mb-1">{selected.title}</h3>
            <p className="text-white/40 text-sm mb-6">${selected.price} USD — paid via crypto</p>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">
                  Your email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
                <p className="text-white/25 text-xs mt-1.5">
                  Your download link will be sent here after payment.
                </p>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating invoice…
                  </>
                ) : (
                  <>
                    Pay ${selected.price} with Crypto
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-white/20 text-xs">
                Powered by NOWPayments · 50+ cryptocurrencies accepted
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
