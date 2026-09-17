"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface RazorpayPayButtonProps {
  membershipId?: string;
  ptPackageId?: string;
  amount: number;
  planName: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayPayButton({ membershipId, ptPackageId, amount, planName }: RazorpayPayButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission lock to prevent duplicate order generation
  const isSubmittingRef = useRef(false);

  // Load Razorpay Script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // 1. Create order on server (authoritative amount calculated server-side!)
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, ptPackageId }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Failed to create payment order");

      // 2. Load script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to connect to payment gateway. Please check your network connection.");
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ARK FIT",
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: "#1E40AF" },
        handler: async function (response: any) {
          // 4. Server-side signature verification
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            setSuccess(true);
            setTimeout(() => {
              router.refresh();
              setSuccess(false);
            }, 1500);
          } else {
            setError("Payment signature verification failed. Please contact gym reception.");
          }
          isSubmittingRef.current = false;
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            isSubmittingRef.current = false;
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError("Payment failed: " + (response.error?.description || "Transaction declined"));
        isSubmittingRef.current = false;
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment");
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  if (success) {
    return (
      <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        Payment Confirmed!
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handlePay}
        disabled={loading}
        className="h-9 px-4 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>Connecting to Gateway...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Pay Online via Razorpay</span>
          </>
        )}
      </button>

      {error && (
        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
