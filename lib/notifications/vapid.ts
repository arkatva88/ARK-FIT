import webpush from "web-push";

let vapidConfigured = false;

export function getVapidPublicKey(): string {
  const key =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.");
  }
  return key;
}

export function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey =
    process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:notifications@arkfit.in";

  if (!publicKey || !privateKey) {
    console.warn(
      "VAPID credentials missing. Web push notifications will not be dispatched."
    );
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error("Failed to initialize VAPID details:", err);
    return false;
  }
}

export { webpush };
