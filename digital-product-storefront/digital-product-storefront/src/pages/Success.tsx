import { useSearch } from "wouter";
import { CheckCircle, Mail, Download, ArrowLeft } from "lucide-react";

export default function Success() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get("email") || "";
  const orderId = params.get("orderId") || "";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Payment confirmed!</h1>
        <p className="text-white/50 text-lg mb-8">
          Your order has been received and your download link is on its way.
        </p>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-left space-y-4 mb-8">
          {email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white/90">Download link sent to</p>
                <p className="text-sm text-white/40">{email}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white/90">Instant delivery</p>
              <p className="text-sm text-white/40">Check your inbox (and spam folder) for your download link.</p>
            </div>
          </div>
          {orderId && (
            <div className="pt-3 border-t border-white/5">
              <p className="text-xs text-white/20">Order ID: {orderId}</p>
            </div>
          )}
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </a>
      </div>
    </div>
  );
}
