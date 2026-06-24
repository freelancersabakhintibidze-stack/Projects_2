import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function Cancel() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Payment cancelled</h1>
        <p className="text-white/50 text-lg mb-8">
          No charge was made. You can try again anytime.
        </p>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-white/40 text-sm mb-8">
          Your cart is still saved. Head back to the store and click Buy Now whenever you're ready.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </a>
        </div>
      </div>
    </div>
  );
}
