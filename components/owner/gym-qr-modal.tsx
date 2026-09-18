"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Printer, Download, RefreshCw, X, Loader2, AlertTriangle, CheckCircle2, Copy } from "lucide-react";

interface GymQrModalProps {
  buttonText?: string;
  className?: string;
}

export function GymQrModal({ buttonText = "Gym Check-in QR", className }: GymQrModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [qrData, setQrData] = useState<{
    gymName: string;
    checkInUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const fetchQrCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gyms/qr-code");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load gym QR code");
      setQrData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowRotateConfirm(false);
    fetchQrCode();
  };

  const handleClose = () => {
    if (rotating) return;
    setIsOpen(false);
  };

  const handleRotateQr = async () => {
    setRotating(true);
    setError(null);
    try {
      const res = await fetch("/api/gyms/qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGENERATE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rotate QR code");
      setQrData(data);
      setShowRotateConfirm(false);
    } catch (err: any) {
      setError(err.message || "Failed to regenerate QR code");
    } finally {
      setRotating(false);
    }
  };

  const handleCopyLink = () => {
    if (!qrData?.checkInUrl) return;
    navigator.clipboard.writeText(qrData.checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!printAreaRef.current || !qrData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${qrData.gymName} - Attendance Check-in QR</title>
          <style>
            @page { size: A4 portrait; margin: 20mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              text-align: center;
              color: #0f172a;
            }
            .poster {
              border: 3px solid #1e40af;
              border-radius: 24px;
              padding: 40px;
              max-width: 500px;
              margin: 0 auto;
              box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            }
            .badge {
              display: inline-block;
              background: #eff6ff;
              color: #1e40af;
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              padding: 6px 16px;
              border-radius: 9999px;
              margin-bottom: 16px;
            }
            h1 {
              font-size: 32px;
              font-weight: 800;
              margin: 0 0 8px 0;
              letter-spacing: -0.5px;
            }
            p.sub {
              font-size: 15px;
              color: #64748b;
              margin: 0 0 28px 0;
            }
            .qr-img {
              width: 320px;
              height: 320px;
              display: block;
              margin: 0 auto 24px auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 8px;
            }
            .instruction {
              font-size: 16px;
              font-weight: 600;
              color: #1e40af;
              margin: 0 0 6px 0;
            }
            .note {
              font-size: 12px;
              color: #94a3b8;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="poster">
            <div class="badge">Official Facility QR</div>
            <h1>${qrData.gymName}</h1>
            <p class="sub">Front Desk & Entrance Floor Attendance</p>
            <img class="qr-img" src="${qrData.qrDataUrl}" alt="Check-in QR" />
            <p class="instruction">Scan with your phone camera to check in</p>
            <p class="note">Powered by ARK FIT Gym Operating System</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrData?.qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrData.qrDataUrl;
    a.download = `${qrData.gymName.toLowerCase().replace(/\s+/g, "_")}_checkin_qr.png`;
    a.click();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          className ||
          "h-9 px-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        }
      >
        <QrCode className="w-4 h-4 text-[#1E40AF]" />
        <span>{buttonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#1E40AF]" />
                <h2 className="text-sm font-bold text-slate-900">Gym Attendance QR Code</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={rotating}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center space-y-4">
              {loading ? (
                <div className="py-12 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1E40AF] mx-auto" />
                  <p className="text-xs text-slate-500">Generating facility check-in code...</p>
                </div>
              ) : error ? (
                <div className="py-6 space-y-3">
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                    {error}
                  </div>
                  <button
                    type="button"
                    onClick={fetchQrCode}
                    className="h-8 px-4 rounded bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : qrData ? (
                <>
                  <div ref={printAreaRef} className="space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block">
                        Reception & Front Entrance
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{qrData.gymName}</h3>
                      <p className="text-xs text-slate-500">Scan to check in on the gym floor</p>
                    </div>

                    {/* QR Display */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-inner">
                      <img
                        src={qrData.qrDataUrl}
                        alt="Attendance QR Code"
                        className="w-56 h-56 rounded-lg mx-auto bg-white p-2 border border-slate-200 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#1E40AF]" />
                      <span>Print Poster</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Regenerate Confirmation Drawer */}
                  {showRotateConfirm ? (
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-left space-y-2.5 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-amber-900 block">
                            Regenerate Gym Attendance QR?
                          </span>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            This will permanently invalidate any currently printed or displayed QR code. Existing check-in records will remain safe.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={rotating}
                          onClick={() => setShowRotateConfirm(false)}
                          className="h-7 px-2.5 rounded border border-slate-200 bg-white text-slate-600 text-xs font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={rotating}
                          onClick={handleRotateQr}
                          className="h-7 px-3 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          {rotating ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Regenerating...</span>
                            </>
                          ) : (
                            <span>Confirm Rotation</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRotateConfirm(true)}
                        className="text-[11px] text-slate-400 hover:text-amber-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate / Invalidate Current QR</span>
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400">
                Non-sensitive token · Server-authenticated check-in
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
